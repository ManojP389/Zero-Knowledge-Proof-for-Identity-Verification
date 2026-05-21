import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { getEmail, getRole, logout } from '../api';

const userLinks = [
  { to: '/user/upload', label: 'Upload' },
  { to: '/user/profile', label: 'Wallet & QR' },
  { to: '/user/notifications', label: 'Notifications' },
];

const verifierLinks = [
  { to: '/company/requirements', label: 'Policy' },
  { to: '/company/scan', label: 'Scan QR' },
  { to: '/company/result', label: 'History' },
];

export default function AppShell() {
  const navigate = useNavigate();
  const role = getRole();
  const email = getEmail();
  const links = role === 'company' ? verifierLinks : userLinks;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.16),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(15,23,42,0.18),_transparent_22%),linear-gradient(180deg,_#fcfaf4_0%,_#f4ecda_44%,_#efe3cd_100%)] text-slate-900">
      <div className="relative min-h-screen overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-70">
          <div className="absolute left-[-8rem] top-[18vh] h-72 w-72 rounded-full bg-teal-200/40 blur-3xl" />
          <div className="absolute right-[-6rem] top-0 h-96 w-96 rounded-full bg-cyan-100/50 blur-3xl" />
          <div className="absolute bottom-[-10rem] left-[22vw] h-80 w-80 rounded-full bg-amber-100/80 blur-3xl" />
        </div>

        <div className="relative grid min-h-screen lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="border-r border-white/40 bg-slate-950/96 px-5 py-6 text-slate-100 shadow-[30px_0_90px_rgba(15,23,42,0.18)] backdrop-blur xl:px-7">
            <div className="flex h-full flex-col">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-teal-300">ProofX</p>
                <h1 className="mt-4 text-3xl font-semibold leading-tight text-white">Private credential workspace</h1>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  Users generate proofs, verifiers validate claims, and trust anchors stay verifiable without exposing raw identity documents.
                </p>
              </div>

              <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-teal-300">{role || 'guest'}</p>
                <p className="mt-2 break-all text-sm text-slate-200">{email || 'Sign in to continue'}</p>
              </div>

              <div className="mt-8">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Workspace</p>
                <nav className="space-y-2">
                  {links.map((link, index) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      className={({ isActive }) =>
                        `flex items-center justify-between rounded-[1.4rem] px-4 py-4 text-sm transition ${
                          isActive
                            ? 'bg-teal-400 text-slate-950 shadow-[0_18px_45px_rgba(45,212,191,0.28)]'
                            : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                        }`
                      }
                    >
                      <span>{link.label}</span>
                      <span className="text-xs opacity-70">0{index + 1}</span>
                    </NavLink>
                  ))}
                </nav>
              </div>

              <div className="mt-auto space-y-3 pt-8">
                <button
                  className="w-full rounded-full bg-teal-400 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-teal-300"
                  onClick={() => navigate(role === 'company' ? '/company/scan' : '/user/upload')}
                >
                  Open workspace
                </button>
                <button
                  className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10"
                  onClick={() => {
                    logout();
                    navigate('/auth');
                  }}
                >
                  Logout
                </button>
              </div>
            </div>
          </aside>

          <div className="flex min-h-screen flex-col">
            <header className="border-b border-black/5 px-5 py-5 backdrop-blur xl:px-8">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-teal-700">Trust Layer Dashboard</p>
                  <h2 className="mt-2 text-4xl font-semibold leading-tight text-slate-950">Private credential verification for real-world checks</h2>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                    Generate identity records, create proof-backed QR links, configure verifier requests, and verify eligibility without leaking raw personal data.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[28rem]">
                  <StatCard label="Mode" value={role === 'company' ? 'Verifier' : 'Prover'} />
                  <StatCard label="Security" value="Tokenized QR" />
                  <StatCard label="Trust" value="Chain Anchored" />
                </div>
              </div>
            </header>

            <main className="min-w-0 flex-1 px-5 py-5 xl:px-8 xl:py-6">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-white/50 bg-white/65 px-4 py-4 shadow-[0_18px_45px_rgba(15,23,42,0.06)] backdrop-blur">
      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}
