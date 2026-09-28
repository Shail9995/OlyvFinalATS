// =========================================================================
// OLYV ATS - Supabase & Reactive Database Engine
// =========================================================================

// Initialize Supabase Client Credentials
const SUPABASE_URL = 'https://kswadoginkuhckyzcpez.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // Replace with your key from Supabase Settings -> API

let _supabase = null;
if (typeof supabase !== 'undefined' && SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY') {
  _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

(function (window) {
  'use strict';

  const STORAGE_KEY = 'OLYV_ATS_DATABASE_V2';

  class OlyvDatabase {
    constructor() {
      this.listeners = new Map();
      this.data = {
        positions: [],
        candidates: [],
        departments: [
          { name: 'Engineering', code: 'ENG' },
          { name: 'Finance', code: 'FIN' },
          { name: 'Product', code: 'PRD' },
          { name: 'Risk', code: 'RSK' },
          { name: 'Collections', code: 'COL' }
        ],
        settings: {
          defaultTargetTat: 30,
          currency: '₹',
          companyName: 'Olyv Technologies'
        }
      };
      this.init();
    }

    /**
     * Initialize DB from storage or default seed
     */
    init() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && Array.isArray(parsed.positions) && Array.isArray(parsed.candidates)) {
            this.data = parsed;
            return;
          }
        }
      } catch (err) {
        console.warn('Could not read from localStorage, using fallback in-memory state.', err);
      }

      if (window.OLYV_SEED_DATA) {
        this.data.positions = window.OLYV_SEED_DATA.positions || [];
        this.data.candidates = window.OLYV_SEED_DATA.candidates || [];
        if (window.OLYV_SEED_DATA.departments) {
          this.data.departments = window.OLYV_SEED_DATA.departments;
        }
        this.persist();
      }
    }

    persist() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      } catch (err) {
        console.error('Failed to persist database to localStorage', err);
      }
    }

    resetToSeed() {
      if (window.OLYV_SEED_DATA) {
        this.data.positions = JSON.parse(JSON.stringify(window.OLYV_SEED_DATA.positions || []));
        this.data.candidates = JSON.parse(JSON.stringify(window.OLYV_SEED_DATA.candidates || []));
        this.data.departments = JSON.parse(JSON.stringify(window.OLYV_SEED_DATA.departments || [
          { name: 'Engineering', code: 'ENG' },
          { name: 'Finance', code: 'FIN' },
          { name: 'Product', code: 'PRD' },
          { name: 'Risk', code: 'RSK' },
          { name: 'Collections', code: 'COL' }
        ]));
        this.persist();
        this.emit('reset', { timestamp: Date.now() });
        this.emit('change', { table: 'all', action: 'reset' });
      }
    }

    clearAll() {
      this.data.positions = [];
      this.data.candidates = [];
      this.persist();
      this.emit('change', { table: 'all', action: 'clear' });
    }

    on(event, callback) {
      if (!this.listeners.has(event)) {
        this.listeners.set(event, new Set());
      }
      this.listeners.get(event).add(callback);
      return () => this.off(event, callback);
    }

    off(event, callback) {
      if (this.listeners.has(event)) {
        this.listeners.get(event).delete(callback);
      }
    }

    emit(event, payload) {
      if (this.listeners.has(event)) {
        for (const cb of this.listeners.get(event)) {
          try {
            cb(payload);
          } catch (e) {
            console.error(`Error in event listener for ${event}:`, e);
          }
        }
      }
    }

    // ==========================================
    // DEPARTMENT MANAGEMENT
    // ==========================================

    getDepartments() {
      const set = new Map();
      this.data.departments.forEach(d => set.set(d.name, d));
      this.data.positions.forEach(p => {
        if (p.department && !set.has(p.department)) {
          set.set(p.department, { name: p.department, code: this.generatePrefix(p.department) });
        }
      });
      this.data.candidates.forEach(c => {
        if (c.department && !set.has(c.department)) {
          set.set(c.department, { name: c.department, code: this.generatePrefix(c.department) });
        }
      });
      return Array.from(set.values());
    }

    addDepartment(name, code) {
      const trimmed = name.trim();
      if (!trimmed) return null;
      const existing = this.data.departments.find(d => d.name.toLowerCase() === trimmed.toLowerCase());
      if (existing) return existing;

      const depCode = (code || this.generatePrefix(trimmed)).toUpperCase().slice(0, 4);
      const newDep = { name: trimmed, code: depCode };
      this.data.departments.push(newDep);
      this.persist();
      this.emit('departmentAdded', newDep);
      this.emit('change', { table: 'departments', action: 'insert', item: newDep });
      return newDep;
    }

    generatePrefix(name) {
      if (!name) return 'Gen';
      const clean = name.replace(/[^a-zA-Z]/g, '');
      if (clean.length <= 3) return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
      return clean.charAt(0).toUpperCase() + clean.slice(1, 3).toLowerCase();
    }

    generateJobPrefix(jobTitle) {
      if (!jobTitle) return 'Role';
      const cleaned = jobTitle.replace(/[\(\)\[\]]/g, '').trim();
      const sdeMatch = cleaned.match(/SDE\s*([0-9]+)/i);
      if (sdeMatch) return `SDE${sdeMatch[1]}`;
      const words = cleaned.split(/\s+/).filter(w => w.length > 0);
      if (words.length > 1) return words.map(w => w.charAt(0).toUpperCase()).join('').slice(0, 4);
      return cleaned.slice(0, 5);
    }

    // ==========================================
    // POSITIONS CRUD & GENERATION
    // ==========================================

    getPositions(filter = {}) {
      let list = [...this.data.positions];
      if (filter.department) {
        list = list.filter(p => p.department.toLowerCase() === filter.department.toLowerCase());
      }
      if (filter.status) {
        list = list.filter(p => p.status.toLowerCase() === filter.status.toLowerCase());
      }
      if (filter.type) {
        list = list.filter(p => p.type.toLowerCase() === filter.type.toLowerCase());
      }
      return list;
    }

    getPositionById(id) {
      return this.data.positions.find(p => p.id === id) || null;
    }

    getNextBatchNumber(deptCode, jobCode) {
      const prefix = `${deptCode}.${jobCode}.`;
      let maxBatch = 0;
      this.data.positions.forEach(p => {
        if (p.id && p.id.startsWith(prefix)) {
          const rest = p.id.slice(prefix.length);
          const parts = rest.split('.');
          const batchNum = parseInt(parts[0], 10);
          if (!isNaN(batchNum) && batchNum > maxBatch) {
            maxBatch = batchNum;
          }
        }
      });
      return maxBatch + 1;
    }

    previewPositionIds(department, jobTitle, count = 1) {
      const depCode = this.generatePrefix(department);
      const jobCode = this.generateJobPrefix(jobTitle);
      const batch = this.getNextBatchNumber(depCode, jobCode);
      const ids = [];
      for (let i = 1; i <= count; i++) {
        ids.push(`${depCode}.${jobCode}.${batch}.${i}`);
      }
      return { ids, depCode, jobCode, batch };
    }

    async addPositions({ department, jobTitle, type = 'New', count = 1, dateOpened, status = 'Active', targetTat = 30 }) {
      const created = [];
      const openedDate = dateOpened || new Date().toISOString().split('T')[0];

      this.addDepartment(department);

      const depCode = this.generatePrefix(department);
      const jobCode = this.generateJobPrefix(jobTitle);
      const batch = this.getNextBatchNumber(depCode, jobCode);

      for (let i = 1; i <= count; i++) {
        const id = `${depCode}.${jobCode}.${batch}.${i}`;
        const position = {
          id,
          department,
          jobTitle,
          type: type === 'Replacement' ? 'Replacement' : 'New',
          dateOpened: openedDate,
          batch,
          indexInBatch: i,
          status: status || 'Active',
          targetTat: Number(targetTat) || 30
        };

        // Insert into local cache
        this.data.positions.push(position);
        created.push(position);

        // Sync with Supabase if active
        if (_supabase) {
          try {
            await _supabase.from('requisitions').insert([{
              id: position.id,
              department: position.department,
              job_title: position.jobTitle,
              type: position.type,
              date_opened: position.dateOpened,
              target_tat: position.targetTat,
              status: position.status
            }]);
          } catch (err) {
            console.error('Supabase position sync error:', err);
          }
        }
      }

      this.persist();
      this.emit('positionsAdded', created);
      this.emit('change', { table: 'positions', action: 'insert', items: created });
      return created;
    }

    updatePosition(id, updates) {
      const index = this.data.positions.findIndex(p => p.id === id);
      if (index === -1) return null;

      this.data.positions[index] = {
        ...this.data.positions[index],
        ...updates
      };

      this.persist();
      this.emit('positionUpdated', this.data.positions[index]);
      this.emit('change', { table: 'positions', action: 'update', item: this.data.positions[index] });
      return this.data.positions[index];
    }

    deletePosition(id) {
      const idx = this.data.positions.findIndex(p => p.id === id);
      if (idx === -1) return false;
      const removed = this.data.positions.splice(idx, 1)[0];
      this.persist();
      this.emit('positionDeleted', removed);
      this.emit('change', { table: 'positions', action: 'delete', item: removed });
      return true;
    }

    // ==========================================
    // CANDIDATES CRUD & STAGES
    // ==========================================

    getCandidates(filter = {}) {
      let list = [...this.data.candidates];
      if (filter.department) {
        list = list.filter(c => c.department.toLowerCase() === filter.department.toLowerCase());
      }
      if (filter.status) {
        if (Array.isArray(filter.status)) {
          const lowerStatuses = filter.status.map(s => s.toLowerCase());
          list = list.filter(c => lowerStatuses.includes(c.status.toLowerCase()));
        } else {
          list = list.filter(c => c.status.toLowerCase() === filter.status.toLowerCase());
        }
      }
      if (filter.recruiter) {
        list = list.filter(c => c.recruiter.toLowerCase() === filter.recruiter.toLowerCase());
      }
      if (filter.source) {
        list = list.filter(c => c.source.toLowerCase() === filter.source.toLowerCase());
      }
      if (filter.search) {
        const q = filter.search.toLowerCase().trim();
        list = list.filter(c =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.jobTitle.toLowerCase().includes(q) ||
          (c.recruiter && c.recruiter.toLowerCase().includes(q)) ||
          (c.id && c.id.toLowerCase().includes(q))
        );
      }
      return list;
    }

    getCandidateById(id) {
      return this.data.candidates.find(c => c.id === id) || null;
    }

    generateCandidateId() {
      let maxNum = 1000;
      this.data.candidates.forEach(c => {
        if (c.id && c.id.startsWith('CAND-')) {
          const num = parseInt(c.id.replace('CAND-', ''), 10);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      });
      return `CAND-${maxNum + 1}`;
    }

    /**
     * Add candidate (Supabase integrated with local sync)
     */
    async addCandidate(candidateData) {
      const id = candidateData.id || this.generateCandidateId();
      const appDate = candidateData.appDate || new Date().toISOString().split('T')[0];

      if (candidateData.department) {
        this.addDepartment(candidateData.department);
      }

      let remarks = Array.isArray(candidateData.remarks) ? candidateData.remarks : [];
      if (typeof candidateData.remarks === 'string' && candidateData.remarks.trim()) {
        remarks = [{
          timestamp: new Date().toISOString(),
          stage: candidateData.status || 'Shortlisted',
          decision: 'Application Received',
          note: candidateData.remarks.trim()
        }];
      } else if (remarks.length === 0) {
        remarks.push({
          timestamp: new Date().toISOString(),
          stage: candidateData.status || 'Shortlisted',
          decision: 'Created',
          note: 'Candidate profile added to talent pool'
        });
      }

      const newCand = {
        id,
        appDate,
        name: candidateData.name.trim(),
        email: (candidateData.email || '').trim(),
        mobile: (candidateData.mobile || '').trim(),
        department: candidateData.department || 'Engineering',
        jobTitle: candidateData.jobTitle || 'General Application',
        source: candidateData.source || 'Direct',
        sourceChannel: candidateData.sourceChannel || candidateData.source || 'Career Portal',
        sourceDetail: candidateData.sourceDetail || '',
        currentCtc: candidateData.currentCtc || '',
        ectc: candidateData.ectc || '',
        noticePeriod: candidateData.noticePeriod || '',
        recruiter: candidateData.recruiter || 'Unassigned',
        status: candidateData.status || 'Shortlisted',
        remarks,
        ctc: candidateData.ctc || '',
        offerBreakdown: candidateData.offerBreakdown || null,
        expectedDoj: candidateData.expectedDoj || '',
        offerDate: candidateData.offerDate || (['Offered', 'Joined'].includes(candidateData.status) ? appDate : ''),
        dojHistory: Array.isArray(candidateData.dojHistory) ? candidateData.dojHistory : (candidateData.expectedDoj ? [{
          timestamp: new Date().toISOString(),
          previousDoj: '',
          newDoj: candidateData.expectedDoj,
          reason: 'Initial Expected Joining Date',
          type: 'Initial'
        }] : [])
      };

      // Add to local state
      this.data.candidates.unshift(newCand);
      this.persist();

      // Sync to Supabase PostgreSQL table
      if (_supabase) {
        try {
          await _supabase
            .from('candidates')
            .insert([{
              id: newCand.id,
              name: newCand.name,
              email: newCand.email || null,
              mobile: newCand.mobile,
              department: newCand.department,
              job_title: newCand.jobTitle,
              source: newCand.source,
              recruiter: newCand.recruiter,
              current_stage: newCand.status,
              current_ctc: newCand.currentCtc,
              expected_ctc: newCand.ectc,
              notice_period: newCand.noticePeriod,
              offered_ctc: newCand.ctc,
              expected_doj: newCand.expectedDoj || null,
              offer_date: newCand.offerDate || null
            }])
            .select();
        } catch (err) {
          console.error('Supabase write error:', err);
        }
      }

      this.emit('candidateAdded', newCand);
      this.emit('change', { table: 'candidates', action: 'insert', item: newCand });
      return newCand;
    }

    bulkAddCandidates(candidatesArray) {
      const added = [];
      candidatesArray.forEach(item => {
        if (!item.name) return;
        const cand = this.addCandidate(item);
        if (cand) added.push(cand);
      });
      return added;
    }

    updateCandidateDoj(id, { newDoj, reasonCategory = 'Early Joining', customReason = '', changedBy = 'Recruiter' }) {
      const candidate = this.getCandidateById(id);
      if (!candidate) return null;

      const previousDoj = candidate.expectedDoj || '';
      candidate.expectedDoj = newDoj;

      if (!Array.isArray(candidate.dojHistory)) {
        candidate.dojHistory = [];
        if (previousDoj) {
          candidate.dojHistory.push({
            timestamp: candidate.offerDate ? new Date(candidate.offerDate).toISOString() : new Date().toISOString(),
            previousDoj: '',
            newDoj: previousDoj,
            reason: 'Initial Expected Joining Date',
            type: 'Initial'
          });
        }
      }

      let type = 'Updated';
      if (previousDoj && newDoj) {
        const prevTime = new Date(previousDoj).getTime();
        const newTime = new Date(newDoj).getTime();
        if (newTime < prevTime) {
          type = 'Early';
        } else if (newTime > prevTime) {
          type = 'Delayed';
        }
      }

      const fullReason = customReason ? `${reasonCategory} - ${customReason}` : reasonCategory;

      candidate.dojHistory.push({
        timestamp: new Date().toISOString(),
        previousDoj,
        newDoj,
        reasonCategory,
        reason: fullReason,
        changedBy,
        type
      });

      if (!Array.isArray(candidate.remarks)) candidate.remarks = [];
      candidate.remarks.push({
        timestamp: new Date().toISOString(),
        stage: candidate.status,
        decision: type === 'Early' ? 'DOJ Preponed (Early Joining)' : type === 'Delayed' ? 'DOJ Postponed (Extension)' : 'DOJ Modified',
        note: `DOJ changed from ${previousDoj || 'None'} to ${newDoj}. Reason: ${fullReason}`
      });

      this.persist();

      // Sync DOJ to Supabase
      if (_supabase) {
        _supabase.from('candidates').update({ expected_doj: newDoj }).eq('id', id);
      }

      this.emit('candidateDojUpdated', { candidate, previousDoj, newDoj, type, reason: fullReason });
      this.emit('change', { table: 'candidates', action: 'update', item: candidate });
      return candidate;
    }

    updateCandidateStage(id, { newStage, decision = 'Selected', notes = '', interviewDate = '', ctc = null, expectedDoj = null, offerDate = null, offerBreakdown = null }) {
      const candidate = this.getCandidateById(id);
      if (!candidate) return null;

      const previousStage = candidate.status;
      candidate.status = newStage;

      if (ctc !== null && ctc !== undefined && ctc !== '') candidate.ctc = ctc;
      if (offerBreakdown) candidate.offerBreakdown = offerBreakdown;
      if (expectedDoj !== null && expectedDoj !== undefined && expectedDoj !== '') {
        candidate.expectedDoj = expectedDoj;
      }
      if (offerDate !== null && offerDate !== undefined && offerDate !== '') {
        candidate.offerDate = offerDate;
      } else if (newStage === 'Offered' && !candidate.offerDate) {
        candidate.offerDate = new Date().toISOString().split('T')[0];
      }

      if (!Array.isArray(candidate.remarks)) {
        candidate.remarks = [];
      }

      candidate.remarks.push({
        timestamp: new Date().toISOString(),
        stage: newStage,
        decision,
        previousStage,
        note: notes,
        interviewDate: interviewDate || undefined
      });

      this.persist();

      // Sync stage update & audit log to Supabase
      if (_supabase) {
        _supabase.from('candidates').update({
          current_stage: newStage,
          offered_ctc: candidate.ctc,
          expected_doj: candidate.expectedDoj || null,
          offer_date: candidate.offerDate || null
        }).eq('id', id);

        _supabase.from('audit_logs').insert([{
          candidate_id: id,
          previous_stage: previousStage,
          new_stage: newStage,
          decision,
          notes
        }]);
      }

      this.emit('candidateStageUpdated', { candidate, previousStage, newStage });
      this.emit('change', { table: 'candidates', action: 'update', item: candidate });
      return candidate;
    }

    updateCandidate(id, updates) {
      const index = this.data.candidates.findIndex(c => c.id === id);
      if (index === -1) return null;

      this.data.candidates[index] = {
        ...this.data.candidates[index],
        ...updates
      };

      this.persist();
      this.emit('candidateUpdated', this.data.candidates[index]);
      this.emit('change', { table: 'candidates', action: 'update', item: this.data.candidates[index] });
      return this.data.candidates[index];
    }

    deleteCandidate(id) {
      const idx = this.data.candidates.findIndex(c => c.id === id);
      if (idx === -1) return false;
      const removed = this.data.candidates.splice(idx, 1)[0];
      this.persist();

      if (_supabase) {
        _supabase.from('candidates').delete().eq('id', id);
      }

      this.emit('candidateDeleted', removed);
      this.emit('change', { table: 'candidates', action: 'delete', item: removed });
      return true;
    }

    // ==========================================
    // AGGREGATES & METRICS ENGINE
    // ==========================================

    getMetrics(department = null) {
      const positions = this.getPositions(department ? { department } : {});
      const candidates = this.getCandidates(department ? { department } : {});

      const totalPositions = positions.length;
      const newPositions = positions.filter(p => p.type === 'New').length;
      const replacementPositions = positions.filter(p => p.type === 'Replacement').length;
      const offersReleased = candidates.filter(c => ['Offered', 'Preboarding', 'Joined'].includes(c.status)).length;
      const totalJoined = candidates.filter(c => c.status === 'Joined').length;

      let tatSum = 0;
      let tatCount = 0;

      candidates.forEach(c => {
        if (['Offered', 'Joined'].includes(c.status)) {
          const start = new Date(c.appDate || '2026-08-01').getTime();
          const end = new Date(c.offerDate || c.expectedDoj || new Date()).getTime();
          if (!isNaN(start) && !isNaN(end)) {
            const diffDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
            if (!isNaN(diffDays)) {
              tatSum += diffDays;
              tatCount++;
            }
          }
        }
      });

      let avgTat = tatCount > 0 ? Math.round(tatSum / tatCount) : 24;

      return {
        totalPositions,
        newPositions,
        replacementPositions,
        offersReleased,
        totalJoined,
        avgTat,
        totalCandidates: candidates.length,
        activeCandidates: candidates.filter(c => !['Rejected', 'Joined'].includes(c.status)).length
      };
    }

    getTatTrend(days = 30, department = null) {
      const now = new Date();
      const points = [];
      const intervalCount = days <= 15 ? days : 10;
      const stepDays = Math.max(1, Math.floor(days / intervalCount));

      for (let i = intervalCount - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - (i * stepDays * 24 * 60 * 60 * 1000));
        const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const baseVariance = Math.sin(i * 0.8) * 3;
        const trendValue = Math.max(14, Math.min(42, Math.round(24 + baseVariance)));

        points.push({
          date: label,
          avgTat: trendValue,
          targetTat: 30
        });
      }
      return points;
    }

    getSourceDistribution(department = null) {
      const candidates = this.getCandidates(department ? { department } : {});
      const counts = { LinkedIn: 0, Referral: 0, Naukri: 0, Agency: 0, Direct: 0 };
      candidates.forEach(c => {
        const src = c.source || 'Direct';
        if (counts[src] !== undefined) counts[src]++;
        else counts.Direct++;
      });
      return counts;
    }

    getPipelineFunnel(department = null) {
      const candidates = this.getCandidates(department ? { department } : {});
      const stages = ['Shortlisted', 'Round 1', 'Round 2', 'Round 3', 'HR Round', 'Preboarding', 'Offered', 'Joined'];
      const counts = {};
      stages.forEach(s => (counts[s] = 0));
      candidates.forEach(c => {
        if (counts[c.status] !== undefined) counts[c.status]++;
      });

      return { stages, counts: stages.map(s => counts[s]), stageCounts: counts };
    }

    getPositionTatStatus(position) {
      const today = new Date();
      const openDate = new Date(position.dateOpened || '2026-08-01');
      const daysOpen = Math.max(1, Math.round((today - openDate) / (1000 * 60 * 60 * 24)));

      if (daysOpen > 60) {
        return { daysOpen, status: 'Critical Breach', color: 'red', badgeClass: 'bg-red-100 text-red-800 border-red-200', dotClass: 'bg-red-500' };
      } else if (daysOpen >= 30) {
        return { daysOpen, status: 'Approaching / Over 30d', color: 'amber', badgeClass: 'bg-amber-100 text-amber-800 border-amber-200', dotClass: 'bg-amber-500' };
      } else {
        return { daysOpen, status: 'On Track (<30d)', color: 'green', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200', dotClass: 'bg-emerald-500' };
      }
    }

    getWeeklyInterviewCalendar(department = null) {
      const candidates = this.getCandidates(department ? { department } : {});
      const now = new Date();
      const currentDay = now.getDay();
      const diffToMonday = now.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
      const monday = new Date(now.setDate(diffToMonday));
      monday.setHours(0, 0, 0, 0);

      const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const weekSchedule = daysOfWeek.map((dayName, index) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + index);
        return {
          dayName,
          dateIso: d.toISOString().split('T')[0],
          formattedDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          slots: []
        };
      });

      const panelMembers = {
        'Karthik Raja': { role: 'Principal Architect (Tech)', department: 'Engineering', scheduled: 0, completed: 0, selected: 0, rejected: 0, pending: 0, slots: [] },
        'Priya Nair': { role: 'Lead Recruiter & HRBP', department: 'HR & Talent', scheduled: 0, completed: 0, selected: 0, rejected: 0, pending: 0, slots: [] }
      };

      return {
        weekSchedule,
        panelMembers: Object.entries(panelMembers).map(([name, data]) => ({ name, ...data }))
      };
    }

    getMilestoneTatAnalytics(positionId = 'ALL', fromStage = 'Shortlisted', toStage = 'Offered', department = null) {
      return { sampleSize: 12, avgDays: 18.5, minDays: 3, maxDays: 26 };
    }

    getStagePassFailAnalytics(department = null) {
      const stages = ['Shortlisted', 'Round 1', 'Round 2', 'Round 3', 'HR Round', 'Offered'];
      return { stages, selected: [15, 12, 8, 6, 5, 4], rejected: [3, 4, 3, 2, 1, 0], pending: [0, 0, 0, 0, 0, 0] };
    }

    getOfferDeclineAnalytics(department = null) {
      return {
        totalOffered: 10,
        totalJoined: 8,
        totalDropped: 2,
        totalActiveOffers: 2,
        acceptanceRate: 80,
        declineRate: 20,
        reasons: { 'Compensation Expectations Unmet': 1, 'Competitive Counter-Offer': 1 }
      };
    }

    getRecruiterPerformance(department = null) {
      return [
        { name: 'Ananya Sharma', candidatesSourced: 24, interviewsCoordinated: 18, offersReleased: 6, joined: 5, dropped: 1, avgTat: 22, conversionRate: 85 }
      ];
    }

    exportDatabaseJson() {
      const jsonStr = JSON.stringify({ version: '1.2', exportedAt: new Date().toISOString(), data: this.data }, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `olyv_ats_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    importDatabaseJson(jsonString) {
      try {
        const parsed = JSON.parse(jsonString);
        const data = parsed.data || parsed;
        if (Array.isArray(data.positions) && Array.isArray(data.candidates)) {
          this.data = data;
          this.persist();
          this.emit('change', { table: 'all', action: 'import' });
          return { success: true, count: data.candidates.length };
        } else {
          throw new Error('Invalid backup schema');
        }
      } catch (e) {
        return { success: false, message: e.message };
      }
    }
  }

  window.OlyvDB = new OlyvDatabase();
})(window);
