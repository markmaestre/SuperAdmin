const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const WasteReport = require('../models/WasteReport');
const Notification = require('../models/Notification');
const User = require('../models/User');
const auth = require('../middleware/auth');
const cloudinary = require('cloudinary').v2;

// Helper function to get barangay filter based on admin role
const getBarangayFilterFromRole = (role, assignedBarangay = null) => {
  switch (role) {
    case 'southadmin':
      return { assignedBarangay: 'south_signal' };
    case 'centraladmin':
      return { assignedBarangay: 'central_bicutan' };
    case 'tupadmin':
      return { assignedBarangay: 'tup_taguig' };
    case 'admin':
      return null;
    default:
      return null;
  }
};

// Helper to check if admin has access to a specific barangay
const hasBarangayAccess = (adminRole, reportBarangay) => {
  if (adminRole === 'admin') return true;
  if (adminRole === 'southadmin') return reportBarangay === 'south_signal';
  if (adminRole === 'centraladmin') return reportBarangay === 'central_bicutan';
  if (adminRole === 'tupadmin') return reportBarangay === 'tup_taguig';
  return false;
};

// Helper to check if user belongs to a specific barangay
async function getUserBarangay(userId) {
  const user = await User.findById(userId);
  if (!user) return null;
  return user.assignedBarangay;
}

