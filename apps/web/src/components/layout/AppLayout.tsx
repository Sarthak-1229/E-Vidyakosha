import React, { type ReactNode } from 'react';
import { Navbar } from './Navbar';

export const AppLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <div className="app-shell">
      <div className="atmosphere atmosphere-1" aria-hidden="true" />
      <div className="atmosphere atmosphere-2" aria-hidden="true" />
      <div className="atmosphere atmosphere-3" aria-hidden="true" />

      <Navbar />

      <main className="main-content">{children}</main>

      <footer className="footer">
        <div>
          <strong>E-Vidyakosha</strong> <span>·</span> MIT Academy of Engineering Academic
          Repository <span>·</span> MSS v2.0
        </div>
        <div style={{ marginTop: '6px', fontSize: '12px', opacity: 0.75 }}>
          Authorized Academic Documents <span>·</span> Student, Faculty & Administration
        </div>
      </footer>
    </div>
  );
};
