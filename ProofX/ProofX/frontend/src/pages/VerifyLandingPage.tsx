import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

export default function VerifyLandingPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const hasToken = useMemo(() => Boolean(token), [token]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.16),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(15,23,42,0.18),_transparent_22%),linear-gradient(180deg,_#fcfaf4_0%,_#f4ecda_44%,_#efe3cd_100%)] px-4 py-6 text-slate-900 xl:px-8">
      <div className="grid min-h-[calc(100vh-3rem)] gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="flex flex-col justify-between rounded-[2.4rem] bg-slate-950 p-8 text-white shadow-[0_32px_90px_rgba(15,23,42,0.18)] xl:p-12">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-teal-300">Verifier Link</p>
            <h2 className="mt-4 text-5xl font-semibold leading-tight">Verification request received</h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">
              This page proves the QR only carries a tokenized verification link. A verifier can continue the check without seeing the user&apos;s raw credential data.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <LandingInfo label="Data exposure" value="None in QR" />
            <LandingInfo label="Payload type" value="Signed token" />
            <LandingInfo label="Next step" value="Verifier check" />
          </div>
        </section>

        <section className="rounded-[2.4rem] border border-white/70 bg-white/80 p-8 shadow-[0_28px_80px_rgba(15,23,42,0.08)] xl:p-10">
          <p className="text-sm uppercase tracking-[0.25em] text-teal-700">Token status</p>
          <div className="mt-5 rounded-[1.8rem] bg-stone-100 p-5">
            <p className="break-all text-sm leading-6 text-slate-700">{hasToken ? token : 'No token found in the link.'}</p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800" to="/auth">
              Login as verifier
            </Link>
            <Link
              className="rounded-full bg-teal-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-teal-400"
              to={`/company/scan${hasToken ? `?token=${encodeURIComponent(token || '')}` : ''}`}
            >
              Continue to verification
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

function LandingInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.6rem] border border-white/10 bg-white/5 p-5">
      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{label}</p>
      <p className="mt-3 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
