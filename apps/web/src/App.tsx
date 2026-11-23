import type { ReactNode } from 'react';
import { ArrowRight, BookOpenText, FileCheck2, FileSearch, GraduationCap, LibraryBig, ShieldCheck } from 'lucide-react';
import { Link, Route, Routes } from 'react-router-dom';

function Brand() {
  return <Link className="brand" to="/" aria-label="E-Vidyakosha home"><span className="brand-mark"><BookOpenText size={23} strokeWidth={1.9} /></span><span>E-Vidyakosha</span></Link>;
}

function Shell({ children }: { children: ReactNode }) {
  return <div className="app-shell"><div className="atmosphere atmosphere-a" aria-hidden="true" /><div className="atmosphere atmosphere-b" aria-hidden="true" /><header className="topbar"><Brand /><nav aria-label="Main navigation"><a href="/#features">Features</a><a href="/#how-it-works">How it works</a><Link className="nav-cta" to="/sign-in">Sign in <ArrowRight size={16} /></Link></nav></header><main>{children}</main><footer className="footer">E-Vidyakosha <span>·</span> Academic reference repository <span>·</span> MSS v2.0</footer></div>;
}

function Welcome() {
  return <>
    <section className="hero" aria-labelledby="hero-title"><div className="hero-copy"><span className="eyebrow"><span className="eyebrow-dot" /> A calmer way to learn</span><h1 id="hero-title">Knowledge, <em>beautifully</em> within reach.</h1><p>A thoughtfully organized academic library for learning materials, lecture notes, reference books and papers. One space for everything that matters.</p><div className="hero-actions"><Link className="pill dark" to="/sign-in">Explore the library <ArrowRight size={18} /></Link><a className="pill light" href="#how-it-works">See how it works</a></div><span className="micro-note">A design preview — app features are not yet connected.</span></div><div className="hero-art" aria-label="Decorative preview of the academic catalog"><div className="orb" /><div className="glass float-card"><div className="float-eyebrow"><LibraryBig size={18}/> STUDY SPACE</div><h2>Everything in its place.</h2><p>Find the resources you need, minus the noise.</p><div className="preview-search"><FileSearch size={18} /> Search books, notes, papers...</div><div className="preview-list"><span><FileCheck2 size={18}/> Lecture notes <small>CURATED</small></span><span><BookOpenText size={18}/> Reference books <small>ORGANIZED</small></span></div></div><div className="mini-glass"><ShieldCheck size={20}/> Quality-reviewed resources</div></div></section>
    <section className="section" id="features"><div className="section-head"><span className="eyebrow">BUILT FOR FOCUSED LEARNING</span><h2>Simple for you. Structured for everyone.</h2></div><div className="feature-grid"><article className="feature glass"><div className="icon-well"><FileSearch size={23}/></div><h3>Discover effortlessly</h3><p>Find approved PDFs by subject, document type or title without hunting across disconnected channels.</p></article><article className="feature glass"><div className="icon-well"><GraduationCap size={23}/></div><h3>Faculty contributions</h3><p>Submit academic materials and follow their review status in a dedicated workspace.</p></article><article className="feature glass"><div className="icon-well"><ShieldCheck size={23}/></div><h3>Thoughtful curation</h3><p>Administrators manage categories and review submissions before they enter the shared repository.</p></article></div></section>
    <section className="section how" id="how-it-works"><div className="glass how-card"><div><span className="eyebrow">ONE COLLECTION, THREE ROLES</span><h2>Designed around your academic day.</h2><p>Students discover and read. Faculty contribute. Administrators organize and approve. Everyone works from a consistent source of knowledge.</p></div><Link className="pill dark" to="/sign-in">Continue <ArrowRight size={18}/></Link></div></section>
  </>;
}

function SignIn() {
  return <section className="sign-section"><div className="glass signin-card"><span className="eyebrow">YOUR LIBRARY AWAITS</span><h1>Welcome back.</h1><p>The authentication form will be connected to the approved API during implementation.</p><form onSubmit={(e) => e.preventDefault()}><label htmlFor="email">Institutional email</label><input id="email" type="email" placeholder="name@mitaoe.ac.in" disabled /><label htmlFor="password">Password</label><input id="password" type="password" placeholder="••••••••" disabled /><button className="pill dark" type="button" disabled>Sign in — coming in implementation</button></form><Link className="back-link" to="/">← Back to home</Link></div></section>;
}

export function App() {
  return <Shell><Routes><Route path="/" element={<Welcome />} /><Route path="/sign-in" element={<SignIn />} /><Route path="*" element={<section className="not-found"><h1>Page not found</h1><Link className="pill dark" to="/">Go home</Link></section>} /></Routes></Shell>;
}
