import React, { useState, useEffect, useCallback, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import API_URL from '../Utils/Api';

/* ------------------------------------------------------------------
   DESIGN TOKENS — aligned with AdminDashboard
   ------------------------------------------------------------------ */
const T = {
  navy:       '#15192B',
  navyMid:    '#1B2138',
  navyLight:  '#232A45',
  blue:       '#4F5BD5',
  blueLight:  '#6B76E0',
  cyan:       '#3070C9',
  teal:       '#2F8F8C',
  green:      '#1F9D6D',
  amber:      '#D08B1E',
  red:        '#D9483C',
  slate:      '#5B6276',
  slateLight: '#9AA1B5',
  pageBg:     '#F6F7FB',
  white:      '#FFFFFF',
  border:     '#E7E9F1',
  southColor: '#C9633F',
  centralColor: '#2F8F8C',
};

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

function getCurrentWeekNumber() {
  const now   = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const days  = Math.floor((now - start) / 864e5);
  return Math.ceil((days + start.getDay() + 1) / 7);
}

/* ------------------------------------------------------------------
   ICONS
   ------------------------------------------------------------------ */
const Ico = ({ d, size = 16, color = 'currentColor', sw = 1.8, fill = 'none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"
    fill={fill} stroke={color} strokeWidth={sw}
    strokeLinecap="round" strokeLinejoin="round"
    style={{ display:'inline-block', flexShrink:0, verticalAlign:'middle' }}>
    {Array.isArray(d) ? d.map((p,i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const IC = {
  doc:      ['M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z','M14 2v6h6','M16 13H8','M16 17H8','M10 9H8'],
  xls:      ['M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z','M14 2v6h6','M9 13l6 6','M15 13l-6 6'],
  download: ['M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4','M7 10l5 5 5-5','M12 15V3'],
  calendar: ['M8 2v4','M16 2v4','M3 10h18','M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z'],
  week:     ['M3 12h18','M3 6l9-3 9 3','M3 18l9 3 9-3'],
  year:     ['M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'],
  check:    ['M20 6L9 17l-5-5'],
  alert:    ['M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z','M12 9v4','M12 17h.01'],
  chart:    ['M18 20V10','M12 20V4','M6 20v-6'],
  recycle:  ['M4 15l3 3 3-3','M7 18V9.5C7 7 9 5 11.5 5H13','M20 9l-3-3-3 3','M17 6v8.5C17 17 15 19 12.5 19H11'],
  layers:   ['M12 2L2 7l10 5 10-5-10-5z','M2 17l10 5 10-5','M2 12l10 5 10-5'],
  info:     ['M12 2a10 10 0 100 20 10 10 0 100-20z','M12 16v-4','M12 8h.01'],
  users:    ['M12 11a4 4 0 100-8 4 4 0 000 8z','M18 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2','M22 21v-2a4 4 0 00-3-3.87','M16 3.13a4 4 0 010 7.75'],
  location: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z M12 13a3 3 0 100-6 3 3 0 000 6z',
  building: ['M3 21h18','M5 21V7l8-4 8 4v14','M9 21v-6h6v6'],
  compare:  ['M8 7h12M8 12h12M8 17h12M4 7h.01M4 12h.01M4 17h.01'],
  map:      'M21 10.5c0 4.5-9 12-9 12s-9-7.5-9-12a9 9 0 0118 0z M12 13.5a3 3 0 100-6 3 3 0 000 6z',
  trophy:   'M12 15v5M8 3h8l1 10-5 2-5-2 1-10z M4 7h2 M18 7h2 M6 12h2 M16 12h2',
  award:    'M12 15l-3.5 2 1-4-3-2.5 4-.5L12 6l1.5 4 4 .5-3 2.5 1 4z M12 2a10 10 0 100 20 10 10 0 000-20z',
  trendUp:  'M23 6l-7.5 7.5-5-5L2 17 M17 6h6v6',
  trendDown:'M23 18l-7.5-7.5-5 5L2 7 M17 18h6v-6',
  star:     'M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6-4.8-6 4.8 2.4-7.2-6-4.8h7.6z',
  target:   'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 18a6 6 0 100-12 6 6 0 000 12z M12 14a2 2 0 100-4 2 2 0 000 4z',
  clock:    'M12 6v6l4 2 M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z',
};

/* ------------------------------------------------------------------
   WEIGHT CALCULATION (real logic from backend)
   ------------------------------------------------------------------ */
const calculateItemWeight = (classification, detectedObjectLabel) => {
  const weights = {
    plastic:    { default:0.04, bottle:0.05, bag:0.01, container:0.08, cup:0.03, straw:0.002 },
    paper:      { default:0.08, bag:0.05, cup:0.01, newspaper:0.10, magazine:0.15 },
    glass:      { default:0.25, bottle:0.30, jar:0.25, cup:0.20 },
    metal:      { default:0.02, can:0.015, tin:0.015, lid:0.01 },
    aluminum:   { default:0.015, can:0.015, foil:0.005 },
    organic:    { default:0.25, food:0.25, fruit:0.10, vegetable:0.20, yard:0.50 },
    electronic: { default:0.50, phone:0.18, laptop:2.00, tablet:0.50, battery:0.15 },
    textile:    { default:0.25, shirt:0.20, pants:0.40, jeans:0.50, jacket:0.60 },
    cardboard:  { default:0.25, box:0.50, sheet:0.15, carton:0.10 },
  };
  const classKey = (classification || '').toLowerCase().trim();
  const rawLabel  = (detectedObjectLabel  || '').toLowerCase().trim();
  const category  = weights[classKey] || { default: 0.10 };
  for (const [kw, w] of Object.entries(category)) {
    if (rawLabel.includes(kw)) return w;
  }
  return category.default || 0.10;
};

const calculateTotalWeight = (report) => {
  const qty      = report.detectedObjects?.length || 1;
  const classKey = (report.classification || '').toLowerCase().trim();
  const rawLabel = (report.detectedObjects?.[0]?.label || '').toLowerCase().trim();
  const weight   = calculateItemWeight(classKey, rawLabel) * qty;
  let statusMultiplier = 1;
  if (report.status === 'recycled')  statusMultiplier = 0.9;
  if (report.status === 'processed') statusMultiplier = 0.95;
  return parseFloat((weight * statusMultiplier).toFixed(3));
};

/* ------------------------------------------------------------------
   PROCESS DATA WITH BARANGAY COMPARISON (real data)
   ------------------------------------------------------------------ */
const processDataWithComparison = (southReports, centralReports) => {
  const processBarangayData = (reports, barangayName) => {
    if (!reports?.length) {
      return {
        barangay: barangayName,
        overview: { total:0, pending:0, processed:0, recycled:0, disposed:0, totalWeight:0 },
        classificationBreakdown: [],
        mostScannedItems: [],
        mostCollectedItems: [],
        userActivity: [],
        locationBreakdown: [],
      };
    }

    let totalWeight = 0;
    reports.forEach(r => { totalWeight += calculateTotalWeight(r); });

    const ov = {
      total:     reports.length,
      pending:   reports.filter(r => r.status === 'pending').length,
      processed: reports.filter(r => r.status === 'processed').length,
      recycled:  reports.filter(r => r.status === 'recycled').length,
      disposed:  reports.filter(r => r.status === 'disposed').length,
      totalWeight: parseFloat(totalWeight.toFixed(2)),
    };

    const clsMap = new Map();
    reports.forEach(r => {
      let c = r.classification || 'Unknown';
      if (c === 'Unknown' || c === 'unknown') c = 'Unclassified';
      clsMap.set(c, (clsMap.get(c) || 0) + 1);
    });
    const classificationBreakdown = [...clsMap.entries()]
      .map(([name, count]) => ({ classification:name, count, percentage:ov.total > 0 ? (count/ov.total)*100 : 0 }))
      .sort((a,b) => b.count - a.count);

    const scanMap = new Map();
    reports.forEach(r => {
      if (r.detectedObjects?.length) {
        r.detectedObjects.forEach(obj => {
          let lbl = obj.label || 'Unknown';
          if (lbl === 'Unknown' || lbl === 'unknown') lbl = 'Unclassified Item';
          scanMap.set(lbl, (scanMap.get(lbl) || 0) + 1);
        });
      }
    });
    const mostScannedItems = [...scanMap.entries()]
      .map(([name, count]) => ({ name, count, percentage:ov.total > 0 ? (count/ov.total)*100 : 0 }))
      .sort((a,b) => b.count - a.count).slice(0, 10);

    const collectedMap = new Map();
    reports.forEach(r => {
      if (r.detectedObjects?.length) {
        r.detectedObjects.forEach(obj => {
          let lbl = obj.label || 'Unknown';
          collectedMap.set(lbl, (collectedMap.get(lbl) || 0) + 1);
        });
      } else {
        let c = r.classification || 'Unknown';
        collectedMap.set(c, (collectedMap.get(c) || 0) + 1);
      }
    });
    const mostCollectedItems = [...collectedMap.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a,b) => b.count - a.count).slice(0, 10);

    const userMap = new Map();
    reports.forEach(r => {
      const uid    = r.userId || r.user?._id || r.user;
      let uname    = r.userName || r.user?.name || r.user?.email?.split('@')[0] || 'Resident';
      if (!uname || uname === 'anonymous') uname = 'Resident';
      const uemail = r.userEmail || r.user?.email || '';
      const key    = uid || uname;
      if (userMap.has(key)) { userMap.get(key).reportCount += 1; }
      else { userMap.set(key, { userName:uname, reportCount:1, userEmail:uemail }); }
    });
    const userActivity = [...userMap.values()].sort((a,b) => b.reportCount - a.reportCount).slice(0, 15);

    const locMap = new Map();
    reports.forEach(r => {
      let loc = r.location || r.address || 'Unknown Location';
      if (typeof loc === 'object') loc = loc.address || loc.name || 'Unknown Location';
      if (!loc || loc === 'unknown') loc = 'Other Areas';
      const w = calculateTotalWeight(r);
      const wasteType = r.classification || 'Unclassified';
      if (locMap.has(loc)) {
        const e = locMap.get(loc);
        e.reports += 1; e.weight += w;
        if (!e.wasteTypes[wasteType]) e.wasteTypes[wasteType] = 0;
        e.wasteTypes[wasteType] += 1;
      } else {
        locMap.set(loc, { name:loc, reports:1, weight:w, wasteTypes:{[wasteType]:1} });
      }
    });

    const locationBreakdown = [...locMap.values()]
      .sort((a,b) => b.reports - a.reports).slice(0, 10)
      .map(loc => ({
        name: loc.name, reports: loc.reports,
        weight: parseFloat(loc.weight.toFixed(2)),
        primaryWasteType: Object.entries(loc.wasteTypes).sort((a,b) => b[1]-a[1])[0]?.[0] || 'Unknown',
      }));

    return {
      barangay: barangayName,
      overview: ov,
      classificationBreakdown,
      mostScannedItems,
      mostCollectedItems,
      userActivity,
      locationBreakdown,
    };
  };

  const southData = processBarangayData(southReports, 'South Signal Village');
  const centralData = processBarangayData(centralReports, 'Central Bicutan');

  const combinedTotal = (southData.overview.total || 0) + (centralData.overview.total || 0);
  const combinedWeight = (southData.overview.totalWeight || 0) + (centralData.overview.totalWeight || 0);
  const combinedRecycled = (southData.overview.recycled || 0) + (centralData.overview.recycled || 0);
  const combinedProcessed = (southData.overview.processed || 0) + (centralData.overview.processed || 0);
  const combinedPending = (southData.overview.pending || 0) + (centralData.overview.pending || 0);
  const combinedDisposed = (southData.overview.disposed || 0) + (centralData.overview.disposed || 0);

  const recycledRate = combinedTotal > 0 ? ((combinedRecycled / combinedTotal) * 100).toFixed(1) : 0;
  const processedRate = combinedTotal > 0 ? ((combinedProcessed / combinedTotal) * 100).toFixed(1) : 0;
  const southPercentage = combinedTotal > 0 ? ((southData.overview.total / combinedTotal) * 100).toFixed(1) : 0;
  const centralPercentage = combinedTotal > 0 ? ((centralData.overview.total / combinedTotal) * 100).toFixed(1) : 0;

  const mostActiveBarangay = southData.overview.total >= centralData.overview.total ? 'South Signal Village' : 'Central Bicutan';
  const mostActiveCount = Math.max(southData.overview.total, centralData.overview.total);

  return {
    southData,
    centralData,
    combined: {
      total: combinedTotal,
      totalWeight: combinedWeight.toFixed(2),
      recycled: combinedRecycled,
      processed: combinedProcessed,
      pending: combinedPending,
      disposed: combinedDisposed,
      recycledRate: recycledRate,
      processedRate: processedRate,
    },
    comparison: {
      mostActiveBarangay,
      mostActiveCount,
      southPercentage: southPercentage,
      centralPercentage: centralPercentage,
    },
  };
};

/* ------------------------------------------------------------------
   PDF BUILDER (conditional sections)
   ------------------------------------------------------------------ */
const buildPDF = async (doc, analyticsData, {
  reportPeriod, selectedMonth, selectedYear, selectedWeek,
  startDate, endDate, reportType,
}) => {
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const ML = 14;
  const MR = 14;
  const CW = pw - ML - MR;
  const CT = pw / 2;

  const P = {
    navy:    [21,  25,  43],
    navyMd:  [35,  42,  69],
    blue:    [79,  91,  213],
    blueLt:  [238, 240, 253],
    cyan:    [48,  112, 201],
    green:   [31,  157, 109],
    greenLt: [229, 246, 239],
    amber:   [208, 139, 30],
    amberLt: [252, 241, 223],
    red:     [217, 72,  60],
    redLt:   [251, 235, 233],
    teal:    [47,  143, 140],
    tealLt:  [232, 247, 246],
    purple:  [139, 111, 209],
    purpleLt:[240, 237, 251],
    slate:   [91,  98,  118],
    slateL:  [154, 161, 181],
    light:   [246, 247, 251],
    surf:    [250, 250, 253],
    border:  [231, 233, 241],
    white:   [255, 255, 255],
    south:   [201, 99,  63],
    central: [47,  143, 140],
  };

  const setTxt  = (a) => doc.setTextColor(...a);
  const setFill = (a) => doc.setFillColor(...a);
  const setDrw  = (a) => doc.setDrawColor(...a);
  const rR      = (x,y,w,h,r,m='F') => doc.roundedRect(x,y,w,h,r,r,m);

  let periodLabel = '', periodRange = '', periodType = '';
  if (reportPeriod === 'week') {
    periodLabel = `Week ${selectedWeek}, ${selectedYear}`;
    periodRange = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
    periodType  = 'week';
  } else if (reportPeriod === 'month') {
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    periodLabel = `${MONTHS[selectedMonth]} ${selectedYear}`;
    periodRange = `${MONTHS[selectedMonth]} 1 - ${MONTHS[selectedMonth]} ${lastDay}, ${selectedYear}`;
    periodType  = 'month';
  } else {
    periodLabel = `Year ${selectedYear}`;
    periodRange = `January 1 - December 31, ${selectedYear}`;
    periodType  = 'year';
  }

  const loadLogo = () => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = img.width; c.height = img.height;
        c.getContext('2d').drawImage(img,0,0);
        resolve(c.toDataURL('image/png'));
      } catch { resolve(null); }
    };
    img.onerror = () => resolve(null);
    img.src = '/TMFK.png';
  });
  const logo = await loadLogo();

  const reportTitles = {
    full:     'TMFK FULL ANALYTICS REPORT',
    waste:    'TMFK WASTE ANALYTICS REPORT',
    user:     'TMFK USER ANALYTICS REPORT',
    location: 'TMFK LOCATION ANALYTICS REPORT',
  };

  const drawHeader = () => {
    const H = 52;
    setFill(P.navy); doc.rect(0, 0, pw, H, 'F');
    setFill(P.cyan);  doc.rect(0, 0, 4, H, 'F');
    setFill(P.blue);  doc.rect(0, H, pw, 2, 'F');
    if (logo) {
      setFill(P.white); rR(ML + 1, 8, 34, 34, 2);
      try { doc.addImage(logo, 'PNG', ML + 2, 9, 32, 32); } catch {}
    }
    const tx = ML + 44;
    const titleText = reportTitles[reportType] || 'TMFK BARANGAY COMPARISON REPORT';
    doc.setFontSize(13); doc.setFont('helvetica', 'bold'); setTxt(P.white);
    doc.text(titleText, tx, 20);
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); setTxt(P.cyan);
    doc.text('Citywide Overview · South Signal Village & Central Bicutan', tx, 30);
    doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); setTxt(P.slateL);
    doc.text(`${periodLabel}  ·  ${periodRange}`, tx, 39);
    doc.setFontSize(6.5); setTxt(P.slate);
    doc.text(`Generated: ${new Date().toLocaleString()}`, pw - MR, 48, { align: 'right' });
  };

  const drawFooter = () => {
    const pages  = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      setDrw(P.border); doc.setLineWidth(0.3);
      doc.line(ML, ph - 18, pw - MR, ph - 18);
      doc.setFontSize(6.5); doc.setFont('helvetica', 'normal'); setTxt(P.slate);
      doc.text('This report is system-generated based on submitted waste reports. Data accuracy depends on user input.', ML, ph - 12);
      doc.text(`Page ${i} of ${pages}`, pw - MR, ph - 12, { align: 'right' });
      doc.setFontSize(6); setTxt(P.slateL);
      doc.text(`${new Date().toLocaleDateString()}  ·  TMFK Waste Management System`, CT, ph - 6, { align: 'center' });
    }
  };

  const checkPage = (y, minSpace = 45) => {
    if (y + minSpace > ph - 28) { doc.addPage(); drawHeader(); return 58; }
    return y;
  };

  const sectionHeading = (label, y, accent = P.blue) => {
    y = checkPage(y, 40);
    setFill(P.light); rR(ML, y, CW, 12, 3);
    setFill(accent);  doc.rect(ML, y, 4, 12, 'F');
    doc.setFontSize(9.5); doc.setFont('helvetica', 'bold'); setTxt(P.navy);
    doc.text(label, ML + 12, y + 8.5);
    return y + 18;
  };

  const metricRow = (y, stats) => {
    y = checkPage(y, 38);
    const gap  = 5;
    const boxW = (CW - gap * (stats.length - 1)) / stats.length;
    stats.forEach((s, i) => {
      const bx = ML + i * (boxW + gap);
      setFill(P.white); setDrw(P.border); doc.setLineWidth(0.25);
      rR(bx, y, boxW, 34, 3, 'FD');
      setFill(s.color || P.blue); doc.rect(bx, y, boxW, 3.5, 'F');
      doc.setFontSize(15); doc.setFont('helvetica', 'bold'); setTxt(s.color || P.navy);
      doc.text(String(s.value), bx + boxW / 2, y + 19, { align: 'center' });
      doc.setFontSize(6.5); doc.setFont('helvetica', 'normal'); setTxt(P.slateL);
      doc.text(s.label.toUpperCase(), bx + boxW / 2, y + 28, { align: 'center' });
    });
    return y + 40;
  };

  const insightBox = (y, title, content, accent = P.blue, bgColor = P.blueLt) => {
    const innerW = CW - 24;
    doc.setFontSize(7.5); doc.setFont('helvetica', 'normal');
    const lines  = doc.splitTextToSize(content, innerW);
    const lineH  = 5;
    const titleH = 16;
    const padB   = 10;
    const boxH   = titleH + (lines.length * lineH) + padB;
    y = checkPage(y, boxH + 8);
    setFill(bgColor); setDrw(P.border); doc.setLineWidth(0.3);
    rR(ML, y, CW, boxH, 4, 'FD');
    setFill(accent); doc.rect(ML, y, 4, boxH, 'F');
    doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); setTxt(P.navy);
    doc.text(title, ML + 12, y + 11);
    doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); setTxt([60, 72, 90]);
    let ty = y + titleH + 2;
    lines.forEach(l => { doc.text(l, ML + 12, ty); ty += lineH; });
    return y + boxH + 12;
  };

  const tableDefaults = {
    theme: 'plain',
    margin: { left: ML, right: MR },
    tableLineWidth: 0,
    showHead: 'everyPage',
    rowPageBreak: 'avoid',
    headStyles: {
      fillColor: P.navy, textColor: P.white, fontStyle: 'bold',
      fontSize: 8, cellPadding: { top: 5, bottom: 5, left: 6, right: 6 },
    },
    bodyStyles: {
      fontSize: 7.5, textColor: P.navy,
      cellPadding: { top: 4, bottom: 4, left: 6, right: 6 },
    },
    alternateRowStyles: { fillColor: P.light },
  };

  drawHeader();
  let y = 62;

  const { southData, centralData, combined, comparison } = analyticsData;
  const hasData = combined.total > 0;

  if (!hasData) {
    y = checkPage(y, 50);
    setFill(P.light); rR(ML, y, CW, 50, 5);
    doc.setFontSize(12); doc.setFont('helvetica', 'bold'); setTxt(P.slate);
    doc.text('No waste reports found for the selected period.', CT, y + 22, { align: 'center' });
    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); setTxt(P.slateL);
    doc.text('Please try a different date range or barangay filter.', CT, y + 36, { align: 'center' });
    drawFooter();
    return;
  }

  // SECTION 1 - BARANGAY COMPARISON OVERVIEW
  y = sectionHeading('1. BARANGAY COMPARISON OVERVIEW', y, P.blue);

  y = checkPage(y, 85);
  const cardW = (CW - 12) / 2;

  setFill(P.white); setDrw(P.border); rR(ML, y, cardW, 85, 4, 'FD');
  setFill(P.south); doc.rect(ML, y, cardW, 4, 'F');
  doc.setFontSize(10.5); doc.setFont('helvetica', 'bold'); setTxt(P.south);
  doc.text('South Signal Village', ML + 10, y + 13);
  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); setTxt(P.slate);
  doc.text(`Total Reports: ${southData.overview.total || 0}`, ML + 12, y + 26);
  doc.text(`Total Weight: ${(southData.overview.totalWeight || 0).toFixed(2)} kg`, ML + 12, y + 36);
  doc.text(`Recycled: ${southData.overview.recycled || 0}`, ML + 12, y + 46);
  doc.text(`Processed: ${southData.overview.processed || 0}`, ML + 12, y + 56);
  doc.text(`Pending: ${southData.overview.pending || 0} | Disposed: ${southData.overview.disposed || 0}`, ML + 12, y + 66);
  const southRecycleRate = southData.overview.total > 0 ? ((southData.overview.recycled / southData.overview.total) * 100).toFixed(1) : 0;
  doc.text(`Recycling Rate: ${southRecycleRate}%`, ML + 12, y + 76);

  setFill(P.white); setDrw(P.border); rR(ML + cardW + 12, y, cardW, 85, 4, 'FD');
  setFill(P.central); doc.rect(ML + cardW + 12, y, cardW, 4, 'F');
  doc.setFontSize(10.5); doc.setFont('helvetica', 'bold'); setTxt(P.central);
  doc.text('Central Bicutan', ML + cardW + 22, y + 13);
  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); setTxt(P.slate);
  doc.text(`Total Reports: ${centralData.overview.total || 0}`, ML + cardW + 24, y + 26);
  doc.text(`Total Weight: ${(centralData.overview.totalWeight || 0).toFixed(2)} kg`, ML + cardW + 24, y + 36);
  doc.text(`Recycled: ${centralData.overview.recycled || 0}`, ML + cardW + 24, y + 46);
  doc.text(`Processed: ${centralData.overview.processed || 0}`, ML + cardW + 24, y + 56);
  doc.text(`Pending: ${centralData.overview.pending || 0} | Disposed: ${centralData.overview.disposed || 0}`, ML + cardW + 24, y + 66);
  const centralRecycleRate = centralData.overview.total > 0 ? ((centralData.overview.recycled / centralData.overview.total) * 100).toFixed(1) : 0;
  doc.text(`Recycling Rate: ${centralRecycleRate}%`, ML + cardW + 24, y + 76);

  y += 93;

  let comparisonText = '';
  const southPercentValue = parseFloat(comparison.southPercentage);
  const centralPercentValue = parseFloat(comparison.centralPercentage);

  if (southPercentValue > centralPercentValue && combined.total > 0) {
    comparisonText = `During this ${periodType} (${periodLabel}), ${comparison.mostActiveBarangay} emerged as the most environmentally active community, generating ${comparison.mostActiveCount} waste reports. This accounts for ${comparison.southPercentage}% of the total ${combined.total} reports across both barangays. The total waste collected weighed ${combined.totalWeight} kg, with an average of ${(combined.totalWeight / combined.total).toFixed(2)} kg per report. The recycling rate stands at ${combined.recycledRate}% (${combined.recycled} out of ${combined.total} items recycled), while ${combined.processedRate}% (${combined.processed} items) have been processed. South Signal Village demonstrates stronger participation, which could serve as a model for Central Bicutan. However, with only ${combined.recycled} items recycled out of ${combined.total}, there is significant room for improvement in recycling practices. The barangay with higher participation should share best practices, including community engagement strategies and collection efficiency methods, to help elevate the other barangay's performance. Regular monitoring and incentive programs could boost both recycling rates and overall participation.`;
  } else if (centralPercentValue > 0 && combined.total > 0) {
    comparisonText = `During this ${periodType} (${periodLabel}), ${comparison.mostActiveBarangay} led waste management efforts with ${comparison.mostActiveCount} reports (${comparison.centralPercentage}% of ${combined.total} total reports). Combined waste collection reached ${combined.totalWeight} kg across both barangays. The current recycling rate is ${combined.recycledRate}% (${combined.recycled} items), and the processing rate is ${combined.processedRate}% (${combined.processed} items). While ${comparison.mostActiveBarangay} shows good participation, the other barangay needs to catch up. Key focus areas should include: (1) establishing collection points in underperforming areas, (2) conducting educational campaigns about proper waste segregation, (3) implementing reward systems for active participants, and (4) organizing inter-barangay competitions to encourage friendly rivalry in waste management. The significant gap in participation suggests that targeted interventions in the less active barangay could yield substantial improvements.`;
  } else if (combined.total === 0) {
    comparisonText = `During this ${periodType} (${periodLabel}), both barangays recorded no waste management activity. This indicates an urgent need for comprehensive community engagement strategies. Recommended actions include: (1) launching awareness campaigns about the importance of waste segregation, (2) establishing convenient drop-off points in strategic locations, (3) partnering with barangay captains and community leaders to promote the program, (4) creating incentives for regular reporters, and (5) conducting door-to-door education initiatives. Without immediate intervention, waste management goals will be difficult to achieve. Consider organizing a waste challenge event to kickstart participation.`;
  } else {
    comparisonText = `During this ${periodType} (${periodLabel}), both barangays recorded waste management activity with ${combined.total} total reports generating ${combined.totalWeight} kg of waste. The recycling rate is ${combined.recycledRate}% (${combined.recycled} items), and the processing rate is ${combined.processedRate}% (${combined.processed} items). This moderate participation indicates room for improvement in community engagement strategies.`;
  }

  y = insightBox(y, 'COMPREHENSIVE COMPARISON ANALYSIS', comparisonText, P.blue, P.blueLt);
  y += 6;

  // SECTION 2 - MOST COLLECTED ITEMS PER BARANGAY (full, waste)
  if (reportType === 'full' || reportType === 'waste') {
    y = sectionHeading('2. MOST COLLECTED ITEMS BY BARANGAY', y, P.teal);

    y = checkPage(y, 70);
    const southItems = southData.mostCollectedItems || [];
    const southItemsText = southItems.length > 0
      ? `South Signal Village residents primarily dispose of ${southItems.slice(0, 3).map(i => i.name).join(', ')}. The most collected item is "${southItems[0]?.name || 'N/A'}" with ${southItems[0]?.count || 0} instances. This indicates that ${southItems[0]?.name?.toLowerCase() || 'this material'} is a major waste stream requiring focused recycling programs.`
      : 'No collected items data available for South Signal Village during this period.';
    y = insightBox(y, 'South Signal Village - Collection Analysis', southItemsText, P.south, [251, 240, 235]);

    if (southItems.length > 0) {
      y = checkPage(y, 50);
      const southRows = southItems.slice(0, 10).map((item, i) => [i + 1, item.name, item.count]);
      autoTable(doc, {
        ...tableDefaults, startY: y,
        head: [['#', 'Item Type', 'Count']],
        body: southRows,
        columnStyles: {
          0: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
          1: { cellWidth: 110, fontStyle: 'bold' },
          2: { cellWidth: 28, halign: 'center', fontStyle: 'bold', textColor: P.south },
        },
        didDrawPage: (data) => { if (data.pageNumber > 1) drawHeader(); },
      });
      y = doc.lastAutoTable.finalY + 12;
    }

    y = checkPage(y, 70);
    const centralItems = centralData.mostCollectedItems || [];
    const centralItemsText = centralItems.length > 0
      ? `Central Bicutan's waste profile shows ${centralItems.slice(0, 3).map(i => i.name).join(', ')} as top items. The most frequently collected item is "${centralItems[0]?.name || 'N/A'}" (${centralItems[0]?.count || 0} times). This data helps identify material-specific recycling opportunities. Consider partnering with specialized recyclers for ${centralItems[0]?.name?.toLowerCase() || 'these materials'}.`
      : 'No collected items data available for Central Bicutan. Encouraging residents to report waste is the first priority.';
    y = insightBox(y, 'Central Bicutan - Collection Analysis', centralItemsText, P.central, [232, 247, 246]);

    if (centralItems.length > 0) {
      y = checkPage(y, 50);
      const centralRows = centralItems.slice(0, 10).map((item, i) => [i + 1, item.name, item.count]);
      autoTable(doc, {
        ...tableDefaults, startY: y,
        head: [['#', 'Item Type', 'Count']],
        body: centralRows,
        columnStyles: {
          0: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
          1: { cellWidth: 110, fontStyle: 'bold' },
          2: { cellWidth: 28, halign: 'center', fontStyle: 'bold', textColor: P.central },
        },
        didDrawPage: (data) => { if (data.pageNumber > 1) drawHeader(); },
      });
      y = doc.lastAutoTable.finalY + 12;
    }
  }

  // SECTION 3 - WASTE ANALYTICS (full, waste)
  if (reportType === 'full' || reportType === 'waste') {
    y = sectionHeading('3. WASTE ANALYTICS', y, P.green);

    y = metricRow(y, [
      { label:'Combined Reports', value:combined.total, color:P.blue },
      { label:'Total Weight', value:`${combined.totalWeight} kg`, color:P.teal },
      { label:'Recycled', value:combined.recycled, color:P.green },
      { label:'Processed', value:combined.processed, color:P.cyan },
    ]);
    y += 6;

    const southClassMap = new Map(southData.classificationBreakdown.map(c => [c.classification, c.count]));
    const centralClassMap = new Map(centralData.classificationBreakdown.map(c => [c.classification, c.count]));
    const allClass = new Set([...southClassMap.keys(), ...centralClassMap.keys()]);

    const classRows = [...allClass].map(cls => [
      cls,
      southClassMap.get(cls) || 0,
      centralClassMap.get(cls) || 0,
      (southClassMap.get(cls) || 0) + (centralClassMap.get(cls) || 0),
    ]).sort((a, b) => b[3] - a[3]);

    const topClass = classRows[0]?.[0] || 'Unknown';
    const topClassCount = classRows[0]?.[3] || 0;
    const topClassPct = combined.total > 0 ? ((topClassCount / combined.total) * 100).toFixed(1) : 0;

    const classificationInsight = `Waste classification analysis reveals that "${topClass}" is the most common waste type, accounting for ${topClassPct}% of all reports (${topClassCount} out of ${combined.total} items). This finding is crucial for resource allocation and recycling program design. ${topClass === 'Plastic' ? 'Plastic waste requires special attention due to its environmental persistence and recyclability challenges.' : ''} ${topClass === 'Organic' ? 'Organic waste presents opportunities for composting and biogas generation.' : ''} ${topClass === 'Electronic' ? 'Electronic waste needs specialized handling due to hazardous components and valuable materials.' : ''} Understanding these patterns helps the barangay tailor its waste management strategies, from collection scheduling to partnership with appropriate recycling facilities. The barangay with higher diversity in waste types may need more comprehensive sorting infrastructure.`;

    y = insightBox(y, 'Waste Classification Deep Dive', classificationInsight, P.green, P.greenLt);
    y += 6;

    y = checkPage(y, 60);
    autoTable(doc, {
      ...tableDefaults, startY: y,
      head: [['Waste Classification', 'South Signal', 'Central Bicutan', 'Total', 'Share']],
      body: classRows.map(row => [row[0], row[1], row[2], row[3], combined.total > 0 ? `${((row[3] / combined.total) * 100).toFixed(1)}%` : '0%']),
      columnStyles: {
        0: { cellWidth: 55, fontStyle: 'bold' },
        1: { cellWidth: 32, halign: 'center', fontStyle: 'bold', textColor: P.south },
        2: { cellWidth: 32, halign: 'center', fontStyle: 'bold', textColor: P.central },
        3: { cellWidth: 28, halign: 'center', fontStyle: 'bold', textColor: P.blue },
        4: { cellWidth: 25, halign: 'center', fontStyle: 'bold', textColor: P.green },
      },
      didDrawPage: (data) => { if (data.pageNumber > 1) drawHeader(); },
    });
    y = doc.lastAutoTable.finalY + 12;

    y = sectionHeading('3.2 MOST SCANNED ITEMS COMPARISON', y, P.amber);

    const southScanMap = new Map(southData.mostScannedItems.map(s => [s.name, s.count]));
    const centralScanMap = new Map(centralData.mostScannedItems.map(s => [s.name, s.count]));
    const allScans = new Set([...southScanMap.keys(), ...centralScanMap.keys()]);

    const scanRows = [...allScans].map(item => [
      item,
      southScanMap.get(item) || 0,
      centralScanMap.get(item) || 0,
      (southScanMap.get(item) || 0) + (centralScanMap.get(item) || 0),
    ]).sort((a, b) => b[3] - a[3]).slice(0, 12);

    const topItem = scanRows[0]?.[0] || 'Unknown';
    const topItemCount = scanRows[0]?.[3] || 0;
    const topItemPct = combined.total > 0 ? ((topItemCount / combined.total) * 100).toFixed(1) : 0;

    const scanInsight = `The most frequently scanned item is "${topItem}" with ${topItemCount} occurrences, representing ${topItemPct}% of all scanned waste. This indicates that ${topItem.toLowerCase()} is a major component of the community's waste stream. ${topItem === 'Battery' ? 'Batteries contain hazardous materials and require special disposal methods to prevent environmental contamination.' : ''} ${topItem === 'Plastic Bottle' ? 'Plastic bottles are highly recyclable but often end up in landfills. A bottle deposit program could significantly increase recycling rates.' : ''} ${topItem === 'Cup' ? 'Disposable cups, especially plastic-lined paper cups, are difficult to recycle. Promoting reusable cups could reduce this waste stream.' : ''} Comparing scan patterns between barangays can identify which community needs more education about specific waste types. The barangay with higher scan counts for hazardous items may require priority training on safe disposal practices.`;

    y = insightBox(y, 'Item-Level Analysis', scanInsight, P.amber, P.amberLt);
    y += 6;

    y = checkPage(y, 60);
    autoTable(doc, {
      ...tableDefaults, startY: y,
      head: [['Item Type', 'South Signal', 'Central Bicutan', 'Total', 'Share']],
      body: scanRows.map(row => [row[0], row[1], row[2], row[3], combined.total > 0 ? `${((row[3] / combined.total) * 100).toFixed(1)}%` : '0%']),
      columnStyles: {
        0: { cellWidth: 55, fontStyle: 'bold' },
        1: { cellWidth: 32, halign: 'center', fontStyle: 'bold', textColor: P.south },
        2: { cellWidth: 32, halign: 'center', fontStyle: 'bold', textColor: P.central },
        3: { cellWidth: 28, halign: 'center', fontStyle: 'bold', textColor: P.blue },
        4: { cellWidth: 25, halign: 'center', fontStyle: 'bold', textColor: P.green },
      },
      didDrawPage: (data) => { if (data.pageNumber > 1) drawHeader(); },
    });
    y = doc.lastAutoTable.finalY + 12;
  }

  // SECTION 4 - LOCATION ANALYTICS (full, location)
  if (reportType === 'full' || reportType === 'location') {
    y = sectionHeading('4. LOCATION ANALYTICS', y, P.purple);

    const southLocs = southData.locationBreakdown || [];
    if (southLocs.length > 0) {
      const topSouthLoc = southLocs[0];
      const locationInsightSouth = `In South Signal Village, "${topSouthLoc.name}" is the most active collection point with ${topSouthLoc.reports} reports totaling ${topSouthLoc.weight.toFixed(2)} kg. This location accounts for ${southData.overview.total > 0 ? ((topSouthLoc.reports / southData.overview.total) * 100).toFixed(1) : 0}% of all reports in the barangay. The primary waste type here is "${topSouthLoc.primaryWasteType}". This concentration suggests that either this area has higher population density, better reporting compliance, or greater waste generation. Consider increasing collection frequency at this location and using it as a model for establishing new collection points in underserved areas. Analyzing the waste composition at this hotspot can help design targeted recycling programs.`;

      y = insightBox(y, 'South Signal - Hotspot Analysis', locationInsightSouth, P.south, [251, 240, 235]);
      y += 6;

      y = checkPage(y, 50);
      const southLocRows = southLocs.slice(0, 8).map((loc, i) => [i + 1, loc.name.substring(0, 45), loc.reports, `${loc.weight.toFixed(2)} kg`, loc.primaryWasteType]);
      autoTable(doc, {
        ...tableDefaults, startY: y,
        head: [['#', 'Location', 'Reports', 'Weight', 'Primary Waste']],
        body: southLocRows,
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 75, fontStyle: 'bold' },
          2: { cellWidth: 25, halign: 'center', fontStyle: 'bold', textColor: P.south },
          3: { cellWidth: 28, halign: 'center', textColor: P.teal },
          4: { cellWidth: 30, halign: 'center', fontStyle: 'bold', textColor: P.blue },
        },
        didDrawPage: (data) => { if (data.pageNumber > 1) drawHeader(); },
      });
      y = doc.lastAutoTable.finalY + 12;
    }

    const centralLocs = centralData.locationBreakdown || [];
    if (centralLocs.length > 0) {
      const topCentralLoc = centralLocs[0];
      const locationInsightCentral = `Central Bicutan's primary collection area is "${topCentralLoc.name}" with ${topCentralLoc.reports} reports and ${topCentralLoc.weight.toFixed(2)} kg collected. This location processes ${centralData.overview.total > 0 ? ((topCentralLoc.reports / centralData.overview.total) * 100).toFixed(1) : 0}% of the barangay's waste. Dominant waste type: "${topCentralLoc.primaryWasteType}". The relatively ${centralLocs.length < 3 ? 'limited number of active collection points suggests under-reporting or insufficient coverage.' : 'good distribution of collection points indicates decent infrastructure.'} To improve, consider: (1) establishing additional collection points in unrepresented areas, (2) promoting existing locations through community announcements, and (3) implementing a regular collection schedule to build resident awareness. Comparing location density between barangays can inform resource allocation decisions.`;

      y = insightBox(y, 'Central Bicutan - Hotspot Analysis', locationInsightCentral, P.central, [232, 247, 246]);
      y += 6;

      y = checkPage(y, 50);
      const centralLocRows = centralLocs.slice(0, 8).map((loc, i) => [i + 1, loc.name.substring(0, 45), loc.reports, `${loc.weight.toFixed(2)} kg`, loc.primaryWasteType]);
      autoTable(doc, {
        ...tableDefaults, startY: y,
        head: [['#', 'Location', 'Reports', 'Weight', 'Primary Waste']],
        body: centralLocRows,
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 75, fontStyle: 'bold' },
          2: { cellWidth: 25, halign: 'center', fontStyle: 'bold', textColor: P.central },
          3: { cellWidth: 28, halign: 'center', textColor: P.teal },
          4: { cellWidth: 30, halign: 'center', fontStyle: 'bold', textColor: P.blue },
        },
        didDrawPage: (data) => { if (data.pageNumber > 1) drawHeader(); },
      });
      y = doc.lastAutoTable.finalY + 12;
    }

    if (southLocs.length === 0 && centralLocs.length === 0) {
      y = insightBox(y, 'Location Coverage', 'No location data is available for either barangay during this period. Encourage residents to enable location tagging when submitting reports so collection hotspots can be identified and prioritized.', P.purple, P.purpleLt);
      y += 6;
    }
  }

  // SECTION 5 - USER ANALYTICS (full, user)
  // For user-only reports, this becomes the main focus with extra depth
  if (reportType === 'full' || reportType === 'user') {
    y = sectionHeading('5. USER ANALYTICS', y, P.purple);

    const southTopUser = southData.userActivity[0]?.userName || 'None';
    const southTopCount = southData.userActivity[0]?.reportCount || 0;
    const centralTopUser = centralData.userActivity[0]?.userName || 'None';
    const centralTopCount = centralData.userActivity[0]?.reportCount || 0;
    const totalActiveUsers = southData.userActivity.length + centralData.userActivity.length;

    // Enhanced user analysis text with more actionable insights
    let userText = '';
    if (totalActiveUsers === 0) {
      userText = `CRITICAL: No residents participated in waste reporting during this ${periodType}. This indicates complete community disengagement. Urgent action is required: (1) organize community meetings to introduce the program, (2) recruit barangay ambassadors to encourage participation, (3) launch a first report wins incentive campaign, (4) simplify the reporting process, and (5) showcase the environmental impact of participation. Without resident involvement, waste management goals cannot be achieved. Consider partnering with homeowners' associations and school groups to jumpstart participation. The TMFK team is ready to assist with training materials and launch support.`;
    } else if (totalActiveUsers < 10) {
      userText = `Only ${totalActiveUsers} resident${totalActiveUsers !== 1 ? 's' : ''} participated in waste reporting this ${periodType}. In South Signal Village, "${southTopUser}" is the top contributor with ${southTopCount} reports. Central Bicutan's top contributor is "${centralTopUser}" with ${centralTopCount} reports. This low participation rate suggests that community engagement strategies need significant improvement. Recommended actions: (1) launch a referral program where existing users invite neighbors, (2) create recognition for top contributors, (3) send SMS reminders about reporting, (4) organize community events with on-site reporting stations, and (5) provide small incentives for each report submitted. The barangay with more active users should mentor the other barangay by sharing successful engagement tactics. A targeted campaign focusing on ${southTopUser !== 'None' ? southTopUser : centralTopUser}'s neighborhood could yield quick wins.`;
    } else if (totalActiveUsers < 30) {
      userText = `${totalActiveUsers} residents actively participated in waste reporting this ${periodType}, showing moderate community engagement. South Signal Village's leading contributor, "${southTopUser}", submitted ${southTopCount} reports. Central Bicutan's top contributor, "${centralTopUser}", submitted ${centralTopCount} reports. The average reports per active user is ${combined.total > 0 ? (combined.total / totalActiveUsers).toFixed(1) : 0}. To sustain and grow participation: (1) maintain recognition for top contributors, (2) share impact metrics showing waste diverted from landfills, (3) introduce friendly competition between barangays with monthly leaderboards, (4) host quarterly appreciation events for active users, (5) create user feedback channels for program improvement, and (6) publish weekly "Environmental Heroes" spotlights. The barangay with higher average reports per user may have more effective reporting infrastructure worth replicating. Consider creating user tiers (Bronze, Silver, Gold) based on report counts to encourage continued engagement.`;
    } else {
      userText = `EXCELLENT ENGAGEMENT: ${totalActiveUsers} residents actively participated in waste reporting this ${periodType}, demonstrating strong community commitment to environmental stewardship. South Signal Village's top contributor, "${southTopUser}", submitted ${southTopCount} reports. Central Bicutan's top contributor, "${centralTopUser}", submitted ${centralTopCount} reports. The average reports per active user is ${combined.total > 0 ? (combined.total / totalActiveUsers).toFixed(1) : 0}, indicating consistent participation. To celebrate and expand this success: (1) launch an annual Environmental Champions award ceremony, (2) create featured contributor profiles on community boards, (3) implement a user mentorship program where top contributors guide new participants, (4) host recognition events with barangay officials, (5) develop a user wall of fame at barangay halls, (6) provide exclusive merchandise for top contributors, and (7) invite top users to participate in planning sessions. This momentum is valuable - protect it with regular communication and visible appreciation. Consider establishing a User Advisory Council with top contributors to provide feedback and suggestions.`;
    }

    y = insightBox(y, 'Community Participation Deep Dive', userText, P.purple, P.purpleLt);
    y += 6;

    if (southData.userActivity.length > 0 || centralData.userActivity.length > 0) {
      // Add additional user statistics if available
      if (combined.total > 0 && totalActiveUsers > 0) {
        const avgReportsPerUser = (combined.total / totalActiveUsers).toFixed(1);
        const topUserPercentage = southTopCount > centralTopCount 
          ? ((southTopCount / combined.total) * 100).toFixed(1)
          : ((centralTopCount / combined.total) * 100).toFixed(1);
        
        y = checkPage(y, 50);
        const statsRows = [
          ['Total Active Users', totalActiveUsers.toString()],
          ['Average Reports Per User', avgReportsPerUser],
          ['Top Contributor Share', `${topUserPercentage}% of total reports`],
          ['Users with 5+ Reports', (southData.userActivity.filter(u => u.reportCount >= 5).length + centralData.userActivity.filter(u => u.reportCount >= 5).length).toString()],
          ['Users with 10+ Reports', (southData.userActivity.filter(u => u.reportCount >= 10).length + centralData.userActivity.filter(u => u.reportCount >= 10).length).toString()],
        ];
        autoTable(doc, {
          ...tableDefaults, startY: y,
          head: [['User Engagement Metric', 'Value']],
          body: statsRows,
          columnStyles: {
            0: { cellWidth: 100, fontStyle: 'bold' },
            1: { cellWidth: 70, halign: 'center', fontStyle: 'bold', textColor: P.blue },
          },
          didDrawPage: (data) => { if (data.pageNumber > 1) drawHeader(); },
        });
        y = doc.lastAutoTable.finalY + 12;
      }

      y = checkPage(y, 50);

      if (southData.userActivity.length > 0) {
        setFill(P.white); setDrw(P.border); rR(ML, y, CW, 10, 3, 'F');
        setFill(P.south); doc.rect(ML, y, CW, 10, 'F');
        doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); setTxt(P.white);
        doc.text('South Signal Village - Top Contributors', ML + CW / 2, y + 7.5, { align: 'center' });

        const southUsers = southData.userActivity.slice(0, 8).map((u, i) => [i + 1, u.userName, u.reportCount]);
        autoTable(doc, {
          ...tableDefaults, startY: y + 12,
          head: [['#', 'Name', 'Reports']],
          body: southUsers,
          margin: { left: ML, right: MR },
          columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            1: { cellWidth: 110, fontStyle: 'bold' },
            2: { cellWidth: 30, halign: 'center', fontStyle: 'bold', textColor: P.south },
          },
          didDrawPage: (data) => { if (data.pageNumber > 1) drawHeader(); },
        });
        y = doc.lastAutoTable.finalY + 12;
      }

      if (centralData.userActivity.length > 0) {
        y = checkPage(y, 50);
        setFill(P.white); setDrw(P.border); rR(ML, y, CW, 10, 3, 'F');
        setFill(P.central); doc.rect(ML, y, CW, 10, 'F');
        doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); setTxt(P.white);
        doc.text('Central Bicutan - Top Contributors', ML + CW / 2, y + 7.5, { align: 'center' });

        const centralUsers = centralData.userActivity.slice(0, 8).map((u, i) => [i + 1, u.userName, u.reportCount]);
        autoTable(doc, {
          ...tableDefaults, startY: y + 12,
          head: [['#', 'Name', 'Reports']],
          body: centralUsers,
          margin: { left: ML, right: MR },
          columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            1: { cellWidth: 110, fontStyle: 'bold' },
            2: { cellWidth: 30, halign: 'center', fontStyle: 'bold', textColor: P.central },
          },
          didDrawPage: (data) => { if (data.pageNumber > 1) drawHeader(); },
        });
        y = doc.lastAutoTable.finalY + 12;
      }
    }
  }

  // SECTION 6 - RECOMMENDATIONS (full only)
  if (reportType === 'full') {
    y = sectionHeading('6. STRATEGIC RECOMMENDATIONS', y, P.red);

    const recs = [];
    const southPercent = parseFloat(comparison.southPercentage);
    const centralPercent = parseFloat(comparison.centralPercentage);
    const recycledRateNum = parseFloat(combined.recycledRate);
    const processedRateNum = parseFloat(combined.processedRate);
    const totalActiveUsers = southData.userActivity.length + centralData.userActivity.length;

    if (southPercent > centralPercent + 20 && combined.total > 0) {
      recs.push(`PRIORITY: South Signal Village contributes ${southPercent}% of total reports, making it the primary driver of waste data. Maintain collection frequency, but use this community as a model to develop training materials and best practices for Central Bicutan. Consider a sister barangay mentorship program where South Signal residents help Central Bicutan establish reporting systems.`);
      recs.push(`Central Bicutan urgently needs a community engagement overhaul with only ${centralPercent}% participation. Recommended actions: (1) door-to-door education campaigns, (2) partnership with homeowners' associations, (3) mobile reporting stations at market areas, (4) school-based waste education programs, and (5) community-wide kickoff event with incentives.`);
    } else if (centralPercent > southPercent + 20 && combined.total > 0) {
      recs.push(`Central Bicutan leads with ${centralPercent}% of reports. Document and share their successful strategies with South Signal Village, including communication methods, incentive structures, and collection point placements.`);
      recs.push(`South Signal Village requires targeted interventions to boost participation from ${southPercent}%. Consider: (1) identifying inactive zones and deploying mobile collection teams, (2) partnering with local businesses to sponsor reporting incentives, and (3) creating barangay-specific recognition programs.`);
    } else if (combined.total > 0) {
      recs.push(`Both barangays show comparable participation levels (South: ${southPercent}%, Central: ${centralPercent}%). This balance is positive but still leaves significant room for growth. Launch an inter-barangay friendly competition with monthly winner recognition and tangible rewards.`);
    } else {
      recs.push(`CRITICAL: Both barangays show zero participation. Immediate action required: (1) emergency community meetings in both barangays, (2) temporary incentives for first 50 reports, (3) recruitment of community ambassadors (at least 5 per barangay), (4) simplified reporting via SMS option for non-smartphone users, and (5) visible public commitment from barangay captains.`);
    }

    if (totalActiveUsers === 0 && combined.total > 0) {
      recs.push(`USER ENGAGEMENT CRISIS: Despite having ${combined.total} waste reports, no users are registered or identifiable. Fix data collection to attribute reports to specific users to enable recognition and incentives. Implement mandatory user login or QR code scanning tied to resident profiles.`);
    } else if (totalActiveUsers > 0 && combined.total / totalActiveUsers < 2) {
      recs.push(`USER RETENTION NEEDED: Average of ${(combined.total / totalActiveUsers).toFixed(1)} reports per user indicates many users report only once. Implement retention strategies: (1) thank you messages after each report, (2) streak tracking with bonuses for consecutive reports, (3) monthly raffles for active users, and (4) personalized impact reports showing individual contributions.`);
    } else if (totalActiveUsers > 0 && combined.total / totalActiveUsers >= 5) {
      recs.push(`EXCELLENT USER LOYALTY: Average ${(combined.total / totalActiveUsers).toFixed(1)} reports per user shows strong retention. Leverage these power users as community ambassadors. Create an exclusive "Environmental Champion" program with special benefits and recognition. Invite top 10 users to a planning session for program improvements.`);
    }

    if (recycledRateNum < 30 && combined.total > 0) {
      recs.push(`RECYCLING CRISIS: Only ${recycledRateNum}% of waste is being recycled (${combined.recycled} out of ${combined.total} items). Launch a Recycling First campaign including: (1) dedicated recycling bins in all collection points with clear signage, (2) weekly recycling education sessions at barangay halls, (3) partnership with local junk shops for buy-back programs, (4) recycling drop-off events with small rewards, and (5) school-based recycling champions program. Target: Achieve 40% recycling rate within 3 months.`);
    } else if (recycledRateNum >= 30 && recycledRateNum < 60 && combined.total > 0) {
      recs.push(`Recycling rate at ${recycledRateNum}% shows progress but needs acceleration. Enhance existing programs by: (1) adding more recycling-specific bins in high-traffic areas, (2) creating recycling guides with images of accepted materials, (3) monthly recycling challenges with leaderboards, (4) partnering with local artists for recycled material art projects, and (5) establishing a recycling drop-off center with extended hours. Target: Reach 70% recycling rate within 6 months.`);
    } else if (recycledRateNum >= 60 && combined.total > 0) {
      recs.push(`EXCELLENT: Recycling rate of ${recycledRateNum}% demonstrates strong community commitment. Maintain momentum by: (1) sharing success metrics publicly, (2) expanding recycling to cover more material types, (3) hosting recycling excellence recognition events, and (4) using this success story to attract funding for program expansion.`);
    }

    if (processedRateNum < 50 && combined.total > 0) {
      recs.push(`Processing backlog: Only ${processedRateNum}% of reports are processed (${combined.processed} items). This indicates resource constraints. Solutions: (1) increase processing staff during peak hours, (2) implement batch processing system, (3) use digital tools to streamline verification, (4) create volunteer processing shifts, and (5) prioritize high-value recyclables for immediate processing.`);
    }

    const southTopLoc = southData.locationBreakdown[0];
    const centralTopLoc = centralData.locationBreakdown[0];
    if (southTopLoc && southTopLoc.reports > 0) {
      recs.push(`In South Signal Village, "${southTopLoc.name}" is the busiest collection point with ${southTopLoc.reports} reports. Increase collection frequency here and use this location as a pilot for: (1) extended operating hours, (2) additional recycling bins, (3) real-time reporting kiosk, and (4) community bulletin board with waste reduction tips.`);
    }
    if (centralTopLoc && centralTopLoc.reports > 0) {
      recs.push(`Central Bicutan's primary collection area is "${centralTopLoc.name}" (${centralTopLoc.reports} reports). Analyze what makes this location successful and replicate in underserved areas. Consider installing a public recognition board here to showcase top contributors weekly.`);
    } else if (centralData.overview.total > 0 && !centralTopLoc) {
      recs.push(`Central Bicutan lacks clear collection hotspots based on available data. Conduct a quick mapping survey to identify where residents live and establish collection points within 500m of all residential clusters. Prioritize areas near markets, schools, and transport terminals.`);
    }

    const southTopItem = southData.mostCollectedItems[0];
    const centralTopItem = centralData.mostCollectedItems[0];
    if (southTopItem) {
      if (southTopItem.name === 'Battery') {
        recs.push(`In South Signal Village, "${southTopItem.name}" is the most collected item (${southTopItem.count}x). Batteries contain toxic heavy metals. Establish a dedicated hazardous waste collection schedule and partner with authorized recyclers. Create public awareness about battery hazards through posters and announcements.`);
      } else {
        recs.push(`In South Signal Village, "${southTopItem.name}" is the most collected item (${southTopItem.count}x). Launch a targeted campaign for "${southTopItem.name}" reduction including: (1) alternatives education, (2) recycling workshops, (3) upcycling contests.`);
      }
    }
    if (centralTopItem && centralTopItem.name !== southTopItem?.name) {
      if (centralTopItem.name === 'Cup') {
        recs.push(`Central Bicutan's waste profile is dominated by "${centralTopItem.name}" (${centralTopItem.count}x). Disposable cups, especially coffee cups, are problematic because many have plastic linings. Promote reusable cup programs with participating cafes and provide discounts for customers who bring their own cups.`);
      } else if (centralTopItem.name === 'Plastic Bottle') {
        recs.push(`Central Bicutan's waste profile is dominated by "${centralTopItem.name}" (${centralTopItem.count}x). Implement a bottle deposit return system where residents receive small incentives for returning plastic bottles. Partner with local sari-sari stores to serve as collection points.`);
      } else {
        recs.push(`Central Bicutan's waste profile is dominated by "${centralTopItem.name}" (${centralTopItem.count}x). Design a barangay-specific campaign focusing on "${centralTopItem.name}" reduction and proper disposal.`);
      }
    }

    if (combined.pending > 0) {
      recs.push(`DATA QUALITY: ${combined.pending} report${combined.pending !== 1 ? 's' : ''} remain pending. Implement a 48-hour processing guarantee with automated reminders for staff. Incomplete or unclear reports should trigger follow-up calls within 24 hours.`);
    }
    if (combined.total > 0) {
      recs.push(`COLLECTION EFFICIENCY: Based on report volume patterns, schedule heavier collection ${southPercent > centralPercent ? 'in South Signal Village' : 'in Central Bicutan'} during peak activity periods. Consider staggered collection times to accommodate different resident schedules.`);
    }
    recs.push(`TECHNOLOGY ENHANCEMENT: Deploy simple QR code posters at collection points that link directly to reporting form. Test this in ${southPercent > centralPercent ? 'Central Bicutan' : 'South Signal Village'} first as a pilot before expanding. Add photo upload option to improve waste classification accuracy.`);
    recs.push(`SUSTAINABILITY INCENTIVES: Create a points system where reports earn points redeemable for (1) barangay fee discounts, (2) raffle entries for major prizes, (3) recognition in barangay announcements, or (4) small eco-friendly merchandise like reusable bags.`);
    recs.push(`MONITORING & REPORTING: Establish monthly review meetings with barangay captains to track progress against these recommendations. Create simple dashboard showing key metrics for public display at barangay halls.`);

    const finalRecs = [...new Set(recs)];

    y = checkPage(y, 60);
    autoTable(doc, {
      ...tableDefaults, startY: y,
      head: [['#', 'Strategic Recommendation']],
      body: finalRecs.map((r, i) => [i + 1, r]),
      columnStyles: {
        0: { cellWidth: 12, halign: 'center', fontStyle: 'bold', textColor: P.slateL },
        1: { cellWidth: 168, fontSize: 7.8, lineHeight: 1.4 },
      },
      bodyStyles: { ...tableDefaults.bodyStyles, cellPadding: { top: 5, bottom: 5, left: 6, right: 6 }, lineColor: P.border },
      didDrawPage: (data) => { if (data.pageNumber > 1) drawHeader(); },
    });
  }

  drawFooter();
};

