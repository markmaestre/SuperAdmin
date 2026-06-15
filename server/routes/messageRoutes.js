const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const Admin = require('../models/admin');
const auth = require('../middleware/auth');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const stream = require('stream');

// ==================== CONFIGURE CLOUDINARY ====================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ==================== CONFIGURE MULTER ====================
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
  const allowedDocumentTypes = /pdf|doc|docx|xls|xlsx|txt/;
  
  const isImage = allowedImageTypes.test(file.mimetype);
  const isDocument = allowedDocumentTypes.test(file.mimetype);
  
  if (isImage || isDocument) {
    cb(null, true);
  } else {
    cb(new Error('Only images and documents are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
    files: 10
  },
  fileFilter: fileFilter
});

// ==================== HELPER FUNCTIONS ====================

const uploadToCloudinary = (fileBuffer, originalName, mimeType) => {
  return new Promise((resolve, reject) => {
    const isImage = mimeType.startsWith('image/');
    
    const uploadOptions = {
      folder: isImage ? 'chat_attachments/images' : 'chat_attachments/documents',
      resource_type: isImage ? 'image' : 'raw',
      public_id: `${Date.now()}_${originalName.replace(/[^a-zA-Z0-9.]/g, '_')}`
    };
    
    if (isImage) {
      uploadOptions.transformation = [{ width: 2000, height: 2000, crop: 'limit' }];
    }
    
    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    
    const readableStream = new stream.Readable();
    readableStream.push(fileBuffer);
    readableStream.push(null);
    readableStream.pipe(uploadStream);
  });
};

const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });
    return result;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
  }
};

const findUserById = async (userId) => {
  try {
    let user = await User.findById(userId);
    if (user) {
      return {
        ...user.toObject(),
        userType: 'User',
        username: user.username,
        email: user.email,
        role: 'user',
        barangay: user.barangay
      };
    }

    let admin = await Admin.findById(userId);
    if (admin) {
      return {
        ...admin.toObject(),
        userType: 'Admin',
        username: admin.email.split('@')[0],
        email: admin.email,
        role: admin.role,
        barangay: admin.assignedBarangayLabel
      };
    }

    return null;
  } catch (error) {
    console.error('Error finding user:', error);
    return null;
  }
};

const getUserDetails = async (userId, userModel) => {
  if (userModel === 'User') {
    const user = await User.findById(userId).select('username email barangay role profile');
    if (user) {
      return {
        _id: user._id,
        username: user.username,
        email: user.email,
        barangay: user.barangay,
        role: 'user',
        userType: 'User'
      };
    }
  } else if (userModel === 'Admin') {
    const admin = await Admin.findById(userId).select('email role assignedBarangay assignedBarangayLabel profile');
    if (admin) {
      return {
        _id: admin._id,
        username: admin.email.split('@')[0],
        email: admin.email,
        barangay: admin.assignedBarangayLabel,
        role: admin.role,
        userType: 'Admin'
      };
    }
  }
  return null;
};

const getSenderDetails = async (senderId) => {
  let user = await User.findById(senderId);
  if (user) {
    return {
      senderModel: 'User',
      senderRole: 'user',
      senderBarangay: user.barangay || null
    };
  }

  let admin = await Admin.findById(senderId);
  if (admin) {
    return {
      senderModel: 'Admin',
      senderRole: admin.role,
      senderBarangay: admin.assignedBarangayLabel || null
    };
  }

  return null;
};

const getReceiverDetails = async (receiverId) => {
  let user = await User.findById(receiverId);
  if (user) {
    return {
      receiverModel: 'User',
      receiverRole: 'user',
      receiverBarangay: user.barangay || null
    };
  }

  let admin = await Admin.findById(receiverId);
  if (admin) {
    return {
      receiverModel: 'Admin',
      receiverRole: admin.role,
      receiverBarangay: admin.assignedBarangayLabel || null
    };
  }

  return null;
};

const getBarangayContext = (senderBarangay, receiverBarangay, senderRole, receiverRole) => {
  if (senderBarangay && receiverBarangay && senderBarangay === receiverBarangay) {
    return senderBarangay;
  }
  
  if (senderRole === 'user' && receiverRole !== 'user') {
    return senderBarangay;
  }
  
  if (senderRole !== 'user' && receiverRole === 'user') {
    return receiverBarangay;
  }
  
  return null;
};

