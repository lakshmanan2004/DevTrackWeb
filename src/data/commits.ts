import { Commit } from '../types';

export const commitsToday: Commit[] = [
{ id: 'c1', message: 'Fixed JWT token expiry bug', branch: 'main', time: '10:28 AM', files: 3, sha: 'a3f2b1' },
{ id: 'c2', message: 'Added bcrypt password hashing', branch: 'main', time: '9:41 AM', files: 2, sha: 'b8c4d2' },
{ id: 'c3', message: 'Initial project setup', branch: 'main', time: '8:43 AM', files: 8, sha: 'f1a9c3' }];


export const commitsYesterday: Commit[] = [
{ id: 'c4', message: 'Refactored auth middleware into guards', branch: 'main', time: '4:12 PM', files: 4, sha: 'd7e1a8' },
{ id: 'c5', message: 'Added role based route protection', branch: 'feature/rbac', time: '3:04 PM', files: 6, sha: 'c2b9f4' },
{ id: 'c6', message: 'Fee module field validation', branch: 'feature/fees', time: '1:38 PM', files: 3, sha: 'e5d3c7' },
{ id: 'c7', message: 'Fixed student list pagination offset', branch: 'main', time: '11:22 AM', files: 2, sha: '9a4f6b' },
{ id: 'c8', message: 'Seed script for ERP test data', branch: 'main', time: '9:15 AM', files: 5, sha: '4c8e2d' }];


export const teamCommits = [
{ dev: 'Sneha K', initials: 'SK', message: 'Attendance sync retry backoff', time: '10:41 AM', branch: 'main', sha: '7b2c9e' },
{ dev: 'Ravi Kumar', initials: 'RK', message: 'Fixed JWT token expiry bug', time: '10:28 AM', branch: 'main', sha: 'a3f2b1' },
{ dev: 'Priya M', initials: 'PM', message: 'Student profile form validation', time: '10:12 AM', branch: 'feature/profile', sha: '3f7a1c' },
{ dev: 'Sneha K', initials: 'SK', message: 'Attendance export to CSV', time: '9:52 AM', branch: 'main', sha: 'b1e4d9' },
{ dev: 'Ravi Kumar', initials: 'RK', message: 'Added bcrypt password hashing', time: '9:41 AM', branch: 'main', sha: 'b8c4d2' },
{ dev: 'Arjun J', initials: 'AJ', message: 'Timetable grid layout fix', time: '9:18 AM', branch: 'feature/timetable', sha: 'c9f2a5' },
{ dev: 'Priya M', initials: 'PM', message: 'Reusable table component', time: '8:57 AM', branch: 'main', sha: '6d3b8f' },
{ dev: 'Ravi Kumar', initials: 'RK', message: 'Initial project setup', time: '8:43 AM', branch: 'main', sha: 'f1a9c3' }];