/* ------------------------------------------------------------------
   EXCEL BUILDER (conditional sheets)
   ------------------------------------------------------------------ */
const buildExcel = (analyticsData, { reportPeriod, selectedMonth, selectedYear, selectedWeek, reportType }) => {
  const { southData, centralData, combined, comparison } = analyticsData;
  const wb = XLSX.utils.book_new();

  let periodLabel = '';
  if (reportPeriod === 'week')  periodLabel = `Week ${selectedWeek}, ${selectedYear}`;
  else if (reportPeriod === 'month') periodLabel = `${MONTHS[selectedMonth]} ${selectedYear}`;
  else periodLabel = `Year ${selectedYear}`;

  const reportTitles = {
    full:     'TMFK Full Analytics Report',
    waste:    'TMFK Waste Analytics Report',
    user:     'TMFK User Analytics Report',
    location: 'TMFK Location Analytics Report',
  };

  // ── Overview sheet (always included) ──
  const overviewRows = [
    [reportTitles[reportType] || 'TMFK Barangay Comparison Report'],
    [`Period: ${periodLabel}`],
    [`Generated: ${new Date().toLocaleString()}`],
    [],
    ['Metric', 'South Signal Village', 'Central Bicutan', 'Combined'],
    ['Total Reports', southData.overview.total, centralData.overview.total, combined.total],
    ['Total Weight (kg)', southData.overview.totalWeight, centralData.overview.totalWeight, combined.totalWeight],
    ['Recycled', southData.overview.recycled, centralData.overview.recycled, combined.recycled],
    ['Processed', southData.overview.processed, centralData.overview.processed, combined.processed],
    ['Pending', southData.overview.pending, centralData.overview.pending, combined.pending],
    ['Disposed', southData.overview.disposed, centralData.overview.disposed, combined.disposed],
    [
      'Recycling Rate (%)',
      southData.overview.total > 0 ? ((southData.overview.recycled / southData.overview.total) * 100).toFixed(1) : 0,
      centralData.overview.total > 0 ? ((centralData.overview.recycled / centralData.overview.total) * 100).toFixed(1) : 0,
      combined.recycledRate,
    ],
    [
      'Processing Rate (%)',
      southData.overview.total > 0 ? ((southData.overview.processed / southData.overview.total) * 100).toFixed(1) : 0,
      centralData.overview.total > 0 ? ((centralData.overview.processed / centralData.overview.total) * 100).toFixed(1) : 0,
      combined.processedRate,
    ],
    [],
    ['Share of Total Reports (%)', comparison.southPercentage, comparison.centralPercentage, '100'],
    ['Most Active Barangay', comparison.mostActiveBarangay],
  ];
  const wsOverview = XLSX.utils.aoa_to_sheet(overviewRows);
  wsOverview['!cols'] = [{ wch: 26 }, { wch: 22 }, { wch: 20 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, wsOverview, 'Overview');

  // ── Waste sheets (full, waste) ──
  if (reportType === 'full' || reportType === 'waste') {
    // Classification comparison
    const southClassMap = new Map(southData.classificationBreakdown.map(c => [c.classification, c.count]));
    const centralClassMap = new Map(centralData.classificationBreakdown.map(c => [c.classification, c.count]));
    const allClass = new Set([...southClassMap.keys(), ...centralClassMap.keys()]);
    const classRows = [['Waste Classification', 'South Signal', 'Central Bicutan', 'Total', 'Share (%)']];
    [...allClass].forEach(cls => {
      const s = southClassMap.get(cls) || 0;
      const c = centralClassMap.get(cls) || 0;
      const t = s + c;
      classRows.push([cls, s, c, t, combined.total > 0 ? ((t / combined.total) * 100).toFixed(1) : 0]);
    });
    classRows.sort((a, b) => (typeof a[3] === 'number' && typeof b[3] === 'number' ? b[3] - a[3] : 0));
    const wsClass = XLSX.utils.aoa_to_sheet(classRows);
    wsClass['!cols'] = [{ wch: 24 }, { wch: 16 }, { wch: 18 }, { wch: 10 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, wsClass, 'Waste Classification');

    // Most collected items — South & Central side by side
    const collectedRows = [['#', 'South Signal - Item', 'South - Count', 'Central Bicutan - Item', 'Central - Count']];
    const maxCollected = Math.max(southData.mostCollectedItems.length, centralData.mostCollectedItems.length, 1);
    for (let i = 0; i < maxCollected; i++) {
      collectedRows.push([
        i + 1,
        southData.mostCollectedItems[i]?.name || '',
        southData.mostCollectedItems[i]?.count ?? '',
        centralData.mostCollectedItems[i]?.name || '',
        centralData.mostCollectedItems[i]?.count ?? '',
      ]);
    }
    const wsCollected = XLSX.utils.aoa_to_sheet(collectedRows);
    wsCollected['!cols'] = [{ wch: 5 }, { wch: 24 }, { wch: 14 }, { wch: 24 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, wsCollected, 'Most Collected Items');

    // Most scanned items comparison
    const southScanMap = new Map(southData.mostScannedItems.map(s => [s.name, s.count]));
    const centralScanMap = new Map(centralData.mostScannedItems.map(s => [s.name, s.count]));
    const allScans = new Set([...southScanMap.keys(), ...centralScanMap.keys()]);
    const scanRows = [['Item Type', 'South Signal', 'Central Bicutan', 'Total', 'Share (%)']];
    [...allScans].forEach(item => {
      const s = southScanMap.get(item) || 0;
      const c = centralScanMap.get(item) || 0;
      const t = s + c;
      scanRows.push([item, s, c, t, combined.total > 0 ? ((t / combined.total) * 100).toFixed(1) : 0]);
    });
    scanRows.sort((a, b) => (typeof a[3] === 'number' && typeof b[3] === 'number' ? b[3] - a[3] : 0));
    const wsScan = XLSX.utils.aoa_to_sheet(scanRows);
    wsScan['!cols'] = [{ wch: 24 }, { wch: 16 }, { wch: 18 }, { wch: 10 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, wsScan, 'Most Scanned Items');
  }

  // ── Location sheets (full, location) ──
  if (reportType === 'full' || reportType === 'location') {
    const locRows = [['Barangay', '#', 'Location', 'Reports', 'Weight (kg)', 'Primary Waste Type']];
    southData.locationBreakdown.forEach((loc, i) => {
      locRows.push(['South Signal Village', i + 1, loc.name, loc.reports, loc.weight, loc.primaryWasteType]);
    });
    centralData.locationBreakdown.forEach((loc, i) => {
      locRows.push(['Central Bicutan', i + 1, loc.name, loc.reports, loc.weight, loc.primaryWasteType]);
    });
    if (locRows.length === 1) locRows.push(['No location data available', '', '', '', '', '']);
    const wsLoc = XLSX.utils.aoa_to_sheet(locRows);
    wsLoc['!cols'] = [{ wch: 20 }, { wch: 5 }, { wch: 32 }, { wch: 10 }, { wch: 12 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsLoc, 'Location Analytics');
  }

  // ── User sheets (full, user) ──
  // For user-only reports, this becomes more detailed
  if (reportType === 'full' || reportType === 'user') {
    const totalActiveUsers = southData.userActivity.length + centralData.userActivity.length;
    
    // Add user summary stats sheet for user reports
    if (reportType === 'user') {
      const summaryRows = [
        ['User Analytics Summary'],
        [`Period: ${periodLabel}`],
        [`Generated: ${new Date().toLocaleString()}`],
        [],
        ['Metric', 'Value'],
        ['Total Active Users', totalActiveUsers],
        ['Total Reports from Users', combined.total],
        ['Average Reports Per User', totalActiveUsers > 0 ? (combined.total / totalActiveUsers).toFixed(1) : 0],
        ['South Signal Contributors', southData.userActivity.length],
        ['Central Bicutan Contributors', centralData.userActivity.length],
        ['Top Contributor (South)', southData.userActivity[0]?.userName || 'None'],
        ['Top Contributor Reports (South)', southData.userActivity[0]?.reportCount || 0],
        ['Top Contributor (Central)', centralData.userActivity[0]?.userName || 'None'],
        ['Top Contributor Reports (Central)', centralData.userActivity[0]?.reportCount || 0],
        [],
        ['Engagement Level', 'Number of Users'],
        ['Power Users (10+ reports)', (southData.userActivity.filter(u => u.reportCount >= 10).length + centralData.userActivity.filter(u => u.reportCount >= 10).length)],
        ['Regular Users (5-9 reports)', (southData.userActivity.filter(u => u.reportCount >= 5 && u.reportCount < 10).length + centralData.userActivity.filter(u => u.reportCount >= 5 && u.reportCount < 10).length)],
        ['Casual Users (1-4 reports)', (southData.userActivity.filter(u => u.reportCount >= 1 && u.reportCount < 5).length + centralData.userActivity.filter(u => u.reportCount >= 1 && u.reportCount < 5).length)],
      ];
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
      wsSummary['!cols'] = [{ wch: 28 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, wsSummary, 'User Summary');
    }

    const userRows = [['#', 'South Signal - Name', 'South - Reports', 'South - Email', 'Central Bicutan - Name', 'Central - Reports', 'Central - Email']];
    const maxUsers = Math.max(southData.userActivity.length, centralData.userActivity.length, 1);
    for (let i = 0; i < maxUsers; i++) {
      userRows.push([
        i + 1,
        southData.userActivity[i]?.userName || '',
        southData.userActivity[i]?.reportCount ?? '',
        southData.userActivity[i]?.userEmail || '',
        centralData.userActivity[i]?.userName || '',
        centralData.userActivity[i]?.reportCount ?? '',
        centralData.userActivity[i]?.userEmail || '',
      ]);
    }
    const wsUsers = XLSX.utils.aoa_to_sheet(userRows);
    wsUsers['!cols'] = [{ wch: 5 }, { wch: 22 }, { wch: 14 }, { wch: 26 }, { wch: 22 }, { wch: 14 }, { wch: 26 }];
    XLSX.utils.book_append_sheet(wb, wsUsers, 'Top Contributors');
  }

  return wb;
};

/* ------------------------------------------------------------------
   MAIN COMPONENT (full-screen layout with responsive design)
   ------------------------------------------------------------------ */
const Analytics = ({ adminRole, barangayName }) => {
  const [loading,       setLoading]      = useState(false);
  const [loadingType,   setLoadingType]  = useState(null); // 'pdf' | 'excel'
  const [reportPeriod,  setReportPeriod] = useState('month');
  const [selectedMonth, setSelectedMonth]= useState(new Date().getMonth());
  const [selectedYear,  setSelectedYear] = useState(new Date().getFullYear());
  const [selectedWeek,  setSelectedWeek] = useState(getCurrentWeekNumber());
  const [reportType,    setReportType]   = useState('full');
  const [fetchError,    setFetchError]   = useState(null);
  const [success,       setSuccess]      = useState(false);
  const [successLabel,  setSuccessLabel] = useState('');

  const availableYears = [
    new Date().getFullYear(),
    new Date().getFullYear() - 1,
    new Date().getFullYear() - 2,
  ];

  const getDateRange = useCallback(() => {
    let startDate, endDate;
    if (reportPeriod === 'week') {
      const firstDay = new Date(selectedYear, 0, 1);
      const dow      = firstDay.getDay();
      startDate = new Date(selectedYear, 0, 1);
      startDate.setDate(startDate.getDate() + (selectedWeek - 1) * 7 - dow);
      const curDow = startDate.getDay();
      startDate.setDate(startDate.getDate() - (curDow === 0 ? 6 : curDow - 1));
      startDate.setHours(0,0,0,0);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23,59,59,999);
    } else if (reportPeriod === 'month') {
      startDate = new Date(selectedYear, selectedMonth, 1);
      endDate   = new Date(selectedYear, selectedMonth + 1, 0);
      endDate.setHours(23,59,59,999);
    } else {
      startDate = new Date(selectedYear, 0, 1);
      endDate   = new Date(selectedYear, 11, 31);
      endDate.setHours(23,59,59,999);
    }
    return { startDate, endDate };
  }, [reportPeriod, selectedYear, selectedMonth, selectedWeek]);

  const fetchWasteReports = useCallback(async () => {
    const { startDate, endDate } = getDateRange();
    const token  = localStorage.getItem('adminToken');
    const params = new URLSearchParams();
    if (startDate && endDate) {
      params.append('startDate', startDate.toISOString().split('T')[0]);
      params.append('endDate',   endDate.toISOString().split('T')[0]);
    }
    let url = `${API_URL}/api/waste-reports`;
    if (params.toString()) url += `?${params.toString()}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
    const data = await res.json();
    return data.reports || data || [];
  }, [getDateRange]);

  const getReportFilenameBase = useCallback(() => {
    const rtSuffix = reportType === 'full' ? '_Full'
      : reportType === 'waste' ? '_Waste'
      : reportType === 'location' ? '_Location'
      : '_User';
    const mSuffix = reportPeriod === 'month' ? `_${selectedMonth + 1}` : '';
    return `TMFK_BarangayComparison${rtSuffix}_${reportPeriod}_${selectedYear}${mSuffix}`;
  }, [reportType, reportPeriod, selectedYear, selectedMonth]);

  const handleDownload = async (format) => {
    setLoading(true);
    setLoadingType(format);
    setFetchError(null);
    setSuccess(false);
    try {
      const allReports = await fetchWasteReports();

      if (!allReports?.length) {
        setFetchError('No waste reports found for the selected period. Please try a different date range.');
        setLoading(false);
        setLoadingType(null);
        return;
      }

      const southReports = allReports.filter(r => r.assignedBarangay === 'south_signal');
      const centralReports = allReports.filter(r => r.assignedBarangay === 'central_bicutan');

      const data = processDataWithComparison(southReports, centralReports);
      const { startDate, endDate } = getDateRange();
      const filenameBase = getReportFilenameBase();

      if (format === 'pdf') {
        const doc = new jsPDF('p', 'mm', 'a4');
        await buildPDF(doc, data, {
          reportPeriod, selectedMonth, selectedYear, selectedWeek,
          startDate, endDate, reportType,
        });
        doc.save(`${filenameBase}.pdf`);
        setSuccessLabel('PDF report generated successfully! Check your downloads folder.');
      } else {
        const wb = buildExcel(data, { reportPeriod, selectedMonth, selectedYear, selectedWeek, reportType });
        XLSX.writeFile(wb, `${filenameBase}.xlsx`);
        setSuccessLabel('Excel workbook generated successfully! Check your downloads folder.');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3500);
    } catch (err) {
      console.error(err);
      setFetchError(err.message);
    } finally {
      setLoading(false);
      setLoadingType(null);
    }
  };

  const periodLabel = useMemo(() => {
    if (reportPeriod === 'week') return `Week ${selectedWeek}, ${selectedYear}`;
    if (reportPeriod === 'month') return `${MONTHS[selectedMonth]} ${selectedYear}`;
    return `Year ${selectedYear}`;
  }, [reportPeriod, selectedWeek, selectedYear, selectedMonth]);

  const hintText = useMemo(() => {
    switch (reportType) {
      case 'full': return 'Complete comparative analysis with detailed insights, location breakdowns, user analytics, and strategic recommendations';
      case 'waste': return 'Focused waste analytics including classification comparison, most collected and most scanned items';
      case 'user': return 'User-focused report with community participation analysis and top contributor comparison - includes detailed user metrics and engagement insights';
      case 'location': return 'Geographic breakdown of collection hotspots and waste volume per location for both barangays';
      default: return '';
    }
  }, [reportType]);

  // Full-screen container style
  const fullScreenStyle = {
    minHeight: '100vh',
    background: T.pageBg,
    padding: '24px 32px',
    fontFamily: "'Sora','DM Sans','Inter',sans-serif",
    display: 'flex',
    flexDirection: 'column',
  };

  const S = {
    wrap: {
      background: T.white,
      border: `1.5px solid ${T.border}`,
      borderRadius: 24,
      marginBottom: 24,
      overflow: 'hidden',
      boxShadow: '0 4px 24px rgba(20,24,40,0.08)',
      fontFamily: "'Sora','DM Sans','Inter',sans-serif",
      flex: 1,
    },
    band: {
      background: `linear-gradient(130deg, ${T.navy} 0%, ${T.navyLight} 60%, #2E3658 100%)`,
      padding: '28px 32px 28px',
      position: 'relative',
      overflow: 'hidden',
    },
    bandAccent: {
      position: 'absolute',
      bottom: 0, left: 0, right: 0,
      height: 4,
      background: `linear-gradient(90deg,${T.cyan},${T.blue})`,
    },
    bandDeco: {
      position: 'absolute',
      top: -40, right: -40,
      width: 200, height: 200,
      borderRadius: '50%',
      background: 'rgba(79,91,213,0.12)',
      pointerEvents: 'none',
    },
    bandInner: {
      position: 'relative',
      zIndex: 1,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      flexWrap: 'wrap',
      gap: 16,
    },
    bandLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: 16,
    },
    logoBox: {
      width: 48, height: 48, borderRadius: 12,
      background: 'rgba(255,255,255,0.08)',
      border: '1px solid rgba(255,255,255,0.14)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, overflow: 'hidden',
    },
    bandTitle: {
      fontSize: 20,
      fontWeight: 800,
      color: T.white,
      margin: '0 0 6px',
      letterSpacing: '-0.02em',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    },
    bandSub: { fontSize: 13, color: 'rgba(231,234,243,0.55)', margin: 0 },
    pills: {
      display: 'flex',
      gap: 12,
      flexWrap: 'wrap',
      alignItems: 'center',
    },
    pill: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '6px 14px',
      borderRadius: 24,
      background: 'rgba(255,255,255,0.10)',
      color: 'rgba(231,234,243,0.85)',
      fontSize: 12,
      fontWeight: 600,
      border: '1px solid rgba(255,255,255,0.14)',
      whiteSpace: 'nowrap',
    },
    body: {
      padding: '28px 32px',
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
    },
    controlRow: {
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      flexWrap: 'wrap',
    },
    label: {
      fontSize: 12,
      fontWeight: 700,
      color: T.slate,
      textTransform: 'uppercase',
      letterSpacing: '0.07em',
      flexShrink: 0,
      minWidth: 52,
    },
    divider: {
      width: '1px',
      height: 28,
      background: T.border,
      flexShrink: 0,
    },
    tabBar: {
      display: 'flex',
      gap: 6,
      background: T.pageBg,
      borderRadius: 12,
      padding: 4,
      flexShrink: 0,
    },
    tab: (active) => ({
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '8px 16px',
      borderRadius: 8,
      border: 'none',
      background: active ? T.white : 'transparent',
      color: active ? T.navy : T.slate,
      fontWeight: active ? 700 : 500,
      fontSize: 13,
      cursor: 'pointer',
      boxShadow: active ? '0 1px 4px rgba(20,24,40,0.1)' : 'none',
      transition: 'all 0.2s',
      fontFamily: 'inherit',
      whiteSpace: 'nowrap',
    }),
    selectWrap: {
      position: 'relative',
      display: 'inline-flex',
      alignItems: 'center',
    },
    select: {
      appearance: 'none',
      WebkitAppearance: 'none',
      paddingLeft: 14,
      paddingRight: 32,
      paddingTop: 9,
      paddingBottom: 9,
      borderRadius: 10,
      border: `1.5px solid ${T.border}`,
      fontSize: 13,
      color: T.navy,
      fontWeight: 600,
      background: T.white,
      cursor: 'pointer',
      fontFamily: 'inherit',
      boxShadow: '0 1px 3px rgba(20,24,40,0.05)',
      outline: 'none',
      minWidth: 130,
    },
    selectArrow: {
      position: 'absolute',
      right: 12,
      pointerEvents: 'none',
      display: 'flex',
    },
    typeGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 12,
    },
    typeCard: (active) => ({
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px 16px',
      borderRadius: 12,
      cursor: 'pointer',
      border: active ? `2px solid ${T.blue}` : `2px solid ${T.border}`,
      background: active ? 'rgba(79,91,213,0.04)' : T.white,
      transition: 'all 0.2s',
      boxShadow: active ? `0 0 0 4px rgba(79,91,213,0.12)` : '0 2px 6px rgba(20,24,40,0.04)',
    }),
    typeIcon: (active) => ({
      width: 36,
      height: 36,
      borderRadius: 10,
      flexShrink: 0,
      background: active ? T.blue : T.pageBg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }),
    typeTitle: (active) => ({
      fontSize: 13.5,
      fontWeight: 700,
      color: active ? T.blue : T.navy,
    }),
    typeDesc: {
      fontSize: 11,
      color: T.slateLight,
      marginTop: 3,
      lineHeight: 1.35,
    },
    checkMark: {
      marginLeft: 'auto',
      flexShrink: 0,
    },
    bottomRow: {
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      flexWrap: 'wrap',
    },
    hint: {
      flex: 1,
      minWidth: 0,
      display: 'flex',
      alignItems: 'flex-start',
      gap: 8,
      fontSize: 12,
      color: T.slateLight,
      padding: '10px 14px',
      background: T.pageBg,
      borderRadius: 10,
      lineHeight: 1.5,
    },
    dlBtnGroup: {
      display: 'flex',
      gap: 12,
      flexShrink: 0,
    },
    dlBtn: (dis, variant) => ({
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '12px 26px',
      borderRadius: 12,
      border: variant === 'excel' ? `1.5px solid ${T.green}` : 'none',
      background: dis
        ? '#E7E9F1'
        : variant === 'excel'
          ? T.white
          : `linear-gradient(135deg,${T.navy},${T.blue})`,
      color: dis ? T.slateLight : variant === 'excel' ? T.green : T.white,
      fontSize: 13.5,
      fontWeight: 700,
      cursor: dis ? 'not-allowed' : 'pointer',
      boxShadow: dis ? 'none' : variant === 'excel' ? '0 2px 6px rgba(31,157,109,0.12)' : '0 6px 16px rgba(79,91,213,0.32)',
      transition: 'all 0.2s',
      fontFamily: 'inherit',
      letterSpacing: '0.01em',
      whiteSpace: 'nowrap',
    }),
    successBar: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      background: '#E5F6EF',
      border: '1px solid #9ED8BE',
      borderRadius: 12,
      padding: '12px 20px',
      fontSize: 13,
      color: '#1A6B4B',
      fontWeight: 600,
    },
    errorBar: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      background: '#FBEBE9',
      border: '1px solid #F0BDB6',
      borderRadius: 12,
      padding: '12px 20px',
      fontSize: 13,
      color: '#9C3327',
      fontWeight: 500,
    },
    overlay: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(21,25,43,0.8)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
    },
    overlayBox: {
      background: T.white,
      borderRadius: 24,
      padding: '48px 60px',
      textAlign: 'center',
      boxShadow: '0 40px 80px rgba(0,0,0,0.3)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 24,
      border: `1px solid ${T.border}`,
      minWidth: 320,
    },
    spinRing: {
      width: 56,
      height: 56,
      borderRadius: '50%',
      border: `6px solid ${T.pageBg}`,
      borderTop: `6px solid ${T.blue}`,
      animation: 'tmfk_spin 0.75s linear infinite',
    },
  };

  const PeriodTabs = () => {
    const tabs = [
      { id:'week',  label:'Weekly',  icon:IC.week     },
      { id:'month', label:'Monthly', icon:IC.calendar },
      { id:'year',  label:'Yearly',  icon:IC.year     },
    ];
    return (
      <div style={S.tabBar}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            style={S.tab(reportPeriod === tab.id)}
            onClick={() => setReportPeriod(tab.id)}
          >
            <Ico d={tab.icon} size={14} color={reportPeriod === tab.id ? T.blue : T.slate} sw={2} />
            {tab.label}
          </button>
        ))}
      </div>
    );
  };

  const StyledSelect = ({ value, onChange, children }) => (
    <div style={S.selectWrap}>
      <select value={value} onChange={onChange} style={S.select}>
        {children}
      </select>
      <span style={S.selectArrow}>
        <svg width="12" height="8" viewBox="0 0 12 8" fill={T.slate}>
          <path d="M1 1l5 5 5-5" stroke={T.slate} strokeWidth="1.8" fill="none" strokeLinecap="round" />
        </svg>
      </span>
    </div>
  );

  const ReportTypeCards = () => {
    const types = [
      { id:'full',     label:'Full Report',       desc:'Complete comparative analysis + detailed insights',  icon:IC.layers  },
      { id:'waste',    label:'Waste Analytics',   desc:'Waste classification + most collected items',        icon:IC.recycle },
      { id:'user',     label:'User Analytics',    desc:'Community participation + top contributors + engagement metrics', icon:IC.users   },
      { id:'location', label:'Location Analytics',desc:'Collection hotspots + waste volume per area',         icon:IC.map     },
    ];
    return (
      <div style={S.typeGrid}>
        {types.map(rt => {
          const active = reportType === rt.id;
          return (
            <div key={rt.id} style={S.typeCard(active)} onClick={() => setReportType(rt.id)}>
              <div style={S.typeIcon(active)}>
                <Ico d={rt.icon} size={16} color={active ? T.white : T.slate} sw={2.2} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={S.typeTitle(active)}>{rt.label}</div>
                <div style={S.typeDesc}>{rt.desc}</div>
              </div>
              {active && (
                <div style={S.checkMark}>
                  <Ico d={IC.check} size={16} color={T.blue} sw={2.8} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={fullScreenStyle}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes tmfk_spin   { to { transform: rotate(360deg); } }
        @keyframes tmfk_fadein { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
      `}</style>

      {loading && (
        <div style={S.overlay}>
          <div style={{ ...S.overlayBox, animation:'tmfk_fadein 0.2s ease' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: `linear-gradient(135deg,${T.navy},${T.navyLight})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
            }}>
              <div style={S.spinRing} />
              <div style={{ position: 'absolute' }}>
                <Ico d={loadingType === 'excel' ? IC.xls : IC.doc} size={26} color={T.cyan} sw={1.8} />
              </div>
            </div>
            <div>
              <p style={{ fontSize:18, fontWeight:800, color:T.navy, margin:'0 0 6px' }}>
                {loadingType === 'excel' ? 'Generating Excel Workbook...' : 'Generating Comprehensive Report...'}
              </p>
              <p style={{ fontSize:13, color:T.slate, margin:0 }}>Analyzing waste data and preparing insights</p>
            </div>
          </div>
        </div>
      )}

      <div style={S.wrap}>
        <div style={S.band}>
          <div style={S.bandDeco} />
          <div style={S.bandInner}>
            <div style={S.bandLeft}>
              <div style={S.logoBox}>
                <img src="/TMFK.png" alt="TMFK" style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={e => { e.currentTarget.style.display = 'none'; }} />
              </div>
              <div>
                <h3 style={S.bandTitle}>
                  <Ico d={IC.compare} size={24} color={T.cyan} sw={2.2} />
                  TMFK Barangay Comparison Report
                </h3>
                <p style={S.bandSub}>Citywide overview comparing South Signal Village and Central Bicutan</p>
              </div>
            </div>
            <div style={S.pills}>
              <span style={S.pill}>
                <Ico d={IC.chart} size={13} color={T.cyan} sw={2.2} />
                COMPARISON MODE
              </span>
              <span style={S.pill}>
                <Ico d={IC.calendar} size={13} color={T.cyan} sw={2.2} />
                {periodLabel}
              </span>
            </div>
          </div>
          <div style={S.bandAccent} />
        </div>

        <div style={S.body}>
          <div style={S.controlRow}>
            <span style={S.label}>Period</span>
            <PeriodTabs />
            <div style={S.divider} />
            {reportPeriod === 'month' && (
              <StyledSelect value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))}>
                {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </StyledSelect>
            )}
            {reportPeriod === 'week' && (
              <StyledSelect value={selectedWeek} onChange={e => setSelectedWeek(parseInt(e.target.value))}>
                {Array.from({ length:52 }, (_,i) => (
                  <option key={i+1} value={i+1}>Week {i+1}</option>
                ))}
              </StyledSelect>
            )}
            <StyledSelect value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))}>
              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </StyledSelect>
          </div>

          <div>
            <span style={{ ...S.label, display:'block', marginBottom:12 }}>Report Content</span>
            <ReportTypeCards />
          </div>

          <div style={S.bottomRow}>
            <div style={S.hint}>
              <Ico d={IC.info} size={15} color={T.slateLight} sw={1.8} />
              <span>{hintText}</span>
            </div>
            <div style={S.dlBtnGroup}>
              <button
                style={S.dlBtn(loading, 'excel')}
                onClick={() => handleDownload('excel')}
                disabled={loading}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
              >
                <Ico d={IC.xls} size={16} color={loading ? T.slateLight : T.green} sw={2.2} />
                {loading && loadingType === 'excel' ? 'Generating...' : 'Export Excel'}
              </button>
              <button
                style={S.dlBtn(loading, 'pdf')}
                onClick={() => handleDownload('pdf')}
                disabled={loading}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
              >
                <Ico d={IC.download} size={16} color={loading ? T.slateLight : T.white} sw={2.2} />
                {loading && loadingType === 'pdf' ? 'Generating...' : 'Download PDF Report'}
              </button>
            </div>
          </div>

          {success && (
            <div style={{ ...S.successBar, animation:'tmfk_fadein 0.25s ease' }}>
              <Ico d={IC.check} size={18} color="#1F9D6D" sw={2.8} />
              {successLabel}
            </div>
          )}
          {fetchError && (
            <div style={S.errorBar}>
              <Ico d={IC.alert} size={18} color="#D9483C" sw={2.2} />
              Error: {fetchError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;