// ==================== ROUTES ====================

// 1️⃣ Get all users for messaging
router.get('/users', auth, async (req, res) => {
  try {
    const currentUserId = req.user.id || req.user.userId;
    const currentUserInfo = await findUserById(currentUserId);
    
    if (!currentUserInfo) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    let users = [];
    let admins = [];
    
    const allUsers = await User.find({ _id: { $ne: currentUserId } })
      .select('username email profile role barangay status');
    
    let allAdmins = await Admin.find({ _id: { $ne: currentUserId } })
      .select('email profile role assignedBarangay assignedBarangayLabel');
    
    if (currentUserInfo.userType === 'Admin') {
      if (currentUserInfo.role === 'southadmin') {
        users = allUsers.filter(user => user.barangay === 'South Signal');
        admins = allAdmins.filter(admin => 
          admin.assignedBarangayLabel === 'South Signal, Taguig' ||
          admin.role === 'admin'
        );
      } 
      else if (currentUserInfo.role === 'centraladmin') {
        users = allUsers.filter(user => user.barangay === 'Central Bicutan');
        admins = allAdmins.filter(admin => 
          admin.assignedBarangayLabel === 'Central Signal, Taguig' ||
          admin.role === 'admin'
        );
      }
      else if (currentUserInfo.role === 'admin') {
        users = allUsers;
        admins = allAdmins;
      }
    } else {
      users = allUsers;
      admins = allAdmins;
    }
    
    const formattedAdmins = admins.map(admin => ({
      _id: admin._id,
      username: admin.email.split('@')[0],
      email: admin.email,
      profile: admin.profile,
      role: admin.role,
      userType: 'Admin',
      barangay: admin.assignedBarangayLabel,
      status: 'active'
    }));
    
    const formattedUsers = users.map(user => ({
      _id: user._id,
      username: user.username,
      email: user.email,
      profile: user.profile,
      role: 'user',
      userType: 'User',
      barangay: user.barangay,
      status: user.status
    }));
    
    const allUsersList = [...formattedUsers, ...formattedAdmins];
    res.json(allUsersList);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Failed to fetch users', error: err.message });
  }
});

// 2️⃣ Search users
router.get('/search', auth, async (req, res) => {
  try {
    const query = req.query.q;
    const currentUserId = req.user.id || req.user.userId;
    
    if (!query || query.trim().length === 0) {
      return res.json([]);
    }
    
    const currentUserInfo = await findUserById(currentUserId);
    
    let userResults = await User.find({
      _id: { $ne: currentUserId },
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    }).select('username email profile role barangay status');
    
    let adminResults = await Admin.find({
      _id: { $ne: currentUserId },
      $or: [
        { email: { $regex: query, $options: 'i' } }
      ]
    }).select('email profile role assignedBarangay assignedBarangayLabel');
    
    const formattedAdminResults = adminResults.map(admin => ({
      _id: admin._id,
      username: admin.email.split('@')[0],
      email: admin.email,
      profile: admin.profile,
      role: admin.role,
      userType: 'Admin',
      barangay: admin.assignedBarangayLabel,
      status: 'active'
    }));
    
    const formattedUserResults = userResults.map(user => ({
      _id: user._id,
      username: user.username,
      email: user.email,
      profile: user.profile,
      role: 'user',
      userType: 'User',
      barangay: user.barangay,
      status: user.status
    }));
    
    let allResults = [...formattedUserResults, ...formattedAdminResults];
    
    if (currentUserInfo && currentUserInfo.userType === 'Admin') {
      if (currentUserInfo.role === 'southadmin') {
        allResults = allResults.filter(user => {
          if (user.userType === 'Admin') {
            return user.barangay === 'South Signal, Taguig' || user.role === 'admin';
          } else {
            return user.barangay === 'South Signal';
          }
        });
      } 
      else if (currentUserInfo.role === 'centraladmin') {
        allResults = allResults.filter(user => {
          if (user.userType === 'Admin') {
            return user.barangay === 'Central Signal, Taguig' || user.role === 'admin';
          } else {
            return user.barangay === 'Central Bicutan';
          }
        });
      }
    }
    
    res.json(allResults);
    
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ message: 'Search failed', error: err.message });
  }
});