// @desc    Create waste detection report with image upload
// @route   POST /api/waste-reports/detect
// @access  Private
router.post('/detect', 
  auth,
  [
    body('image').notEmpty().withMessage('Image is required'),
    body('classification').notEmpty().withMessage('Classification is required'),
    body('classification_confidence')
      .custom((value) => {
        const numValue = parseFloat(value);
        return !isNaN(numValue) && numValue >= 0;
      })
      .withMessage('Confidence must be a valid number')
  ],
  async (req, res) => {
    try {
      console.log('📨 Received waste detection request from user:', req.user.id);
      
      const userBarangay = await getUserBarangay(req.user.id);
      
      let assignedBarangay = 'south_signal';
      let assignedBarangayLabel = 'South Signal, Taguig';
      
      if (userBarangay === 'central_bicutan') {
        assignedBarangay = 'central_bicutan';
        assignedBarangayLabel = 'Central Bicutan, Taguig';
      } else if (userBarangay === 'tup_taguig') {
        assignedBarangay = 'tup_taguig';
        assignedBarangayLabel = 'TUP Taguig';
      }
      
      console.log(`📍 User belongs to: ${assignedBarangayLabel}`);
      
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          error: 'Validation failed',
          details: errors.array() 
        });
      }

      const {
        image,
        detected_objects = [],
        classification,
        classification_confidence,
        waste_composition = {},
        material_breakdown = {},
        recycling_tips = [],
        location = {},
        scan_date
      } = req.body;

      let finalConfidence = parseFloat(classification_confidence);
      if (finalConfidence > 1) {
        finalConfidence = finalConfidence / 100;
      }

      const processedObjects = detected_objects.map(obj => ({
        ...obj,
        confidence: obj.confidence > 1 ? obj.confidence / 100 : obj.confidence
      }));

      let imageUrl = image;
      let cloudinaryId = '';

      if (image && image.startsWith('data:image')) {
        try {
          console.log('☁️ Uploading image to Cloudinary...');
          const folder = `waste-reports-${assignedBarangay}`;
          const uploadResponse = await cloudinary.uploader.upload(image, {
            folder: folder,
            resource_type: 'image',
            quality: 'auto:good',
            fetch_format: 'auto'
          });
          imageUrl = uploadResponse.secure_url;
          cloudinaryId = uploadResponse.public_id;
          console.log('✅ Image uploaded to Cloudinary:', imageUrl);
        } catch (uploadError) {
          console.error('❌ Cloudinary upload error:', uploadError);
          return res.status(500).json({
            success: false,
            error: 'Failed to upload image to cloud storage'
          });
        }
      }

      const session = await WasteReport.startSession();
      session.startTransaction();

      try {
        const reportData = {
          user: req.user.id,
          userEmail: req.user.email,
          image: imageUrl,
          cloudinaryId: cloudinaryId,
          detectedObjects: processedObjects,
          classification,
          classificationConfidence: finalConfidence,
          wasteComposition: waste_composition,
          materialBreakdown: material_breakdown,
          recyclingTips: recycling_tips,
          location,
          status: 'pending',
          assignedBarangay: assignedBarangay,
          assignedBarangayLabel: assignedBarangayLabel,
          statusHistory: [{
            status: 'pending',
            changedAt: new Date(),
            changedBy: req.user.id,
            changedByName: req.user.name || req.user.email,
            changedByRole: 'user',
            notes: 'Report created'
          }]
        };

        if (scan_date) {
          reportData.scanDate = new Date(scan_date);
        }

        const report = new WasteReport(reportData);
        await report.save({ session });

        console.log(`✅ Waste report saved: ${report._id} - Barangay: ${assignedBarangayLabel}`);

        const notification = new Notification({
          user: req.user.id,
          title: 'Waste Report Created',
          message: `Your waste detection report for ${assignedBarangayLabel} has been created. Classification: ${classification}`,
          type: 'report_created',
          relatedReport: report._id
        });
        await notification.save({ session });

        await session.commitTransaction();
        session.endSession();

        const populatedReport = await WasteReport.findById(report._id)
          .populate('user', 'name email profile');

        res.status(201).json({
          success: true,
          message: 'Report successfully saved!',
          report: populatedReport,
          notification: {
            id: notification._id,
            title: notification.title,
            message: notification.message
          }
        });

      } catch (transactionError) {
        await session.abortTransaction();
        session.endSession();
        console.error('❌ Transaction error:', transactionError);
        
        if (transactionError.name === 'ValidationError') {
          return res.status(400).json({
            success: false,
            error: 'Data validation failed',
            details: transactionError.errors
          });
        }
        
        if (transactionError.code === 11000) {
          return res.status(400).json({
            success: false,
            error: 'Duplicate entry found'
          });
        }
        
        throw transactionError;
      }

    } catch (error) {
      console.error('❌ Report creation error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to create waste report',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @desc    Get user's own reports
// @route   GET /api/waste-reports/my-reports
// @access  Private
router.get('/my-reports', auth, async (req, res) => {
  try {
    const userBarangay = await getUserBarangay(req.user.id);
    
    const query = { 
      user: req.user.id,
      assignedBarangay: userBarangay
    };
    
    const { page = 1, limit = 10, status } = req.query;
    if (status && status !== 'all') {
      query.status = status;
    }

    const reports = await WasteReport.find(query)
      .populate('user', 'name email profile')
      .sort({ scanDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v');

    const total = await WasteReport.countDocuments(query);

    res.json({
      success: true,
      reports,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
      barangay: userBarangay
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch reports' 
    });
  }
});

// @desc    Get single report by ID
// @route   GET /api/waste-reports/:id
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const report = await WasteReport.findById(req.params.id)
      .populate('user', 'name email profile')
      .populate('statusHistory.changedBy', 'name email role');
    
    if (!report) {
      return res.status(404).json({ 
        success: false,
        error: 'Report not found' 
      });
    }

    if (report.user._id.toString() === req.user.id) {
      return res.json({ success: true, report });
    }

    if (req.user.role === 'admin') {
      return res.json({ success: true, report });
    }
    
    if (req.user.role === 'southadmin' && report.assignedBarangay === 'south_signal') {
      return res.json({ success: true, report });
    }
    
    if (req.user.role === 'centraladmin' && report.assignedBarangay === 'central_bicutan') {
      return res.json({ success: true, report });
    }

    if (req.user.role === 'tupadmin' && report.assignedBarangay === 'tup_taguig') {
      return res.json({ success: true, report });
    }

    return res.status(403).json({ 
      success: false,
      error: 'Access denied' 
    });

  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch report' 
    });
  }
});

