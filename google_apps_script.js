/**
 * =========================================================================
 * OLYV ATS - Google Sheets Database Backend (Google Apps Script)
 * =========================================================================
 * 
 * INSTRUCTIONS TO DEPLOY:
 * 1. Open Google Sheets (https://sheets.new) and name it "Olyv Recruitment Database".
 * 2. In Google Sheets, click: Extensions > Apps Script.
 * 3. Delete any code in the editor, paste this entire file, and click "Save" (disk icon).
 * 4. Run the "setupSheet" function once from the dropdown at the top to automatically
 *    create and format the "Candidates" and "Positions" tabs with headers and sample rows!
 * 5. Click "Deploy" (top-right blue button) > "New deployment".
 * 6. Select type: "Web app".
 * 7. Set:
 *    - Description: "Olyv ATS Live Sync API"
 *    - Execute as: "Me" (your Google account)
 *    - Who has access: "Anyone"
 * 8. Click "Deploy" and authorize permissions.
 * 9. Copy the generated "Web app URL" (ends with /exec) and paste it into the
 *    Olyv ATS Dashboard (Cloud Data Settings > Web App URL)!
 * =========================================================================
 */

/**
 * Run this function once to set up tabs and sample data
 */
function setupSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Setup Candidates Sheet
  let candSheet = ss.getSheetByName('Candidates');
  if (!candSheet) {
    candSheet = ss.insertSheet('Candidates');
  }
  candSheet.clear();

  const candHeaders = [
    'ID', 'Application Date', 'Name', 'Email', 'Mobile', 
    'Department', 'Job Title', 'Source', 'Recruiter', 
    'Status', 'Offered CTC', 'Offer Date', 'Expected DOJ', 'Latest Remarks'
  ];
  candSheet.appendRow(candHeaders);

  // Format Header Row
  const candHeaderRange = candSheet.getRange(1, 1, 1, candHeaders.length);
  candHeaderRange.setBackground('#0f172a')
                 .setFontColor('#ffffff')
                 .setFontWeight('bold')
                 .setFontFamily('Arial')
                 .setFontSize(10);
  candSheet.setFrozenRows(1);

  // Sample Candidates
  const sampleCandidates = [
    ['CAND-1001', '2026-07-15', 'Aarav Mehta', 'aarav.mehta@example.com', '+91 98201 44821', 'Engineering', 'SDE 2 (Distributed Systems)', 'LinkedIn', 'Ananya Sharma', 'Joined', '₹34 LPA', '2026-08-10', '2026-09-01', 'Joined Bangalore office.'],
    ['CAND-1002', '2026-07-20', 'Radhika Sen', 'radhika.sen@example.com', '+91 98450 12890', 'Finance', 'Finance Manager', 'Referral', 'Vikram Malhotra', 'Joined', '₹26 LPA', '2026-08-14', '2026-09-05', 'Completed onboarding.'],
    ['CAND-1004', '2026-08-02', 'Tanvi Deshmukh', 'tanvi.deshmukh@example.com', '+91 99203 77412', 'Product', 'Senior Product Manager', 'LinkedIn', 'Priya Nair', 'Preboarding', '₹40 LPA', '2026-08-28', '2026-09-25', 'BGV verification in progress.'],
    ['CAND-1005', '2026-08-05', 'Siddharth Varma', 'siddharth.v@example.com', '+91 98710 33201', 'Engineering', 'Lead Backend Engineer', 'Agency', 'Ananya Sharma', 'Offered', '₹48 LPA', '2026-09-02', '2026-10-01', 'Offer released.'],
    ['CAND-1008', '2026-08-15', 'Ishaan Chopra', 'ishaan.c@example.com', '+91 97204 11234', 'Engineering', 'SDE 1 (Frontend)', 'LinkedIn', 'Ananya Sharma', 'HR Round', '', '', '', 'Discussion scheduled.'],
    ['CAND-1009', '2026-08-18', 'Meera Nambiar', 'meera.n@example.com', '+91 98401 99281', 'Product', 'Product Designer (UI/UX)', 'Referral', 'Priya Nair', 'Round 3', '', '', '', 'Design portfolio approved.'],
    ['CAND-1011', '2026-08-22', 'Ankit Aggarwal', 'ankit.ag@example.com', '+91 99991 22345', 'Engineering', 'SDE 1 (Backend)', 'LinkedIn', 'Ananya Sharma', 'Round 2', '', '', '', 'Cleared DSA round.'],
    ['CAND-1012', '2026-08-24', 'Divya Sundaram', 'divya.s@example.com', '+91 98840 77123', 'Risk', 'Fraud Risk Analyst', 'Direct', 'Rohan Verma', 'Round 1', '', '', '', 'Screening call scheduled.'],
    ['CAND-1019', '2026-08-01', 'Manish Tiwari', 'manish.t@example.com', '+91 98210 99401', 'Engineering', 'SDE 2 (Distributed Systems)', 'Naukri', 'Ananya Sharma', 'Rejected', '', '', '', 'Skills gap in distributed cache.']
  ];

  sampleCandidates.forEach(row => candSheet.appendRow(row));

  // 2. Setup Positions Sheet
  let posSheet = ss.getSheetByName('Positions');
  if (!posSheet) {
    posSheet = ss.insertSheet('Positions');
  }
  posSheet.clear();

  const posHeaders = [
    'Position ID', 'Department', 'Job Title', 'Type', 
    'Date Opened', 'Status', 'Target TAT (Days)'
  ];
  posSheet.appendRow(posHeaders);

  const posHeaderRange = posSheet.getRange(1, 1, 1, posHeaders.length);
  posHeaderRange.setBackground('#0f172a')
                .setFontColor('#ffffff')
                .setFontWeight('bold')
                .setFontFamily('Arial')
                .setFontSize(10);
  posSheet.setFrozenRows(1);

  // Sample Positions
  const samplePositions = [
    ['ENG-SDE1-001', 'Engineering', 'SDE 1 (Frontend)', 'New', '2026-08-15', 'Active', 30],
    ['ENG-SDE1-002', 'Engineering', 'SDE 1 (Backend)', 'New', '2026-08-10', 'Active', 30],
    ['ENG-SDE2-001', 'Engineering', 'SDE 2 (Distributed Systems)', 'Replacement', '2026-08-01', 'Active', 35],
    ['ENG-LBE-001', 'Engineering', 'Lead Backend Engineer', 'New', '2026-08-20', 'Active', 45],
    ['FIN-FM-001', 'Finance', 'Finance Manager', 'Replacement', '2026-08-08', 'Active', 30],
    ['FIN-SFA-001', 'Finance', 'Senior Financial Analyst', 'New', '2026-08-22', 'Active', 25],
    ['PRD-SPM-001', 'Product', 'Senior Product Manager', 'New', '2026-08-12', 'Active', 35],
    ['PRD-UXD-001', 'Product', 'Product Designer (UI/UX)', 'Replacement', '2026-08-18', 'Active', 25],
    ['RSK-CRM-001', 'Risk', 'Credit Risk Manager', 'New', '2026-08-02', 'Active', 30],
    ['COL-COM-001', 'Collections', 'Collections Operations Lead', 'New', '2026-08-06', 'Active', 25]
  ];

  samplePositions.forEach(row => posSheet.appendRow(row));

  // Auto-resize columns
  candSheet.autoResizeColumns(1, candHeaders.length);
  posSheet.autoResizeColumns(1, posHeaders.length);
}