// 3️⃣ Get conversations list
router.get('/conversations', auth, async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const currentUserInfo = await findUserById(userId);
    
    if (!currentUserInfo) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const allMessages = await Message.find({
      $or: [
        { sender: userId },
        { receiver: userId }
      ],
      isDeletedBySender: { $ne: true },
      isDeletedByReceiver: { $ne: true }
    }).sort({ timestamp: -1 });
    
    const conversationMap = new Map();
    
    for (const msg of allMessages) {
      const isSender = msg.sender.toString() === userId.toString();
      const otherUserId = isSender ? msg.receiver.toString() : msg.sender.toString();
      const otherUserModel = isSender ? msg.receiverModel : msg.senderModel;
      
      const key = otherUserId;
      
      if (!conversationMap.has(key)) {
        const userInfo = await getUserDetails(otherUserId, otherUserModel);
        if (userInfo) {
          conversationMap.set(key, {
            user: userInfo,
            lastMessage: {
              _id: msg._id,
              text: msg.message || (msg.attachments?.length > 0 ? `📎 ${msg.attachments.length} attachment(s)` : ''),
              hasAttachment: msg.attachments?.length > 0,
              attachments: msg.attachments,
              timestamp: msg.timestamp,
              read: msg.read,
              isEdited: msg.isEdited || false,
              sender: msg.sender,
              senderRole: msg.senderRole
            },
            unreadCount: 0,
            timestamp: msg.timestamp
          });
        }
      }
      
      if (msg.receiver.toString() === userId.toString() && !msg.read) {
        const conv = conversationMap.get(key);
        if (conv) {
          conv.unreadCount = (conv.unreadCount || 0) + 1;
        }
      }
    }
    
    let conversations = Array.from(conversationMap.values());
    conversations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    conversations = conversations.map(conv => ({
      ...conv,
      unread: conv.unreadCount > 0
    }));
    
    res.json(conversations);
    
  } catch (err) {
    console.error('Get conversations error:', err);
    res.status(500).json({ message: 'Failed to fetch conversations', error: err.message });
  }
});

// 4️⃣ Get conversation between users
router.get('/conversation/:otherUserId', auth, async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const otherUserId = req.params.otherUserId;
    
    if (!mongoose.Types.ObjectId.isValid(otherUserId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }
    
    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: otherUserId },
        { sender: otherUserId, receiver: userId }
      ],
      isDeletedBySender: false,
      isDeletedByReceiver: false
    }).sort({ timestamp: 1 });
    
    const populatedMessages = await Promise.all(
      messages.map(async (msg) => {
        const senderInfo = await getUserDetails(msg.sender, msg.senderModel);
        const receiverInfo = await getUserDetails(msg.receiver, msg.receiverModel);
        
        return {
          _id: msg._id,
          senderId: msg.sender,
          receiverId: msg.receiver,
          text: msg.message,
          attachments: msg.attachments || [],
          timestamp: msg.timestamp,
          read: msg.read,
          readAt: msg.readAt,
          isEdited: msg.isEdited || false,
          editedAt: msg.editedAt || null,
          sender: senderInfo,
          receiver: receiverInfo,
          senderRole: msg.senderRole,
          receiverRole: msg.receiverRole,
          barangayContext: msg.barangayContext
        };
      })
    );
    
    res.json(populatedMessages);
    
  } catch (err) {
    console.error('Get conversation error:', err);
    res.status(500).json({ message: 'Failed to fetch conversation', error: err.message });
  }
});

