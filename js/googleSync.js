/**
 * =========================================================================
 * OLYV ATS - Google Sheets & Cloud Database Synchronization Engine
 * =========================================================================
 * Provides real-time synchronization between Olyv ATS and Google Sheets,
 * supporting both Google Apps Script Web Apps (2-way sync) and direct
 * viewable Google Sheets links (live 1-way sync).
 */

(function (window) {
  'use strict';

  const SYNC_CONFIG_KEY = 'OLYV_GOOGLE_SYNC_CONFIG_V1';

  class OlyvGoogleSync {
    constructor() {
      this.config = {
        enabled: false,
        url: '',
        mode: 'apps_script', // 'apps_script' | 'google_sheet'
        autoSyncInterval: 60, // seconds (0 = manual)
        lastSyncTime: null,
        sheetTitle: ''
      };

      this.isSyncing = false;
      this.timerId = null;
      this.listeners = new Set();

      this.loadConfig();
      this.init();
    }

    loadConfig() {
      try {
        const stored = localStorage.getItem(SYNC_CONFIG_KEY);
        if (stored) {
          this.config = { ...this.config, ...JSON.parse(stored) };
        }
      } catch (e) {
        console.warn('Failed to load sync config from localStorage', e);
      }
    }

    saveConfig() {
      try {
        localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(this.config));
        this.emitStatus();
      } catch (e) {
        console.error('Failed to save sync config', e);
      }
    }

    init() {
      if (this.config.enabled && this.config.url) {
        this.startAutoSync();
        // Trigger initial sync on page load
        setTimeout(() => this.syncNow(true), 800);
      } else {
        this.emitStatus();
      }
    }

    onStatusChange(cb) {
      this.listeners.add(cb);
      cb(this.getStatus());
      return () => this.listeners.delete(cb);
    }

    emitStatus() {
      const status = this.getStatus();
      for (const cb of this.listeners) {
        try { cb(status); } catch (e) {}
      }
    }

    getStatus() {
      return {
        enabled: this.config.enabled,
        isSyncing: this.isSyncing,
        url: this.config.url,
        mode: this.config.mode,
        sheetTitle: this.config.sheetTitle || 'Google Sheet',
        lastSyncTime: this.config.lastSyncTime,
        autoSyncInterval: this.config.autoSyncInterval
      };
    }

    /**
     * Start background auto-sync timer
     */
    startAutoSync() {
      this.stopAutoSync();
      if (!this.config.enabled || !this.config.url || this.config.autoSyncInterval <= 0) return;

      this.timerId = setInterval(() => {
        this.syncNow(false);
      }, this.config.autoSyncInterval * 1000);
    }

    stopAutoSync() {
      if (this.timerId) {
        clearInterval(this.timerId);
        this.timerId = null;
      }
    }

    /**
     * Extract Google Sheet ID from URL if user pastes a standard Google Sheets link
     */
    extractSheetId(url) {
      const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      return match ? match[1] : null;
    }

    /**
     * Fetch Google Sheet table via dynamic script tag (JSONP)
     * Completely immune to CORS restrictions and works seamlessly from file:/// protocol!
     */
    fetchJsonp(sheetId, sheetName = 'Candidates', timeoutMs = 9000) {
      return new Promise((resolve, reject) => {
        const callbackName = 'gvizCallback_' + Math.random().toString(36).substring(2, 9);
        const script = document.createElement('script');
        let completed = false;

        const timer = setTimeout(() => {
          if (completed) return;
          completed = true;
          cleanup();
          reject(new Error(`Timeout fetching tab '${sheetName}'. Please check internet and sharing permissions.`));
        }, timeoutMs);

        function cleanup() {
          clearTimeout(timer);
          try { delete window[callbackName]; } catch (e) {}
          if (script.parentNode) script.parentNode.removeChild(script);
        }

        window[callbackName] = (response) => {
          if (completed) return;
          completed = true;
          cleanup();
          if (response && response.status === 'ok' && response.table) {
            resolve(response.table);
          } else if (response && response.status === 'error') {
            const msg = (response.errors && response.errors[0] && response.errors[0].message) || 'Error from Google Sheets';
            reject(new Error(msg));
          } else {
            reject(new Error('Invalid response structure from Google Sheets.'));
          }
        };

        script.onerror = () => {
          if (completed) return;
          completed = true;
          cleanup();
          reject(new Error(`Could not access Google Sheet. Please ensure the sheet is shared: click the green Share button > set General access to 'Anyone with the link' as Viewer.`));
        };

        const paramSheet = sheetName ? `&sheet=${encodeURIComponent(sheetName)}` : '';
        script.src = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=responseHandler:${callbackName}${paramSheet}`;
        document.head.appendChild(script);
      });
    }

    /**
     * Test connection to Google Sheet or Apps Script URL
     */
    async testConnection(url) {
      const trimmedUrl = (url || '').trim();
      if (!trimmedUrl) {
        return { success: false, message: 'Please provide a valid URL.' };
      }

      try {
        if (trimmedUrl.includes('script.google.com')) {
          // Google Apps Script endpoint
          try {
            const res = await fetch(trimmedUrl, { method: 'GET' });
            if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
            const json = await res.json();
            if (json.status === 'success' && json.data) {
              return {
                success: true,
                mode: 'apps_script',
                sheetTitle: json.sheetTitle || 'Olyv Recruitment Database',
                candidatesCount: (json.data.candidates || []).length,
                positionsCount: (json.data.positions || []).length,
                message: `Connected successfully! Found ${json.data.candidates?.length || 0} candidates and ${json.data.positions?.length || 0} positions.`
              };
            } else {
              throw new Error(json.message || 'Invalid response structure from Apps Script');
            }
          } catch (scriptErr) {
            throw new Error(`Corporate Google Workspace restriction on Apps Script Web Apps. Simply paste your Google Sheet link (https://docs.google.com/spreadsheets/d/...) instead! It connects instantly.`);
          }
        } else {
          // Direct Google Sheet URL - Uses JSONP (100% CORS-free and works on file:///)
          const sheetId = this.extractSheetId(trimmedUrl);
          if (!sheetId) {
            return { success: false, message: 'Could not find spreadsheet ID in link. Make sure the URL looks like: https://docs.google.com/spreadsheets/d/.../edit' };
          }

          let table;
          try {
            table = await this.fetchJsonp(sheetId, 'Candidates');
          } catch (e) {
            // Fallback: try fetching first default tab
            table = await this.fetchJsonp(sheetId, '');
          }

          const rowsCount = (table && table.rows) ? table.rows.length : 0;
          return {
            success: true,
            mode: 'google_sheet',
            sheetTitle: 'Google Sheet Database',
            candidatesCount: rowsCount,
            message: `Connected successfully! Found ${rowsCount} rows in Google Sheet.`
          };
        }
      } catch (err) {
        console.error('Connection test error:', err);
        return {
          success: false,
          message: err.message || 'Failed to connect. Check URL and sharing permissions.'
        };
      }
    }

    /**
     * Master Sync Trigger
     */
    async syncNow(showToast = true) {
      if (!this.config.enabled || !this.config.url) {
        if (showToast && window.OlyvApp) {
          window.OlyvApp.showToast('Google Sheets sync is not enabled. Configure it in settings.', 'info');
        }
        return false;
      }

      if (this.isSyncing) return false;

      this.isSyncing = true;
      this.emitStatus();

      try {
        const url = this.config.url.trim();

        if (url.includes('script.google.com')) {
          // Sync via Google Apps Script Web App
          const res = await fetch(url, { method: 'GET' });
          if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
          const json = await res.json();

          if (json.status === 'success' && json.data) {
            const newCandidates = json.data.candidates || [];
            const newPositions = json.data.positions || [];

            this.applySyncData(newCandidates, newPositions, json.sheetTitle);

            this.config.lastSyncTime = new Date().toISOString();
            this.config.sheetTitle = json.sheetTitle || 'Google Sheets Database';
            this.saveConfig();

            if (showToast && window.OlyvApp) {
              window.OlyvApp.showToast(`Synced ${newCandidates.length} candidates & ${newPositions.length} positions from Google Sheets!`, 'success');
            }
          } else {
            throw new Error(json.message || 'Invalid response from Google Apps Script');
          }

        } else {
          // Sync via Direct Google Sheet link using JSONP (CORS-free)
          const sheetId = this.extractSheetId(url);
          if (!sheetId) throw new Error('Invalid Google Sheet URL.');

          // 1. Fetch Candidates via JSONP
          let rawCandidates = [];
          try {
            const candTable = await this.fetchJsonp(sheetId, 'Candidates');
            rawCandidates = this.gvizToObjects(candTable);
          } catch (e) {
            const defaultTable = await this.fetchJsonp(sheetId, '');
            rawCandidates = this.gvizToObjects(defaultTable);
          }

          // 2. Fetch Positions via JSONP
          let rawPositions = [];
          try {
            const posTable = await this.fetchJsonp(sheetId, 'Positions');
            rawPositions = this.gvizToObjects(posTable);
          } catch (e) {
            console.warn('Positions tab not found via JSONP, keeping existing positions.', e);
          }

          // Transform GViz objects to Olyv schema
          const mappedCandidates = this.mapRawCandidates(rawCandidates);
          const mappedPositions = this.mapRawPositions(rawPositions);

          this.applySyncData(mappedCandidates, mappedPositions, 'Google Sheet Database');

          this.config.lastSyncTime = new Date().toISOString();
          this.config.sheetTitle = 'Google Sheet Database';
          this.saveConfig();

          if (showToast && window.OlyvApp) {
            window.OlyvApp.showToast(`Synced ${mappedCandidates.length} candidates from Google Sheets!`, 'success');
          }
        }

        return true;

      } catch (err) {
        console.error('Google Sheets sync error:', err);
        if (showToast && window.OlyvApp) {
          window.OlyvApp.showToast(`Sync error: ${err.message}`, 'error');
        }
        return false;
      } finally {
        this.isSyncing = false;
        this.emitStatus();
      }
    }

    /**
     * Parse Google Visualization API (GViz) Table into clean Javascript objects
     */
    gvizToObjects(table) {
      if (!table || !table.rows || !table.cols) return [];

      // 1. Determine column headers
      let headers = table.cols.map(c => (c && c.label ? c.label.trim().toLowerCase() : ''));
      let startRow = 0;

      // If column labels are mostly empty, check if row 0 contains the header names
      const labeledCount = headers.filter(h => h.length > 0).length;
      if (labeledCount < 2 && table.rows.length > 0) {
        const firstRowCells = table.rows[0].c || [];
        headers = firstRowCells.map(cell => (cell && cell.v !== null && cell.v !== undefined ? String(cell.v).trim().toLowerCase() : ''));
        startRow = 1;
      }

      const results = [];
      for (let r = startRow; r < table.rows.length; r++) {
        const rowCells = table.rows[r].c || [];
        const obj = {};
        let hasAnyData = false;

        for (let c = 0; c < headers.length; c++) {
          const header = headers[c] || `col_${c}`;
          const cell = rowCells[c];
          const val = cell && cell.v !== null && cell.v !== undefined ? cell.v : (cell && cell.f !== null && cell.f !== undefined ? cell.f : '');
          if (val !== '') hasAnyData = true;
          obj[header] = String(val).trim();
        }

        if (hasAnyData) {
          results.push(obj);
        }
      }
      return results;
    }

    /**
     * Map raw sheet columns to standard Candidate entity
     */
    mapRawCandidates(rawList) {
      return rawList.map((row, idx) => {
        const findVal = (aliases) => {
          for (const a of aliases) {
            if (row[a] !== undefined && row[a] !== '') return row[a];
          }
          return '';
        };

        const id = findVal(['id', 'candidate id']) || `CAND-${1000 + idx}`;
        const name = findVal(['name', 'candidate name', 'full name']) || 'Unnamed Candidate';
        const email = findVal(['email', 'email address', 'candidate email']) || '';
        const mobile = findVal(['mobile', 'phone', 'contact number', 'phone number']) || '';
        const department = findVal(['department', 'dept']) || 'Engineering';
        const jobTitle = findVal(['job title', 'role', 'position', 'designation']) || 'Specialist';
        const source = findVal(['source', 'channel', 'source channel']) || 'Direct';
        const recruiter = findVal(['recruiter', 'recruiter owner', 'owner']) || 'Unassigned';
        const status = findVal(['status', 'stage', 'current status']) || 'Shortlisted';
        const ctc = findVal(['offered ctc', 'ctc', 'package']) || '';
        const expectedDoj = findVal(['expected doj', 'doj', 'date of joining']) || '';
        const offerDate = findVal(['offer date', 'date offered']) || '';
        const note = findVal(['latest remarks', 'remarks', 'notes', 'feedback']) || 'Imported from Google Sheet';

        return {
          id,
          appDate: findVal(['application date', 'app date', 'date']) || '2026-08-01',
          name,
          email,
          mobile,
          department,
          jobTitle,
          source,
          recruiter,
          status,
          ctc,
          expectedDoj,
          offerDate,
          remarks: [{
            timestamp: new Date().toISOString(),
            stage: status,
            decision: 'Logged',
            note
          }]
        };
      }).filter(c => c.name && c.name !== 'Unnamed Candidate');
    }

    /**
     * Map raw sheet columns to standard Position entity
     */
    mapRawPositions(rawList) {
      return rawList.map((row, idx) => {
        const findVal = (aliases) => {
          for (const a of aliases) {
            if (row[a] !== undefined && row[a] !== '') return row[a];
          }
          return '';
        };

        const id = findVal(['position id', 'id']) || `POS-${idx + 1}`;
        const department = findVal(['department', 'dept']) || 'Engineering';
        const jobTitle = findVal(['job title', 'title', 'role']) || 'Role';
        const type = findVal(['type', 'requisition type']) || 'New';
        const dateOpened = findVal(['date opened', 'opened date']) || '2026-08-01';
        const status = findVal(['status']) || 'Active';
        const targetTatVal = parseInt(findVal(['target tat (days)', 'target tat', 'tat']), 10);

        return {
          id,
          department,
          jobTitle,
          type: type.toLowerCase().includes('rep') ? 'Replacement' : 'New',
          dateOpened,
          status,
          targetTat: !isNaN(targetTatVal) && targetTatVal > 0 ? targetTatVal : 30
        };
      }).filter(p => p.jobTitle && p.department);
    }

    /**
     * Apply synced candidates & positions into OlyvDB reactively
     */
    applySyncData(candidates, positions, sheetTitle) {
      if (!window.OlyvDB) return;

      if (Array.isArray(candidates) && candidates.length > 0) {
        window.OlyvDB.data.candidates = candidates;
      }
      if (Array.isArray(positions) && positions.length > 0) {
        window.OlyvDB.data.positions = positions;
      }

      // Update departments list based on synced data
      const deptSet = new Set();
      candidates.forEach(c => c.department && deptSet.add(c.department));
      positions.forEach(p => p.department && deptSet.add(p.department));

      deptSet.forEach(deptName => {
        window.OlyvDB.addDepartment(deptName);
      });

      window.OlyvDB.persist();
      window.OlyvDB.emit('change', { table: 'all', action: 'google_sync' });
    }

    /**
     * Push stage updates back to Google Sheets (if Apps Script 2-Way Sync is enabled)
     */
    async pushCandidateUpdate(candidateId, updates) {
      if (!this.config.enabled || !this.config.url || !this.config.url.includes('script.google.com')) {
        return; // Only works with Google Apps Script Web App
      }

      try {
        await fetch(this.config.url, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({
            action: 'update_candidate_stage',
            candidateId,
            newStage: updates.newStage,
            decision: updates.decision,
            notes: updates.notes,
            ctc: updates.ctc,
            expectedDoj: updates.expectedDoj,
            offerDate: updates.offerDate
          })
        });
      } catch (err) {
        console.warn('Failed to push update back to Google Sheets', err);
      }
    }
  }

  window.OlyvGoogleSync = new OlyvGoogleSync();
})(window);