/**
 * Handle GET requests - return Candidates and Positions as JSON
 */
function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Read Candidates
    const candSheet = ss.getSheetByName('Candidates');
    const candData = candSheet ? candSheet.getDataRange().getValues() : [];
    const candidates = [];

    if (candData.length > 1) {
      const headers = candData[0].map(h => String(h).trim().toLowerCase());
      for (let i = 1; i < candData.length; i++) {
        const row = candData[i];
        if (!row[0] && !row[2]) continue; // Skip empty rows

        const getCol = (nameAliases) => {
          for (let alias of nameAliases) {
            const idx = headers.indexOf(alias);
            if (idx !== -1 && row[idx] !== undefined && row[idx] !== null) {
              return String(row[idx]).trim();
            }
          }
          return '';
        };

        candidates.push({
          id: getCol(['id', 'candidate id']) || `CAND-${1000 + i}`,
          appDate: formatDate(row[headers.indexOf('application date')]) || '2026-08-01',
          name: getCol(['name', 'candidate name']),
          email: getCol(['email', 'email address']),
          mobile: getCol(['mobile', 'phone', 'contact']),
          department: getCol(['department', 'dept']) || 'Engineering',
          jobTitle: getCol(['job title', 'role', 'position']) || 'Role',
          source: getCol(['source', 'channel']) || 'Direct',
          recruiter: getCol(['recruiter', 'owner']) || 'Unassigned',
          status: getCol(['status', 'stage']) || 'Shortlisted',
          ctc: getCol(['offered ctc', 'ctc', 'package']),
          offerDate: formatDate(row[headers.indexOf('offer date')]),
          expectedDoj: formatDate(row[headers.indexOf('expected doj')]),
          remarks: [{
            timestamp: new Date().toISOString(),
            stage: getCol(['status', 'stage']) || 'Shortlisted',
            decision: 'Logged',
            note: getCol(['latest remarks', 'remarks', 'notes']) || 'Record from Google Sheets'
          }]
        });
      }
    }

    // 2. Read Positions
    const posSheet = ss.getSheetByName('Positions');
    const posData = posSheet ? posSheet.getDataRange().getValues() : [];
    const positions = [];

    if (posData.length > 1) {
      const headers = posData[0].map(h => String(h).trim().toLowerCase());
      for (let i = 1; i < posData.length; i++) {
        const row = posData[i];
        if (!row[0] && !row[2]) continue;

        const getCol = (nameAliases) => {
          for (let alias of nameAliases) {
            const idx = headers.indexOf(alias);
            if (idx !== -1 && row[idx] !== undefined && row[idx] !== null) {
              return String(row[idx]).trim();
            }
          }
          return '';
        };

        const targetTatVal = parseInt(getCol(['target tat (days)', 'target tat', 'tat']), 10);

        positions.push({
          id: getCol(['position id', 'id']) || `POS-${i}`,
          department: getCol(['department', 'dept']) || 'Engineering',
          jobTitle: getCol(['job title', 'title', 'role']) || 'Role',
          type: getCol(['type', 'requisition type']) || 'New',
          dateOpened: formatDate(row[headers.indexOf('date opened')]) || '2026-08-01',
          status: getCol(['status']) || 'Active',
          targetTat: !isNaN(targetTatVal) && targetTatVal > 0 ? targetTatVal : 30
        });
      }
    }

    const payload = {
      status: 'success',
      timestamp: new Date().toISOString(),
      sheetTitle: ss.getName(),
      data: {
        candidates: candidates,
        positions: positions
      }
    };

    return ContentService.createTextOutput(JSON.stringify(payload))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle POST requests - update candidate stage or add records from Olyv Dashboard
 */
