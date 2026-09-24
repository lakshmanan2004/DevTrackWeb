import { DevAlert, LeaderAlert } from '../types';

export const developerAlerts: DevAlert[] = [
{
  id: 'a1',
  kind: 'reminder',
  title: 'Check-in Reminder',
  body: '10 AM log due in 13 minutes',
  time: '10:34 AM · Today',
  unread: true,
  action: 'Open Check-in Form'
},
{
  id: 'a2',
  kind: 'approval',
  title: 'Log Approved',
  body: '8 AM log approved by Karthik',
  time: '9:12 AM · Today',
  unread: true,
  action: 'View Log'
},
{
  id: 'a3',
  kind: 'rejection',
  title: 'Log Rejected',
  body: '2 PM log rejected — too vague, no screenshot',
  time: 'Yesterday 3:08 PM',
  unread: false,
  action: 'Resubmit Log'
},
{
  id: 'a4',
  kind: 'eod',
  title: 'EOD Reminder',
  body: 'Submit EOD before 4:30 PM',
  time: 'Yesterday 4:05 PM',
  unread: false
}];


export const leaderAlerts: LeaderAlert[] = [
{
  id: 'la1',
  severity: 'critical',
  category: 'Missed Log',
  who: 'Arjun J',
  title: 'Arjun J — Missed Check-in',
  body: '9:00 AM log not submitted',
  meta: '10:02 AM · College ERP · Team Alpha',
  detection:
  'Cron job at 10:00 AM found no WorkLog for Arjun hourSlot:9. Alert pushed via Socket.IO.',
  unread: true,
  actions: ['View Arjun', 'Send Reminder', 'Mark Seen']
},

{
  id: 'la3',
  severity: 'flag',
  category: 'Batch Submit',
  who: 'Arjun J',
  title: 'Arjun J — Batch Submission',
  body: '5 logs submitted in 8 minutes',
  meta: 'Yesterday 4:49 PM · College ERP · Team Alpha',
  detection: 'Submission timestamps compared. 3+ logs in 10 min = batch alert.',
  unread: true,
  actions: ['Review Logs', 'Reject All', 'Mark Seen'],
  timeline: [
  { at: '4:42 PM', what: '9 AM log' },
  { at: '4:44 PM', what: '10 AM log' },
  { at: '4:46 PM', what: '11 AM log' },
  { at: '4:48 PM', what: '12 PM log' },
  { at: '4:50 PM', what: '2 PM log' }]

},
{
  id: 'la4',
  severity: 'critical',
  category: 'Missed Log',
  who: 'Vikram R',
  title: 'Vikram R — No logs today',
  body: '8 AM, 9 AM and 10 AM slots all empty',
  meta: '10:05 AM · College ERP · Team Alpha',
  detection:
  'Three consecutive empty hourSlots with no session heartbeat. Escalated to Team Leader automatically.',
  unread: true,
  actions: ['View Vikram', 'Send Reminder', 'Mark Seen']
},
{
  id: 'la5',
  severity: 'seen',
  category: 'EOD Missing',
  who: 'Priya M',
  title: 'Priya M — EOD Missing',
  body: 'No EOD report submitted for Sep 7 2026',
  meta: 'Yesterday 4:35 PM · College ERP · Team Alpha',
  detection: 'Nightly job at 4:35 PM found no EODReport document for Sep 7.',
  unread: false,
  actions: ['View Priya', 'Mark Seen']
},

{
  id: 'la7',
  severity: 'seen',
  category: 'Missed Log',
  who: 'Priya M',
  title: 'Priya M — Missed Check-in',
  body: '3:00 PM log not submitted',
  meta: 'Yesterday 4:02 PM · College ERP · Team Alpha',
  detection: 'Cron job at 4:00 PM found no WorkLog for Priya hourSlot:15.',
  unread: false,
  actions: ['View Priya', 'Mark Seen']
},
{
  id: 'la8',
  severity: 'seen',
  category: 'EOD Missing',
  who: 'Vikram R',
  title: 'Vikram R — EOD Missing',
  body: 'No EOD report submitted for Sep 5 2026',
  meta: 'Sep 5 4:35 PM · College ERP · Team Alpha',
  detection: 'Nightly job at 4:35 PM found no EODReport document for Sep 5.',
  unread: false,
  actions: ['View Vikram', 'Mark Seen']
}];