// 5️⃣ Send message with attachments
router.post('/send', auth, upload.array('attachments', 10), async (req, res) => {
  try {
    const { receiverId, text } = req.body;
    const senderId = req.user.id || req.user.userId;
    const files = req.files || [];
    
    if (!receiverId) {
      return res.status(400).json({ message: 'receiverId is required' });
    }
    
    if (!text && files.length === 0) {
      return res.status(400).json({ message: 'Either text or attachment is required' });
    }
    
    if (!mongoose.Types.ObjectId.isValid(senderId) || !mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }
    
    const senderDetails = await getSenderDetails(senderId);
    if (!senderDetails) {
      return res.status(404).json({ message: 'Sender not found' });
    }
    
    const receiverDetails = await getReceiverDetails(receiverId);
    if (!receiverDetails) {
      return res.status(404).json({ message: 'Receiver not found' });
    }
    
    if (senderId.toString() === receiverId.toString()) {
      return res.status(400).json({ message: 'Cannot send message to yourself' });
    }
    
    const barangayContext = getBarangayContext(
      senderDetails.senderBarangay,
      receiverDetails.receiverBarangay,
      senderDetails.senderRole,
      receiverDetails.receiverRole
    );
    
    const attachments = [];
    for (const file of files) {
      try {
        const isImage = file.mimetype.startsWith('image/');
        const fileType = isImage ? 'image' : 
                        file.mimetype === 'application/pdf' ? 'pdf' : 'document';
        
        const uploadResult = await uploadToCloudinary(file.buffer, file.originalname, file.mimetype);
        
        let thumbnailUrl = null;
        if (isImage && uploadResult.public_id) {
          thumbnailUrl = cloudinary.url(uploadResult.public_id, {
            width: 200,
            height: 200,
            crop: 'thumb',
            gravity: 'face'
          });
        }
        
        attachments.push({
          filename: uploadResult.public_id,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          url: uploadResult.secure_url,
          type: fileType,
          thumbnailUrl: thumbnailUrl
        });
      } catch (uploadError) {
        console.error('Error uploading file:', uploadError);
      }
    }
    
    const message = new Message({
      sender: senderId,
      senderModel: senderDetails.senderModel,
      senderRole: senderDetails.senderRole,
      senderBarangay: senderDetails.senderBarangay,
      receiver: receiverId,
      receiverModel: receiverDetails.receiverModel,
      receiverRole: receiverDetails.receiverRole,
      receiverBarangay: receiverDetails.receiverBarangay,
      message: text || null,
      attachments: attachments,
      barangayContext: barangayContext,
      read: false,
      readAt: null,
      isEdited: false,
      editedAt: null
    });
    
    await message.save();
    
    const senderInfo = await getUserDetails(senderId, senderDetails.senderModel);
    const receiverInfo = await getUserDetails(receiverId, receiverDetails.receiverModel);
    
    const responseMessage = {
      _id: message._id,
      senderId: message.sender,
      receiverId: message.receiver,
      text: message.message,
      attachments: message.attachments,
      timestamp: message.timestamp,
      read: message.read,
      isEdited: message.isEdited,
      sender: senderInfo,
      receiver: receiverInfo,
      senderRole: message.senderRole,
      receiverRole: message.receiverRole,
      barangayContext: message.barangayContext
    };
    
    const io = req.app.get('io');
    if (io) {
      io.to(receiverId.toString()).emit('receiveMessage', responseMessage);
      io.to(senderId.toString()).emit('receiveMessage', responseMessage);
    }
    
    res.json({ success: true, message: responseMessage });
    
  } catch (err) {
    console.error('❌ Send message error:', err);
    res.status(500).json({ message: 'Failed to send message', error: err.message });
  }
});

// 5️⃣b EDIT message - NEW ROUTE
router.put('/edit/:messageId', auth, async (req, res) => {
  try {
    const { text } = req.body;
    const userId = req.user.id || req.user.userId;
    const { messageId } = req.params;
    
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Message text is required' });
    }
    
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    // Only sender can edit
    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Only the sender can edit this message' });
    }
    
    // Can only edit within 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (message.timestamp < fiveMinutesAgo) {
      return res.status(403).json({ message: 'Messages can only be edited within 5 minutes' });
    }
    
    message.message = text.trim();
    message.isEdited = true;
    message.editedAt = new Date();
    
    await message.save();
    
    const senderInfo = await getUserDetails(message.sender, message.senderModel);
    const receiverInfo = await getUserDetails(message.receiver, message.receiverModel);
    
    const updatedMessage = {
      _id: message._id,
      senderId: message.sender,
      receiverId: message.receiver,
      text: message.message,
      attachments: message.attachments,
      timestamp: message.timestamp,
      read: message.read,
      isEdited: message.isEdited,
      editedAt: message.editedAt,
      sender: senderInfo,
      receiver: receiverInfo,
      senderRole: message.senderRole,
      receiverRole: message.receiverRole
    };
    
    const io = req.app.get('io');
    if (io) {
      io.to(message.receiver.toString()).emit('messageEdited', updatedMessage);
      io.to(message.sender.toString()).emit('messageEdited', updatedMessage);
    }
    
    res.json({ success: true, message: updatedMessage });
    
  } catch (err) {
    console.error('Edit message error:', err);
    res.status(500).json({ message: 'Failed to edit message', error: err.message });
  }
});

