import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  FileCheck2,
  FileSearch,
  FolderTree,
  GraduationCap,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <span className="eyebrow">
            <span className="eyebrow-dot" /> MIT Academy of Engineering · Repository
          </span>
          <h1 id="hero-title">
            Academic Knowledge, <span>Structured &amp; Verified.</span>
          </h1>
          <p>
            A unified institutional catalog for lecture notes, laboratory manuals, question banks,
            reference books, and research papers—organized by department and subject, and vetted by
            faculty reviewers.
          </p>

          <div className="hero-actions">
            <Link to={isAuthenticated ? '/library' : '/library'} className="btn btn-primary btn-lg">
              Explore Library <ArrowRight size={16} />
            </Link>
            <Link to="/register" className="btn btn-secondary btn-lg">
              Student Sign Up
            </Link>
          </div>

          <div className="hero-meta-note">
            <ShieldCheck size={15} color="var(--c-success-icon)" />
            <span>Authenticated access · SHA-256 duplicate protection · GridFS archival storage</span>
          </div>
        </div>

        {/* Clean Architectural Console Preview Window */}
        <div className="console-preview-window" aria-label="Academic catalog preview">
          <div className="preview-window-bar">
            <div className="preview-window-dots" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <span>E-Vidyakosha Console — Library Catalog</span>
            <span style={{ color: 'var(--c-accent-pressed)' }}>MSS v2.0</span>
          </div>

          <div className="preview-console-grid">
            <div className="preview-sidebar">
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: 'var(--c-text-subtle)',
                  letterSpacing: '0.8px',
                  textTransform: 'uppercase',
                  padding: '2px 6px 6px',
                }}
              >
                Hierarchy
              </div>
              <div className="preview-side-item active">
                <BookOpen size={13} /> Academic Library
              </div>
              <div className="preview-side-item">
                <span className="tree-dot" style={{ background: '#0095eb' }} /> Computer Engg.
              </div>
              <div className="preview-side-item">
                <span className="tree-dot" style={{ background: '#10b981' }} /> E&amp;TC Engg.
              </div>
              <div className="preview-side-item">
                <span className="tree-dot" style={{ background: '#8b5cf6' }} /> Mechanical Engg.
              </div>
              <div className="preview-side-item">
                <span className="tree-dot" style={{ background: '#f59e0b' }} /> Civil Engg.
              </div>
            </div>

            <div className="preview-main">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid var(--c-divider)',
                  paddingBottom: '10px',
                }}
              >
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--c-ink)' }}>
                  Approved Course Documents
                </span>
                <span className="badge badge-type">Department Verified</span>
              </div>

              <div className="preview-table-row">
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--c-ink)' }}>Data Structures &amp; Graphs</div>
                  <div style={{ fontSize: '11px', color: 'var(--c-text-muted)' }}>Computer Engineering</div>
                </div>
                <span className="badge badge-type">Lecture Notes</span>
                <span className="badge badge-approved">Approved</span>
              </div>

              <div className="preview-table-row">
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--c-ink)' }}>Database Normalization Manual</div>
                  <div style={{ fontSize: '11px', color: 'var(--c-text-muted)' }}>DBMS Lab</div>
                </div>
                <span className="badge badge-type">Lab Manual</span>
                <span className="badge badge-approved">Approved</span>
              </div>

              <div className="preview-table-row">
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--c-ink)' }}>Digital Signal Processing</div>
                  <div style={{ fontSize: '11px', color: 'var(--c-text-muted)' }}>E&amp;TC Engineering</div>
                </div>
                <span className="badge badge-type">Question Paper</span>
                <span className="badge badge-approved">Approved</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="features">
        <div className="section-head">
          <span className="eyebrow">Institutional Architecture</span>
          <h2>Structured academic workflows for every campus role.</h2>
        </div>

        <div className="feature-grid">
          <article className="feature-card">
            <div className="icon-well">
              <FileSearch size={20} />
            </div>
            <h3>Indexed Catalog Discovery</h3>
            <p>
              Search approved titles and cascade across Departments, Subjects, and 7 document
              classifications with instant inline PDF reading and authorized downloads.
            </p>
          </article>

          <article className="feature-card">
            <div className="icon-well">
              <GraduationCap size={20} />
            </div>
            <h3>Faculty Publishing Portal</h3>
            <p>
              Upload unencrypted PDFs up to 50 MiB with pre-upload integrity checks, automatic
              SHA-256 deduplication, and transparent review-status tracking.
            </p>
          </article>

          <article className="feature-card">
            <div className="icon-well">
              <FolderTree size={20} />
            </div>
            <h3>Administrative Governance</h3>
            <p>
              Evaluate pending submissions atomically, enforce rejection notes, manage user roles,
              and safeguard department-to-subject referential integrity.
            </p>
          </article>
        </div>
      </section>

      <section className="section" id="how-it-works">
        <div className="how-card">
          <div style={{ maxWidth: '640px' }}>
            <span className="eyebrow">
              <FileCheck2 size={13} /> Role-Based Institutional Access
            </span>
            <h2>Ready to access the institutional catalog?</h2>
            <p style={{ marginTop: '6px' }}>
              Students with an <strong>@mitaoe.ac.in</strong> email can self-register immediately.
              Faculty and departmental administrators sign in with institution-provisioned
              credentials.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link to="/sign-in" className="btn btn-primary btn-lg">
              Sign In <ArrowRight size={16} />
            </Link>
            <Link to="/register" className="btn btn-secondary btn-lg">
              Student Registration
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};
