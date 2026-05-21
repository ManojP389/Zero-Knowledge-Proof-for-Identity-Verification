import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

type NavItem = {
  label: string;
  path: string;
};

type WorkspaceShellProps = {
  role: 'USER' | 'COMPANY';
  handle: string;
  sectionLabel: string;
  pageTitle: string;
  pageDescription: string;
  navItems: NavItem[];
  activePath: string;
  children: ReactNode;
  sidePanel?: ReactNode;
};

const WorkspaceShell = ({
  role,
  handle,
  sectionLabel,
  pageTitle,
  pageDescription,
  navItems,
  activePath,
  children,
  sidePanel,
}: WorkspaceShellProps) => {
  const navigate = useNavigate();

  return (
    <div className="workspace-page">
      <div className="workspace-container">
        <header className="workspace-topbar">
          <div>
            <p className="workspace-kicker">PROOFX</p>
            <h1 className="workspace-hero-title">
              Private credential verification for real-world checks
            </h1>
            <p className="workspace-hero-copy">
              Users generate privacy-preserving proofs, companies verify claims,
              and hashes stay anchored to the trust layer.
            </p>
          </div>

          <div className="workspace-account">
            <p className="workspace-account-label">{role}</p>
            <p className="workspace-account-handle">{handle}</p>
            <div className="workspace-account-actions">
              <button className="workspace-account-open" type="button">
                Open workspace
              </button>
              <button
                className="workspace-account-logout"
                type="button"
                onClick={() => navigate('/')}
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <div className="workspace-grid">
          <aside className="workspace-sidebar">
            <p className="workspace-sidebar-title">WORKSPACE</p>
            <nav className="workspace-nav">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className={
                    item.path === activePath
                      ? 'workspace-nav-item active'
                      : 'workspace-nav-item'
                  }
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </aside>

          <div className={sidePanel ? 'workspace-content with-side' : 'workspace-content'}>
            <section className="workspace-main-card">
              <p className="workspace-kicker">{sectionLabel}</p>
              <h2 className="workspace-section-title">{pageTitle}</h2>
              <p className="workspace-section-copy">{pageDescription}</p>
              <div className="workspace-main-slot">{children}</div>
            </section>

            {sidePanel ? <aside className="workspace-side-card">{sidePanel}</aside> : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceShell;