// @desc    Get all reports (admin only)
// @route   GET /api/waste-reports
// @access  Private/Admin
router.get('/', auth, async (req, res) => {
  try {
    console.log('🔐 Admin access - Role:', req.user.role);
    
    if (!['admin', 'southadmin', 'centraladmin', 'tupadmin'].includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        error: 'Access denied. Admin privileges required.' 
      });
    }

    const { 
      page = 1, 
      limit = 50, 
      status, 
      user, 
      classification, 
      startDate, 
      endDate 
    } = req.query;
    
    let query = {};
    const barangayFilter = getBarangayFilterFromRole(req.user.role);
    
    if (barangayFilter) {
      query = { ...barangayFilter };
      console.log(`🔍 Filtering for: ${req.user.role}`);
    }
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (user) {
      query.user = user;
    }
    
    if (classification && classification !== 'all') {
      query.classification = classification;
    }
    
    if (startDate || endDate) {
      query.scanDate = {};
      if (startDate) {
        query.scanDate.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.scanDate.$lte = end;
      }
    }

    const reports = await WasteReport.find(query)
      .populate('user', 'name email profile')
      .populate('statusHistory.changedBy', 'name email role')
      .sort({ scanDate: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await WasteReport.countDocuments(query);

    const barangays = [...new Set(reports.map(r => r.assignedBarangayLabel).filter(Boolean))];

    res.json({
      success: true,
      reports: reports || [],
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
      filters: {
        status: status || 'all',
        user: user || 'all',
        classification: classification || 'all',
        startDate: startDate || '',
        endDate: endDate || ''
      },
      adminRole: req.user.role,
      barangays: barangays
    });

  } catch (error) {
    console.error('❌ Get reports error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch reports',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @desc    Schedule pickup for a report
// @route   POST /api/waste-reports/:id/schedule-pickup
// @access  Private/Admin
router.post('/:id/schedule-pickup', 
  auth,
  [
    body('scheduledDate').isISO8601().withMessage('Valid date is required'),
    body('scheduledTime').notEmpty().withMessage('Time is required'),
    body('pickupAddress').optional()
  ],
  async (req, res) => {
    try {
      if (!['admin', 'southadmin', 'centraladmin', 'tupadmin'].includes(req.user.role)) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }

      const report = await WasteReport.findById(req.params.id).populate('user', 'name email');
      if (!report) {
        return res.status(404).json({ success: false, error: 'Report not found' });
      }

      let hasAccess = false;
      if (req.user.role === 'admin') hasAccess = true;
      else if (req.user.role === 'southadmin' && report.assignedBarangay === 'south_signal') hasAccess = true;
      else if (req.user.role === 'centraladmin' && report.assignedBarangay === 'central_bicutan') hasAccess = true;
      else if (req.user.role === 'tupadmin' && report.assignedBarangay === 'tup_taguig') hasAccess = true;

      if (!hasAccess) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }

      const { scheduledDate, scheduledTime, notes, pickupAddress } = req.body;

      const oldStatus = report.status;
      if (oldStatus !== 'scheduled') {
        report.status = 'scheduled';
        report.statusHistory.push({
          status: 'scheduled',
          changedAt: new Date(),
          changedBy: req.user.id,
          changedByName: req.user.name || req.user.email,
          changedByRole: req.user.role,
          notes: `Status changed from ${oldStatus} to scheduled due to pickup scheduling.`
        });
      }

      report.scheduledPickup = {
        scheduledDate: new Date(scheduledDate),
        scheduledTime,
        notes: notes || '',
        scheduledBy: req.user.id,
        scheduledAt: new Date(),
        confirmed: false,
        pickupAddress: pickupAddress || report.location?.address || 'To be confirmed'
      };

      report.statusHistory.push({
        status: report.status,
        changedAt: new Date(),
        changedBy: req.user.id,
        changedByName: req.user.name || req.user.email,
        changedByRole: req.user.role,
        notes: `Pickup scheduled for ${new Date(scheduledDate).toLocaleDateString()} at ${scheduledTime}. ${notes || ''}`,
        scheduledPickupDate: new Date(scheduledDate),
        scheduledPickupTime: scheduledTime
      });

      await report.save();

      const notification = new Notification({
        user: report.user._id,
        title: 'Pickup Scheduled',
        message: `Your waste pickup has been scheduled for ${new Date(scheduledDate).toLocaleDateString()} at ${scheduledTime}. ${notes || ''}`,
        type: 'pickup_scheduled',
        relatedReport: report._id
      });
      await notification.save();

      res.json({
        success: true,
        message: 'Pickup scheduled successfully',
        scheduledPickup: report.scheduledPickup
      });

    } catch (error) {
      console.error('Schedule pickup error:', error);
      res.status(500).json({ success: false, error: 'Failed to schedule pickup' });
    }
  }
);

// @desc    Upload admin proof image
// @route   POST /api/waste-reports/:id/upload-proof
// @access  Private/Admin
router.post('/:id/upload-proof',
  auth,
  [
    body('image').notEmpty().withMessage('Image is required'),
    body('type').isIn(['pickup_scheduled', 'collected', 'processed', 'recycled', 'disposed', 'completed', 'hazardous_waste']),
    body('description').optional()
  ],
  async (req, res) => {
    try {
      if (!['admin', 'southadmin', 'centraladmin', 'tupadmin'].includes(req.user.role)) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }

      const report = await WasteReport.findById(req.params.id);
      if (!report) {
        return res.status(404).json({ success: false, error: 'Report not found' });
      }

      let hasAccess = false;
      if (req.user.role === 'admin') hasAccess = true;
      else if (req.user.role === 'southadmin' && report.assignedBarangay === 'south_signal') hasAccess = true;
      else if (req.user.role === 'centraladmin' && report.assignedBarangay === 'central_bicutan') hasAccess = true;
      else if (req.user.role === 'tupadmin' && report.assignedBarangay === 'tup_taguig') hasAccess = true;

      if (!hasAccess) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }

      const { image, type, description } = req.body;
      let imageUrl = image;
      let cloudinaryId = '';

      if (image && image.startsWith('data:image')) {
        try {
          const folder = `waste-proofs/${report.assignedBarangay}`;
          const uploadResponse = await cloudinary.uploader.upload(image, {
            folder: folder,
            resource_type: 'image',
            quality: 'auto:good'
          });
          imageUrl = uploadResponse.secure_url;
          cloudinaryId = uploadResponse.public_id;
        } catch (uploadError) {
          console.error('Cloudinary upload error:', uploadError);
          return res.status(500).json({ success: false, error: 'Failed to upload image' });
        }
      }

      report.adminProofImages.push({
        url: imageUrl,
        cloudinaryId,
        type,
        description: description || `Proof of ${type}`,
        uploadedAt: new Date()
      });

      await report.save();

      res.json({
        success: true,
        message: 'Proof image uploaded successfully',
        proofImage: { url: imageUrl, type, uploadedAt: new Date() }
      });

    } catch (error) {
      console.error('Upload proof error:', error);
      res.status(500).json({ success: false, error: 'Failed to upload proof image' });
    }
  }
);

