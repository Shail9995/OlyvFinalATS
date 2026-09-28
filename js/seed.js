/**
 * OLYV ATS - Enterprise Seed Data
 * Comprehensive realistic talent requisition and candidate pool
 */

(function (window) {
  'use strict';

  const departments = [
    { name: 'Engineering', code: 'ENG' },
    { name: 'Finance', code: 'FIN' },
    { name: 'Product', code: 'PRD' },
    { name: 'Risk', code: 'RSK' },
    { name: 'Collections', code: 'COL' }
  ];

  const positions = [
    // Engineering
    {
      id: 'ENG-SDE1-001',
      department: 'Engineering',
      jobTitle: 'SDE 1 (Frontend)',
      type: 'New',
      dateOpened: '2026-08-15',
      status: 'Active',
      targetTat: 30
    },
    {
      id: 'ENG-SDE1-002',
      department: 'Engineering',
      jobTitle: 'SDE 1 (Backend)',
      type: 'New',
      dateOpened: '2026-08-10',
      status: 'Active',
      targetTat: 30
    },
    {
      id: 'ENG-SDE2-001',
      department: 'Engineering',
      jobTitle: 'SDE 2 (Distributed Systems)',
      type: 'Replacement',
      dateOpened: '2026-08-01',
      status: 'Active',
      targetTat: 35
    },
    {
      id: 'ENG-LBE-001',
      department: 'Engineering',
      jobTitle: 'Lead Backend Engineer',
      type: 'New',
      dateOpened: '2026-08-20',
      status: 'Active',
      targetTat: 45
    },
    {
      id: 'ENG-DEV-001',
      department: 'Engineering',
      jobTitle: 'DevOps & Cloud Architect',
      type: 'Replacement',
      dateOpened: '2026-08-05',
      status: 'Active',
      targetTat: 30
    },

    // Finance
    {
      id: 'FIN-FM-001',
      department: 'Finance',
      jobTitle: 'Finance Manager',
      type: 'Replacement',
      dateOpened: '2026-08-08',
      status: 'Active',
      targetTat: 30
    },
    {
      id: 'FIN-SFA-001',
      department: 'Finance',
      jobTitle: 'Senior Financial Analyst',
      type: 'New',
      dateOpened: '2026-08-22',
      status: 'Active',
      targetTat: 25
    },
    {
      id: 'FIN-TAX-001',
      department: 'Finance',
      jobTitle: 'Taxation & Treasury Lead',
      type: 'New',
      dateOpened: '2026-07-28',
      status: 'Active',
      targetTat: 40
    },

    // Product
    {
      id: 'PRD-SPM-001',
      department: 'Product',
      jobTitle: 'Senior Product Manager',
      type: 'New',
      dateOpened: '2026-08-12',
      status: 'Active',
      targetTat: 35
    },
    {
      id: 'PRD-UXD-001',
      department: 'Product',
      jobTitle: 'Product Designer (UI/UX)',
      type: 'Replacement',
      dateOpened: '2026-08-18',
      status: 'Active',
      targetTat: 25
    },
    {
      id: 'PRD-APM-001',
      department: 'Product',
      jobTitle: 'Associate Product Manager',
      type: 'New',
      dateOpened: '2026-08-25',
      status: 'Active',
      targetTat: 20
    },

    // Risk
    {
      id: 'RSK-CRM-001',
      department: 'Risk',
      jobTitle: 'Credit Risk Manager',
      type: 'New',
      dateOpened: '2026-08-02',
      status: 'Active',
      targetTat: 30
    },
    {
      id: 'RSK-FRA-001',
      department: 'Risk',
      jobTitle: 'Fraud Risk Analyst',
      type: 'Replacement',
      dateOpened: '2026-08-14',
      status: 'Active',
      targetTat: 25
    },

    // Collections
    {
      id: 'COL-COM-001',
      department: 'Collections',
      jobTitle: 'Collections Operations Lead',
      type: 'New',
      dateOpened: '2026-08-06',
      status: 'Active',
      targetTat: 25
    },
    {
      id: 'COL-RTL-001',
      department: 'Collections',
      jobTitle: 'Recovery Team Lead',
      type: 'Replacement',
      dateOpened: '2026-08-16',
      status: 'Active',
      targetTat: 20
    }
  ];

  const candidates = [
    // Joined Candidates
    {
      id: 'CAND-1001',
      appDate: '2026-07-15',
      name: 'Aarav Mehta',
      email: 'aarav.mehta@example.com',
      mobile: '+91 98201 44821',
      department: 'Engineering',
      jobTitle: 'SDE 2 (Distributed Systems)',
      source: 'LinkedIn',
      recruiter: 'Ananya Sharma',
      status: 'Joined',
      ctc: '₹34 LPA',
      offerDate: '2026-08-10',
      expectedDoj: '2026-09-01',
      remarks: [
        { timestamp: '2026-07-16T10:00:00Z', stage: 'Shortlisted', decision: 'Selected', note: 'Top-tier profile from Flipkart, high concurrency experience.' },
        { timestamp: '2026-07-22T14:30:00Z', stage: 'Round 1', decision: 'Selected', note: 'Cleared DS & Algo round with optimal space-time complexities.' },
        { timestamp: '2026-07-28T11:00:00Z', stage: 'Round 2', decision: 'Selected', note: 'Strong system design: Kafka streaming and Redis caching architecture.' },
        { timestamp: '2026-08-02T16:00:00Z', stage: 'Round 3', decision: 'Selected', note: 'Director round approved, excellent cultural alignment.' },
        { timestamp: '2026-08-06T15:00:00Z', stage: 'HR Round', decision: 'Selected', note: 'Salary expectation aligned. Offer proposed.' },
        { timestamp: '2026-08-10T12:00:00Z', stage: 'Offered', decision: 'Selected', note: 'Official offer letter released for ₹34 LPA.' },
        { timestamp: '2026-09-01T09:30:00Z', stage: 'Joined', decision: 'Selected', note: 'Candidate onboarded successfully, laptop provisioned.' }
      ]
    },
    {
      id: 'CAND-1002',
      appDate: '2026-07-20',
      name: 'Radhika Sen',
      email: 'radhika.sen@example.com',
      mobile: '+91 98450 12890',
      department: 'Finance',
      jobTitle: 'Finance Manager',
      source: 'Referral',
      recruiter: 'Vikram Malhotra',
      status: 'Joined',
      ctc: '₹26 LPA',
      offerDate: '2026-08-14',
      expectedDoj: '2026-09-05',
      remarks: [
        { timestamp: '2026-07-21T11:00:00Z', stage: 'Shortlisted', decision: 'Selected', note: 'Referred by CFO. Chartered Accountant with 6 yrs exp.' },
        { timestamp: '2026-07-27T15:00:00Z', stage: 'Round 1', decision: 'Selected', note: 'Financial modeling and audit case study performed exceptionally.' },
        { timestamp: '2026-08-04T12:00:00Z', stage: 'Round 2', decision: 'Selected', note: 'Leadership interview with VP Finance was very positive.' },
        { timestamp: '2026-08-14T17:00:00Z', stage: 'Offered', decision: 'Selected', note: 'Offer accepted same day.' },
        { timestamp: '2026-09-05T09:00:00Z', stage: 'Joined', decision: 'Selected', note: 'Joined Delhi office, background verification completed.' }
      ]
    },
    {
      id: 'CAND-1003',
      appDate: '2026-07-25',
      name: 'Aditya Kulkarni',
      email: 'aditya.k@example.com',
      mobile: '+91 97112 55901',
      department: 'Collections',
      jobTitle: 'Collections Operations Lead',
      source: 'Naukri',
      recruiter: 'Sneha Iyer',
      status: 'Joined',
      ctc: '₹19 LPA',
      offerDate: '2026-08-18',
      expectedDoj: '2026-09-08',
      remarks: [
        { timestamp: '2026-07-26T09:00:00Z', stage: 'Shortlisted', decision: 'Selected', note: 'Deep experience in NBFC and retail lending collections.' },
        { timestamp: '2026-08-05T14:00:00Z', stage: 'Round 1', decision: 'Selected', note: 'Tested on regulatory compliance and field operations.' },
        { timestamp: '2026-08-18T16:00:00Z', stage: 'Offered', decision: 'Selected', note: 'Released offer letter.' },
        { timestamp: '2026-09-08T10:00:00Z', stage: 'Joined', decision: 'Selected', note: 'Completed day-1 induction.' }
      ]
    },

    // Offered & Preboarding Candidates
    {
      id: 'CAND-1004',
      appDate: '2026-08-02',
      name: 'Tanvi Deshmukh',
      email: 'tanvi.deshmukh@example.com',
      mobile: '+91 99203 77412',
      department: 'Product',
      jobTitle: 'Senior Product Manager',
      source: 'LinkedIn',
      recruiter: 'Priya Nair',
      status: 'Preboarding',
      ctc: '₹40 LPA',
      offerDate: '2026-08-28',
      expectedDoj: '2026-09-25',
      remarks: [
        { timestamp: '2026-08-03T10:00:00Z', stage: 'Shortlisted', decision: 'Selected', note: 'Led growth products at Swiggy, 7 years PM exp.' },
        { timestamp: '2026-08-11T16:00:00Z', stage: 'Round 1', decision: 'Selected', note: 'Product sense interview cleared with distinction.' },
        { timestamp: '2026-08-19T14:00:00Z', stage: 'Round 2', decision: 'Selected', note: 'Technical architecture & metrics roadmap presentation was top-tier.' },
        { timestamp: '2026-08-25T11:00:00Z', stage: 'HR Round', decision: 'Selected', note: 'Notice period negotiation completed (30 days).' },
        { timestamp: '2026-08-28T16:30:00Z', stage: 'Offered', decision: 'Selected', note: 'Offer released.' },
        { timestamp: '2026-09-02T10:00:00Z', stage: 'Preboarding', decision: 'Selected', note: 'Preboarding initiated: BGV documents submitted.' }
      ]
    },
    {
      id: 'CAND-1005',
      appDate: '2026-08-05',
      name: 'Siddharth Varma',
      email: 'siddharth.v@example.com',
      mobile: '+91 98710 33201',
      department: 'Engineering',
      jobTitle: 'Lead Backend Engineer',
      source: 'Agency',
      recruiter: 'Ananya Sharma',
      status: 'Offered',
      ctc: '₹48 LPA',
      offerDate: '2026-09-02',
      expectedDoj: '2026-10-01',
      remarks: [
        { timestamp: '2026-08-06T12:00:00Z', stage: 'Shortlisted', decision: 'Selected', note: 'Agency submission from Michael Page.' },
        { timestamp: '2026-08-16T15:00:00Z', stage: 'Round 1', decision: 'Selected', note: 'Excellent Go / Distributed microservices mastery.' },
        { timestamp: '2026-08-24T17:00:00Z', stage: 'Round 2', decision: 'Selected', note: 'VP Engineering endorsed for Lead position.' },
        { timestamp: '2026-09-02T18:00:00Z', stage: 'Offered', decision: 'Selected', note: 'Offer rolled out: ₹48 LPA including performance bonus.' }
      ]
    },
    {
      id: 'CAND-1006',
      appDate: '2026-08-12',
      name: 'Pooja Hegde',
      email: 'pooja.hegde@example.com',
      mobile: '+91 98199 88320',
      department: 'Risk',
      jobTitle: 'Credit Risk Manager',
      source: 'LinkedIn',
      recruiter: 'Rohan Verma',
      status: 'Offered',
      ctc: '₹31 LPA',
      offerDate: '2026-09-06',
      expectedDoj: '2026-09-28',
      remarks: [
        { timestamp: '2026-08-13T10:00:00Z', stage: 'Shortlisted', decision: 'Selected', note: 'Ex-HDFC credit underwriting lead.' },
        { timestamp: '2026-08-21T11:00:00Z', stage: 'Round 1', decision: 'Selected', note: 'In-depth credit scorecard modeling skills.' },
        { timestamp: '2026-08-30T15:00:00Z', stage: 'Round 2', decision: 'Selected', note: 'Chief Risk Officer gave green signal.' },
        { timestamp: '2026-09-06T14:00:00Z', stage: 'Offered', decision: 'Selected', note: 'Offer delivered.' }
      ]
    },
    {
      id: 'CAND-1007',
      appDate: '2026-08-08',
      name: 'Nikhil Bansal',
      email: 'nikhil.b@example.com',
      mobile: '+91 99100 44521',
      department: 'Engineering',
      jobTitle: 'DevOps & Cloud Architect',
      source: 'Direct',
      recruiter: 'Ananya Sharma',
      status: 'Preboarding',
      ctc: '₹38 LPA',
      offerDate: '2026-08-30',
      expectedDoj: '2026-09-20',
      remarks: [
        { timestamp: '2026-08-09T09:00:00Z', stage: 'Shortlisted', decision: 'Selected', note: 'Kubernetes CKA certified, AWS & GCP expert.' },
        { timestamp: '2026-08-18T16:00:00Z', stage: 'Round 1', decision: 'Selected', note: 'Terraform infrastructure-as-code live test passed.' },
        { timestamp: '2026-08-26T14:00:00Z', stage: 'Round 2', decision: 'Selected', note: 'Architectural drilldown on disaster recovery.' },
        { timestamp: '2026-08-30T17:00:00Z', stage: 'Offered', decision: 'Selected', note: 'Offer accepted.' },
        { timestamp: '2026-09-04T11:00:00Z', stage: 'Preboarding', decision: 'Selected', note: 'Welcome kit and ID creation underway.' }
      ]
    },

    // In-Progress Active Candidates (HR Round, Round 3, Round 2, Round 1, Shortlisted)
    {
      id: 'CAND-1008',
      appDate: '2026-08-15',
      name: 'Ishaan Chopra',
      email: 'ishaan.c@example.com',
      mobile: '+91 97204 11234',
      department: 'Engineering',
      jobTitle: 'SDE 1 (Frontend)',
      source: 'LinkedIn',
      recruiter: 'Ananya Sharma',
      status: 'HR Round',
      ctc: '',
      expectedDoj: '',
      remarks: [
        { timestamp: '2026-08-16T10:00:00Z', stage: 'Shortlisted', decision: 'Selected', note: 'Strong portfolio with React & WebGL work.' },
        { timestamp: '2026-08-25T15:00:00Z', stage: 'Round 1', decision: 'Selected', note: 'Cleared JS coding task with 98% test coverage.' },
        { timestamp: '2026-09-02T11:30:00Z', stage: 'Round 2', decision: 'Selected', note: 'Component architecture and state management approved.' },
        { timestamp: '2026-09-08T14:00:00Z', stage: 'HR Round', decision: 'Pending', note: 'HR discussion scheduled for compensation fit.' }
      ]
    },
    {
      id: 'CAND-1009',
      appDate: '2026-08-18',
      name: 'Meera Nambiar',
      email: 'meera.n@example.com',
      mobile: '+91 98401 99281',
      department: 'Product',
      jobTitle: 'Product Designer (UI/UX)',
      source: 'Referral',
      recruiter: 'Priya Nair',
      status: 'Round 3',
      ctc: '',
      expectedDoj: '',
      remarks: [
        { timestamp: '2026-08-19T10:00:00Z', stage: 'Shortlisted', decision: 'Selected', note: 'Referral from Head of Design. Figma master.' },
        { timestamp: '2026-08-27T14:00:00Z', stage: 'Round 1', decision: 'Selected', note: 'Design critique round passed effortlessly.' },
        { timestamp: '2026-09-05T16:00:00Z', stage: 'Round 2', decision: 'Selected', note: 'App design challenge presentation scored 9.5/10.' }
      ]
    },
    {
      id: 'CAND-1010',
      appDate: '2026-08-20',
      name: 'Karan Singhal',
      email: 'karan.s@example.com',
      mobile: '+91 98110 55432',
      department: 'Finance',
      jobTitle: 'Senior Financial Analyst',
      source: 'Naukri',
      recruiter: 'Vikram Malhotra',
      status: 'Round 2',
      ctc: '',
      expectedDoj: '',
      remarks: [
        { timestamp: '2026-08-21T09:30:00Z', stage: 'Shortlisted', decision: 'Selected', note: 'CFA Level 2 candidate with fintech modeling exp.' },
        { timestamp: '2026-09-01T15:00:00Z', stage: 'Round 1', decision: 'Selected', note: 'Cash flow forecasting test cleared.' }
      ]
    },
    {
      id: 'CAND-1011',
      appDate: '2026-08-22',
      name: 'Ankit Aggarwal',
      email: 'ankit.ag@example.com',
      mobile: '+91 99991 22345',
      department: 'Engineering',
      jobTitle: 'SDE 1 (Backend)',
      source: 'LinkedIn',
      recruiter: 'Ananya Sharma',
      status: 'Round 2',
      ctc: '',
      expectedDoj: '',
      remarks: [
        { timestamp: '2026-08-23T11:00:00Z', stage: 'Shortlisted', decision: 'Selected', note: 'Java/Spring Boot and PostgreSQL specialist.' },
        { timestamp: '2026-09-03T16:00:00Z', stage: 'Round 1', decision: 'Selected', note: 'Live coding problem solved under 25 minutes.' }
      ]
    },
    {
      id: 'CAND-1012',
      appDate: '2026-08-24',
      name: 'Divya Sundaram',
      email: 'divya.s@example.com',
      mobile: '+91 98840 77123',
      department: 'Risk',
      jobTitle: 'Fraud Risk Analyst',
      source: 'Direct',
      recruiter: 'Rohan Verma',
      status: 'Round 1',
      ctc: '',
      expectedDoj: '',
      remarks: [
        { timestamp: '2026-08-25T10:00:00Z', stage: 'Shortlisted', decision: 'Selected', note: 'Python & SQL for transaction fraud patterns.' }
      ]
    },
    {
      id: 'CAND-1013',
      appDate: '2026-08-26',
      name: 'Sameer Joshi',
      email: 'sameer.j@example.com',
      mobile: '+91 98230 44109',
      department: 'Collections',
      jobTitle: 'Recovery Team Lead',
      source: 'Naukri',
      recruiter: 'Sneha Iyer',
      status: 'Round 1',
      ctc: '',
      expectedDoj: '',
      remarks: [
        { timestamp: '2026-08-27T14:00:00Z', stage: 'Shortlisted', decision: 'Selected', note: 'Team management experience with 15 direct reports.' }
      ]
    },
    {
      id: 'CAND-1014',
      appDate: '2026-08-28',
      name: 'Ritu Ganguly',
      email: 'ritu.g@example.com',
      mobile: '+91 98310 66504',
      department: 'Product',
      jobTitle: 'Associate Product Manager',
      source: 'Referral',
      recruiter: 'Priya Nair',
      status: 'Round 1',
      ctc: '',
      expectedDoj: '',
      remarks: [
        { timestamp: '2026-08-29T11:00:00Z', stage: 'Shortlisted', decision: 'Selected', note: 'IIT Kharagpur grad with 1.5 yrs APM experience.' }
      ]
    },
    {
      id: 'CAND-1015',
      appDate: '2026-08-30',
      name: 'Varun Grover',
      email: 'varun.g@example.com',
      mobile: '+91 98101 22899',
      department: 'Engineering',
      jobTitle: 'SDE 1 (Frontend)',
      source: 'LinkedIn',
      recruiter: 'Ananya Sharma',
      status: 'Shortlisted',
      ctc: '',
      expectedDoj: '',
      remarks: [
        { timestamp: '2026-08-30T15:00:00Z', stage: 'Shortlisted', decision: 'Pending', note: 'Resume screened, scheduled for technical screening call.' }
      ]
    },
    {
      id: 'CAND-1016',
      appDate: '2026-09-01',
      name: 'Zoya Siddiqui',
      email: 'zoya.s@example.com',
      mobile: '+91 98920 11980',
      department: 'Finance',
      jobTitle: 'Taxation & Treasury Lead',
      source: 'Agency',
      recruiter: 'Vikram Malhotra',
      status: 'Shortlisted',
      ctc: '',
      expectedDoj: '',
      remarks: [
        { timestamp: '2026-09-01T12:00:00Z', stage: 'Shortlisted', decision: 'Pending', note: 'Big 4 GST & Corporate tax advisory background.' }
      ]
    },
    {
      id: 'CAND-1017',
      appDate: '2026-09-02',
      name: 'Deepak Rawat',
      email: 'deepak.rawat@example.com',
      mobile: '+91 97170 33810',
      department: 'Engineering',
      jobTitle: 'SDE 1 (Backend)',
      source: 'Direct',
      recruiter: 'Ananya Sharma',
      status: 'Shortlisted',
      ctc: '',
      expectedDoj: '',
      remarks: [
        { timestamp: '2026-09-02T16:00:00Z', stage: 'Shortlisted', decision: 'Pending', note: 'Applied on careers portal.' }
      ]
    },
    {
      id: 'CAND-1018',
      appDate: '2026-09-04',
      name: 'Kavita Menon',
      email: 'kavita.m@example.com',
      mobile: '+91 98470 55192',
      department: 'Risk',
      jobTitle: 'Credit Risk Manager',
      source: 'Referral',
      recruiter: 'Rohan Verma',
      status: 'Shortlisted',
      ctc: '',
      expectedDoj: '',
      remarks: [
        { timestamp: '2026-09-04T14:30:00Z', stage: 'Shortlisted', decision: 'Pending', note: 'Referred by Risk Director.' }
      ]
    },

    // Rejected Candidates
    {
      id: 'CAND-1019',
      appDate: '2026-08-01',
      name: 'Manish Tiwari',
      email: 'manish.t@example.com',
      mobile: '+91 98210 99401',
      department: 'Engineering',
      jobTitle: 'SDE 2 (Distributed Systems)',
      source: 'Naukri',
      recruiter: 'Ananya Sharma',
      status: 'Rejected',
      ctc: '',
      expectedDoj: '',
      remarks: [
        { timestamp: '2026-08-02T10:00:00Z', stage: 'Shortlisted', decision: 'Selected', note: 'Resume looked promising.' },
        { timestamp: '2026-08-10T15:00:00Z', stage: 'Round 1', decision: 'Rejected', note: 'Struggled with concurrency and multithreading fundamentals.' }
      ]
    },
    {
      id: 'CAND-1020',
      appDate: '2026-08-04',
      name: 'Shweta Mathur',
      email: 'shweta.m@example.com',
      mobile: '+91 98180 44219',
      department: 'Product',
      jobTitle: 'Senior Product Manager',
      source: 'LinkedIn',
      recruiter: 'Priya Nair',
      status: 'Rejected',
      ctc: '',
      expectedDoj: '',
      remarks: [
        { timestamp: '2026-08-05T11:00:00Z', stage: 'Shortlisted', decision: 'Selected', note: 'Experience in e-commerce.' },
        { timestamp: '2026-08-14T16:00:00Z', stage: 'Round 1', decision: 'Selected', note: 'Good communication.' },
        { timestamp: '2026-08-22T14:00:00Z', stage: 'Round 2', decision: 'Rejected', note: 'Weak analytical and business metrics depth.' }
      ]
    },
    {
      id: 'CAND-1021',
      appDate: '2026-08-07',
      name: 'Rakesh Nair',
      email: 'rakesh.nair@example.com',
      mobile: '+91 98451 88302',
      department: 'Collections',
      jobTitle: 'Collections Operations Lead',
      source: 'Agency',
      recruiter: 'Sneha Iyer',
      status: 'Rejected',
      ctc: '',
      expectedDoj: '',
      remarks: [
        { timestamp: '2026-08-08T10:00:00Z', stage: 'Shortlisted', decision: 'Selected', note: 'Agency profile.' },
        { timestamp: '2026-08-15T11:00:00Z', stage: 'Round 1', decision: 'Rejected', note: 'Candidate looking for purely remote roles, position is hybrid.' }
      ]
    },
    {
      id: 'CAND-1022',
      appDate: '2026-08-10',
      name: 'Farhan Akhtar',
      email: 'farhan.a@example.com',
      mobile: '+91 98200 66129',
      department: 'Engineering',
      jobTitle: 'DevOps & Cloud Architect',
      source: 'LinkedIn',
      recruiter: 'Ananya Sharma',
      status: 'Rejected',
      ctc: '',
      expectedDoj: '',
      remarks: [
        { timestamp: '2026-08-11T12:00:00Z', stage: 'Shortlisted', decision: 'Selected', interviewer: 'Ananya Sharma', note: 'Shortlisted for interview.' },
        { timestamp: '2026-08-20T16:30:00Z', stage: 'Round 1', decision: 'Rejected', interviewer: 'Karthik Raja', note: 'Failed hands-on debugging challenge.' }
      ]
    },

    // Dropped / Declined Offers with Reasons
    {
      id: 'CAND-1023',
      appDate: '2026-07-28',
      name: 'Abhishek Saxena',
      email: 'abhishek.s@example.com',
      mobile: '+91 98112 33451',
      department: 'Engineering',
      jobTitle: 'Lead Backend Engineer',
      source: 'LinkedIn',
      recruiter: 'Ananya Sharma',
      status: 'Dropped',
      ctc: '₹46 LPA',
      offerDate: '2026-08-22',
      expectedDoj: '2026-09-15',
      declineReason: 'Competitive Counter-Offer',
      declineNotes: 'Candidate accepted higher counter-offer with equity buyback from current startup.',
      remarks: [
        { timestamp: '2026-07-29T10:00:00Z', stage: 'Shortlisted', decision: 'Selected', interviewer: 'Ananya Sharma', note: 'Ex-Zomato staff engineer with high scale Go background.' },
        { timestamp: '2026-08-05T14:00:00Z', stage: 'Round 1', decision: 'Selected', interviewer: 'Karthik Raja', note: 'Superb architecture deep dive.' },
        { timestamp: '2026-08-14T16:00:00Z', stage: 'Round 2', decision: 'Selected', interviewer: 'Amitabh Roy', note: 'Director endorsed with high priority.' },
        { timestamp: '2026-08-22T17:00:00Z', stage: 'Offered', decision: 'Selected', interviewer: 'Priya Nair', note: 'Rolled out ₹46 LPA offer.' },
        { timestamp: '2026-09-02T11:00:00Z', stage: 'Dropped', decision: 'Rejected', interviewer: 'Ananya Sharma', note: 'Declined: Accepted counter-offer from current company.' }
      ]
    },
    {
      id: 'CAND-1024',
      appDate: '2026-08-02',
      name: 'Sanya Mirza',
      email: 'sanya.m@example.com',
      mobile: '+91 97180 99281',
      department: 'Product',
      jobTitle: 'Senior Product Manager',
      source: 'Referral',
      recruiter: 'Priya Nair',
      status: 'Dropped',
      ctc: '₹38 LPA',
      offerDate: '2026-08-26',
      expectedDoj: '2026-09-22',
      declineReason: 'Compensation Expectations Unmet',
      declineNotes: 'Wanted ₹44L fixed component without performance linkage.',
      remarks: [
        { timestamp: '2026-08-03T11:00:00Z', stage: 'Shortlisted', decision: 'Selected', interviewer: 'Priya Nair', note: 'Referred by VP Product.' },
        { timestamp: '2026-08-12T15:00:00Z', stage: 'Round 1', decision: 'Selected', interviewer: 'Rohit Joshi', note: 'Product teardown and execution metrics solid.' },
        { timestamp: '2026-08-20T17:00:00Z', stage: 'Round 2', decision: 'Selected', interviewer: 'Amitabh Roy', note: 'Strategy presentation approved.' },
        { timestamp: '2026-08-26T14:00:00Z', stage: 'Offered', decision: 'Selected', interviewer: 'Priya Nair', note: 'Offer released.' },
        { timestamp: '2026-09-04T12:00:00Z', stage: 'Dropped', decision: 'Rejected', interviewer: 'Priya Nair', note: 'Declined: Comp mismatch.' }
      ]
    },
    {
      id: 'CAND-1025',
      appDate: '2026-08-10',
      name: 'Vikas Taneja',
      email: 'vikas.t@example.com',
      mobile: '+91 98450 77112',
      department: 'Risk',
      jobTitle: 'Credit Risk Manager',
      source: 'Agency',
      recruiter: 'Rohan Verma',
      status: 'Dropped',
      ctc: '₹29 LPA',
      offerDate: '2026-09-01',
      expectedDoj: '2026-09-29',
      declineReason: 'Location & Relocation Constraints',
      declineNotes: 'Unable to relocate to Bengaluru due to elderly parent care.',
      remarks: [
        { timestamp: '2026-08-11T10:00:00Z', stage: 'Shortlisted', decision: 'Selected', interviewer: 'Rohan Verma', note: 'Agency candidate.' },
        { timestamp: '2026-08-19T14:30:00Z', stage: 'Round 1', decision: 'Selected', interviewer: 'Shreya Das', note: 'Cleared risk modeling round.' },
        { timestamp: '2026-08-27T16:00:00Z', stage: 'Round 2', decision: 'Selected', interviewer: 'Shreya Das', note: 'Risk committee round passed.' },
        { timestamp: '2026-09-01T15:00:00Z', stage: 'Offered', decision: 'Selected', interviewer: 'Rohan Verma', note: 'Offered ₹29 LPA.' },
        { timestamp: '2026-09-08T10:00:00Z', stage: 'Dropped', decision: 'Rejected', interviewer: 'Rohan Verma', note: 'Declined: Relocation issue.' }
      ]
    }
  ];

  window.OLYV_SEED_DATA = {
    departments,
    positions,
    candidates
  };

  // If DB already instantiated before seed, hydrate it
  if (window.OlyvDB && (!window.OlyvDB.data.positions || window.OlyvDB.data.positions.length === 0)) {
    window.OlyvDB.init();
  }
})(window);
