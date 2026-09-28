/**
 * OLYV ATS - Main Application Controller
 * Single Page Application routing, reactive rendering, filters, and UI state
 */

(function (window) {
  'use strict';

  class OlyvApp {
    constructor() {
      this.currentDepartment = null; // null = Company Overview
      this.currentTab = 'tab-analytics';
      this.searchQuery = '';
      this.stageFilter = 'ALL';
      this.sourceFilter = 'ALL';
      this.recruiterFilter = 'ALL';
      this.pipelineViewMode = 'board'; // 'board' | 'table'

      this.init();
    }

    init() {
      // Subscribe to DB events for instantaneous reactive re-rendering
      window.OlyvDB.on('change', () => {
        this.renderAll();
      });

      // Bind global UI listeners
      this.bindEvents();

      // Initial Render
      this.renderAll();
    }

    /**
     * Filter pipeline by clicking on funnel bar
     */
    filterByFunnelStage(stage) {
      this.switchTab('tab-pipeline');
      this.setPipelineViewMode('table');
      const stageSelect = document.getElementById('tableStageFilter');
      if (stageSelect) {
        stageSelect.value = stage;
      }
      this.stageFilter = stage;
      this.renderCandidateTable();
      this.showToast(`Filtered candidates by stage: ${stage}`, 'info');
    }

    bindEvents() {
      // Tab switching
      const tabBtns = document.querySelectorAll('[data-tab-target]');
      tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const target = btn.getAttribute('data-tab-target');
          this.switchTab(target);
        });
      });

      // Global Search input
      const searchInput = document.getElementById('globalSearchInput');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          this.searchQuery = e.target.value.trim();
          this.renderCandidateTable();
        });
      }

      // Department filter select for candidates table (when in overview)
      const tableDeptFilter = document.getElementById('tableDeptFilter');
      if (tableDeptFilter) {
        tableDeptFilter.addEventListener('change', () => {
          this.renderCandidateTable();
        });
      }

      // Stage filter
      const stageFilterEl = document.getElementById('tableStageFilter');
      if (stageFilterEl) {
        stageFilterEl.addEventListener('change', (e) => {
          this.stageFilter = e.target.value;
          this.renderCandidateTable();
        });
      }

      // Source filter
      const sourceFilterEl = document.getElementById('tableSourceFilter');
      if (sourceFilterEl) {
        sourceFilterEl.addEventListener('change', (e) => {
          this.sourceFilter = e.target.value;
          this.renderCandidateTable();
        });
      }

      // TAT Chart Timeframe Buttons
      const timeBtns = document.querySelectorAll('[data-tat-days]');
      timeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          timeBtns.forEach(b => b.classList.remove('bg-blue-600', 'text-white', 'shadow-xs'));
          timeBtns.forEach(b => b.classList.add('bg-white', 'text-slate-600'));
          btn.classList.remove('bg-white', 'text-slate-600');
          btn.classList.add('bg-blue-600', 'text-white', 'shadow-xs');

          const days = parseInt(btn.getAttribute('data-tat-days'), 10);
          window.OlyvCharts.setTimeframe(days, this.currentDepartment);
        });
      });

      // Position Department select change (for custom dept toggle & ID preview)
      const posDeptSelect = document.getElementById('posDepartmentSelect');
      if (posDeptSelect) {
        posDeptSelect.addEventListener('change', (e) => {
          const customContainer = document.getElementById('newDeptContainer');
          if (e.target.value === '__NEW__') {
            customContainer.classList.remove('hidden');
          } else {
            customContainer.classList.add('hidden');
          }
          window.OlyvModals.updatePositionIdPreview();
        });
      }

      // Inputs affecting position ID preview
      ['posJobTitle', 'posCount', 'posCustomDept'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.addEventListener('input', () => window.OlyvModals.updatePositionIdPreview());
        }
      });

      // Candidate modal department change
      const candDeptSelect = document.getElementById('candDepartmentSelect');
      if (candDeptSelect) {
        candDeptSelect.addEventListener('change', () => {
          window.OlyvModals.populateCandidateJobTitles();
        });
      }

      // Candidate custom job toggle
      const candJobSelect = document.getElementById('candJobTitleSelect');
      if (candJobSelect) {
        candJobSelect.addEventListener('change', () => {
          window.OlyvModals.handleCandidateJobSelectChange();
        });
      }

      // Candidate stage change in modal (dynamic offer reveal)
      const stageSelect = document.getElementById('stageProgressionSelect');
      if (stageSelect) {
        stageSelect.addEventListener('change', (e) => {
          window.OlyvModals.checkStageOfferVisibility(e.target.value);
        });
      }

      // Bulk Upload Live Parse
      const bulkTextarea = document.getElementById('bulkUploadTextarea');
      if (bulkTextarea) {
        bulkTextarea.addEventListener('input', () => {
          window.OlyvModals.parseBulkText();
        });
      }

    }

    /**
     * Master render function for current context
     */
    renderAll() {
      this.renderSidebar();
      this.renderHeader();
      this.renderKpiCards();

      // Render active tab view
      if (this.currentTab === 'tab-analytics') {
        window.OlyvCharts.renderAll(this.currentDepartment);
      } else if (this.currentTab === 'tab-pipeline') {
        this.renderCandidateTable();
      } else if (this.currentTab === 'tab-offers') {
        this.renderOffersTable();
      } else if (this.currentTab === 'tab-positions') {
        this.renderPositionsTable();
      }
    }

    // ==========================================
    // SIDEBAR & NAVIGATION
    // ==========================================

    selectDepartment(deptName) {
      this.currentDepartment = deptName; // null if company overview
      this.renderAll();
    }

    renderSidebar() {
      const depListContainer = document.getElementById('sidebarDepartmentList');
      const overviewBtn = document.getElementById('sidebarOverviewBtn');
      const overviewCountBadge = document.getElementById('overviewCountBadge');

      if (!depListContainer) return;

      const departments = window.OlyvDB.getDepartments();
      const allPositions = window.OlyvDB.getPositions();
      const allCandidates = window.OlyvDB.getCandidates();

      if (overviewCountBadge) {
        overviewCountBadge.textContent = `${allPositions.length} Pos • ${allCandidates.length} Cand`;
      }

      // Update Company Overview button active style
      if (this.currentDepartment === null) {
        overviewBtn.className = 'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium bg-blue-600 text-white shadow-xs transition-colors duration-150';
      } else {
        overviewBtn.className = 'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors duration-150';
      }

      // Generate dynamic department list
      depListContainer.innerHTML = '';
      departments.forEach(dept => {
        const isActive = this.currentDepartment && this.currentDepartment.toLowerCase() === dept.name.toLowerCase();
        const posCount = allPositions.filter(p => p.department.toLowerCase() === dept.name.toLowerCase()).length;
        const candCount = allCandidates.filter(c => c.department.toLowerCase() === dept.name.toLowerCase()).length;

        const itemClass = isActive
          ? 'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white shadow-xs transition-colors'
          : 'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors';

        depListContainer.innerHTML += `
          <button onclick="window.OlyvApp.selectDepartment('${dept.name}')" class="${itemClass}">
            <div class="flex items-center space-x-2.5 truncate">
              <span class="w-2 h-2 rounded-full ${isActive ? 'bg-white' : 'bg-slate-500'}"></span>
              <span class="truncate">${dept.name}</span>
            </div>
            <div class="flex items-center space-x-1.5 text-[11px] font-mono">
              <span class="px-1.5 py-0.5 rounded ${isActive ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-300'}" title="${posCount} Positions">${posCount}P</span>
              <span class="px-1.5 py-0.5 rounded ${isActive ? 'bg-blue-800 text-blue-100' : 'bg-slate-800/60 text-slate-400'}" title="${candCount} Candidates">${candCount}C</span>
            </div>
          </button>
        `;
      });
    }

    // ==========================================
    // HEADER & CONTEXTUAL ACTIONS
    // ==========================================

    renderHeader() {
      const headerTitle = document.getElementById('headerTitle');
      const headerSubtitle = document.getElementById('headerSubtitle');
      const addPositionBtn = document.getElementById('headerAddPositionBtn');
      const addCandidateBtn = document.getElementById('headerAddCandidateBtn');

      if (this.currentDepartment === null) {
        headerTitle.textContent = 'Company Overview Dashboard';
        headerSubtitle.textContent = 'Real-time hiring intelligence and enterprise talent acquisition pipeline';
        if (addPositionBtn) {
          addPositionBtn.classList.remove('hidden');
          addPositionBtn.setAttribute('onclick', 'window.OlyvModals.openAddPositionModal()');
        }
        if (addCandidateBtn) addCandidateBtn.classList.add('hidden');
      } else {
        headerTitle.textContent = `${this.currentDepartment} Dashboard`;
        headerSubtitle.textContent = `Active requisitions, candidate funnel, and hiring speed for ${this.currentDepartment}`;
        // Show BOTH Add Position and Add Candidate for each department
        if (addPositionBtn) {
          addPositionBtn.classList.remove('hidden');
          addPositionBtn.setAttribute('onclick', `window.OlyvModals.openAddPositionModal('${this.currentDepartment}')`);
        }
        if (addCandidateBtn) {
          addCandidateBtn.classList.remove('hidden');
          addCandidateBtn.setAttribute('onclick', `window.OlyvModals.openAddCandidateModal('${this.currentDepartment}')`);
        }
      }
    }

    // ==========================================
    // TOP 5 KPI CARDS
    // ==========================================

    renderKpiCards() {
      const metrics = window.OlyvDB.getMetrics(this.currentDepartment);

      // Card 1: Total Positions Count
      const totalPosEl = document.getElementById('kpiTotalPositions');
      if (totalPosEl) totalPosEl.textContent = metrics.totalPositions;

      // Card 2: Position Types Breakdown (Explicit separate line items)
      const newPosEl = document.getElementById('kpiNewPositions');
      const replPosEl = document.getElementById('kpiReplPositions');
      const typeBarNew = document.getElementById('kpiTypeBarNew');
      const typeBarRepl = document.getElementById('kpiTypeBarRepl');

      if (newPosEl) newPosEl.textContent = metrics.newPositions;
      if (replPosEl) replPosEl.textContent = metrics.replacementPositions;

      if (typeBarNew && typeBarRepl) {
        const total = metrics.totalPositions || 1;
        const newPct = Math.round((metrics.newPositions / total) * 100);
        const replPct = 100 - newPct;
        typeBarNew.style.width = `${newPct}%`;
        typeBarRepl.style.width = `${replPct}%`;
      }

      // Card 3: Offers Released Count
      const offersEl = document.getElementById('kpiOffersReleased');
      if (offersEl) offersEl.textContent = metrics.offersReleased;

      // Card 4: Total Joined Count
      const joinedEl = document.getElementById('kpiTotalJoined');
      if (joinedEl) joinedEl.textContent = metrics.totalJoined;

      // Card 5: Overall Avg TAT
      const tatEl = document.getElementById('kpiAvgTat');
      const tatBadge = document.getElementById('kpiTatBadge');
      if (tatEl) tatEl.textContent = `${metrics.avgTat}d`;

      if (tatBadge) {
        if (metrics.avgTat <= 25) {
          tatBadge.textContent = 'Faster than 30d target';
          tatBadge.className = 'text-[11px] font-medium text-emerald-600 flex items-center mt-1';
        } else if (metrics.avgTat <= 30) {
          tatBadge.textContent = 'On 30d benchmark target';
          tatBadge.className = 'text-[11px] font-medium text-blue-600 flex items-center mt-1';
        } else {
          tatBadge.textContent = `${metrics.avgTat - 30}d over benchmark target`;
          tatBadge.className = 'text-[11px] font-medium text-amber-600 flex items-center mt-1';
        }
      }
    }

    // ==========================================
    // TAB NAVIGATION
    // ==========================================

    switchTab(tabId) {
      this.currentTab = tabId;

      // Toggle tab button active styles
      const tabBtns = document.querySelectorAll('[data-tab-target]');
      tabBtns.forEach(btn => {
        const isTarget = btn.getAttribute('data-tab-target') === tabId;
        if (isTarget) {
          btn.className = 'px-4 py-2.5 text-sm font-semibold text-blue-600 border-b-2 border-blue-600 flex items-center space-x-2 transition-colors';
        } else {
          btn.className = 'px-4 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-700 hover:border-slate-300 border-b-2 border-transparent flex items-center space-x-2 transition-colors';
        }
      });

      // Toggle tab content containers
      const panes = document.querySelectorAll('.tab-pane');
      panes.forEach(pane => {
        if (pane.id === tabId) {
          pane.classList.remove('hidden');
        } else {
          pane.classList.add('hidden');
        }
      });

      // Trigger respective tab renderer
      if (tabId === 'tab-analytics') {
        window.OlyvCharts.renderAll(this.currentDepartment);
        this.renderMilestoneTatAnalyzer();
        this.renderOfferAnalyticsMetrics();
      } else if (tabId === 'tab-pipeline') {
        this.renderCandidateTable();
      } else if (tabId === 'tab-calendar') {
        this.renderInterviewCalendar();
      } else if (tabId === 'tab-offers') {
        this.renderOffersTable();
      } else if (tabId === 'tab-positions') {
        this.renderPositionsTable();
      }
    }

    // ==========================================
    // TAB 2: CANDIDATE PIPELINE DRILLDOWN
    // ==========================================

    setPipelineViewMode(mode) {
      this.pipelineViewMode = mode;
      const boardBtn = document.getElementById('pipelineViewBoardBtn');
      const tableBtn = document.getElementById('pipelineViewTableBtn');
      const boardContainer = document.getElementById('pipelineKanbanView');
      const tableContainer = document.getElementById('pipelineTableView');
      const stageFilterCont = document.getElementById('stageFilterContainer');

      if (mode === 'board') {
        if (boardBtn) boardBtn.className = 'px-2.5 py-1 rounded-md bg-white text-blue-700 shadow-2xs flex items-center space-x-1.5 transition-all';
        if (tableBtn) tableBtn.className = 'px-2.5 py-1 rounded-md text-slate-600 hover:text-slate-800 flex items-center space-x-1.5 transition-all';
        if (boardContainer) boardContainer.classList.remove('hidden');
        if (tableContainer) tableContainer.classList.add('hidden');
        if (stageFilterCont) stageFilterCont.classList.add('hidden'); // All stages visible on board
        this.renderKanbanBoard();
      } else {
        if (boardBtn) boardBtn.className = 'px-2.5 py-1 rounded-md text-slate-600 hover:text-slate-800 flex items-center space-x-1.5 transition-all';
        if (tableBtn) tableBtn.className = 'px-2.5 py-1 rounded-md bg-white text-blue-700 shadow-2xs flex items-center space-x-1.5 transition-all';
        if (boardContainer) boardContainer.classList.add('hidden');
        if (tableContainer) tableContainer.classList.remove('hidden');
        if (stageFilterCont) stageFilterCont.classList.remove('hidden');
        this.renderCandidateTable();
      }
    }

    renderCandidateTable() {
      // If currently in board view mode, route to Kanban
      if (this.pipelineViewMode === 'board') {
        this.renderKanbanBoard();
        return;
      }

      const tbody = document.getElementById('candidateTableBody');
      const countEl = document.getElementById('candidateResultCount');
      if (!tbody) return;

      const filter = {};
      if (this.currentDepartment) {
        filter.department = this.currentDepartment;
      } else {
        const tableDeptFilter = document.getElementById('tableDeptFilter');
        if (tableDeptFilter && tableDeptFilter.value !== 'ALL') {
          filter.department = tableDeptFilter.value;
        }
      }

      if (this.stageFilter !== 'ALL') {
        filter.status = this.stageFilter;
      }
      if (this.sourceFilter !== 'ALL') {
        filter.source = this.sourceFilter;
      }
      if (this.searchQuery) {
        filter.search = this.searchQuery;
      }

      const candidates = window.OlyvDB.getCandidates(filter);
      if (countEl) countEl.textContent = `${candidates.length} candidates found`;

      this.populateDeptFilterOptions();

      if (candidates.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" class="px-6 py-12 text-center text-slate-400">
              <div class="flex flex-col items-center justify-center space-y-2">
                <svg class="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span class="text-sm font-medium text-slate-500">No candidates match your filters</span>
                <span class="text-xs text-slate-400">Try adjusting your search criteria or add new candidates</span>
              </div>
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = '';
      candidates.forEach(c => {
        const badgeClasses = this.getBadgeClasses(c.status);
        const lastRemark = Array.isArray(c.remarks) && c.remarks.length > 0 ? c.remarks[c.remarks.length - 1] : null;

        tbody.innerHTML += `
          <tr class="hover:bg-slate-50/80 transition-colors border-b border-slate-200/70 text-sm">
            <td class="px-4 py-3">
              <div class="font-semibold text-slate-900">${c.name}</div>
              <div class="text-xs text-slate-500 font-mono">${c.id} • ${c.mobile || 'No Phone'}</div>
            </td>
            <td class="px-4 py-3">
              <div class="text-slate-800 font-medium">${c.jobTitle}</div>
              <div class="text-xs text-slate-500">${c.department}</div>
            </td>
            <td class="px-4 py-3">
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${badgeClasses}">
                <span class="w-1.5 h-1.5 rounded-full mr-1.5 ${c.status === 'Rejected' ? 'bg-red-500' : ['Offered', 'Joined'].includes(c.status) ? 'bg-emerald-500' : 'bg-blue-500'}"></span>
                ${c.status}
              </span>
            </td>
            <td class="px-4 py-3 text-slate-600 text-xs">
              <span class="px-2 py-1 bg-slate-100 rounded text-slate-700 font-medium">${c.source}</span>
            </td>
            <td class="px-4 py-3 text-slate-700 text-xs">
              ${c.recruiter || 'Unassigned'}
            </td>
            <td class="px-4 py-3 text-xs text-slate-500 max-w-[200px] truncate" title="${lastRemark ? lastRemark.note : 'No notes'}">
              ${lastRemark ? `<span class="font-medium text-slate-700">${lastRemark.stage}:</span> ${lastRemark.note}` : 'No notes'}
            </td>
            <td class="px-4 py-3 text-right whitespace-nowrap">
              <button onclick="window.OlyvModals.openStageProgressionModal('${c.id}')"
                class="inline-flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-semibold bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 hover:border-blue-600 transition-all duration-150 shadow-2xs">
                <span>Update Stage</span>
                <span>➔</span>
              </button>
            </td>
          </tr>
        `;
      });
    }

    populateDeptFilterOptions() {
      const tableDeptFilter = document.getElementById('tableDeptFilter');
      if (tableDeptFilter) {
        if (this.currentDepartment) {
          tableDeptFilter.parentElement.classList.add('hidden');
        } else {
          tableDeptFilter.parentElement.classList.remove('hidden');
          const currentVal = tableDeptFilter.value;
          const depts = window.OlyvDB.getDepartments();
          tableDeptFilter.innerHTML = '<option value="ALL">All Departments</option>';
          depts.forEach(d => {
            tableDeptFilter.innerHTML += `<option value="${d.name}" ${currentVal === d.name ? 'selected' : ''}>${d.name}</option>`;
          });
        }
      }
    }

    // ==========================================
    // KANBAN DRAG & DROP PIPELINE CONTROLLER
    // ==========================================

    renderKanbanBoard() {
      const boardContainer = document.getElementById('kanbanBoardColumns');
      const countEl = document.getElementById('candidateResultCount');
      if (!boardContainer) return;

      const filter = {};
      if (this.currentDepartment) {
        filter.department = this.currentDepartment;
      } else {
        const tableDeptFilter = document.getElementById('tableDeptFilter');
        if (tableDeptFilter && tableDeptFilter.value !== 'ALL') {
          filter.department = tableDeptFilter.value;
        }
      }

      if (this.sourceFilter !== 'ALL') {
        filter.source = this.sourceFilter;
      }
      if (this.searchQuery) {
        filter.search = this.searchQuery;
      }

      const allCandidates = window.OlyvDB.getCandidates(filter);
      if (countEl) countEl.textContent = `${allCandidates.length} candidates in pipeline`;

      this.populateDeptFilterOptions();

      // Defined Kanban Stages (Shortlisting, R1, R2, R3, HR Round, Preboarding, Offer)
      const stagesConfig = [
        { id: 'Shortlisted', label: 'Shortlisted', color: 'slate', badge: 'bg-slate-100 text-slate-700' },
        { id: 'Round 1', label: 'Round 1 (Screening)', color: 'sky', badge: 'bg-sky-100 text-sky-800' },
        { id: 'Round 2', label: 'Round 2 (Tech/Core)', color: 'blue', badge: 'bg-blue-100 text-blue-800' },
        { id: 'Round 3', label: 'Round 3 (Leadership)', color: 'indigo', badge: 'bg-indigo-100 text-indigo-800' },
        { id: 'HR Round', label: 'HR Round', color: 'purple', badge: 'bg-purple-100 text-purple-800' },
        { id: 'Preboarding', label: 'Preboarding', color: 'amber', badge: 'bg-amber-100 text-amber-800' },
        { id: 'Offer', label: 'Offer Release', color: 'teal', badge: 'bg-teal-100 text-teal-800' }
      ];

      boardContainer.innerHTML = '';

      stagesConfig.forEach(stage => {
        const stageCandidates = allCandidates.filter(c => {
          if (stage.id === 'Shortlisted') return c.status === 'Shortlisted';
          if (stage.id === 'Offer') return c.status === 'Offered';
          return c.status === stage.id;
        });

        const colDiv = document.createElement('div');
        colDiv.className = 'kanban-col flex-1 min-w-[210px] max-w-[250px] bg-slate-100/70 border border-slate-200/90 rounded-xl p-3 flex flex-col max-h-[75vh]';
        colDiv.setAttribute('data-stage-id', stage.id);

        // Kanban Column Header
        colDiv.innerHTML = `
          <div class="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
            <div class="flex items-center space-x-1.5">
              <span class="w-2.5 h-2.5 rounded-full ${stage.id === 'Offer' ? 'bg-teal-500' : stage.id === 'Preboarding' ? 'bg-amber-500' : 'bg-blue-500'}"></span>
              <span class="font-bold text-xs text-slate-800">${stage.label}</span>
            </div>
            <span class="font-mono text-[11px] font-bold px-2 py-0.5 rounded-full ${stage.badge}">
              ${stageCandidates.length}
            </span>
          </div>
          <div class="kanban-cards-container flex-1 overflow-y-auto space-y-2 pr-1 min-h-[120px]" data-drop-stage="${stage.id}">
            <!-- Candidate cards injected here -->
          </div>
        `;

        const cardsContainer = colDiv.querySelector('.kanban-cards-container');

        if (stageCandidates.length === 0) {
          cardsContainer.innerHTML = `
            <div class="h-24 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-[11px] pointer-events-none">
              Drag candidates here
            </div>
          `;
        } else {
          stageCandidates.forEach(cand => {
            const card = document.createElement('div');
            card.className = 'kanban-card bg-white p-3 rounded-lg border border-slate-200/90 shadow-2xs hover:shadow-md transition-all text-xs select-none';
            card.setAttribute('draggable', 'true');
            card.setAttribute('data-candidate-id', cand.id);

            const lastRemark = Array.isArray(cand.remarks) && cand.remarks.length > 0 ? cand.remarks[cand.remarks.length - 1] : null;

            // Optional tags for comp & notice period
            let compTags = '';
            if (cand.currentCtc || cand.ectc || cand.noticePeriod) {
              compTags = `
                <div class="flex flex-wrap gap-1 mt-1 mb-1.5 text-[9px] font-mono text-slate-600">
                  ${cand.currentCtc ? `<span class="bg-slate-100 px-1.5 py-0.5 rounded" title="Current CTC">C: ₹${cand.currentCtc}L</span>` : ''}
                  ${cand.ectc ? `<span class="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-semibold" title="Expected CTC">E: ₹${cand.ectc}L</span>` : ''}
                  ${cand.noticePeriod ? `<span class="bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded" title="Notice Period">NP: ${cand.noticePeriod}d</span>` : ''}
                </div>
              `;
            }

            card.innerHTML = `
              <div class="flex items-center justify-between mb-1">
                <span class="font-mono text-[10px] font-bold text-slate-400">${cand.id}</span>
                <span class="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">${cand.source}</span>
              </div>
              <div class="font-bold text-slate-900 text-xs mb-0.5">${cand.name}</div>
              <div class="text-[11px] text-slate-600">${cand.jobTitle}</div>
              <div class="text-[10px] text-slate-400 mb-1">${cand.department}</div>
              ${compTags}
              ${cand.ctc ? `<div class="mb-1 text-[11px] font-mono font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">Offered: ${cand.ctc}</div>` : ''}
              ${cand.expectedDoj ? `<div class="mb-2 text-[10px] text-amber-700 font-medium">DOJ: ${cand.expectedDoj}</div>` : ''}
              <div class="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                <span class="text-slate-400 truncate max-w-[100px]" title="${cand.recruiter}">${cand.recruiter || 'Unassigned'}</span>
                <button type="button" draggable="false"
                  onclick="event.stopPropagation(); window.OlyvModals.openStageProgressionModal('${cand.id}')"
                  class="px-2 py-0.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white font-semibold transition-colors cursor-pointer">
                  Manage ➔
                </button>
              </div>
            `;

            // Drag Events for Card (prevent dragging when clicking on button)
            card.addEventListener('dragstart', (e) => {
              if (e.target.closest('button')) {
                e.preventDefault();
                return;
              }
              e.dataTransfer.setData('text/plain', cand.id);
              e.dataTransfer.effectAllowed = 'move';
              card.classList.add('dragging');
            });

            card.addEventListener('dragend', () => {
              card.classList.remove('dragging');
              document.querySelectorAll('.kanban-col').forEach(c => c.classList.remove('drag-over'));
            });

            cardsContainer.appendChild(card);
          });
        }

        // Drag & Drop Listeners for Column
        colDiv.addEventListener('dragover', (e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          colDiv.classList.add('drag-over');
        });

        colDiv.addEventListener('dragleave', (e) => {
          if (!colDiv.contains(e.relatedTarget)) {
            colDiv.classList.remove('drag-over');
          }
        });

        colDiv.addEventListener('drop', (e) => {
          e.preventDefault();
          colDiv.classList.remove('drag-over');
          const candidateId = e.dataTransfer.getData('text/plain');
          if (!candidateId) return;

          this.handleCandidateKanbanDrop(candidateId, stage.id);
        });

        boardContainer.appendChild(colDiv);
      });
    }

    handleCandidateKanbanDrop(candidateId, targetStage) {
      const candidate = window.OlyvDB.getCandidateById(candidateId);
      if (!candidate) return;

      const currentStage = candidate.status;
      if (currentStage === targetStage || (currentStage === 'Offered' && targetStage === 'Offer')) {
        return; // No-op
      }

      // If moving to Offer stage, prompt with Quick Offer modal to capture CTC and expected DOJ
      if (targetStage === 'Offer') {
        window.OlyvModals.openQuickOfferModal(candidateId);
        return;
      }

      // Normal stage progression
      window.OlyvDB.updateCandidateStage(candidateId, {
        newStage: targetStage,
        decision: 'Progressed via Board Drag & Drop',
        notes: `Candidate moved from ${currentStage} to ${targetStage} on Kanban board`
      });

      this.showToast(`Moved ${candidate.name} to ${targetStage}!`, 'success');
      this.renderKanbanBoard();
    }

    // ==========================================
    // TAB 3: OFFERS & DOJ TRACKER
    // ==========================================

    renderOffersTable() {
      const tbody = document.getElementById('offersTableBody');
      const totalPipelineCtcEl = document.getElementById('offersTotalCtc');
      const avgCtcEl = document.getElementById('offersAvgCtc');
      const upcomingJoineesEl = document.getElementById('offersUpcomingJoinees');

      if (!tbody) return;

      const filter = { status: ['Offered', 'Preboarding', 'Joined', 'Dropped'] };
      if (this.currentDepartment) {
        filter.department = this.currentDepartment;
      }

      const offers = window.OlyvDB.getCandidates(filter);

      // Compute aggregates for Top of Tab 3
      let totalLakhs = 0;
      let validCtcCount = 0;
      let upcomingCount = 0;
      const today = new Date();

      offers.filter(c => c.status !== 'Dropped').forEach(c => {
        if (c.ctc) {
          const match = c.ctc.match(/(\d+(\.\d+)?)/);
          if (match) {
            totalLakhs += parseFloat(match[1]);
            validCtcCount++;
          }
        }
        if (c.expectedDoj && c.status !== 'Joined') {
          const dojDate = new Date(c.expectedDoj);
          if (dojDate >= today) upcomingCount++;
        }
      });

      if (totalPipelineCtcEl) {
        totalPipelineCtcEl.textContent = totalLakhs > 0 ? `₹${Math.round(totalLakhs)} Lakhs` : '₹0';
      }
      if (avgCtcEl) {
        const avg = validCtcCount > 0 ? (totalLakhs / validCtcCount).toFixed(1) : 0;
        avgCtcEl.textContent = avg > 0 ? `₹${avg} LPA` : 'N/A';
      }
      if (upcomingJoineesEl) {
        upcomingJoineesEl.textContent = `${upcomingCount} upcoming`;
      }

      if (offers.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" class="px-6 py-12 text-center text-slate-400">
              No candidates currently in Offered, Preboarding, Joined, or Dropped stages.
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = '';
      offers.forEach(c => {
        let dojBadge = '<span class="text-slate-400 text-xs italic">Not set</span>';
        if (c.expectedDoj) {
          const dojDate = new Date(c.expectedDoj);
          const diffDays = Math.round((dojDate - today) / (1000 * 60 * 60 * 24));

          if (c.status === 'Joined') {
            dojBadge = `<span class="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">Joined on ${c.expectedDoj}</span>`;
          } else if (c.status === 'Dropped') {
            dojBadge = `<span class="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-500 line-through">${c.expectedDoj}</span>`;
          } else if (diffDays < 0) {
            dojBadge = `<span class="px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800">Past DOJ (${Math.abs(diffDays)}d ago)</span>`;
          } else if (diffDays === 0) {
            dojBadge = `<span class="px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 font-bold">Joining Today</span>`;
          } else {
            dojBadge = `<span class="px-2 py-0.5 rounded text-xs font-semibold bg-sky-100 text-sky-800">In ${diffDays} days (${c.expectedDoj})</span>`;
          }
        }

        const isDropped = c.status === 'Dropped';
        const isJoined = c.status === 'Joined';

        tbody.innerHTML += `
          <tr class="hover:bg-slate-50/80 transition-colors border-b border-slate-200/70 text-sm ${isDropped ? 'opacity-60 bg-slate-50' : ''}">
            <td class="px-4 py-3">
              <div class="font-semibold text-slate-900">${c.name}</div>
              <div class="text-xs text-slate-500 font-mono">${c.id} • ${c.email}</div>
            </td>
            <td class="px-4 py-3">
              <div class="text-slate-800 font-medium">${c.jobTitle}</div>
              <div class="text-xs text-slate-500">${c.department}</div>
            </td>
            <td class="px-4 py-3 font-semibold text-slate-900 font-mono text-sm">
              <div>${c.ctc || '<span class="text-slate-400 text-xs italic">Pending</span>'}</div>
              ${c.offerBreakdown ? `
                <div class="text-[10px] text-slate-500 font-normal mt-0.5 space-x-1">
                  <span>Fix: ₹${c.offerBreakdown.fixed || 0}L</span>
                  ${c.offerBreakdown.variable ? `<span>• Var: ₹${c.offerBreakdown.variable}L</span>` : ''}
                  ${c.offerBreakdown.esops ? `<span class="text-indigo-600 font-semibold">• ESOP: ₹${c.offerBreakdown.esops}L</span>` : ''}
                  ${c.offerBreakdown.joiningBonus ? `<span class="text-emerald-600">• JB: ₹${c.offerBreakdown.joiningBonus}L</span>` : ''}
                </div>
              ` : ''}
            </td>
            <td class="px-4 py-3 text-xs text-slate-600 font-mono">
              ${c.offerDate || '<span class="text-slate-400 italic">Not recorded</span>'}
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center space-x-1.5">
                ${dojBadge}
                ${!isJoined && !isDropped ? `
                  <button onclick="window.OlyvModals.openUpdateDojModal('${c.id}')" title="Reschedule DOJ / Record Early Joining"
                    class="p-1 rounded text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                ` : ''}
              </div>
            </td>
            <td class="px-4 py-3">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${this.getBadgeClasses(c.status)}">
                ${c.status}
              </span>
            </td>
            <td class="px-4 py-3 text-right">
              <div class="inline-flex items-center space-x-1">
                ${!isJoined && !isDropped ? `
                  <button onclick="window.OlyvApp.markCandidateJoined('${c.id}')" title="Candidate has Joined company"
                    class="px-2.5 py-1 text-xs font-semibold bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded border border-emerald-200 hover:border-emerald-600 transition-colors">
                    ✓ Joined
                  </button>
                  <button onclick="window.OlyvApp.markCandidateDropped('${c.id}')" title="Candidate dropped / rejected offer"
                    class="px-2 py-1 text-xs font-semibold text-red-600 hover:text-white hover:bg-red-600 rounded border border-red-200 hover:border-red-600 transition-colors">
                    ✕ Dropped
                  </button>
                ` : ''}
                <button onclick="window.OlyvModals.openStageProgressionModal('${c.id}')"
                  class="px-2 py-1 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded border border-slate-200 transition-colors">
                  Details
                </button>
              </div>
            </td>
          </tr>
        `;
      });
    }

    markCandidateJoined(candidateId) {
      const candidate = window.OlyvDB.getCandidateById(candidateId);
      if (!candidate) return;

      const today = new Date().toISOString().split('T')[0];
      window.OlyvDB.updateCandidateStage(candidateId, {
        newStage: 'Joined',
        decision: 'Joined Organization',
        notes: `Candidate joined on ${today}`,
        expectedDoj: candidate.expectedDoj || today
      });

      this.showToast(`Congratulations! ${candidate.name} marked as Joined!`, 'success');
      this.renderOffersTable();
    }

    markCandidateDropped(candidateId) {
      const candidate = window.OlyvDB.getCandidateById(candidateId);
      if (!candidate) return;

      const reason = prompt(`Reason for dropping ${candidate.name}:`, 'Declined offer / Backed out before joining');
      if (reason === null) return; // User cancelled

      window.OlyvDB.updateCandidateStage(candidateId, {
        newStage: 'Dropped',
        decision: 'Candidate Dropped',
        notes: reason || 'Candidate backed out before DOJ'
      });

      this.showToast(`${candidate.name} marked as Dropped.`, 'info');
      this.renderOffersTable();
    }

    // ==========================================
    // KPI DRILLDOWN CONTROLLERS
    // ==========================================

    openKpiPositionsDrilldown(type = 'ALL') {
      window.OlyvModals.openKpiPositionsModal(type);
    }

    openKpiJoinedDrilldown() {
      this.switchTab('tab-offers');
      this.showToast('Showing all joined and offered candidates.', 'info');
    }

    handleBackupRestore(event) {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = window.OlyvDB.importDatabaseJson(e.target.result);
        if (result.success) {
          this.showToast(`Database restored successfully! (${result.count} candidates loaded)`, 'success');
          this.renderAll();
        } else {
          alert(`Failed to restore backup: ${result.message}`);
        }
      };
      reader.readAsText(file);
      event.target.value = ''; // Reset input
    }

    // ==========================================
    // TAB 4: OPEN POSITIONS LOG
    // ==========================================

    renderPositionsTable() {
      const tbody = document.getElementById('positionsTableBody');
      const countEl = document.getElementById('positionsResultCount');
      if (!tbody) return;

      const filter = {};
      if (this.currentDepartment) {
        filter.department = this.currentDepartment;
      }

      const positions = window.OlyvDB.getPositions(filter);
      if (countEl) countEl.textContent = `${positions.length} Requisitions`;

      if (positions.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" class="px-6 py-12 text-center text-slate-400">
              No positions open in this scope. Click "+ Add Positions" to create requisitions.
            </td>
          </tr>
        `;
        return;
      }

      const today = new Date();
      tbody.innerHTML = '';

      positions.forEach(p => {
        const openDate = new Date(p.dateOpened || '2026-08-01');
        const daysOpen = Math.max(1, Math.round((today - openDate) / (1000 * 60 * 60 * 24)));
        const targetTat = p.targetTat || 30;

        const tatInfo = window.OlyvDB.getPositionTatStatus(p);
        const tatStatusBadge = `
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${tatInfo.badgeClass} border">
            <span class="w-1.5 h-1.5 rounded-full ${tatInfo.dotClass} mr-1.5"></span>
            ${tatInfo.daysOpen}d Open • ${tatInfo.status}
          </span>
        `;

        const typeBadge = p.type === 'New'
          ? '<span class="px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-700">New</span>'
          : '<span class="px-2 py-0.5 rounded text-xs font-semibold bg-purple-100 text-purple-700">Replacement</span>';

        tbody.innerHTML += `
          <tr class="hover:bg-slate-50/80 transition-colors border-b border-slate-200/70 text-sm">
            <td class="px-4 py-3 font-mono font-bold text-slate-800">
              ${p.id}
            </td>
            <td class="px-4 py-3 font-medium text-slate-900">
              ${p.jobTitle}
            </td>
            <td class="px-4 py-3 text-slate-600">
              ${p.department}
            </td>
            <td class="px-4 py-3">
              ${typeBadge}
            </td>
            <td class="px-4 py-3 text-xs text-slate-500">
              ${p.dateOpened}
            </td>
            <td class="px-4 py-3">
              ${tatStatusBadge}
            </td>
            <td class="px-4 py-3 text-right">
              <button onclick="window.OlyvApp.handleDeletePosition('${p.id}')"
                class="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors" title="Delete Requisition">
                <svg class="w-4 h-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </td>
          </tr>
        `;
      });
    }

    handleDeletePosition(id) {
      if (confirm(`Are you sure you want to delete position ${id}?`)) {
        window.OlyvDB.deletePosition(id);
        this.showToast(`Position ${id} deleted`, 'info');
      }
    }

    // ==========================================
    // BADGE & STAGE HELPERS
    // ==========================================

    getBadgeClasses(status) {
      switch (status) {
        case 'Joined':
          return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
        case 'Offered':
          return 'bg-teal-100 text-teal-800 border border-teal-200';
        case 'Preboarding':
          return 'bg-amber-100 text-amber-800 border border-amber-200';
        case 'HR Round':
          return 'bg-purple-100 text-purple-800 border border-purple-200';
        case 'Round 3':
          return 'bg-indigo-100 text-indigo-800 border border-indigo-200';
        case 'Round 2':
          return 'bg-blue-100 text-blue-800 border border-blue-200';
        case 'Round 1':
          return 'bg-sky-100 text-sky-800 border border-sky-200';
        case 'Shortlisted':
          return 'bg-slate-100 text-slate-700 border border-slate-200';
        case 'Rejected':
        case 'Dropped':
          return 'bg-red-100 text-red-700 border border-red-200';
        default:
          return 'bg-slate-100 text-slate-700 border border-slate-200';
      }
    }

    // ==========================================
    // TOAST NOTIFICATIONS
    // ==========================================

    showToast(message, type = 'success') {
      const toast = document.getElementById('globalToast');
      const toastMsg = document.getElementById('toastMessage');
      const toastIcon = document.getElementById('toastIcon');

      if (!toast || !toastMsg) return;

      toastMsg.textContent = message;

      if (type === 'success') {
        toastIcon.innerHTML = '✓';
        toastIcon.className = 'w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold mr-2.5';
      } else if (type === 'info') {
        toastIcon.innerHTML = 'i';
        toastIcon.className = 'w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold mr-2.5';
      } else {
        toastIcon.innerHTML = '!';
        toastIcon.className = 'w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold mr-2.5';
      }

      toast.classList.remove('opacity-0', 'translate-y-4', 'pointer-events-none');
      toast.classList.add('opacity-100', 'translate-y-0');

      setTimeout(() => {
        toast.classList.remove('opacity-100', 'translate-y-0');
        toast.classList.add('opacity-0', 'translate-y-4', 'pointer-events-none');
      }, 3200);
    }

    exportDatabaseJson() {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(window.OlyvDB.data, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `olyv_ats_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      this.showToast('Database JSON exported successfully!', 'success');
    }

    resetSeedData() {
      if (confirm('Reset entire database back to default seed data? All custom additions will be restored to default demo state.')) {
        window.OlyvDB.resetToSeed();
        this.showToast('Database reset to enterprise demo seed data.', 'info');
      }
    }

    // ==========================================
    // TAB: WEEKLY INTERVIEW CALENDAR
    // ==========================================

    renderInterviewCalendar() {
      const grid = document.getElementById('weeklyCalendarGrid');
      const tableBody = document.getElementById('panelMembersTableBody');
      if (!grid || !tableBody) return;

      const calendarData = window.OlyvDB.getWeeklyInterviewCalendar(this.currentDepartment);

      // Render 7-day schedule grid
      grid.innerHTML = '';
      calendarData.weekSchedule.forEach(day => {
        const hasSlots = day.slots && day.slots.length > 0;
        let slotsHtml = '';

        if (!hasSlots) {
          slotsHtml = `
            <div class="p-3 rounded-lg border border-dashed border-slate-200 text-center bg-slate-50/50">
              <span class="text-[11px] text-slate-400 italic">No scheduled calls</span>
              <div class="text-[10px] text-emerald-600 font-semibold mt-1">✓ Panel Available</div>
            </div>
          `;
        } else {
          day.slots.forEach(s => {
            slotsHtml += `
              <div class="p-2.5 rounded-lg border border-blue-200 bg-blue-50/70 hover:bg-blue-50 transition-colors shadow-2xs space-y-1">
                <div class="flex items-center justify-between text-[10px] font-mono text-blue-900 font-bold">
                  <span>${s.time}</span>
                  <span class="px-1.5 py-0.2 rounded bg-blue-200/70 text-blue-800">${s.stage}</span>
                </div>
                <div class="font-bold text-slate-900 text-xs">${s.candName}</div>
                <div class="text-[10px] text-slate-600 truncate">${s.role}</div>
                <div class="pt-1 border-t border-blue-200/60 flex items-center justify-between text-[10px]">
                  <span class="text-slate-500 font-medium">${s.interviewer}</span>
                  <button onclick="window.OlyvModals.openStageProgressionModal('${s.candId}')" class="text-blue-700 hover:text-blue-900 font-semibold">
                    Manage ➔
                  </button>
                </div>
              </div>
            `;
          });
        }

        grid.innerHTML += `
          <div class="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs flex flex-col space-y-2">
            <div class="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <span class="font-bold text-slate-900 text-xs">${day.dayName}</span>
                <span class="text-[10px] text-slate-400 block">${day.formattedDate}</span>
              </div>
              <span class="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${hasSlots ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'}">
                ${day.slots.length} session${day.slots.length === 1 ? '' : 's'}
              </span>
            </div>
            <div class="space-y-2 flex-1">
              ${slotsHtml}
            </div>
          </div>
        `;
      });

      // Render Panel members scorecard
      tableBody.innerHTML = '';
      calendarData.panelMembers.forEach(m => {
        const totalEvaluated = m.selected + m.rejected;
        const passRatio = totalEvaluated > 0 ? Math.round((m.selected / totalEvaluated) * 100) : 0;
        const isFree = m.scheduled === 0;

        tableBody.innerHTML += `
          <tr class="hover:bg-slate-50/80 transition-colors border-b border-slate-200/70 text-xs">
            <td class="px-4 py-3">
              <div class="font-semibold text-slate-900">${m.name}</div>
              <div class="text-[11px] text-slate-500">${m.role}</div>
            </td>
            <td class="px-4 py-3 text-slate-600 font-medium">
              ${m.department}
            </td>
            <td class="px-4 py-3">
              <span class="font-mono font-bold ${m.scheduled > 0 ? 'text-blue-600' : 'text-slate-400'}">
                ${m.scheduled} slot${m.scheduled === 1 ? '' : 's'} scheduled
              </span>
            </td>
            <td class="px-4 py-3 font-mono font-bold text-slate-800">
              ${m.completed} interviews
            </td>
            <td class="px-4 py-3">
              <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
                ✓ ${m.selected} Selected
              </span>
            </td>
            <td class="px-4 py-3">
              <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800">
                ✕ ${m.rejected} Rejected
              </span>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center space-x-2">
                <div class="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div class="bg-emerald-500 h-full" style="width: ${passRatio}%"></div>
                </div>
                <span class="font-mono font-semibold text-slate-700 text-[11px]">${passRatio}%</span>
              </div>
            </td>
            <td class="px-4 py-3 text-right">
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${isFree ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}">
                <span class="w-1.5 h-1.5 rounded-full mr-1.5 ${isFree ? 'bg-emerald-500' : 'bg-blue-500'}"></span>
                ${isFree ? 'Available' : 'Slots Blocked'}
              </span>
            </td>
          </tr>
        `;
      });
    }

    // ==========================================
    // MILESTONE TAT ANALYZER & OFFER STATS
    // ==========================================

    renderMilestoneTatAnalyzer() {
      const posSelect = document.getElementById('tatAnalysisPositionSelect');
      if (posSelect && posSelect.options.length <= 1) {
        const positions = window.OlyvDB.getPositions(this.currentDepartment ? { department: this.currentDepartment } : {});
        positions.forEach(p => {
          posSelect.innerHTML += `<option value="${p.id}">${p.id} - ${p.jobTitle} (${p.department})</option>`;
        });
      }
      this.handleMilestoneTatChange();
    }

    handleMilestoneTatChange() {
      const posSelect = document.getElementById('tatAnalysisPositionSelect');
      const fromSelect = document.getElementById('tatAnalysisFromStage');
      const toSelect = document.getElementById('tatAnalysisToStage');

      const posId = posSelect ? posSelect.value : 'ALL';
      const fromStage = fromSelect ? fromSelect.value : 'Shortlisted';
      const toStage = toSelect ? toSelect.value : 'Offered';

      const tatData = window.OlyvDB.getMilestoneTatAnalytics(posId, fromStage, toStage, this.currentDepartment);

      const avgEl = document.getElementById('milestoneTatAvg');
      const minEl = document.getElementById('milestoneTatMin');
      const maxEl = document.getElementById('milestoneTatMax');
      const samplesEl = document.getElementById('milestoneTatSamples');
      const badgeEl = document.getElementById('milestoneTatBadge');

      if (avgEl) avgEl.textContent = tatData.avgDays;
      if (minEl) minEl.textContent = tatData.minDays;
      if (maxEl) maxEl.textContent = tatData.maxDays;
      if (samplesEl) samplesEl.textContent = tatData.sampleSize;

      if (badgeEl) {
        if (tatData.avgDays > 60) {
          badgeEl.className = 'inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/30 text-red-200 border border-red-500/50';
          badgeEl.textContent = 'Critical Breach (>60d)';
        } else if (tatData.avgDays >= 30) {
          badgeEl.className = 'inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/30 text-amber-200 border border-amber-500/50';
          badgeEl.textContent = 'Approaching Limit (30-60d)';
        } else {
          badgeEl.className = 'inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/30 text-emerald-200 border border-emerald-500/50';
          badgeEl.textContent = 'On Track (<30d)';
        }
      }
    }

    renderOfferAnalyticsMetrics() {
      const offerData = window.OlyvDB.getOfferDeclineAnalytics(this.currentDepartment);

      const totalOfferedEl = document.getElementById('offerTotalOfferedCount');
      const totalJoinedEl = document.getElementById('offerTotalJoinedCount');
      const totalDeclinedEl = document.getElementById('offerTotalDeclinedCount');
      const acceptBadge = document.getElementById('offerAcceptanceRateBadge');
      const declineBadge = document.getElementById('offerDeclineRateBadge');

      if (totalOfferedEl) totalOfferedEl.textContent = offerData.totalOffered;
      if (totalJoinedEl) totalJoinedEl.textContent = offerData.totalJoined + offerData.totalActiveOffers;
      if (totalDeclinedEl) totalDeclinedEl.textContent = offerData.totalDropped;
      if (acceptBadge) acceptBadge.textContent = `${offerData.acceptanceRate}% Accepted`;
      if (declineBadge) declineBadge.textContent = `${offerData.declineRate}% Declined`;
    }

    // ==========================================
    // MODAL 8: UPCOMING JOINERS MODAL
    // ==========================================

    openUpcomingJoinersModal() {
      const tbody = document.getElementById('upcomingJoinersModalBody');
      const countEl = document.getElementById('upcomingJoinersCount');
      if (!tbody) return;

      const candidates = window.OlyvDB.getCandidates({ status: ['Offered', 'Preboarding'] });
      const upcoming = candidates.filter(c => c.expectedDoj);

      if (countEl) countEl.textContent = `${upcoming.length} candidate(s) awaiting date of joining`;

      if (upcoming.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" class="px-4 py-8 text-center text-slate-400">
              No upcoming joinees scheduled at this moment.
            </td>
          </tr>
        `;
      } else {
        tbody.innerHTML = '';
        upcoming.forEach(c => {
          tbody.innerHTML += `
            <tr class="hover:bg-slate-50 transition-colors">
              <td class="px-4 py-3 font-semibold text-slate-900">
                ${c.name}
                <div class="text-[10px] text-slate-400 font-mono">${c.id}</div>
              </td>
              <td class="px-4 py-3">
                <div class="text-slate-800 font-medium">${c.jobTitle}</div>
                <div class="text-[10px] text-slate-500">${c.department}</div>
              </td>
              <td class="px-4 py-3 font-mono font-bold text-teal-800">
                ${c.ctc || 'Negotiated'}
              </td>
              <td class="px-4 py-3">
                <span class="px-2 py-0.5 rounded font-mono font-bold text-xs bg-emerald-100 text-emerald-800">
                  ${c.expectedDoj}
                </span>
              </td>
              <td class="px-4 py-3 text-slate-600">
                ${c.recruiter || 'Unassigned'}
              </td>
              <td class="px-4 py-3 text-right">
                <button onclick="window.OlyvModals.closeAll(); window.OlyvModals.openStageProgressionModal('${c.id}')"
                  class="px-2.5 py-1 text-xs rounded bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white font-semibold transition-colors">
                  Manage ➔
                </button>
              </td>
            </tr>
          `;
        });
      }

      window.OlyvModals.openModal('upcomingJoinersModal');
    }

    // ==========================================
    // MODAL 9: OLYV ATS EXECUTIVE WELCOME COCKPIT
    // ==========================================

    openExecutiveCockpitModal() {
      const metrics = window.OlyvDB.getMetrics(null);
      const funnel = window.OlyvDB.getFunnelData(null);
      const recruiters = window.OlyvDB.getRecruiterPerformance(null);
      const candidates = window.OlyvDB.getCandidates({ status: ['Offered', 'Preboarding'] });

      // KPI highlights
      const posEl = document.getElementById('cockpitTotalPositions');
      const joinEl = document.getElementById('cockpitUpcomingJoinees');
      const candEl = document.getElementById('cockpitActiveCandidates');
      const tatEl = document.getElementById('cockpitAvgTat');

      if (posEl) posEl.textContent = metrics.totalPositions;
      if (joinEl) joinEl.textContent = candidates.length;
      if (candEl) candEl.textContent = metrics.totalCandidates;
      if (tatEl) tatEl.textContent = `${metrics.avgTat}d`;

      // Funnel pills
      const pillsContainer = document.getElementById('cockpitFunnelPills');
      if (pillsContainer) {
        pillsContainer.innerHTML = '';
        funnel.stages.forEach((stage, idx) => {
          const count = funnel.counts[idx];
          pillsContainer.innerHTML += `
            <div class="px-3 py-2 rounded-lg bg-white border border-slate-200 flex items-center space-x-2 shadow-2xs">
              <span class="font-semibold text-slate-700 text-xs">${stage}:</span>
              <span class="font-mono font-bold text-blue-600 text-sm">${count}</span>
            </div>
          `;
        });
      }

      // Recruiter table
      const recTable = document.getElementById('cockpitRecruiterTableBody');
      if (recTable) {
        recTable.innerHTML = '';
        recruiters.forEach(r => {
          recTable.innerHTML += `
            <tr class="hover:bg-slate-50 transition-colors">
              <td class="px-4 py-2.5 font-bold text-slate-900">${r.name}</td>
              <td class="px-4 py-2.5 font-mono text-slate-700">${r.candidatesSourced}</td>
              <td class="px-4 py-2.5 font-mono text-slate-700">${r.interviewsCoordinated}</td>
              <td class="px-4 py-2.5 font-mono font-semibold text-blue-700">${r.offersReleased}</td>
              <td class="px-4 py-2.5 font-mono font-bold text-emerald-700">✓ ${r.joined}</td>
              <td class="px-4 py-2.5 font-mono text-red-600">${r.dropped}</td>
              <td class="px-4 py-2.5 font-mono font-medium text-slate-800">${r.avgTat}d</td>
              <td class="px-4 py-2.5 text-right font-mono font-bold text-slate-900">${r.conversionRate}%</td>
            </tr>
          `;
        });
      }

      // Immediate joiners spotlight
      const joinersList = document.getElementById('cockpitUpcomingJoinersList');
      if (joinersList) {
        joinersList.innerHTML = '';
        if (candidates.length === 0) {
          joinersList.innerHTML = '<p class="text-slate-400 italic text-xs col-span-2">No upcoming joiners in the immediate 30-day window.</p>';
        } else {
          candidates.slice(0, 4).forEach(c => {
            joinersList.innerHTML += `
              <div class="p-3 rounded-lg border border-emerald-200 bg-emerald-50/50 flex items-center justify-between">
                <div>
                  <div class="font-bold text-slate-900 text-xs">${c.name}</div>
                  <div class="text-[10px] text-slate-500">${c.jobTitle} • ${c.department}</div>
                  <div class="text-[10px] text-teal-800 font-mono font-semibold mt-0.5">${c.ctc || 'CTC Disclosed'}</div>
                </div>
                <div class="text-right">
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 font-mono block">
                    DOJ: ${c.expectedDoj || 'TBD'}
                  </span>
                  <span class="text-[9px] text-slate-400 mt-1 block">${c.recruiter || 'HR Lead'}</span>
                </div>
              </div>
            `;
          });
        }
      }

      window.OlyvModals.openModal('executiveCockpitModal');
    }
  }

  // Initialize application
  window.OlyvApp = new OlyvApp();
})(window);
