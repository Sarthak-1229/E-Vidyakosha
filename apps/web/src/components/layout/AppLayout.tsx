import React, { type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BookOpen,
  Upload,
  Clock,
  ShieldCheck,
  FileSpreadsheet,
  Layers,
  Users,
} from 'lucide-react';
import { Navbar } from './Navbar';
import { useAuth } from '../../context/AuthContext';
import { SidebarHierarchyTree } from './SidebarHierarchyTree';

export const AppLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const isActive = (path: string) =>
    location.pathname === path || (path === '/library' && location.pathname.startsWith('/library/'));

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <Navbar />

      <div className="console-body">
        {isAuthenticated && (
          <aside className="sidebar-rail" aria-label="Workspace navigation">
            <div className="sidebar-section">
              <div className="sidebar-section-label">Workspace</div>
              <nav className="sidebar-nav-list" aria-label="Main navigation">
                <Link to="/library" className={`sidebar-link ${isActive('/library') ? 'active' : ''}`}>
                  <BookOpen size={16} />
                  Library
                </Link>

                {user?.role === 'FACULTY' && (
                  <>
                    <Link
                      to="/faculty/upload"
                      className={`sidebar-link ${isActive('/faculty/upload') ? 'active' : ''}`}
                    >
                      <Upload size={16} />
                      Upload PDF
                    </Link>
                    <Link
                      to="/faculty/submissions"
                      className={`sidebar-link ${isActive('/faculty/submissions') ? 'active' : ''}`}
                    >
                      <Clock size={16} />
                      My Submissions
                    </Link>
                  </>
                )}

                {user?.role === 'ADMIN' && (
                  <>
                    <Link
                      to="/admin/approvals"
                      className={`sidebar-link ${isActive('/admin/approvals') ? 'active' : ''}`}
                    >
                      <ShieldCheck size={16} />
                      Review Queue
                    </Link>
                    <Link
                      to="/admin/documents"
                      className={`sidebar-link ${isActive('/admin/documents') ? 'active' : ''}`}
                    >
                      <FileSpreadsheet size={16} />
                      Documents
                    </Link>
                    <Link
                      to="/admin/academic"
                      className={`sidebar-link ${isActive('/admin/academic') ? 'active' : ''}`}
                    >
                      <Layers size={16} />
                      Hierarchy
                    </Link>
                    <Link
                      to="/admin/users"
                      className={`sidebar-link ${isActive('/admin/users') ? 'active' : ''}`}
                    >
                      <Users size={16} />
                      Users
                    </Link>
                  </>
                )}
              </nav>
            </div>

            <SidebarHierarchyTree />
          </aside>
        )}

        <main className="main-content" id="main-content" tabIndex={-1}>
          <div className={isAuthenticated ? 'console-container' : 'public-container'}>
            {children}
          </div>

          <footer className="footer">
            <div>
              <strong>E-Vidyakosha</strong> <span className="sep">·</span> MIT Academy of Engineering Academic
              Repository <span className="sep">·</span> MSS v2.0
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};
