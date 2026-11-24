import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpenText,
  FileCheck2,
  FileSearch,
  GraduationCap,
  LibraryBig,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <>
      {/* Hero Section */}
      <section className="hero" aria-labelledby="hero-title" style={{ minHeight: '620px' }}>
        <div className="hero-copy">
          <span className="eyebrow light">
            <span className="eyebrow-dot" /> Academic Reference Repository
          </span>
          <h1 id="hero-title" style={{ color: '#ffffff' }}>
            Knowledge, <em>beautifully</em> within reach.
          </h1>
          <p style={{ color: '#e2e8f0' }}>
            A curated institutional repository for lecture notes, reference books, lab manuals,
            and research publications. Clean, structured, and verified by department faculty.
          </p>
          <div className="hero-actions" style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            <Link to="/library" className="btn btn-primary btn-lg">
              Explore Library <ArrowRight size={18} />
            </Link>
            <Link to="/register" className="btn btn-secondary btn-lg">
              Student Sign Up
            </Link>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '24px',
              fontSize: '12px',
              color: '#cbd5e1',
            }}
          >
            <Sparkles size={14} color="#93c5fd" />
            <span>MSS v2.0 Compliant <span>·</span> Exclusively for MIT Academy of Engineering</span>
          </div>
        </div>

        {/* Hero Visual Card */}
        <div className="hero-art" aria-label="Academic catalog showcase">
          <div className="orb" />
          <div className="glass float-card">
            <div className="float-eyebrow">
              <LibraryBig size={18} /> STUDY SPACE
            </div>
            <h2>Everything in its place.</h2>
            <p>Access department-approved course material without the noise.</p>
            <div className="preview-search">
              <FileSearch size={18} /> Search course notes, papers, question banks...
            </div>
            <div className="preview-list">
              <span>
                <FileCheck2 size={18} /> Lecture notes <small>CURATED</small>
              </span>
              <span>
                <BookOpenText size={18} /> Lab manuals <small>VERIFIED</small>
              </span>
            </div>
          </div>
          <div className="mini-glass">
            <ShieldCheck size={20} color="#059669" />
            <span>Faculty Verified Resources</span>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="section" id="features">
        <div className="section-head">
          <span className="eyebrow">DESIGNED FOR ACADEMIC RIGOR</span>
          <h2>A single repository for every student & faculty member.</h2>
        </div>
        <div className="feature-grid">
          <article className="feature glass">
            <div className="icon-well">
              <FileSearch size={24} />
            </div>
            <h3>Approved Discovery</h3>
            <p>
              Instantly search through officially approved academic literature filtered by Department,
              Subject, and resource classification.
            </p>
          </article>
          <article className="feature glass">
            <div className="icon-well">
              <GraduationCap size={24} />
            </div>
            <h3>Faculty Contributions</h3>
            <p>
              Faculty members upload up to 50 MiB academic PDFs with full status tracking across
              pending, approved, and revision states.
            </p>
          </article>
          <article className="feature glass">
            <div className="icon-well">
              <ShieldCheck size={24} />
            </div>
            <h3>Institutional Curation</h3>
            <p>
              Department administrators review submissions, enforce academic standards, and maintain
              subject hierarchies with complete integrity.
            </p>
          </article>
        </div>
      </section>

      {/* How it Works / Roles Banner */}
      <section className="section how" id="how-it-works" style={{ paddingTop: 0 }}>
        <div className="glass how-card">
          <div>
            <span className="eyebrow">THREE DISTINCT ACTORS</span>
            <h2>Connected learning workflows.</h2>
            <p>
              Students search, read inline and download materials. Faculty submit course material
              and track review decisions. Administrators safeguard quality and maintain structure.
            </p>
          </div>
          <Link to="/sign-in" className="btn btn-primary btn-lg">
            Access Portal <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </>
  );
};
