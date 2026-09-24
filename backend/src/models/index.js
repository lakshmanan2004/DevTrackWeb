const { Schema, model, Types } = require('mongoose');

const TargetedFeedbackSchema = new Schema(
  {
    id: String,
    highlightedText: String,
    comment: String,
    screenshotUrl: String,
    screenshotName: String,
    createdAt: Date
  },
  { _id: false }
);

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['developer', 'leader', 'manager', 'admin'], required: true },
  initials: String,
  github: { type: String, default: '' },
  active: { type: Boolean, default: true },
  team: { type: Types.ObjectId, ref: 'Team', default: null },
  jobTitle: { type: String, default: 'Developer' },
  joinedAt: { type: Date, default: Date.now },
  lastSeenAt: { type: Date, default: null }
});

const TeamSchema = new Schema({
  name: { type: String, required: true },
  project: { type: Types.ObjectId, ref: 'Project', default: null },
  leader: { type: Types.ObjectId, ref: 'User', required: true },
  members: [{ type: Types.ObjectId, ref: 'User' }]
});

const ProjectSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  status: { type: String, enum: ['ongoing', 'completed', 'hold'], default: 'ongoing' },
  manager: { type: Types.ObjectId, ref: 'User', required: true },
  team: { type: Types.ObjectId, ref: 'Team', required: true },
  repoUrl: { type: String, default: '' },
  startedAt: { type: Date, required: true },
  targetDate: { type: Date, default: null },
  endedAt: { type: Date, default: null },
  plannedTasks: { type: Number, default: 50 }
});

const WorkLogSchema = new Schema({
  developer: { type: Types.ObjectId, ref: 'User', required: true },
  team: { type: Types.ObjectId, ref: 'Team' },
  project: { type: Types.ObjectId, ref: 'Project' },
  date: { type: String, required: true }, // YYYY-MM-DD (local)
  hourSlot: { type: Number, required: true },
  task: { type: String, required: true },
  status: { type: String, enum: ['todo', 'progress', 'done', 'blocked'], default: 'progress' },
  description: { type: String, required: true },
  submittedAt: { type: Date, default: Date.now },
  activeMinutes: { type: Number, default: 0 },
  attachmentName: { type: String, default: '' },
  attachmentUrl: { type: String, default: '' },
  commitsCount: { type: Number, default: 0 },
  commitUrl: { type: String, default: '' },
  review: {
    type: String,
    enum: ['approved', 'pending', 'rejected', 'changes_requested'],
    default: 'pending'
  },
  reviewNote: { type: String, default: '' },
  targetedFeedback: [TargetedFeedbackSchema],
  blocker: { type: String, default: '' },
  wordCount: { type: Number, default: 0 },
  resubmissions: [{ text: String, at: Date }]
});
WorkLogSchema.index({ developer: 1, date: 1, hourSlot: 1 }, { unique: true });

const CommitSchema = new Schema({
  developer: { type: Types.ObjectId, ref: 'User', required: true },
  project: { type: Types.ObjectId, ref: 'Project' },
  team: { type: Types.ObjectId, ref: 'Team' },
  message: { type: String, required: true },
  branch: { type: String, default: 'main' },
  files: { type: Number, default: 1 },
  sha: { type: String, required: true },
  url: { type: String, default: '' },
  committedAt: { type: Date, default: Date.now },
  date: { type: String, required: true }
});

const EodReportSchema = new Schema({
  developer: { type: Types.ObjectId, ref: 'User', required: true },
  project: { type: Types.ObjectId, ref: 'Project' },
  team: { type: Types.ObjectId, ref: 'Team' },
  date: { type: String, required: true },
  summary: { type: String, required: true },
  carryForward: { type: String, default: '' },
  blockers: { type: String, default: '' },
  rating: { type: Number, default: 3 },
  checklist: [{ label: String, checked: Boolean }],
  wordCount: { type: Number, default: 0 },
  submittedAt: { type: Date, default: Date.now }
});
EodReportSchema.index({ developer: 1, date: 1 }, { unique: true });

const TaskSchema = new Schema({
  title: { type: String, required: true },
  note: { type: String, default: '' },
  priority: { type: String, enum: ['urgent', 'high', 'medium'], default: 'medium' },
  dueDate: { type: String, default: 'Today 5:00 PM' },
  assignee: { type: Types.ObjectId, ref: 'User', required: true },
  assignedBy: { type: Types.ObjectId, ref: 'User', required: true },
  assignedByRole: { type: String, enum: ['TL', 'PM'], default: 'TL' },
  assignedByName: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' },
  type: {
    type: String,
    enum: ['targeted_feedback', 'manual_assignment', 'blocker_resolution'],
    default: 'manual_assignment'
  },
  highlightedText: { type: String, default: '' },
  linkedLog: { type: Types.ObjectId, ref: 'WorkLog', default: null },
  createdAt: { type: Date, default: Date.now }
});

const AlertSchema = new Schema({
  // prevents duplicate cron alerts, e.g. missed:{devId}:{date}:{slot}
  dedupeKey: { type: String, index: { unique: true, sparse: true } },
  audience: { type: String, enum: ['developer', 'leader', 'manager'], required: true },
  user: { type: Types.ObjectId, ref: 'User' }, // recipient for audience=developer
  team: { type: Types.ObjectId, ref: 'Team' }, // scoping for leader audience
  project: { type: Types.ObjectId, ref: 'Project' },
  managerScope: [{ type: Types.ObjectId, ref: 'User' }], // managers who should see it
  developerId: { type: Types.ObjectId, ref: 'User' }, // the dev the alert is about
  kind: { type: String, default: '' }, // developer alerts: reminder|approval|rejection|eod
  severity: { type: String, default: '' }, // leader alerts: critical|warning|flag|seen
  category: { type: String, default: '' },
  who: { type: String, default: '' },
  title: { type: String, required: true },
  body: { type: String, default: '' },
  meta: { type: String, default: '' },
  detection: { type: String, default: '' },
  idleTime: { type: String, default: '' },
  lastActive: { type: String, default: '' },
  actions: [{ type: String }],
  timeline: [{ at: String, what: String }],
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const SettingSchema = new Schema({
  workStartHour: { type: Number, default: 8 },
  workEndHour: { type: Number, default: 16 },
  workEndMinute: { type: Number, default: 30 },
  workDays: { type: [Number], default: [1, 2, 3, 4, 5] }, // 0=Sun
  intervalMinutes: { type: Number, default: 60 },
  minWords: { type: Number, default: 30 },
  graceMinutes: { type: Number, default: 10 },
  idleMinutes: { type: Number, default: 10 },
  batchThreshold: { type: Number, default: 3 },
  notifications: {
    push: { type: Boolean, default: true },
    sound: { type: Boolean, default: true },
    email: { type: Boolean, default: true },
    autoReject: { type: Boolean, default: false }
  },
  eodDeadline: { type: String, default: '4:30 PM' }
});
SettingSchema.statics.get = async function () {
  let s = await this.findOne();
  if (!s) s = await this.create({});
  return s;
};

const User = model('User', UserSchema);
const Team = model('Team', TeamSchema);
const Project = model('Project', ProjectSchema);
const WorkLog = model('WorkLog', WorkLogSchema);
const Commit = model('Commit', CommitSchema);
const EodReport = model('EodReport', EodReportSchema);
const Task = model('Task', TaskSchema);
const Alert = model('Alert', AlertSchema);
const Setting = model('Setting', SettingSchema);

module.exports = { User, Team, Project, WorkLog, Commit, EodReport, Task, Alert, Setting };