// @desc    Update report status with full tracking
// @route   PUT /api/waste-reports/:id/status
// @access  Private
router.put('/:id/status', 
  auth,
  [
    body('status').isIn(['pending', 'processed', 'scheduled', 'recycled', 'disposed', 'rejected', 'completed'])
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          error: 'Validation failed',
          details: errors.array() 
        });
      }

      const { status, adminNotes, proofImage } = req.body;
      
      console.log(`🔄 Updating report ${req.params.id} to status: ${status} by ${req.user.role}`);

      const report = await WasteReport.findById(req.params.id);
      if (!report) {
        return res.status(404).json({ success: false, error: 'Report not found' });
      }

      let hasAccess = false;
      if (req.user.role === 'admin') hasAccess = true;
      else if (req.user.role === 'southadmin' && report.assignedBarangay === 'south_signal') hasAccess = true;
      else if (req.user.role === 'centraladmin' && report.assignedBarangay === 'central_bicutan') hasAccess = true;
      else if (req.user.role === 'tupadmin' && report.assignedBarangay === 'tup_taguig') hasAccess = true;
      else if (report.user.toString() === req.user.id) hasAccess = true;
      
      if (!hasAccess) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }

      const session = await WasteReport.startSession();
      session.startTransaction();

      try {
        const oldStatus = report.status;
        const oldScheduledPickup = report.scheduledPickup;
        
        report.status = status;
        
        if (adminNotes && req.user.role !== 'user') {
          report.adminNotes = adminNotes;
        }

        // Handle proof image upload if provided
        let proofImageUrl = null;
        let proofCloudinaryId = null;
        
        // Define valid proof types
        const validProofTypes = ['processed', 'recycled', 'disposed', 'completed', 'pickup_scheduled', 'collected', 'hazardous_waste'];
        
        if (proofImage && proofImage.startsWith('data:image')) {
          try {
            const folder = `waste-proofs/${report.assignedBarangay}`;
            const uploadResponse = await cloudinary.uploader.upload(proofImage, {
              folder: folder,
              resource_type: 'image',
              quality: 'auto:good'
            });
            proofImageUrl = uploadResponse.secure_url;
            proofCloudinaryId = uploadResponse.public_id;
            
            // Map status to proof type
            let proofType = status;
            // For hazardous waste (Special Waste), use 'hazardous_waste' type
            if (report.classification === 'Special Waste' && status === 'disposed') {
              proofType = 'hazardous_waste';
            }
            
            // Add to admin proof images if status is in valid types
            if (validProofTypes.includes(proofType)) {
              report.adminProofImages.push({
                url: proofImageUrl,
                cloudinaryId: proofCloudinaryId,
                type: proofType,
                description: `Proof of ${status} status${report.classification === 'Special Waste' ? ' (Hazardous Waste)' : ''}`,
                uploadedAt: new Date()
              });
            }
          } catch (uploadError) {
            console.error('Proof image upload error:', uploadError);
            // Don't fail the whole transaction if image upload fails
          }
        }

        // Add to status history
        report.statusHistory.push({
          status: status,
          changedAt: new Date(),
          changedBy: req.user.id,
          changedByName: req.user.name || req.user.email,
          changedByRole: req.user.role,
          notes: adminNotes || `Status changed from ${oldStatus} to ${status}`,
          proofImage: proofCloudinaryId,
          proofImageUrl: proofImageUrl,
          scheduledPickupDate: oldScheduledPickup?.scheduledDate,
          scheduledPickupTime: oldScheduledPickup?.scheduledTime
        });

        // If status is processed and has scheduled pickup, mark as confirmed
        if (status === 'processed' && report.scheduledPickup) {
          report.scheduledPickup.confirmed = true;
          report.scheduledPickup.confirmedAt = new Date();
        }
        
        // If status is completed, ensure pickup is confirmed if it existed
        if (status === 'completed' && report.scheduledPickup && !report.scheduledPickup.confirmed) {
          report.scheduledPickup.confirmed = true;
          report.scheduledPickup.confirmedAt = new Date();
        }

        // If status is recycled or disposed, record collection
        if (status === 'recycled' || status === 'disposed') {
          report.collectionDetails = {
            collectedAt: new Date(),
            collectedBy: req.user.id,
            collectionProofImage: proofImageUrl,
            collectionProofCloudinaryId: proofCloudinaryId,
            notes: adminNotes || `Waste ${status}`
          };
        }
        
        await report.save({ session });

        // Create notification for the user
        let notificationMessage = '';
        if (req.user.role !== 'user') {
          const adminRoleName = req.user.role === 'admin' ? 'Admin' : 
                                req.user.role === 'southadmin' ? 'South Signal Admin' : 
                                req.user.role === 'centraladmin' ? 'Central Bicutan Admin' : 'TUP Admin';
          notificationMessage = `${adminRoleName} updated your report status from ${oldStatus} to: ${status}. ${adminNotes ? `Notes: ${adminNotes}` : ''}`;
        } else {
          notificationMessage = `Your report status updated to: ${status}`;
        }

        const notification = new Notification({
          user: report.user,
          title: 'Report Status Updated',
          message: notificationMessage,
          type: 'report_processed',
          relatedReport: report._id
        });
        await notification.save({ session });

        await session.commitTransaction();
        session.endSession();

        const updatedReport = await WasteReport.findById(report._id)
          .populate('user', 'name email profile')
          .populate('statusHistory.changedBy', 'name email role');

        res.json({ 
          success: true, 
          message: 'Report status updated successfully',
          report: updatedReport
        });

      } catch (transactionError) {
        await session.abortTransaction();
        session.endSession();
        throw transactionError;
      }

    } catch (error) {
      console.error('Update status error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to update report status',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// @desc    Delete waste report
// @route   DELETE /api/waste-reports/:id
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const report = await WasteReport.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    let hasAccess = false;
    if (req.user.role === 'admin') hasAccess = true;
    else if (req.user.role === 'southadmin' && report.assignedBarangay === 'south_signal') hasAccess = true;
    else if (req.user.role === 'centraladmin' && report.assignedBarangay === 'central_bicutan') hasAccess = true;
    else if (req.user.role === 'tupadmin' && report.assignedBarangay === 'tup_taguig') hasAccess = true;
    else if (report.user.toString() === req.user.id) hasAccess = true;
    
    if (!hasAccess) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    if (report.cloudinaryId) {
      try {
        await cloudinary.uploader.destroy(report.cloudinaryId);
      } catch (cloudinaryError) {
        console.error('Cloudinary delete error:', cloudinaryError);
      }
    }

    await WasteReport.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete report' });
  }
});

