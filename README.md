# Olyv — Enterprise Recruitment Analytics Dashboard & ATS

**Olyv** is a high-performance Recruitment Analytics Dashboard and Applicant Tracking System (ATS) designed for talent acquisition teams, HR leaders, and recruitment operations. Built with a lightning-fast client-side reactive state engine, Olyv delivers instant sub-10ms UI updates, rich interactive Chart.js visualizations, and complete persistence across sessions.

Now equipped with **Live Google Sheets Headless Cloud Sync**, Olyv allows your team members to add and manage candidate data in familiar spreadsheets or Google Forms **without ever granting them access to this executive dashboard**.

---

## 🔒 Team Access & Privacy Architecture

```
┌─────────────────────────────────────────────────────────┐
│              RECRUITMENT TEAM / COORDINATORS            │
│  (Recruiters, Hiring Managers, Sourcing Specialists)   │
└───────────────────────────┬─────────────────────────────┘
                            │
              Enters data via Google Sheets
              or Google Form (NO Olyv Access)
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│             GOOGLE SHEETS LIVE DATABASE                 │
│         Tab 1: Candidates   •   Tab 2: Positions        │
└───────────────────────────┬─────────────────────────────┘
                            │
               Live Sync Engine (JSON / CSV)
               Auto-refreshes every 30s - 60s
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│              OLYV ATS EXECUTIVE DASHBOARD               │
│      (Executive View, Analytics, KPIs, Funnel)          │
└─────────────────────────────────────────────────────────┘
```

- **Separation of Concerns**: Team members work in Google Sheets where they are comfortable.
- **Data Protection**: Candidates, CTC details, and requisition pipelines remain centralized in your Google Drive.
- **Real-Time Intelligence**: Executives and HR heads open Olyv to visualize conversion funnels, TAT trends, and offer trackers in real-time.

---

## ⚡ How to Connect to Google Sheets (30-Second Setup)

