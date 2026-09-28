import { Project } from '../types';

export const projects: Project[] = [
  {
    id: 'erp',
    name: 'College ERP System',
    description: 'Centralized enterprise platform for student administration, course registrations, timetable generation, and department workflow automation.',
    status: 'ongoing',
    manager: 'Senthil P',
    leader: 'Karthik M',
    team: 'Team Alpha',
    developers: 4,
    developerNames: ['Ravi Kumar', 'Anita Roy', 'Priya S', 'Suresh M'],
    started: 'Aug 1, 2026',
    targetDate: 'Dec 20, 2026',
    progress: 65,
    health: 'On Track',
    tasksDone: 28,
    blockers: 6,
    activeDevs: 3,
    inProgress: 2,
    modules: [
      { id: 'm1', name: 'Database & Architecture Design', description: 'ER diagrams, PostgreSQL schemas & indexing strategy', weightPercentage: 20, status: 'completed' },
      { id: 'm2', name: 'UI / UX Wireframing', description: 'Figma prototypes for student and admin dashboard', weightPercentage: 15, status: 'completed' },
      { id: 'm3', name: 'Backend API Development', description: 'REST APIs for registration, timetable & grading', weightPercentage: 30, status: 'completed' },
      { id: 'm4', name: 'Frontend UI Implementation', description: 'React screens for registration & timetable modules', weightPercentage: 25, status: 'in_progress' },
      { id: 'm5', name: 'UAT & Deployment', description: 'User acceptance testing, security audit & production launch', weightPercentage: 10, status: 'todo' }
    ]
  },
  {
    id: 'attendance',
    name: 'Attendance App',
    description: 'Biometric & QR-based mobile attendance tracker for students and faculty with real-time sync and automated anomaly alerts.',
    status: 'ongoing',
    manager: 'Senthil P',
    leader: 'Senthil K',
    team: 'Team Beta',
    developers: 3,
    developerNames: ['Vikram R', 'Meera N', 'Arun Kumar'],
    started: 'Sep 1, 2026',
    targetDate: 'Nov 15, 2026',
    progress: 30,
    health: 'Slightly Behind',
    tasksDone: 11,
    blockers: 2,
    activeDevs: 2,
    inProgress: 3,
    modules: [
      { id: 'm201', name: 'Requirements & System Specs', description: 'QR scanning logic & hardware integration specs', weightPercentage: 15, status: 'completed' },
      { id: 'm202', name: 'UI Mockups & Mobile Layout', description: 'React Native screens for QR scanner & student list', weightPercentage: 15, status: 'completed' },
      { id: 'm203', name: 'Backend Sync & DB Architecture', description: 'Real-time WebSocket & attendance logging endpoints', weightPercentage: 35, status: 'in_progress' },
      { id: 'm204', name: 'Biometric & Scanner Integration', description: 'Camera hardware access & biometric verification', weightPercentage: 25, status: 'todo' },
      { id: 'm205', name: 'Production Deployment', description: 'App store release & server deployment', weightPercentage: 10, status: 'todo' }
    ]
  },
  {
    id: 'library',
    name: 'Library Management System',
    description: 'Digital cataloging, book issuance, automated fine calculation, and e-resource repository system for campus libraries.',
    status: 'ongoing',
    manager: 'Vijay R',
    leader: 'Vijay S',
    team: 'Team Gamma',
    developers: 3,
    developerNames: ['Deepak V', 'Kavitha P', 'Siddharth T'],
    started: 'Jul 15, 2026',
    targetDate: 'Oct 30, 2026',
    progress: 80,
    health: 'On Track',
    tasksDone: 42,
    blockers: 1,
    activeDevs: 3,
    inProgress: 2,
    modules: [
      { id: 'm301', name: 'Catalog & ISBN Database Schema', description: 'Database design for 50k+ books & electronic media', weightPercentage: 20, status: 'completed' },
      { id: 'm302', name: 'UI Implementation', description: 'Search portal & checkout interface', weightPercentage: 20, status: 'completed' },
      { id: 'm303', name: 'Automated Fine Calculation Engine', description: 'Cron job and payment integration for late returns', weightPercentage: 40, status: 'completed' },
      { id: 'm304', name: 'Digital E-Resource Repository', description: 'PDF upload and reader integration', weightPercentage: 20, status: 'todo' }
    ]
  },
  {
    id: 'fee',
    name: 'Fee Payment System',
    description: 'Secure payment gateway integration for tuition, hostel, and exam fees with instant receipt generation and ERP ledger sync.',
    status: 'ongoing',
    manager: 'Vijay R',
    leader: 'Kumar M',
    team: 'Team Delta',
    developers: 5,
    developerNames: ['Rohan Gupta', 'Neha Sharma', 'Aakash V', 'Divya M', 'Karan S'],
    started: 'Sep 5, 2026',
    targetDate: 'Jan 15, 2027',
    progress: 15,
    health: 'Behind',
    tasksDone: 4,
    blockers: 3,
    activeDevs: 4,
    inProgress: 5,
    modules: [
      { id: 'm401', name: 'Payment Gateway Integration Specs', description: 'Razorpay / RazorPay API architecture & webhooks', weightPercentage: 15, status: 'completed' },
      { id: 'm402', name: 'Fee Ledger & ERP Sync Engine', description: 'Database schema for transaction ledgers', weightPercentage: 35, status: 'todo' },
      { id: 'm403', name: 'Student UI Payment Portal', description: 'Payment screens & invoice generation', weightPercentage: 35, status: 'in_progress' },
      { id: 'm404', name: 'Security Audit & Compliance', description: 'PCI-DSS validation & encryption testing', weightPercentage: 15, status: 'todo' }
    ]
  },
  {
    id: 'portal',
    name: 'Student Portal',
    description: 'Self-service web portal for students to check grades, request official transcripts, download hall tickets, and track attendance.',
    status: 'completed',
    manager: 'Vijay R',
    leader: 'Vijay S',
    team: 'Team Alpha',
    developers: 3,
    developerNames: ['Anita Roy', 'Ravi Kumar', 'Priya S'],
    started: 'Aug 1, 2026',
    ended: 'Aug 30, 2026',
    targetDate: 'Aug 31, 2026',
    progress: 100,
    health: 'Delivered on time',
    tasksDone: 56,
    blockers: 0,
    activeDevs: 0,
    inProgress: 0,
    modules: [
      { id: 'm501', name: 'UI Wireframing & Design System', description: 'Component library & responsive templates', weightPercentage: 25, status: 'completed' },
      { id: 'm502', name: 'Grade & Transcript APIs', description: 'Fast search & PDF transcript generation', weightPercentage: 45, status: 'completed' },
      { id: 'm503', name: 'Deployment & SSL Config', description: 'Production hosting and security setup', weightPercentage: 30, status: 'completed' }
    ]
  },
  {
    id: 'hostel',
    name: 'Hostel Management System',
    description: 'Allotment engine, gate pass workflow, mess billing, and room inventory management for campus accommodation.',
    status: 'completed',
    manager: 'Senthil P',
    leader: 'Karthik M',
    team: 'Team Beta',
    developers: 4,
    developerNames: ['Vikram R', 'Meera N', 'Suresh M', 'Arun Kumar'],
    started: 'Jul 1, 2026',
    ended: 'Jul 20, 2026',
    targetDate: 'Jul 25, 2026',
    progress: 100,
    health: 'Delivered on time',
    tasksDone: 38,
    blockers: 0,
    activeDevs: 0,
    inProgress: 0,
    modules: [
      { id: 'm601', name: 'Room Inventory & Allocation Engine', description: 'Algorithmic room allocation system', weightPercentage: 50, status: 'completed' },
      { id: 'm602', name: 'Gate Pass & Mess Workflow', description: 'Digital QR gate pass and billing', weightPercentage: 50, status: 'completed' }
    ]
  },
  {
    id: 'transport',
    name: 'Transport Tracking App',
    description: 'Live GPS location tracking, route management, and driver assignment system for university shuttle buses.',
    status: 'hold',
    manager: 'Vijay R',
    leader: 'Kumar M',
    team: 'Team Gamma',
    developers: 2,
    developerNames: ['Deepak V', 'Kavitha P'],
    started: 'Aug 20, 2026',
    targetDate: 'Nov 30, 2026',
    progress: 22,
    health: 'Behind',
    tasksDone: 6,
    blockers: 2,
    activeDevs: 0,
    inProgress: 1,
    modules: [
      { id: 'm701', name: 'GPS Sensor & Tracking API', description: 'Telemetry integration for shuttle buses', weightPercentage: 22, status: 'completed' },
      { id: 'm702', name: 'Driver & Route Management UI', description: 'Interactive Mapbox dashboard for routes', weightPercentage: 78, status: 'todo' }
    ]
  }
];


export const projectWeeks = [
{ label: 'Week 1', tasks: 8, blockers: 1, health: 'Good' as const },
{ label: 'Week 2', tasks: 10, blockers: 0, health: 'Good' as const },
{ label: 'Week 3', tasks: 6, blockers: 3, health: 'Slow' as const },
{ label: 'Week 4', tasks: 4, blockers: 2, health: 'Slow' as const },
{ label: 'This Week', tasks: 3, blockers: 3, health: 'Behind' as const }];


export const activeBlockers = [
{
  id: 'b1',
  title: 'API integration issue',
  since: 'Since Sep 6',
  team: 'Team Alpha',
  state: 'Unresolved' as const
},
{
  id: 'b2',
  title: 'Server access needed',
  since: 'Since Sep 7',
  team: 'Team Alpha',
  state: 'Unresolved' as const
},
{
  id: 'b3',
  title: 'Design approval pending',
  since: 'Since Sep 5',
  team: 'Team Alpha',
  state: 'In Discussion' as const
}];