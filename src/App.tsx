import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { DeveloperDashboard } from './pages/developer/DeveloperDashboard';
import { WorkLogs } from './pages/developer/WorkLogs';
import { MyCommits } from './pages/developer/MyCommits';
import { EodReport } from './pages/developer/EodReport';
import { DeveloperAlerts } from './pages/developer/DeveloperAlerts';
import { DeveloperProfile } from './pages/developer/DeveloperProfile';
import { MyPendingWorks } from './pages/developer/MyPendingWorks';
import { MyProjects as DeveloperMyProjects } from './pages/developer/MyProjects';
import { LiveDashboard } from './pages/leader/LiveDashboard';
import { TeamCalendar } from './pages/leader/TeamCalendar';
import { AllDevelopers } from './pages/leader/AllDevelopers';
import { LeaderAlerts } from './pages/leader/LeaderAlerts';
import { WeeklyReports } from './pages/leader/WeeklyReports';
import { CommitsOverview } from './pages/leader/CommitsOverview';
import { LogApprovals } from './pages/leader/LogApprovals';
import { MyProjects } from './pages/manager/MyProjects';
import { CreateProject } from './pages/manager/CreateProject';
import { ManageTeams } from './pages/manager/ManageTeams';
import { ProjectOverview } from './pages/manager/ProjectOverview';
import { ManagerAlerts } from './pages/manager/ManagerAlerts';
import { UserManagement } from './pages/admin/UserManagement';
import { ProjectsOverview } from './pages/admin/ProjectsOverview';
import { EmployeePerformance } from './pages/admin/EmployeePerformance';
import { AdminSettings } from './pages/admin/AdminSettings';
import { Role } from './types';

const roleHome: Record<Role, string> = {
  developer: '/developer',
  leader: '/leader',
  manager: '/manager',
  admin: '/admin'
};

function Protected({ role, children }: { role: Role; children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-canvas">
        <p className="text-sm font-semibold text-gray-500">Loading DevTrack…</p>
      </div>
    );
  }
  if (!user) return <Navigate to="/" replace />;
  if (user.role !== role) return <Navigate to={roleHome[user.role]} replace />;
  return <>{children}</>;
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route element={<Protected role="developer"><AppShell role="developer" /></Protected>}>
          <Route path="/developer" element={<DeveloperDashboard />} />
          <Route path="/developer/projects" element={<DeveloperMyProjects />} />
          <Route path="/developer/pending" element={<MyPendingWorks />} />
          <Route path="/developer/logs" element={<WorkLogs />} />
          <Route path="/developer/commits" element={<MyCommits />} />
          <Route path="/developer/eod" element={<EodReport />} />
          <Route path="/developer/alerts" element={<DeveloperAlerts />} />
          <Route path="/developer/profile" element={<DeveloperProfile />} />
        </Route>

        <Route element={<Protected role="leader"><AppShell role="leader" /></Protected>}>
          <Route path="/leader" element={<LiveDashboard />} />
          <Route path="/leader/calendar" element={<TeamCalendar />} />
          <Route path="/leader/developers" element={<AllDevelopers />} />
          <Route path="/leader/alerts" element={<LeaderAlerts />} />
          <Route path="/leader/reports" element={<WeeklyReports />} />
          <Route path="/leader/commits" element={<CommitsOverview />} />
          <Route path="/leader/approvals" element={<LogApprovals />} />
        </Route>

        <Route element={<Protected role="manager"><AppShell role="manager" /></Protected>}>
          <Route path="/manager" element={<MyProjects />} />
          <Route path="/manager/create" element={<CreateProject />} />
          <Route path="/manager/teams" element={<ManageTeams />} />
          <Route path="/manager/overview" element={<ProjectOverview />} />
          <Route path="/manager/alerts" element={<ManagerAlerts />} />
        </Route>

        <Route element={<Protected role="admin"><AppShell role="admin" /></Protected>}>
          <Route path="/admin" element={<UserManagement />} />
          <Route path="/admin/projects" element={<ProjectsOverview />} />
          <Route path="/admin/performance" element={<EmployeePerformance />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}