### Option A: Two-Way Sync via Google Apps Script (Recommended)
1. Open [sheets.new](https://sheets.new) to create a new Google Sheet (e.g. *"Olyv Recruitment Database"*).
2. Click **Extensions > Apps Script**.
3. Delete any code in the editor, open the file [`google_apps_script.js`](file:///c:/Users/Shailesh-1596_SC-710/Desktop/AI/google_apps_script.js) from your project folder, copy all code, and paste it into Apps Script.
4. Run the function `setupSheet` from the top dropdown. This automatically formats the sheet with two tabs: **`Candidates`** and **`Positions`**, adds enterprise column headers, and populates sample rows.
5. Click **Deploy > New deployment**:
   - Type: **Web app**
   - Description: *Olyv ATS Live Sync API*
   - Execute as: *Me*
   - Who has access: *Anyone*
6. Click **Deploy**, authorize permissions, and copy the **Web app URL** (ends with `/exec`).
7. In the Olyv Dashboard, click the **⚙️ Cloud DB Settings** button in the header, paste your Web App URL, and click **Save & Connect**!
8. Olyv is now connected! Any candidate added by recruiters in Google Sheets appears in Olyv, and stage transitions made in Olyv write back to Google Sheets.

### Option B: Zero-Code Public Read-Only Link (Instant)
1. In your Google Sheet, click **Share > General access > Anyone with the link can view**.
2. Copy the Google Sheet URL (e.g., `https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing`).
3. In Olyv, click **⚙️ Cloud DB Settings**, paste the URL, and click **Save & Connect**.
4. Olyv will parse the live `Candidates` and `Positions` tabs automatically.

---

## 🌟 Core ATS Features

### 1. Relational Data Schemas
- **Positions Requisitions Store**:
  - `id`: Auto-generated unique code (`ENG-SDE1-001`, `FIN-FM-001`, `PRD-SPM-001`, `RSK-CRM-001`).
  - `department`: Department allocation (`Engineering`, `Finance`, `Product`, `Risk`, `Collections`, or custom).
  - `jobTitle`: Specific designation.
  - `type`: Headcount classification (`New` vs `Replacement`).
  - `dateOpened`: ISO 8601 date.
  - `status`: Requisition lifecycle (`Active`, `Closed`, `On Hold`).
  - `targetTat`: Benchmark hiring turnaround time (Default: 30 days).
- **Candidates Talent Pool Store**:
  - `id`: Unique applicant ID (`CAND-1001`).
  - `appDate`: Application date.
  - `name`, `email`, `mobile`: Contact info.
  - `department`: Department mapping.
  - `jobTitle`: Mapped role.
  - `source`: Recruitment channel (`LinkedIn`, `Referral`, `Naukri`, `Agency`, `Direct`).
  - `recruiter`: Assigned talent acquisition specialist.
  - `status`: 9-stage progression (`Shortlisted`, `Round 1`, `Round 2`, `Round 3`, `HR Round`, `Preboarding`, `Offered`, `Joined`, `Rejected`).
  - `remarks`: Structured audit trail tracking stage decisions, interview feedback, and timestamped notes.
  - `ctc`: Offered compensation package (e.g. `₹34 LPA`).
  - `expectedDoj`: Date of Joining (with real-time countdown).
  - `offerDate`: Date of official offer letter rollout.

### 2. UI Layout & Design System
- **Dark Sidebar (`#0f172a`)**:
  - Brand header with "OLYV" logo and "Company Dashboard" subtitle.
  - "Company Overview" reset navigation option with total counts.
  - Interactive list of active departments dynamically extracted from the database with live position (`P`) and candidate (`C`) count badges.
  - Database management tools: **Export Database JSON** and **Reset Demo Seed Data**.
- **Main Dashboard Container (`#f1f5f9`)**:
  - Context-aware header displaying `"Company Overview Dashboard"` or `"[Department Name] Dashboard"`.
  - Live Sync Status Badge (`🟢 Google Sheet Connected` or `⚪ Local DB`).
  - On-Demand `🔄 Sync Now` button with live spin animation.
  - Contextual Action Buttons:
    - `+ Add Positions` *(Visible ONLY when viewing Company Overview)*.
    - `+ Add Candidate` *(Visible ONLY when viewing a specific Department)*.
    - `⬆ Bulk Upload` *(Always visible)*.

### 3. Top 5 Real-Time KPI Cards
1. **Total Positions Count**: Live count of active job requisitions.
2. **Position Types Breakdown**: Explicit separate counts for `New` vs `Replacement` with a visual ratio bar.
3. **Offers Released Count**: Candidates in `Offered`, `Preboarding`, or `Joined`.
4. **Total Joined Count**: Successfully onboarded candidates.
5. **Overall Avg TAT**: Mean hiring turnaround time in days compared against corporate benchmark target (30 days).

### 4. 4 Comprehensive Dashboard Tabs
- **Tab 1: Analytics & Overview**:
  - **Hiring Speed (TAT Trend Line Chart)**: Track turnaround time over `7d`, `15d`, `30d`, `60d`, or `90d` timeframes with target benchmark comparison.
  - **Candidate Source Mix (Doughnut Chart)**: Visual breakdown of candidate sources (`LinkedIn`, `Referral`, `Naukri`, `Agency`, `Direct`).
  - **Active Pipeline Funnel (Bar Chart)**: End-to-end stage conversion volume from `Shortlisted` to `Joined`.
- **Tab 2: Candidate Pipeline Drilldown**:
  - Filterable by Department, Stage, Source, and global search query.
  - Color-coded badges for all 9 stages.
  - Per-row `Update Stage ➔` action button.
- **Tab 3: Offers & DOJ Tracker**:
  - Dedicated tracker for candidates in `Offered`, `Preboarding`, and `Joined`.
  - Displays offered CTC, offer date, expected DOJ, countdown status (`Joined`, `Joining Today`, `In X days`, `Past DOJ`).
  - Top metric highlights: Total Pipeline CTC, Average Offered CTC, and Upcoming Joinees.
- **Tab 4: Open Positions Log**:
  - Full requisition tracking table showing Auto ID, Department, Job Title, Requisition Type, Date Opened, and TAT performance status (`On Track`, `Approaching Target`, or `Breached`).

### 5. Interactive Modals & Workflows
1. **Google Sheets Cloud Sync Modal**: Setup, connection tester, and auto-sync timer options.
2. **Add Position Modal**: Auto-generated 3-letter prefix generator (e.g. `ENG`, `FIN`, `PRD`, `RSK`, `COL`) and live ID preview.
3. **Add Candidate Modal**: Context-aware department auto-fill and open role selector.
4. **Candidate Stage Progression Modal**: 9-stage progression with decisions, interview scheduling, remarks log, and conditional reveal of **Offer Date**, **Expected DOJ**, and **Offered CTC**.
5. **Bulk Upload Modal**: Raw spreadsheet paste area supporting TSV / CSV directly from Microsoft Excel or Google Sheets.

---

## 🚀 Quick Launch

1. Double-click **[`start_app.bat`](file:///c:/Users/Shailesh-1596_SC-710/Desktop/AI/start_app.bat)** or open **[`index.html`](file:///c:/Users/Shailesh-1596_SC-710/Desktop/AI/index.html)** in Google Chrome, Microsoft Edge, Firefox, or Brave.
2. The application opens instantly with zero build steps or external dependencies.
3. Connect your Google Sheet via the header **⚙️ Cloud Settings** icon anytime to switch from demo data to your live team sheet.

---

## 📂 Project Structure

```
c:\Users\Shailesh-1596_SC-710\Desktop\AI\
├── index.html               # Main single-page application entry point
├── google_apps_script.js    # Ready-to-deploy Google Sheets backend API script
├── start_app.bat            # 1-Click Windows Launcher
├── README.md                # Documentation & user manual
├── css\
│   └── styles.css           # Enterprise styling, custom scrollbars, modal animations
└── js\
    ├── seed.js              # Comprehensive enterprise seed data
    ├── db.js                # Reactive in-browser relational database engine
    ├── googleSync.js        # Google Sheets live synchronization engine
    ├── charts.js            # Chart.js visualization controllers
    ├── modals.js            # Modal controllers (Add Position, Add Candidate, Stage, Bulk, Cloud)
    └── app.js               # Main application router, filters, and UI events
```