// @desc    Get comprehensive statistics
// @route   GET /api/waste-reports/stats/comprehensive
// @access  Private/Admin
router.get('/stats/comprehensive', auth, async (req, res) => {
  try {
    if (!['admin', 'southadmin', 'centraladmin', 'tupadmin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    let baseFilter = {};
    const barangayFilter = getBarangayFilterFromRole(req.user.role);
    
    if (barangayFilter) {
      baseFilter = { ...barangayFilter };
    }

    const totalReports = await WasteReport.countDocuments(baseFilter);
    const pendingReports = await WasteReport.countDocuments({ ...baseFilter, status: 'pending' });
    const scheduledReports = await WasteReport.countDocuments({ ...baseFilter, status: 'scheduled' });
    const processedReports = await WasteReport.countDocuments({ ...baseFilter, status: 'processed' });
    const recycledReports = await WasteReport.countDocuments({ ...baseFilter, status: 'recycled' });
    const disposedReports = await WasteReport.countDocuments({ ...baseFilter, status: 'disposed' });
    const rejectedReports = await WasteReport.countDocuments({ ...baseFilter, status: 'rejected' });
    const completedReports = await WasteReport.countDocuments({ ...baseFilter, status: 'completed' });

    const classificationStats = await WasteReport.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: '$classification',
          count: { $sum: 1 },
          avgConfidence: { $avg: '$classificationConfidence' }
        }
      },
      {
        $project: {
          classification: '$_id',
          count: 1,
          avgConfidence: 1,
          percentage: totalReports > 0 ? { $multiply: [{ $divide: ['$count', totalReports] }, 100] } : 0
        }
      },
      { $sort: { count: -1 } }
    ]);

    const monthlyStats = await WasteReport.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: {
            year: { $year: '$scanDate' },
            month: { $month: '$scanDate' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          period: {
            $concat: [
              { $toString: '$_id.year' },
              '-',
              { $toString: { $cond: [{ $lt: ['$_id.month', 10] }, { $concat: ['0', { $toString: '$_id.month' }] }, { $toString: '$_id.month' }] } }
            ]
          },
          count: 1
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);

    const userStats = await WasteReport.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: '$user',
          reportCount: { $sum: 1 },
          firstReport: { $min: '$scanDate' },
          lastReport: { $max: '$scanDate' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $project: {
          userId: '$_id',
          userName: { $arrayElemAt: ['$userInfo.name', 0] },
          userEmail: { $arrayElemAt: ['$userInfo.email', 0] },
          reportCount: 1,
          firstReport: 1,
          lastReport: 1
        }
      },
      { $sort: { reportCount: -1 } },
      { $limit: 10 }
    ]);

    const materialStats = await WasteReport.aggregate([
      { $match: baseFilter },
      { $unwind: '$detectedObjects' },
      {
        $group: {
          _id: '$detectedObjects.material',
          count: { $sum: 1 },
          avgConfidence: { $avg: '$detectedObjects.confidence' }
        }
      },
      {
        $project: {
          material: '$_id',
          count: 1,
          avgConfidence: 1,
          percentage: totalReports > 0 ? { $multiply: [{ $divide: ['$count', totalReports] }, 100] } : 0
        }
      },
      { $sort: { count: -1 } },
      { $match: { material: { $ne: null, $ne: '' } } }
    ]);

    res.json({
      success: true,
      adminRole: req.user.role,
      barangayFilter: barangayFilter ? Object.values(barangayFilter)[0] : 'all',
      stats: {
        overview: {
          total: totalReports,
          pending: pendingReports,
          scheduled: scheduledReports,
          processed: processedReports,
          recycled: recycledReports,
          disposed: disposedReports,
          rejected: rejectedReports,
          completed: completedReports
        },
        classificationBreakdown: classificationStats,
        monthlyTrends: monthlyStats,
        userActivity: userStats,
        materialBreakdown: materialStats,
        summary: {
          mostCommonClassification: classificationStats[0]?.classification || 'None',
          topMaterial: materialStats[0]?.material || 'None',
          mostActiveUser: userStats[0]?.userName || 'None',
          avgReportsPerUser: totalReports / (userStats.length || 1)
        }
      }
    });
  } catch (error) {
    console.error('Get comprehensive stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch comprehensive statistics' });
  }
});

