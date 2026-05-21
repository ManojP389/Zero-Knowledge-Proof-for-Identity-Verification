import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { ProfileData, ProofData, VerificationHistoryItem } from '../types';

interface ProfileResponse {
  profile: ProfileData | null;
  proof: ProofData | null;
  qr: {
    qrUrl: string;
    qrToken: string;
  } | null;
  verificationHistory: VerificationHistoryItem[];
}

interface ProofResponse {
  proof: ProofData;
  summary: {
    claimsReady: string[];
    generatedAt: string;
  };
}

interface QrResponse {
  qrUrl: string;
  qrToken: string;
  qrImage: string;
}

export default function ProfileQR() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [proof, setProof] = useState<ProofData | null>(null);
  const [qr, setQr] = useState<QrResponse | null>(null);
  const [history, setHistory] = useState<VerificationHistoryItem[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const loadProfile = async () => {
    try {
      const result = await apiFetch<ProfileResponse>('/user/profile');
      setProfile(result.profile);
      setProof(result.proof);
      setHistory(result.verificationHistory || []);
      if (result.qr?.qrToken) {
        const qrResult = await apiFetch<QrResponse>('/user/get-qr');
        setQr(qrResult);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to load profile');
    }
  };

  useEffect(() => {
    void loadProfile();
  }, []);

  const generateProof = async () => {
    setLoading(true);
    setMessage('');
    try {
      const result = await apiFetch<ProofResponse>('/user/generate-proof', {
        method: 'POST',
      });
      setProof(result.proof);
      setMessage('Proof refreshed successfully. Your saved QR can continue to be used.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Proof generation failed');
    } finally {
      setLoading(false);
    }
  };

  const getQr = async () => {
    setLoading(true);
    setMessage('');
    try {
      const result = await apiFetch<QrResponse>('/user/get-qr');
      setQr(result);
      setMessage('Persistent wallet QR loaded.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'QR generation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6">
      <section className="space-y-6 rounded-[2.2rem] border border-white/70 bg-white/78 p-8 shadow-[0_28px_80px_rgba(15,23,42,0.08)] xl:min-h-[calc(100vh-14rem)]">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-teal-700">User side</p>
          <h2 className="mt-2 font-serif text-3xl font-semibold">Wallet + Proof QR</h2>
          <p className="mt-2 max-w-2xl text-slate-600">
            Your QR now persists across logins. New certificate uploads update missing profile fields and the verification history stays available in the wallet.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <InfoCard label="Issuer" value={profile?.issuer || 'Not available'} />
          <InfoCard label="Credential status" value={profile?.revocationId ? 'Active' : 'Not issued'} />
          <InfoCard label="Available claims" value="Name, age, state, degree, income" />
        </div>

        <div className="flex flex-wrap gap-3">
          <button onClick={generateProof} disabled={loading || !profile} className="rounded-full px-6">
            Refresh Proof
          </button>
          <button onClick={getQr} disabled={loading || !proof} className="rounded-full bg-teal-500 px-6 text-slate-950 hover:bg-teal-400">
            Load QR
          </button>
        </div>

        {message && <div className="rounded-[1.5rem] bg-stone-100 p-4 text-sm text-slate-700">{message}</div>}

        <section className="rounded-[2rem] bg-slate-950 p-5 text-slate-100 shadow-[0_28px_80px_rgba(15,23,42,0.18)] sm:p-7">
          <h3 className="font-serif text-2xl font-semibold">Persistent QR</h3>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            This QR persists for the account. Each verifier check still creates a fresh blockchain-anchored history entry.
          </p>

          <div className="mt-6 rounded-[1.75rem] bg-white/5 p-4 sm:p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Wallet holder preview</p>
            {profile?.photoDataUrl ? (
              <img
                src={profile.photoDataUrl}
                alt="Wallet holder preview"
                className="mt-3 aspect-square w-36 rounded-[1.1rem] object-cover sm:w-44"
              />
            ) : (
              <div className="mt-3 flex aspect-square w-36 items-center justify-center rounded-[1.1rem] bg-slate-900 text-center text-sm text-slate-400 sm:w-44">
                Upload a profile photo
              </div>
            )}
          </div>

          {qr ? (
            <div className="mt-5 grid gap-5 rounded-[1.75rem] bg-white p-4 text-slate-950 sm:p-5 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-center">
              <div className="flex aspect-square w-full max-w-[260px] items-center justify-center rounded-[1.35rem] bg-slate-50 p-3 shadow-[0_14px_45px_rgba(15,23,42,0.08)]">
                <img src={qr.qrImage} alt="ProofX verification QR code" className="h-full w-full object-contain" />
              </div>
              <div className="rounded-[1.2rem] bg-slate-950 p-4 text-slate-100 sm:p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-teal-300">Verifier URL</p>
                <p className="mt-3 break-all text-sm leading-6 text-slate-300">{qr.qrUrl}</p>
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-[1.5rem] bg-white/5 p-4 text-sm text-slate-300">Load the wallet QR after documents are parsed.</div>
          )}
        </section>

        {proof && (
          <div className="rounded-[1.75rem] bg-slate-950 p-6 text-slate-100">
            <p className="text-sm uppercase tracking-[0.2em] text-teal-300">Proof summary</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <InfoCard label="Issuer" value={proof.publicSignals.issuer} dark />
              <InfoCard label="Revocation ID" value={proof.publicSignals.revocationId || 'Not available'} dark />
              <InfoCard label="Issuer signature" value={proof.publicSignals.issuerSignature ? 'Valid demo signature' : 'Not available'} dark />
              <InfoCard label="Scheme" value={proof.proofData.scheme} dark />
              <InfoCard label="Generated at" value={new Date(proof.proofData.generatedAt).toLocaleString()} dark />
            </div>
          </div>
        )}

        <div className="rounded-[1.75rem] border border-stone-200 bg-stone-50 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-teal-700">Verification history</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">Accepted and rejected checks</h3>
            </div>
            <div className="rounded-full bg-white px-4 py-2 text-sm text-slate-600">{history.length} recorded checks</div>
          </div>
          <div className="mt-5 space-y-3">
            {history.length === 0 ? (
              <div className="rounded-[1.25rem] bg-white p-4 text-sm text-slate-600">No verifier has checked this profile yet.</div>
            ) : (
              history.map((item) => (
                <div key={item.id} className="rounded-[1.25rem] bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-semibold text-slate-900">{item.companyEmail}</p>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${item.result ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                      {item.result ? 'accepted' : 'rejected'}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{new Date(item.timestamp).toLocaleString()}</p>
                  {item.chainReference && <p className="mt-2 break-all text-xs text-slate-500">{item.chainReference}</p>}
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function InfoCard({ label, value, dark = false }: { label: string; value: string; dark?: boolean }) {
  return (
    <div className={`rounded-[1.5rem] p-4 ${dark ? 'bg-white/5' : 'bg-stone-100'}`}>
      <p className={`text-xs uppercase tracking-[0.2em] ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
      <p className={`mt-2 text-sm ${dark ? 'text-white' : 'text-slate-800'}`}>{value}</p>
    </div>
  );
}
