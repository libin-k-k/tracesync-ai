import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/dashboard/Sidebar';
import { Topbar } from '../components/dashboard/Topbar';

function resolvePageMeta(pathname: string): { title: string; subtitle: string } {
  if (pathname.startsWith('/errors/')) {
    return {
      title: 'Error detail',
      subtitle: 'Stack trace and AI solution for this saved crash',
    };
  }

  if (pathname.startsWith('/errors')) {
    return {
      title: 'Error history',
      subtitle: 'Saved crashes and AI solutions for your workspace',
    };
  }

  if (pathname.startsWith('/users')) {
    return {
      title: 'Members',
      subtitle: 'Engineering managers, team leaders, and the developers who report to them',
    };
  }

  if (pathname.startsWith('/projects')) {
    return {
      title: 'Projects',
      subtitle: 'Create and manage applications monitored for your tenant',
    };
  }

  if (pathname.startsWith('/settings')) {
    return {
      title: 'Settings',
      subtitle: 'Tenant profile and secure ingest API credentials',
    };
  }

  return {
    title: 'Overview',
    subtitle: 'Workspace health, volume, and the latest AI insight',
  };
}

export function DashboardLayout() {
  const location = useLocation();
  const meta = resolvePageMeta(location.pathname);

  return (
    <div className="dash-shell">
      <a className="skip-link" href="#dash-main">
        Skip to main content
      </a>
      <Sidebar />
      <div className="dash-main" id="dash-main">
        <Topbar title={meta.title} subtitle={meta.subtitle} crumb="Workspace" />
        <main className="dash-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
