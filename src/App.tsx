import React, { useState, Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { useAuth } from './context/AuthContext';
import { SplashScreen } from './components/ui/SplashScreen';
import { Role } from './types';

// Lazy-loaded route components for lightning-fast initial load & isolated code bundles
const Login = lazy(() => import('./pages/Login').then((m) => ({ default: m.Login })));
const DeveloperDashboard = lazy(() => import('./pages/developer/DeveloperDashboard').then((m) => ({ default: m.DeveloperDashboard })));
const WorkLogs = lazy(() => import('./pages/developer/WorkLogs').then((m) => ({ default: m.WorkLogs })));
const MyCommits = lazy(() => import('./pages/developer/MyCommits').then((m) => ({ default: m.MyCommits })));
const EodReport = lazy(() => import('./pages/developer/EodReport').then((m) => ({ default: m.EodReport })));
const DeveloperAlerts = lazy(() => import('./pages/developer/DeveloperAlerts').then((m) => ({ default: m.DeveloperAlerts })));
const DeveloperProfile = lazy(() => import('./pages/developer/DeveloperProfile').then((m) => ({ default: m.DeveloperProfile })));
const MyPendingWorks = lazy(() => import('./pages/developer/MyPendingWorks').then((m) => ({ default: m.MyPendingWorks })));
const DeveloperMyProjects = lazy(() => import('./pages/developer/MyProjects').then((m) => ({ default: m.MyProjects })));

const LiveDashboard = lazy(() => import('./pages/leader/LiveDashboard').then((m) => ({ default: m.LiveDashboard })));
const AllDevelopers = lazy(() => import('./pages/leader/AllDevelopers').then((m) => ({ default: m.AllDevelopers })));
const LeaderProjects = lazy(() => import('./pages/leader/LeaderProjects').then((m) => ({ default: m.LeaderProjects })));
const LeaderAlerts = lazy(() => import('./pages/leader/LeaderAlerts').then((m) => ({ default: m.LeaderAlerts })));
const WeeklyReports = lazy(() => import('./pages/leader/WeeklyReports').then((m) => ({ default: m.WeeklyReports })));
const CommitsOverview = lazy(() => import('./pages/leader/CommitsOverview').then((m) => ({ default: m.CommitsOverview })));
const LogApprovals = lazy(() => import('./pages/leader/LogApprovals').then((m) => ({ default: m.LogApprovals })));

const MyProjects = lazy(() => import('./pages/manager/MyProjects').then((m) => ({ default: m.MyProjects })));
const CreateProject = lazy(() => import('./pages/manager/CreateProject').then((m) => ({ default: m.CreateProject })));
const ManageTeams = lazy(() => import('./pages/manager/ManageTeams').then((m) => ({ default: m.ManageTeams })));
const ProjectOverview = lazy(() => import('./pages/manager/ProjectOverview').then((m) => ({ default: m.ProjectOverview })));
const ManagerAlerts = lazy(() => import('./pages/manager/ManagerAlerts').then((m) => ({ default: m.ManagerAlerts })));

const UserManagement = lazy(() => import('./pages/admin/UserManagement').then((m) => ({ default: m.UserManagement })));
const ProjectsOverview = lazy(() => import('./pages/admin/ProjectsOverview').then((m) => ({ default: m.ProjectsOverview })));
const EmployeePerformance = lazy(() => import('./pages/admin/EmployeePerformance').then((m) => ({ default: m.EmployeePerformance })));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings').then((m) => ({ default: m.AdminSettings })));
const UserProfile = lazy(() => import('./pages/common/UserProfile').then((m) => ({ default: m.UserProfile })));

const roleHome: Record<Role, string> = {
  developer: '/developer',
  leader: '/leader',
  manager: '/manager',
  admin: '/admin'
};

function PageFallback() {
  return (
    <div className="flex flex-1 items-center justify-center p-12 min-h-[300px]">
      <div className="h-7 w-7 rounded-full border-2 border-brand/30 border-t-brand animate-spin" />
    </div>
  );
}

function Protected({ role, children }: { role: Role; children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return <SplashScreen minDurationMs={400} />;
  }
  if (!user) return <Navigate to="/" replace />;
  if (user.role !== role) return <Navigate to={roleHome[user.role]} replace />;
  return <>{children}</>;
}

export function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <>
      {showSplash && (
        <SplashScreen
          minDurationMs={1300}
          onComplete={() => setShowSplash(false)}
        />
      )}
      <BrowserRouter>
        <Suspense fallback={<PageFallback />}>
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
              <Route path="/leader/developers" element={<AllDevelopers />} />
              <Route path="/leader/projects" element={<LeaderProjects />} />
              <Route path="/leader/alerts" element={<LeaderAlerts />} />
              <Route path="/leader/reports" element={<WeeklyReports />} />
              <Route path="/leader/commits" element={<CommitsOverview />} />
              <Route path="/leader/approvals" element={<LogApprovals />} />
              <Route path="/leader/profile" element={<UserProfile />} />
            </Route>

            <Route element={<Protected role="manager"><AppShell role="manager" /></Protected>}>
              <Route path="/manager" element={<MyProjects />} />
              <Route path="/manager/create" element={<CreateProject />} />
              <Route path="/manager/teams" element={<ManageTeams />} />
              <Route path="/manager/overview" element={<ProjectOverview />} />
              <Route path="/manager/alerts" element={<ManagerAlerts />} />
              <Route path="/manager/profile" element={<UserProfile />} />
            </Route>

            <Route element={<Protected role="admin"><AppShell role="admin" /></Protected>}>
              <Route path="/admin" element={<UserManagement />} />
              <Route path="/admin/projects" element={<ProjectsOverview />} />
              <Route path="/admin/performance" element={<EmployeePerformance />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
              <Route path="/admin/profile" element={<UserProfile />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </>
  );
}