// @desc    Get quick overview statistics
// @route   GET /api/waste-reports/stats/overview
// @access  Private/Admin
router.get('/stats/overview', auth, async (req, res) => {
  try {
    if (!['admin', 'southadmin', 'centraladmin', 'tupadmin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    let baseFilter = {};
    const barangayFilter = getBarangayFilterFromRole(req.user.role);
    
    if (barangayFilter) {
      baseFilter = { ...barangayFilter };
    }

    const totalReports = await WasteReport.countDocuments(baseFilter);
    const pendingReports = await WasteReport.countDocuments({ ...baseFilter, status: 'pending' });
    const scheduledReports = await WasteReport.countDocuments({ ...baseFilter, status: 'scheduled' });
    const processedReports = await WasteReport.countDocuments({ ...baseFilter, status: 'processed' });
    const recycledReports = await WasteReport.countDocuments({ ...baseFilter, status: 'recycled' });
    const disposedReports = await WasteReport.countDocuments({ ...baseFilter, status: 'disposed' });
    const rejectedReports = await WasteReport.countDocuments({ ...baseFilter, status: 'rejected' });
    const completedReports = await WasteReport.countDocuments({ ...baseFilter, status: 'completed' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaysReports = await WasteReport.countDocuments({
      ...baseFilter,
      scanDate: { $gte: today }
    });

    const startOfWeek = new Date();
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const thisWeeksReports = await WasteReport.countDocuments({
      ...baseFilter,
      scanDate: { $gte: startOfWeek }
    });

    res.json({
      success: true,
      adminRole: req.user.role,
      barangayFilter: barangayFilter ? Object.values(barangayFilter)[0] : 'all',
      stats: {
        total: totalReports,
        pending: pendingReports,
        scheduled: scheduledReports,
        processed: processedReports,
        recycled: recycledReports,
        disposed: disposedReports,
        rejected: rejectedReports,
        completed: completedReports,
        todaysReports,
        thisWeeksReports
      }
    });
  } catch (error) {
    console.error('Get overview stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch overview statistics' });
  }
});

module.exports = router;