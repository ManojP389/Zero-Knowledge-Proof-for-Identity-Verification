import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, AuthPayload, saveAuth } from '../api';

const roles = ['user', 'company'] as const;

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [role, setRole] = useState<(typeof roles)[number]>('user');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async () => {
    setLoading(true);
    setMessage('');
    try {
      const result = await apiFetch<AuthPayload>(`/auth/${mode}`, {
        method: 'POST',
        body: JSON.stringify({ email, password, role }),
      });
      saveAuth(result);
      navigate(result.role === 'company' ? '/company/requirements' : '/user/upload');
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.2),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.18),_transparent_30%),linear-gradient(160deg,_#fff9ef_0%,_#f2ebdc_55%,_#e6dcc7_100%)] px-4 py-8 text-slate-900">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-[2.5rem] border border-white/60 bg-slate-950 p-8 text-white shadow-[0_30px_100px_rgba(15,23,42,0.16)] md:p-10">
          <p className="text-sm uppercase tracking-[0.3em] text-teal-300">Zero-knowledge credential layer</p>
          <h1 className="mt-4 font-serif text-5xl leading-tight">
            Share proof,
            <br />
            not personal data.
          </h1>
          <p className="mt-5 max-w-xl text-base text-slate-300">
            ProofX lets users upload identity documents, generate private proofs, and present a single QR code that verifiers can check against blockchain-backed rules.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              ['Upload', 'Photo and certificates stay off-chain.'],
              ['Prove', 'Age and degree claims are packed into a proof.'],
              ['Verify', 'Verifiers only see pass or fail outcomes.'],
            ].map(([title, description]) => (
              <div key={title} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                <p className="text-lg font-semibold">{title}</p>
                <p className="mt-2 text-sm text-slate-300">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2.5rem] border border-white/70 bg-white/80 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur md:p-10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-teal-700">Access portal</p>
              <h2 className="mt-2 font-serif text-3xl font-semibold">Login / Signup</h2>
            </div>
            <div className="rounded-full bg-stone-100 p-1">
              {['login', 'signup'].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMode(value as 'login' | 'signup')}
                  className={`rounded-full px-4 py-2 text-sm ${
                    mode === value ? 'bg-slate-950 text-white' : 'bg-transparent text-slate-600 hover:bg-transparent'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 space-y-5">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Email</span>
              <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="team@proofx.app" />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
              />
            </label>

            <div className="space-y-3">
              <span className="text-sm font-medium text-slate-700">Role selection</span>
              <div className="grid gap-3 sm:grid-cols-2">
                {roles.map((currentRole) => (
                  <button
                    key={currentRole}
                    type="button"
                    onClick={() => setRole(currentRole)}
                    className={`rounded-[1.5rem] border px-4 py-4 text-left ${
                      role === currentRole
                        ? 'border-teal-500 bg-teal-50 text-slate-950'
                        : 'border-stone-200 bg-stone-50 text-slate-700 hover:bg-stone-100'
                    }`}
                  >
                    <p className="text-base font-semibold capitalize">{currentRole === 'company' ? 'verifier' : currentRole}</p>
                    <p className="mt-1 text-sm">
                      {currentRole === 'user' ? 'Upload documents and generate a proof.' : 'Set requirements and verify a QR.'}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <button onClick={submit} disabled={loading || !email || !password} className="w-full rounded-full py-4 text-base">
              {loading ? 'Please wait...' : `${mode === 'login' ? 'Login' : 'Signup'} as ${role === 'company' ? 'verifier' : role}`}
            </button>

            {message && <div className="rounded-[1.5rem] bg-rose-50 p-4 text-sm text-rose-700">{message}</div>}
          </div>
        </section>
      </div>
    </div>
  );
}
