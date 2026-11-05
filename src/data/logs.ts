import { WorkLog } from '../types';

export const todayLogs: WorkLog[] = [
{
  id: 'l8',
  hourLabel: '8 AM',
  hourSlot: 8,
  task: 'Setup development environment',
  status: 'done',
  description:
  'Configured webpack, installed dependencies, verified dev server. Fixed missing environment variables in the .env file and documented the setup steps for the rest of Team Alpha so nobody repeats the same work.',
  submittedAt: '8:51 AM',
  activeMinutes: 52,
  attachment: 'screenshot.png',
  commits: 1,
  review: 'approved',
  reviewNote: 'Approved by Karthik (Team Lead)',
  project: 'FinTech Cloud Platform',
  wordCount: 38
},
{
  id: 'l9',
  hourLabel: '9 AM',
  hourSlot: 9,
  task: 'JWT Authentication module',
  status: 'progress',
  description:
  'Built login and register API endpoints with JWT token generation and bcrypt password hashing. Tested all five cases in Postman including invalid credentials and expired tokens. All tests passing on the local server.',
  submittedAt: '9:49 AM',
  activeMinutes: 48,
  attachment: 'postman.png',
  commits: 2,
  review: 'changes_requested',
  targetedFeedback: [
    {
      id: 'tf-1',
      highlightedText: 'Tested all five cases in Postman including invalid credentials and expired tokens.',
      comment: 'Please attach the Postman execution report or screenshot for the expired token scenario.',
      screenshotUrl: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=600&auto=format&fit=crop&q=80',
      screenshotName: 'postman-expired-token-case.png',
      createdAt: '10:15 AM'
    }
  ],
  project: 'FinTech Cloud Platform',
  wordCount: 42
},
{
  id: 'l10',
  hourLabel: '10 AM',
  hourSlot: 10,
  task: 'JWT token expiry fix',
  status: 'done',
  description:
  'Traced the token expiry bug to a mismatched clock offset between the auth service and the API gateway. Normalised both to UTC, refreshed the refresh-token rotation logic and re-ran the auth suite end to end.',
  submittedAt: '10:38 AM',
  activeMinutes: 41,
  attachment: 'jwt-fix.png',
  commits: 1,
  review: 'pending',
  project: 'FinTech Cloud Platform',
  wordCount: 40
},
{
  id: 'l11',
  hourLabel: '11 AM',
  hourSlot: 11,
  task: 'Payment gateway integration',
  status: 'blocked',
  description:
  'Started wiring the Stripe checkout flow into the billing module. Created the order endpoint and the client webhook handler, but cannot complete verification without working sandbox API keys from the master account.',
  submittedAt: '11:47 AM',
  activeMinutes: 30,
  attachment: 'error.png',
  commits: 0,
  review: 'pending',
  blocker: 'Stripe sandbox API key revoked. Waiting for access from the enterprise account owner.',
  project: 'FinTech Cloud Platform',
  wordCount: 34
},
{
  id: 'l12',
  hourLabel: '12 PM',
  hourSlot: 12,
  task: 'Executive dashboard API contract',
  status: 'progress',
  description:
  'Drafted the response schema for the executive analytics endpoint together with Priya, mapped every field to the ledger tables and listed the three aggregations that need a materialized database view instead of a runtime join.',
  submittedAt: '12:52 PM',
  activeMinutes: 44,
  attachment: 'schema.png',
  commits: 0,
  review: 'pending',
  project: 'FinTech Cloud Platform',
  wordCount: 39
},
{
  id: 'l2',
  hourLabel: '2 PM',
  hourSlot: 14,
  task: 'Code review for attendance PR',
  status: 'done',
  description:
  'Reviewed pull request forty one from Sneha covering the attendance sync job. Left six comments on error handling and retries, verified the migration locally and approved after the retry backoff was corrected.',
  submittedAt: '2:44 PM',
  activeMinutes: 37,
  attachment: 'review.png',
  commits: 0,
  review: 'approved',
  reviewNote: 'Approved by Karthik (Team Lead)',
  project: 'FinTech Cloud Platform',
  wordCount: 36
}];


export const recentActivity = [
{ date: 'Sep 8', task: 'JWT token expiry fix', status: 'done' as const, onTime: true },
{ date: 'Sep 8', task: 'JWT Authentication module', status: 'progress' as const, onTime: true },
{ date: 'Sep 8', task: 'Setup development environment', status: 'done' as const, onTime: true },
{ date: 'Sep 5', task: 'Billing module validation', status: 'done' as const, onTime: true },
{ date: 'Sep 5', task: 'Stripe sandbox setup', status: 'blocked' as const, onTime: false }];


export const pastEodReports = [
{ date: 'Sep 5 2026', summary: 'Billing module validation + Stripe sandbox integration', rating: 4, time: '4:22 PM' },
{ date: 'Sep 4 2026', summary: 'Executive dashboard API and query optimisation', rating: 5, time: '4:11 PM' },
{ date: 'Sep 3 2026', summary: 'Half day — scheduled cloud infrastructure maintenance', rating: 3, time: '5:12 PM' },
{ date: 'Sep 2 2026', summary: 'Auth middleware, role guards, unit tests', rating: 4, time: '4:18 PM' },
{ date: 'Sep 1 2026', summary: 'Database schema review with Karthik', rating: 4, time: '4:29 PM' }];


export const eodChecklist = [
{ id: 'c1', label: 'Setup development environment', checked: true },
{ id: 'c2', label: 'JWT auth endpoints', checked: true },
{ id: 'c3', label: 'Token expiry fix', checked: true },
{ id: 'c4', label: 'Payment gateway (blocked)', checked: false },
{ id: 'c5', label: 'Dashboard API (carry forward)', checked: false }];