import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Upload,
  Clock,
  ShieldCheck,
  Users,
  Layers,
  FileSpreadsheet,
  LogOut,
  Menu,
  X,
  ArrowRight,
  ChevronDown,
} from 'lucide-react';
import { Brand } from '../common/Brand';
import { useAuth } from '../../context/AuthContext';
import { useMockApi } from '../../api/client';
import { useDialogFocus } from '../../hooks/useDialogFocus';
import { SidebarHierarchyTree } from './SidebarHierarchyTree';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const drawer = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useDialogFocus(drawer, mobileMenuOpen, () => setMobileMenuOpen(false));

  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, [location.key, location.pathname, location.search]);

  useEffect(() => {
    if (!userMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [userMenuOpen]);

  const handleLogout = () => {
    logout();
    navigate('/sign-in');
  };

  const isActive = (path: string) => location.pathname === path;

  const portalLabel =
    user?.role === 'ADMIN'
      ? 'Administration Console'
      : user?.role === 'FACULTY'
      ? 'Faculty Workspace'
      : user?.role === 'STUDENT'
      ? 'Student Library'
      : 'Academic Document Repository';

  const initials = user?.name
    ? user.name
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('')
    : 'U';

  return (
    <>
      <header className="topbar">
        <div className={isAuthenticated ? 'topbar-left' : 'topbar-public-inner'}>
          <div className="topbar-left">
            {isAuthenticated && (
              <button
                type="button"
                className="mobile-nav-toggle"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open mobile menu"
                aria-expanded={mobileMenuOpen}
              >
                <Menu size={18} />
              </button>
            )}
            <Brand to={isAuthenticated ? '/library' : '/'} />
            <span className="topbar-divider" aria-hidden="true" />
            <span className="topbar-context">{portalLabel}</span>
          </div>

          {!isAuthenticated && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <nav className="nav-links" aria-label="Main navigation">
                <Link to="/#features" className={`nav-item ${isActive('/') ? 'active' : ''}`}>
                  Overview
                </Link>
                <Link
                  to="/register"
                  className={`nav-item ${isActive('/register') ? 'active' : ''}`}
                >
                  Student Sign Up
                </Link>
                <Link to="/sign-in" className="btn btn-primary btn-sm">
                  Sign In <ArrowRight size={14} />
                </Link>
                {useMockApi && <span className="user-role-tag">Mock data</span>}
              </nav>

              <button
                type="button"
                className="mobile-nav-toggle"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open mobile menu"
                aria-expanded={mobileMenuOpen}
              >
                <Menu size={18} />
              </button>
            </div>
          )}
        </div>

        {isAuthenticated && (
          <div className="user-menu-wrap" ref={userMenuRef}>
            {useMockApi && <span className="user-role-tag">Mock data</span>}

            <button
              type="button"
              className="user-menu-trigger"
              onClick={() => setUserMenuOpen((prev) => !prev)}
              aria-expanded={userMenuOpen}
              aria-haspopup="menu"
              aria-label="Account menu"
            >
              <span className="user-avatar-chip" aria-hidden="true">
                {initials}
              </span>
              <span className="user-name-label">
                {user?.name}
              </span>
              <span className="user-role-tag">{user?.role}</span>
              <ChevronDown size={14} color="var(--c-text-muted)" />
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="btn btn-ghost btn-sm"
              title="Sign out"
              aria-label="Sign out"
              style={{ padding: '7px 8px' }}
            >
              <LogOut size={16} />
            </button>

            {userMenuOpen && (
              <div className="user-popover" role="menu">
                <div className="user-popover-header">
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--c-ink)' }}>
                    {user?.name}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--c-text-muted)', wordBreak: 'break-all' }}>
                    {user?.email}
                  </div>
                </div>
                <Link to="/library" className="user-popover-item" role="menuitem">
                  <BookOpen size={15} color="var(--c-accent)" /> Academic Library
                </Link>
                {user?.role === 'FACULTY' && (
                  <>
                    <Link to="/faculty/upload" className="user-popover-item" role="menuitem">
                      <Upload size={15} color="var(--c-accent)" /> Upload Document
                    </Link>
                    <Link to="/faculty/submissions" className="user-popover-item" role="menuitem">
                      <Clock size={15} color="var(--c-accent)" /> My Submissions
                    </Link>
                  </>
                )}
                {user?.role === 'ADMIN' && (
                  <>
                    <Link to="/admin/approvals" className="user-popover-item" role="menuitem">
                      <ShieldCheck size={15} color="var(--c-accent)" /> Review Queue
                    </Link>
                    <Link to="/admin/documents" className="user-popover-item" role="menuitem">
                      <FileSpreadsheet size={15} color="var(--c-accent)" /> Documents
                    </Link>
                    <Link to="/admin/academic" className="user-popover-item" role="menuitem">
                      <Layers size={15} color="var(--c-accent)" /> Hierarchy
                    </Link>
                    <Link to="/admin/users" className="user-popover-item" role="menuitem">
                      <Users size={15} color="var(--c-accent)" /> Users
                    </Link>
                  </>
                )}
                <div style={{ borderTop: '1px solid var(--c-divider)', margin: '4px 0' }} />
                <button type="button" onClick={handleLogout} className="user-popover-item danger" role="menuitem">
                  <LogOut size={15} /> Log Out
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          className="mobile-menu-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setMobileMenuOpen(false);
          }}
        >
          <div
            ref={drawer}
            tabIndex={-1}
            className="mobile-menu-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
          >
            <div className="mobile-menu-header">
              <Brand to={isAuthenticated ? '/library' : '/'} />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="btn-ghost"
                aria-label="Close menu"
                style={{ padding: '6px', borderRadius: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <nav className="mobile-nav-links" aria-label="Mobile links">
              {!isAuthenticated ? (
                <>
                  <Link to="/" onClick={() => setMobileMenuOpen(false)} className="sidebar-link">
                    Overview
                  </Link>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="sidebar-link">
                    Student Sign Up
                  </Link>
                  <Link
                    to="/sign-in"
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn btn-primary"
                    style={{ marginTop: '12px' }}
                  >
                    Sign In
                  </Link>
                </>
              ) : (
                <>
                  <div
                    style={{
                      padding: '8px 10px 12px',
                      marginBottom: '8px',
                      borderBottom: '1px solid var(--c-divider)',
                      fontSize: '12.5px',
                      color: 'var(--c-text-secondary)',
                    }}
                  >
                    Signed in as <strong>{user?.name}</strong> ({user?.role})
                  </div>

                  <div className="sidebar-section">
                    <div className="sidebar-section-label">Workspace</div>
                    <div className="sidebar-nav-list">
                      <Link
                        to="/library"
                        onClick={() => setMobileMenuOpen(false)}
                        className={`sidebar-link ${isActive('/library') ? 'active' : ''}`}
                      >
                        <BookOpen size={16} /> Library
                      </Link>

                      {user?.role === 'FACULTY' && (
                        <>
                          <Link
                            to="/faculty/upload"
                            onClick={() => setMobileMenuOpen(false)}
                            className={`sidebar-link ${isActive('/faculty/upload') ? 'active' : ''}`}
                          >
                            <Upload size={16} /> Upload PDF
                          </Link>
                          <Link
                            to="/faculty/submissions"
                            onClick={() => setMobileMenuOpen(false)}
                            className={`sidebar-link ${isActive('/faculty/submissions') ? 'active' : ''}`}
                          >
                            <Clock size={16} /> My Submissions
                          </Link>
                        </>
                      )}

                      {user?.role === 'ADMIN' && (
                        <>
                          <Link
                            to="/admin/approvals"
                            onClick={() => setMobileMenuOpen(false)}
                            className={`sidebar-link ${isActive('/admin/approvals') ? 'active' : ''}`}
                          >
                            <ShieldCheck size={16} /> Review Queue
                          </Link>
                          <Link
                            to="/admin/documents"
                            onClick={() => setMobileMenuOpen(false)}
                            className={`sidebar-link ${isActive('/admin/documents') ? 'active' : ''}`}
                          >
                            <FileSpreadsheet size={16} /> Documents
                          </Link>
                          <Link
                            to="/admin/academic"
                            onClick={() => setMobileMenuOpen(false)}
                            className={`sidebar-link ${isActive('/admin/academic') ? 'active' : ''}`}
                          >
                            <Layers size={16} /> Hierarchy
                          </Link>
                          <Link
                            to="/admin/users"
                            onClick={() => setMobileMenuOpen(false)}
                            className={`sidebar-link ${isActive('/admin/users') ? 'active' : ''}`}
                          >
                            <Users size={16} /> Users
                          </Link>
                        </>
                      )}
                    </div>
                  </div>

                  <SidebarHierarchyTree onNavigate={() => setMobileMenuOpen(false)} />

                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="btn btn-secondary"
                    style={{ marginTop: '12px', color: 'var(--c-danger)' }}
                  >
                    <LogOut size={15} /> Sign Out
                  </button>
                </>
              )}
            </nav>
          </div>
        </div>
      )}
    </>
  );
};