function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'update_candidate_stage') {
      const candSheet = ss.getSheetByName('Candidates');
      if (!candSheet) throw new Error('Candidates sheet not found');

      const data = candSheet.getDataRange().getValues();
      const headers = data[0].map(h => String(h).trim().toLowerCase());
      const idCol = headers.indexOf('id');
      const statusCol = headers.indexOf('status');
      const ctcCol = headers.indexOf('offered ctc');
      const dojCol = headers.indexOf('expected doj');
      const offerDateCol = headers.indexOf('offer date');
      const remarksCol = headers.indexOf('latest remarks');

      const candId = postData.candidateId;
      let rowIndex = -1;

      for (let i = 1; i < data.length; i++) {
        if (String(data[i][idCol]).trim().toLowerCase() === String(candId).trim().toLowerCase()) {
          rowIndex = i + 1; // 1-based index
          break;
        }
      }

      if (rowIndex !== -1) {
        if (statusCol !== -1 && postData.newStage) {
          candSheet.getRange(rowIndex, statusCol + 1).setValue(postData.newStage);
        }
        if (ctcCol !== -1 && postData.ctc !== undefined && postData.ctc !== null) {
          candSheet.getRange(rowIndex, ctcCol + 1).setValue(postData.ctc);
        }
        if (dojCol !== -1 && postData.expectedDoj) {
          candSheet.getRange(rowIndex, dojCol + 1).setValue(postData.expectedDoj);
        }
        if (offerDateCol !== -1 && postData.offerDate) {
          candSheet.getRange(rowIndex, offerDateCol + 1).setValue(postData.offerDate);
        }
        if (remarksCol !== -1 && postData.notes) {
          candSheet.getRange(rowIndex, remarksCol + 1).setValue(postData.notes);
        }

        return ContentService.createTextOutput(JSON.stringify({
          status: 'success',
          message: `Candidate ${candId} updated successfully`
        })).setMimeType(ContentService.MimeType.JSON);
      } else {
        throw new Error(`Candidate ${candId} not found in sheet`);
      }
    }

    if (action === 'add_candidate') {
      const candSheet = ss.getSheetByName('Candidates');
      const c = postData.candidate;
      candSheet.appendRow([
        c.id, c.appDate, c.name, c.email, c.mobile,
        c.department, c.jobTitle, c.source, c.recruiter,
        c.status, c.ctc || '', c.offerDate || '', c.expectedDoj || '', c.remarks || ''
      ]);

      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Candidate added'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Unknown action'
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function formatDate(val) {
  if (!val) return '';
  if (val instanceof Date) {
    return Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  const str = String(val).trim();
  if (str.match(/^\d{4}-\d{2}-\d{2}/)) {
    return str.substring(0, 10);
  }
  return str;
}
