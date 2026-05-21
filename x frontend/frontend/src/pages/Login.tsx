import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const Login = () => {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'company' ? 'company' : 'user';
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [role, setRole] = useState<'user' | 'company'>(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(role === 'user' ? '/user/upload' : '/company/requirements');
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <section className="auth-showcase">
          <p className="auth-kicker">ZERO-KNOWLEDGE CREDENTIAL LAYER</p>
          <h1 className="auth-title">Share proof, not personal data.</h1>
          <p className="auth-copy">
            ProofX lets users upload identity documents, generate private proofs,
            and present a single QR code that companies can verify against
            blockchain-backed rules.
          </p>

          <div className="auth-feature-grid">
            <div className="auth-feature">
              <h3>Upload</h3>
              <p>Photo and certificates stay off-chain.</p>
            </div>
            <div className="auth-feature">
              <h3>Prove</h3>
              <p>Age and degree claims are packed into a proof.</p>
            </div>
            <div className="auth-feature">
              <h3>Verify</h3>
              <p>Companies only see pass or fail outcomes.</p>
            </div>
          </div>
        </section>

        <section className="auth-card">
          <p className="auth-kicker">ACCESS PORTAL</p>
          <div className="auth-switch" aria-label="login mode toggle">
            <button
              type="button"
              className={mode === 'login' ? 'active' : ''}
              onClick={() => setMode('login')}
            >
              login
            </button>
            <button
              type="button"
              className={mode === 'signup' ? 'active' : ''}
              onClick={() => setMode('signup')}
            >
              signup
            </button>
          </div>

          <h2>Login / Signup</h2>

          <form onSubmit={handleSubmit}>
            <label className="auth-label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              placeholder="team@proofx.app"
              required
            />

            <label className="auth-label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              placeholder="Enter your password"
              required
            />

            <label className="auth-label">Role selection</label>
            <div className="auth-role-grid">
              <button
                type="button"
                className={role === 'user' ? 'auth-role-card active' : 'auth-role-card'}
                onClick={() => setRole('user')}
              >
                <div className="auth-role-title">User</div>
                <div className="auth-role-copy">
                  Upload documents and generate a proof.
                </div>
              </button>

              <button
                type="button"
                className={role === 'company' ? 'auth-role-card active' : 'auth-role-card'}
                onClick={() => setRole('company')}
              >
                <div className="auth-role-title">Company</div>
                <div className="auth-role-copy">
                  Set requirements and verify a QR.
                </div>
              </button>
            </div>

            <button type="submit" className="auth-submit">
              {role === 'user' ? 'Login as user' : 'Login as company'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default Login;
