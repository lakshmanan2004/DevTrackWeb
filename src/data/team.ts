import { Developer } from '../types';

export const NOW = '10:47 AM';
export const TODAY = 'Tuesday Sep 8 2026';
export const TODAY_LONG = 'Tuesday September 8 2026';

export const currentDeveloper = {
  name: 'Ravi Kumar',
  firstName: 'Ravi',
  initials: 'RK',
  email: 'ravi@college.edu',
  github: 'github.com/ravikumar',
  team: 'Team Alpha',
  project: 'College ERP System',
  joined: 'Aug 15 2026',
  leader: 'Karthik M',
  week: { active: '31h 20m', logs: 28, avgPerDay: '5.6', onTime: '94%' }
};

export const developers: Developer[] = [
{
  id: 'ravi',
  name: 'Ravi Kumar',
  initials: 'RK',
  email: 'ravi@college.edu',
  activeMinutes: 252,
  logs: 6,
  done: 4,
  missed: 0,
  commits: 3,
  lastSeen: '10:46 AM',
  note: 'All logs on time',
  team: 'Team Alpha',
  project: 'College ERP System'
},
{
  id: 'priya',
  name: 'Priya M',
  initials: 'PM',
  email: 'priya@college.edu',
  activeMinutes: 225,
  logs: 5,
  done: 3,
  missed: 0,
  commits: 2,
  lastSeen: '10:44 AM',
  note: 'EOD missing yesterday',
  team: 'Team Alpha',
  project: 'College ERP System'
},
{
  id: 'sneha',
  name: 'Sneha K',
  initials: 'SK',
  email: 'sneha@college.edu',
  activeMinutes: 240,
  logs: 5,
  done: 5,
  missed: 0,
  commits: 5,
  lastSeen: '10:47 AM',
  note: 'Top performer',
  team: 'Team Alpha',
  project: 'College ERP System',
  topPerformer: true
},
{
  id: 'arjun',
  name: 'Arjun J',
  initials: 'AJ',
  email: 'arjun@college.edu',
  activeMinutes: 130,
  logs: 2,
  done: 1,
  missed: 1,
  commits: 1,
  lastSeen: '10:31 AM',
  note: 'Alert sent',
  team: 'Team Alpha',
  project: 'College ERP System'
},
{
  id: 'vikram',
  name: 'Vikram R',
  initials: 'VR',
  email: 'vikram@college.edu',
  activeMinutes: 0,
  logs: 0,
  done: 0,
  missed: 3,
  commits: 0,
  lastSeen: 'Not seen today',
  note: 'No activity',
  team: 'Team Alpha',
  project: 'College ERP System'
}];


export const weeklyRows = [
{ day: 'Mon', date: 'Sep 1', logs: 6, active: '7h 12m', hours: 7.2, done: 5, blocked: 0, missed: 0, commits: 4, eod: true },
{ day: 'Tue', date: 'Sep 2', logs: 6, active: '6h 48m', hours: 6.8, done: 6, blocked: 0, missed: 0, commits: 3, eod: true },
{ day: 'Wed', date: 'Sep 3', logs: 3, active: '3h 06m', hours: 3.1, done: 2, blocked: 1, missed: 3, commits: 1, eod: false },
{ day: 'Thu', date: 'Sep 4', logs: 6, active: '7h 30m', hours: 7.5, done: 6, blocked: 0, missed: 0, commits: 5, eod: true },
{ day: 'Fri', date: 'Sep 5', logs: 7, active: '6h 44m', hours: 6.7, done: 5, blocked: 1, missed: 0, commits: 4, eod: true }];


export const teams = [
{
  id: 'alpha',
  name: 'Team Alpha',
  project: 'College ERP System',
  leader: { name: 'Karthik M', initials: 'KM' },
  members: [
  { name: 'Ravi Kumar', initials: 'RK' },
  { name: 'Priya M', initials: 'PM' },
  { name: 'Sneha K', initials: 'SK' },
  { name: 'Arjun J', initials: 'AJ' }]

},
{
  id: 'beta',
  name: 'Team Beta',
  project: 'Attendance App',
  leader: { name: 'Senthil K', initials: 'SK' },
  members: [
  { name: 'Vikram R', initials: 'VR' },
  { name: 'Divya S', initials: 'DS' },
  { name: 'Mohan T', initials: 'MT' }]

},
{
  id: 'gamma',
  name: 'Team Gamma',
  project: 'Student Portal',
  leader: { name: 'Vijay S', initials: 'VS' },
  members: [
  { name: 'Anitha R', initials: 'AR' },
  { name: 'Praveen B', initials: 'PB' },
  { name: 'Lakshmi N', initials: 'LN' }]

}];