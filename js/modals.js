/**
 * OLYV ATS - Interactive Modals & Workflow Controller
 * Manages Add Position, Add Candidate, Stage Progression, and Bulk Upload Modals
 */

(function (window) {
  'use strict';

  class OlyvModals {
    constructor() {
      this.activeModal = null;
      this.currentCandidateForStage = null;
      this.initEvents();
    }

    initEvents() {
      // Close on backdrop click or ESC
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.activeModal) {
          this.closeAll();
        }
      });
    }

    openModal(modalId) {
      const modal = document.getElementById(modalId);
      if (!modal) return;
      this.closeAll();
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      this.activeModal = modalId;
      document.body.style.overflow = 'hidden';
    }

    closeAll() {
      const modals = document.querySelectorAll('.modal-overlay');
      modals.forEach(m => {
        m.classList.add('hidden');
        m.classList.remove('flex');
      });
      this.activeModal = null;
      this.currentCandidateForStage = null;
      document.body.style.overflow = '';
    }

    // ==========================================
    // 1. ADD POSITION MODAL
    // ==========================================

    openAddPositionModal(defaultDepartment = null) {
      const form = document.getElementById('addPositionForm');
      if (form) form.reset();

      // Populate departments
      const depSelect = document.getElementById('posDepartmentSelect');
      const departments = window.OlyvDB.getDepartments();
      depSelect.innerHTML = '<option value="">-- Select or Create Department --</option>';
      departments.forEach(d => {
        depSelect.innerHTML += `<option value="${d.name}" ${defaultDepartment && defaultDepartment.toLowerCase() === d.name.toLowerCase() ? 'selected' : ''}>${d.name} (${d.code})</option>`;
      });
      depSelect.innerHTML += '<option value="__NEW__">+ Create New Department...</option>';

      // Set default date to today
      const today = new Date().toISOString().split('T')[0];
      document.getElementById('posDateOpened').value = today;
      document.getElementById('posTargetTat').value = '30';
      document.getElementById('posCount').value = '1';

      // Reset new department inputs
      document.getElementById('newDeptContainer').classList.add('hidden');
      this.updatePositionIdPreview();

      // Update live dual headcount counters (New vs Replacement)
      const metrics = window.OlyvDB.getMetrics(defaultDepartment);
      const newCountEl = document.getElementById('modalPosNewCount');
      const replCountEl = document.getElementById('modalPosReplCount');
      const newBadgeEl = document.getElementById('modalPosNewBadge');
      const replBadgeEl = document.getElementById('modalPosReplBadge');

      if (newCountEl) newCountEl.textContent = `${metrics.newPositions} New`;
      if (replCountEl) replCountEl.textContent = `${metrics.replacementPositions} Replacement`;
      if (newBadgeEl) newBadgeEl.textContent = `${metrics.newPositions} active`;
      if (replBadgeEl) replBadgeEl.textContent = `${metrics.replacementPositions} active`;

      this.openModal('addPositionModal');
    }

    updatePositionIdPreview() {
      const depSelect = document.getElementById('posDepartmentSelect');
      const customDeptInput = document.getElementById('posCustomDept');
      const jobTitleInput = document.getElementById('posJobTitle');
      const countInput = document.getElementById('posCount');
      const previewEl = document.getElementById('posIdPreview');

      let dept = depSelect.value;
      if (dept === '__NEW__') {
        dept = customDeptInput.value.trim() || 'NewDept';
      }

      const title = jobTitleInput.value.trim() || 'Role';
      const count = parseInt(countInput.value, 10) || 1;

      if (!dept || dept === '__NEW__') {
        previewEl.innerHTML = '<span class="text-slate-400">Select department to preview ID</span>';
        return;
      }

      const { ids, batch } = window.OlyvDB.previewPositionIds(dept, title, count);
      if (ids.length === 1) {
        previewEl.innerHTML = `<span class="font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-200">${ids[0]}</span>`;
      } else {
        previewEl.innerHTML = `<span class="font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-200">${ids[0]}</span> <span class="text-slate-400 text-xs">to</span> <span class="font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-200">${ids[ids.length - 1]}</span> <span class="text-slate-500 font-semibold text-[11px]">(Batch ${batch}, ${count} positions)</span>`;
      }
    }

    handleAddPositionSubmit(e) {
      e.preventDefault();
      const depSelect = document.getElementById('posDepartmentSelect');
      const customDept = document.getElementById('posCustomDept');
      const customCode = document.getElementById('posCustomCode');
      const jobTitle = document.getElementById('posJobTitle').value.trim();
      const type = document.querySelector('input[name="posType"]:checked').value;
      const count = parseInt(document.getElementById('posCount').value, 10) || 1;
      const dateOpened = document.getElementById('posDateOpened').value;
      const targetTat = parseInt(document.getElementById('posTargetTat').value, 10) || 30;

      let department = depSelect.value;
      if (department === '__NEW__') {
        department = customDept.value.trim();
        const code = customCode.value.trim().toUpperCase();
        if (!department) {
          alert('Please specify the new department name.');
          return;
        }
        window.OlyvDB.addDepartment(department, code);
      }

      if (!department || !jobTitle) {
        alert('Please provide both Department and Job Title.');
        return;
      }

      const created = window.OlyvDB.addPositions({
        department,
        jobTitle,
        type,
        count,
        dateOpened,
        status: 'Active',
        targetTat
      });

      this.closeAll();
      window.OlyvApp.showToast(`Successfully created ${created.length} position(s)!`, 'success');
    }

    // ==========================================
    // 2. ADD CANDIDATE MODAL
    // ==========================================

    openAddCandidateModal(currentDepartment = null) {
      const form = document.getElementById('addCandidateForm');
      if (form) form.reset();

      // Populate Departments
      const depSelect = document.getElementById('candDepartmentSelect');
      const departments = window.OlyvDB.getDepartments();
      depSelect.innerHTML = '';
      departments.forEach(d => {
        depSelect.innerHTML += `<option value="${d.name}" ${currentDepartment && currentDepartment.toLowerCase() === d.name.toLowerCase() ? 'selected' : ''}>${d.name}</option>`;
      });

      // Populate Job Titles based on selected department
      this.populateCandidateJobTitles();

      // Today's date default
      document.getElementById('candAppDate').value = new Date().toISOString().split('T')[0];

      this.openModal('addCandidateModal');
    }

    populateCandidateJobTitles() {
      const depSelect = document.getElementById('candDepartmentSelect');
      const jobSelect = document.getElementById('candJobTitleSelect');
      const selectedDept = depSelect.value;

      // Get positions in this department to recommend job titles
      const positions = window.OlyvDB.getPositions({ department: selectedDept, status: 'Active' });
      const titles = Array.from(new Set(positions.map(p => p.jobTitle)));

      jobSelect.innerHTML = '';
      if (titles.length > 0) {
        titles.forEach(t => {
          jobSelect.innerHTML += `<option value="${t}">${t}</option>`;
        });
        jobSelect.innerHTML += '<option value="__CUSTOM__">+ Type Custom Job Title...</option>';
      } else {
        jobSelect.innerHTML = '<option value="__CUSTOM__">+ Type Custom Job Title...</option>';
      }

      this.handleCandidateJobSelectChange();
    }

    handleCandidateJobSelectChange() {
      const jobSelect = document.getElementById('candJobTitleSelect');
      const customContainer = document.getElementById('candCustomJobContainer');
      if (jobSelect.value === '__CUSTOM__') {
        customContainer.classList.remove('hidden');
      } else {
        customContainer.classList.add('hidden');
      }
    }

    handleSourceCategoryChange() {
      const category = document.getElementById('candSourceCategory').value;
      const subLabel = document.getElementById('candSourceSubLabel');
      const internalSelect = document.getElementById('candSubInternal');
      const vendorSelect = document.getElementById('candSubVendor');
      const portalSelect = document.getElementById('candSubPortal');
      const referralInput = document.getElementById('candSubReferral');
      const careerPortalDiv = document.getElementById('candSubCareerPortal');
      const customSourceContainer = document.getElementById('candCustomSourceContainer');

      // Hide all sub-inputs first
      internalSelect.classList.add('hidden');
      vendorSelect.classList.add('hidden');
      portalSelect.classList.add('hidden');
      referralInput.classList.add('hidden');
      careerPortalDiv.classList.add('hidden');
      customSourceContainer.classList.add('hidden');

      if (category === 'Internal Recruiter') {
        subLabel.textContent = 'Select Internal Recruiter *';
        internalSelect.classList.remove('hidden');
      } else if (category === 'External Recruiter') {
        subLabel.textContent = 'Select Vendor / Placement Agency *';
        vendorSelect.classList.remove('hidden');
      } else if (category === 'Job Portal') {
        subLabel.textContent = 'Select Job Board / Sourcing Portal *';
        portalSelect.classList.remove('hidden');
      } else if (category === 'Referral') {
        subLabel.textContent = 'Referral Source Details *';
        referralInput.classList.remove('hidden');
      } else if (category === 'Career Portal') {
        subLabel.textContent = 'Direct Channel Details';
        careerPortalDiv.classList.remove('hidden');
      }
    }

    handleAddCandidateSubmit(e) {
      e.preventDefault();
      const name = document.getElementById('candName').value.trim();
      const email = document.getElementById('candEmail').value.trim();
      const mobile = document.getElementById('candMobile').value.trim();
      const department = document.getElementById('candDepartmentSelect').value;
      const jobSelect = document.getElementById('candJobTitleSelect');
      let jobTitle = jobSelect.value;
      if (jobTitle === '__CUSTOM__') {
        jobTitle = document.getElementById('candCustomJob').value.trim();
      }

      // Sourcing Channel Category & Specific Detail
      const sourceCategory = document.getElementById('candSourceCategory').value;
      let sourceDetail = '';
      let recruiterOwner = 'Unassigned';

      if (sourceCategory === 'Internal Recruiter') {
        const val = document.getElementById('candSubInternal').value;
        sourceDetail = val === '__CUSTOM_REC__' ? (document.getElementById('candCustomSourceInput').value.trim() || 'Internal Recruiter') : val;
        recruiterOwner = sourceDetail;
      } else if (sourceCategory === 'External Recruiter') {
        const val = document.getElementById('candSubVendor').value;
        sourceDetail = val === '__CUSTOM_VEN__' ? (document.getElementById('candCustomSourceInput').value.trim() || 'Agency Vendor') : val;
        recruiterOwner = `Vendor: ${sourceDetail}`;
      } else if (sourceCategory === 'Job Portal') {
        const val = document.getElementById('candSubPortal').value;
        sourceDetail = val === '__CUSTOM_PORTAL__' ? (document.getElementById('candCustomSourceInput').value.trim() || 'Job Portal') : val;
        recruiterOwner = `${sourceDetail} Sourcing`;
      } else if (sourceCategory === 'Referral') {
        sourceDetail = document.getElementById('candSubReferral').value.trim() || 'Employee Referral';
        recruiterOwner = `Ref: ${sourceDetail}`;
      } else {
        sourceDetail = 'Olyv Careers Portal';
        recruiterOwner = 'Inbound Applications';
      }

      const currentCtc = document.getElementById('candCurrentCtc').value.trim();
      const ectc = document.getElementById('candEctc').value.trim();
      const noticePeriod = document.getElementById('candNoticePeriod').value.trim();

      const appDate = document.getElementById('candAppDate').value;
      const status = document.getElementById('candInitialStage').value;
      const remarks = document.getElementById('candInitialRemarks').value.trim();

      if (!name || !department || !jobTitle) {
        alert('Please fill in candidate Name, Department, and Job Title.');
        return;
      }

      const newCand = window.OlyvDB.addCandidate({
        name,
        email,
        mobile,
        department,
        jobTitle,
        source: sourceCategory,
        sourceChannel: sourceCategory,
        sourceDetail,
        currentCtc,
        ectc,
        noticePeriod,
        recruiter: recruiterOwner,
        appDate,
        status,
        remarks: remarks || `Sourced via ${sourceCategory} (${sourceDetail}). Current: ${currentCtc || 'N/A'}, Expected: ${ectc || 'N/A'}, NP: ${noticePeriod || 'N/A'}`
      });

      this.closeAll();
      window.OlyvApp.showToast(`Candidate ${newCand.name} (${newCand.id}) added to ${department}!`, 'success');
    }

    // ==========================================
    // 3. CANDIDATE STAGE PROGRESSION MODAL
    // ==========================================

    openStageProgressionModal(candidateId) {
      try {
        const candidate = window.OlyvDB.getCandidateById(candidateId);
        if (!candidate) return;

        this.currentCandidateForStage = candidate;

        // Fill header info
        const nameEl = document.getElementById('stageModalCandName');
        const roleEl = document.getElementById('stageModalCandRole');
        const idEl = document.getElementById('stageModalCandId');
        const badgeEl = document.getElementById('stageModalCurrentBadge');

        if (nameEl) nameEl.textContent = candidate.name;
        if (roleEl) roleEl.textContent = `${candidate.jobTitle} • ${candidate.department}`;
        if (idEl) idEl.textContent = candidate.id;
        if (badgeEl) {
          badgeEl.textContent = candidate.status;
          const badgeClass = (window.OlyvApp && typeof window.OlyvApp.getBadgeClasses === 'function')
            ? window.OlyvApp.getBadgeClasses(candidate.status)
            : 'bg-blue-100 text-blue-800';
          badgeEl.className = `px-2.5 py-1 text-xs font-semibold rounded-full ${badgeClass}`;
        }

        // Setup stage dropdown
        const stageSelect = document.getElementById('stageProgressionSelect');
        if (stageSelect) stageSelect.value = candidate.status;

        // Interview Date
        const interviewDateEl = document.getElementById('stageInterviewDate');
        if (interviewDateEl) interviewDateEl.value = new Date().toISOString().split('T')[0];

        const notesEl = document.getElementById('stageNotes');
        if (notesEl) notesEl.value = '';

        // Reset decision radio to Selected
        const defaultDecision = document.querySelector('input[name="stageDecision"][value="Selected"]');
        if (defaultDecision) defaultDecision.checked = true;

        // Offer Fields setup
        const offerDateInput = document.getElementById('stageOfferDate');
        const dojInput = document.getElementById('stageDoj');

        const breakdown = candidate.offerBreakdown || {};
        const fixedEl = document.getElementById('stageFixedCtc');
        const varEl = document.getElementById('stageVariableCtc');
        const esopEl = document.getElementById('stageEsops');
        const jbEl = document.getElementById('stageJoiningBonus');
        const rbEl = document.getElementById('stageRetentionBonus');
        const ctcEl = document.getElementById('stageCtc');

        if (fixedEl) fixedEl.value = breakdown.fixed || '';
        if (varEl) varEl.value = breakdown.variable || '';
        if (esopEl) esopEl.value = breakdown.esops || '';
        if (jbEl) jbEl.value = breakdown.joiningBonus || '';
        if (rbEl) rbEl.value = breakdown.retentionBonus || '';
        if (ctcEl) ctcEl.value = candidate.ctc || '';

        this.recalculateStageCtc();

        if (offerDateInput) offerDateInput.value = candidate.offerDate || new Date().toISOString().split('T')[0];
        if (dojInput) dojInput.value = candidate.expectedDoj || '';

        if (stageSelect) this.checkStageOfferVisibility(stageSelect.value);

        // Render Stage Remarks History
        this.renderStageRemarksHistory(candidate);

        this.openModal('stageProgressionModal');
      } catch (err) {
        console.error('Error opening Stage Progression Modal:', err);
      }
    }

    recalculateStageCtc() {
      const fixed = parseFloat(document.getElementById('stageFixedCtc').value) || 0;
      const variable = parseFloat(document.getElementById('stageVariableCtc').value) || 0;
      const esops = parseFloat(document.getElementById('stageEsops').value) || 0;
      const joiningBonus = parseFloat(document.getElementById('stageJoiningBonus').value) || 0;
      const retentionBonus = parseFloat(document.getElementById('stageRetentionBonus').value) || 0;

      const totalLpa = fixed + variable + joiningBonus + retentionBonus;
      const totalDisplay = totalLpa > 0 ? `₹${totalLpa.toFixed(1)} LPA${esops > 0 ? ` (+₹${esops}L ESOPs)` : ''}` : '₹0 LPA';
      const calculatedBadge = document.getElementById('stageCalculatedTotalCtc');
      if (calculatedBadge) calculatedBadge.textContent = totalDisplay;

      document.getElementById('stageCtc').value = totalLpa > 0 ? `₹${totalLpa.toFixed(1)} LPA` : '';
    }

    checkStageOfferVisibility(stage) {
      const offerSection = document.getElementById('stageOfferDetailsSection');
      if (stage === 'Offered' || stage === 'Joined' || stage === 'Preboarding') {
        offerSection.classList.remove('hidden');
      } else {
        offerSection.classList.add('hidden');
      }
    }

    renderStageRemarksHistory(candidate) {
      const container = document.getElementById('stageRemarksHistory');
      if (!container) return;

      if (!Array.isArray(candidate.remarks) || candidate.remarks.length === 0) {
        container.innerHTML = '<p class="text-xs text-slate-400 italic">No previous stage logs recorded.</p>';
        return;
      }

      let html = '<div class="space-y-3 relative before:absolute before:inset-0 before:left-2.5 before:w-0.5 before:bg-slate-200">';
      const reversedLogs = [...candidate.remarks].reverse();

      reversedLogs.forEach(log => {
        const timeFormatted = log.timestamp ? new Date(log.timestamp).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        }) : '';

        const badgeClass = log.decision === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700';

        html += `
          <div class="relative flex items-start space-x-3 text-xs">
            <div class="h-5 w-5 rounded-full bg-slate-900 border-2 border-white shadow-sm flex items-center justify-center text-[10px] text-white flex-shrink-0 z-10">
              ✓
            </div>
            <div class="bg-white border border-slate-200 rounded-lg p-2.5 flex-1 shadow-2xs">
              <div class="flex items-center justify-between font-semibold text-slate-800 mb-1">
                <span>Stage: <strong class="text-blue-600">${log.stage}</strong></span>
                <span class="px-1.5 py-0.5 rounded text-[10px] ${badgeClass}">${log.decision || 'Logged'}</span>
              </div>
              <p class="text-slate-600 mb-1 leading-relaxed">${log.note || 'No notes added.'}</p>
              ${log.interviewDate ? `<div class="text-[10px] text-slate-500">Interview Date: ${log.interviewDate}</div>` : ''}
              <div class="text-[10px] text-slate-400 mt-1">${timeFormatted}</div>
            </div>
          </div>
        `;
      });

      html += '</div>';
      container.innerHTML = html;
    }

    handleStageProgressionSubmit(e) {
      e.preventDefault();
      if (!this.currentCandidateForStage) return;

      const newStage = document.getElementById('stageProgressionSelect').value;
      const decisionEl = document.querySelector('input[name="stageDecision"]:checked');
      const decision = decisionEl ? decisionEl.value : 'Selected';
      const notes = document.getElementById('stageNotes').value.trim();
      const interviewDate = document.getElementById('stageInterviewDate').value;

      let ctc = null;
      let expectedDoj = null;
      let offerDate = null;
      let offerBreakdown = null;

      if (newStage === 'Offered' || newStage === 'Joined' || newStage === 'Preboarding') {
        const fixed = parseFloat(document.getElementById('stageFixedCtc').value) || 0;
        const variable = parseFloat(document.getElementById('stageVariableCtc').value) || 0;
        const esops = parseFloat(document.getElementById('stageEsops').value) || 0;
        const joiningBonus = parseFloat(document.getElementById('stageJoiningBonus').value) || 0;
        const retentionBonus = parseFloat(document.getElementById('stageRetentionBonus').value) || 0;

        offerBreakdown = {
          fixed,
          variable,
          esops,
          joiningBonus,
          retentionBonus,
          totalCtc: fixed + variable + joiningBonus + retentionBonus
        };

        ctc = document.getElementById('stageCtc').value.trim() || `₹${offerBreakdown.totalCtc} LPA`;
        expectedDoj = document.getElementById('stageDoj').value;
        offerDate = document.getElementById('stageOfferDate').value;
      }

      window.OlyvDB.updateCandidateStage(this.currentCandidateForStage.id, {
        newStage,
        decision,
        notes: notes || `Transitioned to ${newStage}`,
        interviewDate,
        ctc,
        expectedDoj,
        offerDate,
        offerBreakdown
      });

      this.closeAll();
      window.OlyvApp.showToast(`Stage updated to "${newStage}" for ${this.currentCandidateForStage.name}!`, 'success');
    }

    // ==========================================
    // 4. BULK UPLOAD MODAL
    // ==========================================

    openBulkUploadModal() {
      const textarea = document.getElementById('bulkUploadTextarea');
      if (textarea) textarea.value = '';
      document.getElementById('bulkPreviewContainer').classList.add('hidden');
      document.getElementById('bulkImportBtn').disabled = true;
      document.getElementById('bulkCountBadge').textContent = '0 candidates parsed';
      this.parsedBulkRecords = [];
      this.openModal('bulkUploadModal');
    }

    parseBulkText() {
      const text = document.getElementById('bulkUploadTextarea').value.trim();
      const previewContainer = document.getElementById('bulkPreviewContainer');
      const previewBody = document.getElementById('bulkPreviewBody');
      const importBtn = document.getElementById('bulkImportBtn');
      const countBadge = document.getElementById('bulkCountBadge');

      if (!text) {
        previewContainer.classList.add('hidden');
        importBtn.disabled = true;
        countBadge.textContent = '0 candidates parsed';
        this.parsedBulkRecords = [];
        return;
      }

      // Split lines
      const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length === 0) return;

      // Determine delimiter (tab or comma)
      const firstLine = lines[0];
      const delimiter = firstLine.includes('\t') ? '\t' : ',';

      let startIdx = 0;
      let headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase());

      // Check if header exists
      const hasHeader = headers.some(h => ['name', 'candidate', 'email', 'department', 'job', 'role'].includes(h));
      if (hasHeader) {
        startIdx = 1;
      }

      const records = [];
      const departments = window.OlyvDB.getDepartments().map(d => d.name.toLowerCase());

      for (let i = startIdx; i < lines.length; i++) {
        const parts = lines[i].split(delimiter).map(p => p.trim());
        if (parts.length === 0 || !parts[0]) continue;

        // Smart column mapping: Name, Email, Mobile, Department, JobTitle, Source, Recruiter, Status
        const name = parts[0] || '';
        const email = parts[1] || '';
        const mobile = parts[2] || '';
        let department = parts[3] || 'Engineering';
        const jobTitle = parts[4] || 'Specialist';
        const source = parts[5] || 'Direct';
        const recruiter = parts[6] || 'Unassigned';
        const status = parts[7] || 'Shortlisted';

        const isValid = name.length > 0 && email.includes('@');

        records.push({
          name,
          email,
          mobile,
          department,
          jobTitle,
          source,
          recruiter,
          status,
          isValid
        });
      }

      this.parsedBulkRecords = records;
      const validCount = records.filter(r => r.isValid).length;

      countBadge.textContent = `${validCount} valid / ${records.length} total rows parsed`;
      importBtn.disabled = validCount === 0;

      // Populate preview table
      previewBody.innerHTML = '';
      records.slice(0, 8).forEach(r => {
        previewBody.innerHTML += `
          <tr class="border-b border-slate-100 text-xs ${r.isValid ? 'text-slate-700' : 'text-red-500 bg-red-50/50'}">
            <td class="px-3 py-2 font-medium">${r.name}</td>
            <td class="px-3 py-2">${r.email}</td>
            <td class="px-3 py-2">${r.department}</td>
            <td class="px-3 py-2">${r.jobTitle}</td>
            <td class="px-3 py-2">${r.source}</td>
            <td class="px-3 py-2">
              <span class="px-2 py-0.5 rounded text-[10px] ${r.isValid ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700 font-semibold'}">
                ${r.isValid ? 'Valid' : 'Invalid Email'}
              </span>
            </td>
          </tr>
        `;
      });

      if (records.length > 8) {
        previewBody.innerHTML += `
          <tr class="text-xs text-slate-400 italic">
            <td colspan="6" class="px-3 py-2 text-center">+ ${records.length - 8} more candidates...</td>
          </tr>
        `;
      }

      previewContainer.classList.remove('hidden');
    }

    insertSampleBulkData() {
      const sample = `Name\tEmail\tMobile\tDepartment\tJob Title\tSource\tRecruiter\tStatus
Pravin Sharma\tpravin.sharma@example.com\t+91 98210 33810\tEngineering\tSDE 1 (Frontend)\tLinkedIn\tAnanya Sharma\tShortlisted
Sneha Patel\tsneha.patel@example.com\t+91 99102 44921\tFinance\tSenior Financial Analyst\tReferral\tVikram Malhotra\tRound 1
Arjun Nambiar\tarjun.n@example.com\t+91 98450 66712\tProduct\tProduct Designer (UI/UX)\tNaukri\tPriya Nair\tRound 2
Kavita Iyer\tkavita.iyer@example.com\t+91 98110 88231\tRisk\tFraud Risk Analyst\tDirect\tRohan Verma\tShortlisted`;

      const textarea = document.getElementById('bulkUploadTextarea');
      textarea.value = sample;
      this.parseBulkText();
    }

    handleBulkImportSubmit() {
      if (!this.parsedBulkRecords || this.parsedBulkRecords.length === 0) return;

      const validOnly = this.parsedBulkRecords.filter(r => r.isValid);
      const inserted = window.OlyvDB.bulkAddCandidates(validOnly);

      this.closeAll();
      window.OlyvApp.showToast(`Imported ${inserted.length} candidates successfully!`, 'success');
    }



    // ==========================================
    // 6. UPDATE DATE OF JOINING (DOJ) MODAL
    // ==========================================

    openUpdateDojModal(candidateId) {
      const candidate = window.OlyvDB.getCandidateById(candidateId);
      if (!candidate) return;

      this.currentCandidateForDoj = candidate;

      document.getElementById('dojModalCandName').textContent = candidate.name;
      document.getElementById('dojModalCandRole').textContent = `${candidate.jobTitle} • ${candidate.department}`;
      document.getElementById('dojModalCurrentDoj').textContent = candidate.expectedDoj || 'Not set';

      const newDateInput = document.getElementById('dojModalNewDate');
      newDateInput.value = candidate.expectedDoj || new Date().toISOString().split('T')[0];

      document.getElementById('dojReasonCategory').value = 'Early Joining - Notice Buyout';
      document.getElementById('dojCustomNotes').value = '';
      this.detectDojEarlyLateDifference();

      // Render DOJ History Timeline
      this.renderDojHistoryList(candidate);

      this.openModal('updateDojModal');
    }

    detectDojEarlyLateDifference() {
      const candidate = this.currentCandidateForDoj;
      const badge = document.getElementById('dojDeltaBadge');
      if (!candidate || !badge) return;

      const currentDojStr = candidate.expectedDoj;
      const newDojStr = document.getElementById('dojModalNewDate').value;

      if (!currentDojStr || !newDojStr) {
        badge.innerHTML = '';
        return;
      }

      const curr = new Date(currentDojStr);
      const next = new Date(newDojStr);
      const diffDays = Math.round((next - curr) / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        const earlyDays = Math.abs(diffDays);
        badge.innerHTML = `<span class="inline-flex items-center px-2 py-0.5 rounded text-emerald-800 bg-emerald-100 border border-emerald-200">🟢 Candidate Joining EARLY by ${earlyDays} day${earlyDays > 1 ? 's' : ''}!</span>`;
        // Auto-select early joining reason if default
        const reasonSelect = document.getElementById('dojReasonCategory');
        if (reasonSelect && reasonSelect.value.startsWith('Delayed')) {
          reasonSelect.value = 'Early Joining - Notice Buyout';
        }
      } else if (diffDays > 0) {
        badge.innerHTML = `<span class="inline-flex items-center px-2 py-0.5 rounded text-amber-800 bg-amber-100 border border-amber-200">🟡 Joining DELAYED by ${diffDays} day${diffDays > 1 ? 's' : ''}</span>`;
        const reasonSelect = document.getElementById('dojReasonCategory');
        if (reasonSelect && reasonSelect.value.startsWith('Early')) {
          reasonSelect.value = 'Delayed - Notice Extension';
        }
      } else {
        badge.innerHTML = `<span class="text-slate-400">Same as current date of joining</span>`;
      }
    }

    renderDojHistoryList(candidate) {
      const container = document.getElementById('dojModalHistoryList');
      if (!container) return;

      const history = Array.isArray(candidate.dojHistory) ? candidate.dojHistory : [];

      if (history.length === 0) {
        container.innerHTML = '<p class="text-xs text-slate-400 italic">No previous DOJ modifications recorded.</p>';
        return;
      }

      let html = '<div class="space-y-2">';
      [...history].reverse().forEach(item => {
        const dateFormatted = item.timestamp ? new Date(item.timestamp).toLocaleString('en-US', {
          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        }) : '';

        const typeBadge = item.type === 'Early'
          ? '<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">Early</span>'
          : item.type === 'Delayed'
          ? '<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">Delayed</span>'
          : '<span class="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-200 text-slate-700">Initial</span>';

        html += `
          <div class="p-2 bg-white rounded-lg border border-slate-200 text-xs">
            <div class="flex items-center justify-between text-[11px] mb-1">
              <div class="flex items-center space-x-1.5">
                ${typeBadge}
                <span class="font-mono font-bold text-slate-800">${item.previousDoj ? `${item.previousDoj} ➔ ` : ''}${item.newDoj}</span>
              </div>
              <span class="text-slate-400 text-[10px]">${dateFormatted}</span>
            </div>
            <div class="text-slate-600 text-[11px]">
              <strong>Reason:</strong> ${item.reason || item.reasonCategory || 'Not specified'}
            </div>
          </div>
        `;
      });
      html += '</div>';

      container.innerHTML = html;
    }

    handleUpdateDojSubmit(e) {
      e.preventDefault();
      if (!this.currentCandidateForDoj) return;

      const newDoj = document.getElementById('dojModalNewDate').value;
      const reasonCategory = document.getElementById('dojReasonCategory').value;
      const customReason = document.getElementById('dojCustomNotes').value.trim();

      if (!newDoj) {
        alert('Please specify a valid Date of Joining.');
        return;
      }

      window.OlyvDB.updateCandidateDoj(this.currentCandidateForDoj.id, {
        newDoj,
        reasonCategory,
        customReason
      });

      this.closeAll();
      window.OlyvApp.showToast(`Updated DOJ for ${this.currentCandidateForDoj.name} to ${newDoj}`, 'success');
    }

    // ==========================================
    // 7. QUICK OFFER MODAL (KANBAN DRAG-TO-OFFER)
    // ==========================================

    openQuickOfferModal(candidateId) {
      const candidate = window.OlyvDB.getCandidateById(candidateId);
      if (!candidate) return;

      this.currentCandidateForOffer = candidate;

      document.getElementById('quickOfferCandName').textContent = candidate.name;
      document.getElementById('quickOfferCandRole').textContent = `${candidate.jobTitle} • ${candidate.department}`;

      const breakdown = candidate.offerBreakdown || {};
      document.getElementById('quickOfferFixed').value = breakdown.fixed || '';
      document.getElementById('quickOfferVariable').value = breakdown.variable || '';
      document.getElementById('quickOfferEsops').value = breakdown.esops || '';
      document.getElementById('quickOfferJoiningBonus').value = breakdown.joiningBonus || '';
      document.getElementById('quickOfferRetentionBonus').value = breakdown.retentionBonus || '';

      this.recalculateQuickOfferCtc();

      document.getElementById('quickOfferDate').value = candidate.offerDate || new Date().toISOString().split('T')[0];

      // Default expected DOJ to 30 days from today
      const defaultDoj = new Date();
      defaultDoj.setDate(defaultDoj.getDate() + 30);
      document.getElementById('quickOfferDoj').value = candidate.expectedDoj || defaultDoj.toISOString().split('T')[0];
      document.getElementById('quickOfferNotes').value = '';

      this.openModal('quickOfferModal');
    }

    recalculateQuickOfferCtc() {
      const fixed = parseFloat(document.getElementById('quickOfferFixed').value) || 0;
      const variable = parseFloat(document.getElementById('quickOfferVariable').value) || 0;
      const esops = parseFloat(document.getElementById('quickOfferEsops').value) || 0;
      const joiningBonus = parseFloat(document.getElementById('quickOfferJoiningBonus').value) || 0;
      const retentionBonus = parseFloat(document.getElementById('quickOfferRetentionBonus').value) || 0;

      const totalLpa = fixed + variable + joiningBonus + retentionBonus;
      const totalDisplay = totalLpa > 0 ? `₹${totalLpa.toFixed(1)} LPA${esops > 0 ? ` (+₹${esops}L ESOPs)` : ''}` : '₹0 LPA';
      const badge = document.getElementById('quickOfferCalculatedTotal');
      if (badge) badge.textContent = totalDisplay;
    }

    handleQuickOfferSubmit(e) {
      e.preventDefault();
      if (!this.currentCandidateForOffer) return;

      const fixed = parseFloat(document.getElementById('quickOfferFixed').value) || 0;
      const variable = parseFloat(document.getElementById('quickOfferVariable').value) || 0;
      const esops = parseFloat(document.getElementById('quickOfferEsops').value) || 0;
      const joiningBonus = parseFloat(document.getElementById('quickOfferJoiningBonus').value) || 0;
      const retentionBonus = parseFloat(document.getElementById('quickOfferRetentionBonus').value) || 0;

      if (!fixed || fixed <= 0) {
        alert('Please specify at least Fixed Base CTC.');
        return;
      }

      const offerBreakdown = {
        fixed,
        variable,
        esops,
        joiningBonus,
        retentionBonus,
        totalCtc: fixed + variable + joiningBonus + retentionBonus
      };

      const ctc = `₹${offerBreakdown.totalCtc.toFixed(1)} LPA`;
      const offerDate = document.getElementById('quickOfferDate').value;
      const expectedDoj = document.getElementById('quickOfferDoj').value;
      const notes = document.getElementById('quickOfferNotes').value.trim();

      if (!expectedDoj) {
        alert('Please provide Expected DOJ.');
        return;
      }

      window.OlyvDB.updateCandidateStage(this.currentCandidateForOffer.id, {
        newStage: 'Offered',
        decision: 'Offer Extended',
        notes: notes || `Offered ${ctc} with joining date ${expectedDoj}`,
        ctc,
        offerDate,
        expectedDoj,
        offerBreakdown
      });

      this.closeAll();
      window.OlyvApp.showToast(`Offer recorded for ${this.currentCandidateForOffer.name}! Added to Offers & DOJ Tracker.`, 'success');
    }

    // ==========================================
    // 8. ACTIVE POSITIONS KPI DRILLDOWN MODAL
    // ==========================================

    openKpiPositionsModal(filterType = 'ALL') {
      const positions = window.OlyvDB.getPositions(
        window.OlyvApp.currentDepartment ? { department: window.OlyvApp.currentDepartment } : {}
      );

      const titleEl = document.getElementById('kpiPositionsModalTitle');
      const countEl = document.getElementById('kpiPositionsModalCount');
      const tbody = document.getElementById('kpiPositionsModalBody');
      if (!tbody) return;

      let filtered = positions;
      if (filterType === 'TYPES') {
        titleEl.textContent = 'Active Requisitions by Type';
      } else if (filterType === 'TAT') {
        titleEl.textContent = 'Active Requisitions - Turnaround Performance';
      } else {
        titleEl.textContent = 'Current Open Positions';
      }

      countEl.textContent = `${filtered.length} Open Requisitions`;

      const today = new Date();
      tbody.innerHTML = '';

      if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="px-4 py-8 text-center text-slate-400">No open positions found.</td></tr>`;
      } else {
        filtered.forEach(p => {
          const openDate = new Date(p.dateOpened || '2026-08-01');
          const daysOpen = Math.max(1, Math.round((today - openDate) / (1000 * 60 * 60 * 24)));
          const targetTat = p.targetTat || 30;

          let tatBadge = daysOpen > targetTat
            ? `<span class="px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800">Breached (${daysOpen}d / ${targetTat}d)</span>`
            : daysOpen >= targetTat * 0.75
            ? `<span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800">Approaching (${daysOpen}d / ${targetTat}d)</span>`
            : `<span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">On Track (${daysOpen}d / ${targetTat}d)</span>`;

          tbody.innerHTML += `
            <tr class="hover:bg-slate-50 transition-colors">
              <td class="px-3 py-2 font-mono font-bold text-slate-900">${p.id}</td>
              <td class="px-3 py-2 font-medium text-slate-800">${p.jobTitle}</td>
              <td class="px-3 py-2 text-slate-600">${p.department}</td>
              <td class="px-3 py-2">
                <span class="px-1.5 py-0.5 rounded text-[10px] font-semibold ${p.type === 'New' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}">${p.type}</span>
              </td>
              <td class="px-3 py-2 font-mono text-slate-600">${p.dateOpened || '2026-08-01'}</td>
              <td class="px-3 py-2">${tatBadge}</td>
              <td class="px-3 py-2 text-right">
                <button onclick="window.OlyvModals.closeAll(); window.OlyvApp.switchTab('tab-positions');"
                  class="text-blue-600 hover:text-blue-800 font-semibold text-xs">View Log ➔</button>
              </td>
            </tr>
          `;
        });
      }

      this.openModal('kpiPositionsModal');
    }

    // ==========================================
    // 6. RECRUITER AUTH / ACCESS MANAGEMENT MODAL
    // ==========================================

    openRecruiterAuthModal() {
      const errEl = document.getElementById('authErrorMessage');
      if (errEl) errEl.classList.add('hidden');
      this.openModal('recruiterAuthModal');
    }

    async handleRecruiterAuthSubmit(e) {
      e.preventDefault();
      const form = e.target;
      const isRegister = form.dataset.mode === 'register';
      const email = document.getElementById('authEmail').value.trim();
      const password = document.getElementById('authPassword').value;
      const displayName = document.getElementById('authDisplayName') ? document.getElementById('authDisplayName').value.trim() : '';
      const role = document.getElementById('authRole') ? document.getElementById('authRole').value : 'Recruiter';
      const errEl = document.getElementById('authErrorMessage');
      const submitBtn = document.getElementById('authSubmitBtn');

      if (errEl) errEl.classList.add('hidden');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = isRegister ? 'Creating Account...' : 'Signing In...';
      }

      try {
        if (!window.OlyvFirebase || !window.OlyvFirebase.isOnline) {
          throw new Error('Firebase Cloud Service is currently in local offline mode. Please check network connection.');
        }

        if (isRegister) {
          await window.OlyvFirebase.registerRecruiter(email, password, displayName || email.split('@')[0], role);
          window.OlyvApp.showToast(`Recruiter account created for ${email}!`, 'success');
        } else {
          await window.OlyvFirebase.login(email, password);
          window.OlyvApp.showToast(`Welcome back, ${email}! Cloud sync active.`, 'success');
        }
        this.closeAll();
      } catch (err) {
        console.error('Auth error:', err);
        if (errEl) {
          errEl.textContent = err.message || 'Authentication failed. Please verify credentials.';
          errEl.classList.remove('hidden');
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = isRegister ? 'Create Recruiter Account' : 'Sign In';
        }
      }
    }

    switchAuthMode(mode) {
      const form = document.getElementById('recruiterAuthForm');
      const title = document.getElementById('authModalTitle');
      const submitBtn = document.getElementById('authSubmitBtn');
      const regFields = document.getElementById('authRegisterFields');
      const switchText = document.getElementById('authSwitchText');
      const errEl = document.getElementById('authErrorMessage');

      if (errEl) errEl.classList.add('hidden');

      if (mode === 'register') {
        form.dataset.mode = 'register';
        title.textContent = 'Add Recruiter / Team Member';
        submitBtn.textContent = 'Create Recruiter Account';
        if (regFields) regFields.classList.remove('hidden');
        if (switchText) {
          switchText.innerHTML = `Already have an account? <a href="#" onclick="window.OlyvModals.switchAuthMode('login'); return false;" class="text-blue-600 font-semibold hover:underline">Sign In here</a>`;
        }
      } else {
        form.dataset.mode = 'login';
        title.textContent = 'Recruiter Cloud Sign-In';
        submitBtn.textContent = 'Sign In';
        if (regFields) regFields.classList.add('hidden');
        if (switchText) {
          switchText.innerHTML = `Need to add a recruiter? <a href="#" onclick="window.OlyvModals.switchAuthMode('register'); return false;" class="text-blue-600 font-semibold hover:underline">Register recruiter account</a>`;
        }
      }
    }
  }

  window.OlyvModals = new OlyvModals();
})(window);

