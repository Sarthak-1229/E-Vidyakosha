import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getRoleHomePath } from '../../lib/navigation';

export const LandingPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const workspacePath = getRoleHomePath(user?.role);

  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <span className="eyebrow">MIT Academy of Engineering · Digital Repository</span>
          <h1 id="hero-title">
            Departmental Knowledge, Preserved for Study.
          </h1>
          <p>
            E-Vidyakosha is MIT Academy of Engineering&rsquo;s institutional archive for course
            literature—bringing lecture notes, laboratory manuals, reference texts, and past
            examination papers together by department and subject under faculty stewardship.
          </p>

          <div className="hero-actions">
            {isAuthenticated && user ? (
              <>
                <Link to={workspacePath} className="btn btn-primary btn-lg">
                  Open Workspace <ArrowRight size={16} />
                </Link>
                <Link to="/library" className="btn btn-secondary btn-lg">
                  Explore Library
                </Link>
              </>
            ) : (
              <>
                <Link to="/library" className="btn btn-primary btn-lg">
                  Explore Library <ArrowRight size={16} />
                </Link>
                <Link to="/register" className="btn btn-secondary btn-lg">
                  Student Registration
                </Link>
              </>
            )}
          </div>

          <div className="hero-meta-note">
            Institutional authentication required · Unencrypted PDF archival up to 50 MiB ·
            SHA-256 duplicate protection
          </div>
        </div>

        {/* Archival Catalog Index Plate */}
        <aside className="ledger-plate" aria-label="Repository catalog specification">
          <div className="ledger-plate-head">
            <span className="ledger-plate-title">Repository Collection Standards</span>
            <span className="ledger-plate-ref">MSS v2.0</span>
          </div>

          <div className="ledger-list">
            <div className="ledger-row">
              <span className="ledger-row-label">Academic Taxonomy</span>
              <span className="ledger-row-val">Department → Subject → PDF</span>
            </div>
            <div className="ledger-row">
              <span className="ledger-row-label">Catalog Categories</span>
              <span className="ledger-row-val">Notes, Manuals, Papers &amp; eBooks</span>
            </div>
            <div className="ledger-row">
              <span className="ledger-row-label">Publication Review</span>
              <span className="ledger-row-val">Faculty Upload → Admin Approval</span>
            </div>
            <div className="ledger-row">
              <span className="ledger-row-label">Document Format</span>
              <span className="ledger-row-val">Readable PDF (max 50 MiB)</span>
            </div>
            <div className="ledger-row">
              <span className="ledger-row-label">Access Control</span>
              <span className="ledger-row-val">Approved Holdings Only (GridFS)</span>
            </div>
          </div>
        </aside>
      </section>

      <section className="section" id="features">
        <div className="section-head">
          <span className="eyebrow">Institutional Roles</span>
          <h2>Organized by course, reviewed before publication.</h2>
        </div>

        <div className="pillars-grid">
          <article className="pillar-col">
            <div className="pillar-role">Students</div>
            <h3>Consult Approved Course Holdings</h3>
            <p>
              Register with an official <code>@mitaoe.ac.in</code> address, search indexed
              catalog titles, filter by department, subject, or material type, read inline in the
              document viewer, or download verified PDFs.
            </p>
          </article>

          <article className="pillar-col">
            <div className="pillar-role">Faculty</div>
            <h3>Submit &amp; Track Reference Material</h3>
            <p>
              Upload unencrypted PDF files directly under an existing academic subject with
              automatic SHA-256 duplicate detection, and follow review outcomes or administrative
              revision notes.
            </p>
          </article>

          <article className="pillar-col">
            <div className="pillar-role">Administrators</div>
            <h3>Steward Hierarchy &amp; Review Queue</h3>
            <p>
              Maintain departments, subjects, and institutional user roles, evaluate pending
              submissions with atomic approval decisions, and curate approved metadata safely.
            </p>
          </article>
        </div>
      </section>

      <section className="section" id="how-it-works">
        <div className="how-card">
          <div style={{ maxWidth: '620px' }}>
            <span className="eyebrow">Repository Access</span>
            <h2>Sign in with your MIT AOE credentials.</h2>
            <p style={{ marginTop: '6px' }}>
              Students with an <strong>@mitaoe.ac.in</strong> email can register for immediate
              catalog access. Faculty and departmental administrators sign in with provisioned
              accounts.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link to="/sign-in" className="btn btn-primary btn-lg">
              Sign In <ArrowRight size={16} />
            </Link>
            {!isAuthenticated && (
              <Link to="/register" className="btn btn-secondary btn-lg">
                Create Student Account
              </Link>
            )}
          </div>
        </div>
      </section>
    </>
  );
};