// 6️⃣ Mark messages as read
router.put('/read/:senderId', auth, async (req, res) => {
  try {
    const receiverId = req.user.id || req.user.userId;
    const senderId = req.params.senderId;
    
    if (!mongoose.Types.ObjectId.isValid(receiverId) || !mongoose.Types.ObjectId.isValid(senderId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }
    
    const result = await Message.updateMany(
      { sender: senderId, receiver: receiverId, read: false },
      { $set: { read: true, readAt: new Date() } }
    );
    
    res.json({ success: true, modifiedCount: result.modifiedCount });
    
  } catch (err) {
    console.error('Mark as read error:', err);
    res.status(500).json({ message: 'Failed to update read status', error: err.message });
  }
});

// 7️⃣ Get unread message count
router.get('/unread/count', auth, async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const unreadCount = await Message.countDocuments({
      receiver: userId,
      read: false,
      isDeletedByReceiver: false
    });
    res.json({ unreadCount });
    
  } catch (err) {
    console.error('Get unread count error:', err);
    res.status(500).json({ message: 'Failed to get unread count', error: err.message });
  }
});

// 8️⃣ Delete message (soft delete)
router.delete('/:messageId', auth, async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const { messageId } = req.params;
    
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    // Check if user is sender or receiver
    const isSender = message.sender.toString() === userId.toString();
    const isReceiver = message.receiver.toString() === userId.toString();
    
    if (!isSender && !isReceiver) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    if (isSender) {
      message.isDeletedBySender = true;
    }
    if (isReceiver) {
      message.isDeletedByReceiver = true;
    }
    
    // If both deleted, actually remove from database
    if (message.isDeletedBySender && message.isDeletedByReceiver) {
      await Message.findByIdAndDelete(messageId);
    } else {
      await message.save();
    }
    
    const io = req.app.get('io');
    if (io) {
      io.to(message.sender.toString()).emit('messageDeleted', { messageId });
      io.to(message.receiver.toString()).emit('messageDeleted', { messageId });
    }
    
    res.json({ success: true, message: 'Message deleted' });
    
  } catch (err) {
    console.error('Delete message error:', err);
    res.status(500).json({ message: 'Failed to delete message', error: err.message });
  }
});

// 8️⃣b Delete attachment from message
router.delete('/:messageId/attachment/:attachmentId', auth, async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const { messageId, attachmentId } = req.params;
    
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Only sender can delete attachments' });
    }
    
    const attachment = message.attachments.id(attachmentId);
    if (attachment) {
      await deleteFromCloudinary(attachment.filename, attachment.type === 'image' ? 'image' : 'raw');
      message.attachments.pull(attachmentId);
      await message.save();
    }
    
    res.json({ success: true, attachments: message.attachments });
    
  } catch (err) {
    console.error('Delete attachment error:', err);
    res.status(500).json({ message: 'Failed to delete attachment', error: err.message });
  }
});

// 9️⃣ Health check
router.get('/health', auth, async (req, res) => {
  const userId = req.user.id || req.user.userId;
  const userInfo = await findUserById(userId);
  
  res.json({ 
    status: 'OK', 
    service: 'Messages API',
    user: {
      id: userId,
      role: userInfo?.role,
      barangay: userInfo?.barangay,
      userType: userInfo?.userType
    },
    timestamp: new Date().toISOString()
  });
});

// 🔟 Debug routes
router.get('/debug/messages', auth, async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }]
    }).sort({ timestamp: -1 }).limit(20);
    
    res.json({
      totalMessages: messages.length,
      messages: messages.map(m => ({
        id: m._id,
        sender: m.sender,
        receiver: m.receiver,
        text: m.message,
        hasAttachments: m.attachments?.length > 0,
        attachmentsCount: m.attachments?.length || 0,
        isEdited: m.isEdited || false,
        timestamp: m.timestamp,
        read: m.read
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/debug/all-users', auth, async (req, res) => {
  try {
    const users = await User.find().select('username email barangay role');
    const admins = await Admin.find().select('email role assignedBarangayLabel');
    
    res.json({
      users: users,
      admins: admins,
      totalUsers: users.length,
      totalAdmins: admins.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;