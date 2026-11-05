import { ManagedUser } from '../types';

export const managedUsers: ManagedUser[] = [
{ id: 'u1', name: 'Ravi Kumar', initials: 'RK', email: 'ravi@company.com', role: 'developer', active: true, joined: 'Aug 15 2026' },
{ id: 'u2', name: 'Priya M', initials: 'PM', email: 'priya@company.com', role: 'developer', active: true, joined: 'Aug 15 2026' },
{ id: 'u3', name: 'Sneha K', initials: 'SK', email: 'sneha@company.com', role: 'developer', active: true, joined: 'Aug 15 2026' },
{ id: 'u4', name: 'Arjun J', initials: 'AJ', email: 'arjun@company.com', role: 'developer', active: true, joined: 'Aug 18 2026' },
{ id: 'u5', name: 'Vikram R', initials: 'VR', email: 'vikram@company.com', role: 'developer', active: true, joined: 'Aug 18 2026' },
{ id: 'u6', name: 'Divya S', initials: 'DS', email: 'divya@company.com', role: 'developer', active: true, joined: 'Aug 20 2026' },
{ id: 'u7', name: 'Mohan T', initials: 'MT', email: 'mohan@company.com', role: 'developer', active: true, joined: 'Aug 20 2026' },
{ id: 'u8', name: 'Anitha R', initials: 'AR', email: 'anitha@company.com', role: 'developer', active: true, joined: 'Aug 22 2026' },
{ id: 'u9', name: 'Karthik M', initials: 'KM', email: 'karthik@company.com', role: 'leader', active: true, joined: 'Aug 1 2026' },
{ id: 'u10', name: 'Senthil K', initials: 'SK', email: 'senthilk@company.com', role: 'leader', active: true, joined: 'Aug 1 2026' },
{ id: 'u11', name: 'Senthil P', initials: 'SP', email: 'senthil@company.com', role: 'manager', active: true, joined: 'Aug 1 2026' },
{ id: 'u12', name: 'Vijay R', initials: 'VJ', email: 'vijay@company.com', role: 'manager', active: true, joined: 'Aug 1 2026' },
{ id: 'u13', name: 'Admin User', initials: 'AD', email: 'admin@devtrack.io', role: 'admin', active: true, joined: 'Jul 1 2026' },
{ id: 'u14', name: 'Old Developer', initials: 'XX', email: 'old@company.com', role: 'developer', active: false, joined: 'Jul 1 2026' }];


export const roleLabels: Record<string, string> = {
  developer: 'Developer',
  leader: 'Team Leader',
  manager: 'Project Manager',
  admin: 'Admin'
};