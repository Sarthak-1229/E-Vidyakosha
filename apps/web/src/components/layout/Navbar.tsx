import React, { useState } from 'react';
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
  Database,
} from 'lucide-react';
import { Brand } from '../common/Brand';
import { useAuth } from '../../context/AuthContext';
import { getApiMode, setApiMode } from '../../api/client';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [apiMode, setLocalApiMode] = useState<'live' | 'mock'>(getApiMode());

  const handleLogout = () => {
    logout();
    navigate('/sign-in');
  };

  const toggleApiMode = () => {
    const nextMode = apiMode === 'mock' ? 'live' : 'mock';
    setApiMode(nextMode);
    setLocalApiMode(nextMode);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <header className="topbar">
        <Brand to={isAuthenticated ? '/library' : '/'} />

        {/* Desktop Navigation */}
        <nav className="nav-links" aria-label="Main navigation">
          {!isAuthenticated ? (
            <>
              <a href="/#features" className="nav-item">
                Features
              </a>
              <a href="/#how-it-works" className="nav-item">
                How it works
              </a>
              <Link
                to="/register"
                className={`nav-item ${isActive('/register') ? 'active' : ''}`}
              >
                Student Sign Up
              </Link>
              <Link to="/sign-in" className="btn btn-primary btn-sm">
                Sign in <ArrowRight size={14} />
              </Link>
            </>
          ) : (
            <>
              {/* Common browse */}
              <Link
                to="/library"
                className={`nav-item ${isActive('/library') ? 'active' : ''}`}
              >
                <BookOpen size={16} />
                Library
              </Link>

              {/* Faculty links */}
              {user?.role === 'FACULTY' && (
                <>
                  <Link
                    to="/faculty/upload"
                    className={`nav-item ${isActive('/faculty/upload') ? 'active' : ''}`}
                  >
                    <Upload size={16} />
                    Upload PDF
                  </Link>
                  <Link
                    to="/faculty/submissions"
                    className={`nav-item ${isActive('/faculty/submissions') ? 'active' : ''}`}
                  >
                    <Clock size={16} />
                    My Submissions
                  </Link>
                </>
              )}

              {/* Admin links */}
              {user?.role === 'ADMIN' && (
                <>
                  <Link
                    to="/admin/approvals"
                    className={`nav-item ${isActive('/admin/approvals') ? 'active' : ''}`}
                  >
                    <ShieldCheck size={16} />
                    Review Queue
                  </Link>
                  <Link
                    to="/admin/documents"
                    className={`nav-item ${isActive('/admin/documents') ? 'active' : ''}`}
                  >
                    <FileSpreadsheet size={16} />
                    Documents
                  </Link>
                  <Link
                    to="/admin/academic"
                    className={`nav-item ${isActive('/admin/academic') ? 'active' : ''}`}
                  >
                    <Layers size={16} />
                    Hierarchy
                  </Link>
                  <Link
                    to="/admin/users"
                    className={`nav-item ${isActive('/admin/users') ? 'active' : ''}`}
                  >
                    <Users size={16} />
                    Users
                  </Link>
                </>
              )}

              {/* User Chip & Logout */}
              <div className="user-badge" title={user?.email}>
                <span>{user?.name}</span>
                <span className="user-role-tag">{user?.role}</span>
              </div>

              <button
                onClick={handleLogout}
                className="btn btn-ghost btn-sm"
                title="Sign out"
                aria-label="Sign out"
                style={{ color: '#ffffff' }}
              >
                <LogOut size={16} />
              </button>
            </>
          )}

          {/* API Mode Indicator */}
          <button
            onClick={toggleApiMode}
            className="btn-ghost"
            style={{
              fontSize: '11px',
              padding: '4px 9px',
              borderRadius: '9999px',
              background: apiMode === 'mock' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(16, 185, 129, 0.2)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
            }}
            title={`Click to switch to ${apiMode === 'mock' ? 'Live API' : 'Mock Adapter'}`}
          >
            <Database size={11} />
            <span>{apiMode.toUpperCase()} API</span>
          </button>
        </nav>

        {/* Mobile Hamburger Button */}
        <button
          className="mobile-nav-toggle"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open mobile menu"
        >
          <Menu size={22} />
        </button>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-menu-drawer" role="dialog" aria-modal="true">
          <div className="mobile-menu-header">
            <Brand to={isAuthenticated ? '/library' : '/'} />
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="btn-ghost"
              style={{ color: '#ffffff' }}
              aria-label="Close menu"
            >
              <X size={24} />
            </button>
          </div>

          <div className="mobile-nav-links">
            {!isAuthenticated ? (
              <>
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="nav-item"
                >
                  Home
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="nav-item"
                >
                  Student Sign Up
                </Link>
                <Link
                  to="/sign-in"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn btn-primary"
                  style={{ marginTop: '16px' }}
                >
                  Sign in
                </Link>
              </>
            ) : (
              <>
                <div style={{ color: '#cbd5e1', fontSize: '13px', marginBottom: '8px' }}>
                  Signed in as <strong>{user?.name}</strong> ({user?.role})
                </div>
                <Link
                  to="/library"
                  onClick={() => setMobileMenuOpen(false)}
                  className="nav-item"
                >
                  <BookOpen size={18} /> Library
                </Link>

                {user?.role === 'FACULTY' && (
                  <>
                    <Link
                      to="/faculty/upload"
                      onClick={() => setMobileMenuOpen(false)}
                      className="nav-item"
                    >
                      <Upload size={18} /> Upload PDF
                    </Link>
                    <Link
                      to="/faculty/submissions"
                      onClick={() => setMobileMenuOpen(false)}
                      className="nav-item"
                    >
                      <Clock size={18} /> My Submissions
                    </Link>
                  </>
                )}

                {user?.role === 'ADMIN' && (
                  <>
                    <Link
                      to="/admin/approvals"
                      onClick={() => setMobileMenuOpen(false)}
                      className="nav-item"
                    >
                      <ShieldCheck size={18} /> Review Queue
                    </Link>
                    <Link
                      to="/admin/documents"
                      onClick={() => setMobileMenuOpen(false)}
                      className="nav-item"
                    >
                      <FileSpreadsheet size={18} /> Documents
                    </Link>
                    <Link
                      to="/admin/academic"
                      onClick={() => setMobileMenuOpen(false)}
                      className="nav-item"
                    >
                      <Layers size={18} /> Academic Hierarchy
                    </Link>
                    <Link
                      to="/admin/users"
                      onClick={() => setMobileMenuOpen(false)}
                      className="nav-item"
                    >
                      <Users size={18} /> User Accounts
                    </Link>
                  </>
                )}

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="btn btn-secondary"
                  style={{ marginTop: '24px' }}
                >
                  <LogOut size={16} /> Sign out
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};
