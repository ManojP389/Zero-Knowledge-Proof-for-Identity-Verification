import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { VerificationHistoryItem, VerificationResult } from '../types';

interface LatestResultResponse {
  result: {
    verified: boolean;
    timestamp: string;
    userId?: string;
    userEmail?: string;
    companyId?: string;
    companyEmail?: string;
    chainReference?: string;
  } | null;
  history: VerificationHistoryItem[];
}

export default function VerificationResultPage() {
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [timestamp, setTimestamp] = useState('');
  const [history, setHistory] = useState<VerificationHistoryItem[]>([]);

  useEffect(() => {
    const raw = window.localStorage.getItem('proofx_verification_result');
    if (raw) {
      setResult(JSON.parse(raw) as VerificationResult);
    }

    const loadLatest = async () => {
      try {
        const latest = await apiFetch<LatestResultResponse>('/company/verification-result');
        setHistory(latest.history || []);
        if (latest.result?.timestamp) {
          setTimestamp(latest.result.timestamp);
        }
      } catch {
        // Keep the page usable even if the latest-result lookup fails.
      }
    };

    void loadLatest();
  }, []);

  return (
    <div className="space-y-6 rounded-[2.2rem] border border-white/70 bg-white/78 p-8 shadow-[0_28px_80px_rgba(15,23,42,0.08)] xl:min-h-[calc(100vh-14rem)]">
      <div>
        <p className="text-sm uppercase tracking-[0.25em] text-teal-700">Verifier side</p>
        <h2 className="mt-2 font-serif text-3xl font-semibold">Verification Result</h2>
      </div>

      {!result ? (
        <div className="rounded-[1.75rem] bg-stone-100 p-6 text-slate-700">No in-session verification result available yet. Historical verifier logs are shown below.</div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <ResultTile label="Name Check" value={result.nameVerified ? 'Passed' : 'Skipped / Failed'} positive={Boolean(result.nameVerified)} />
            <ResultTile label="Issuer Check" value={result.issuerVerified ? 'Passed' : 'Failed'} positive={result.issuerVerified} />
            <ResultTile label="Age Check" value={result.ageVerified ? 'Passed' : 'Failed'} positive={result.ageVerified} />
            <ResultTile label="State Check" value={result.stateVerified ? 'Passed' : 'Failed'} positive={result.stateVerified} />
            <ResultTile label="Degree Check" value={result.degreeVerified ? 'Passed' : 'Failed'} positive={result.degreeVerified} />
            <ResultTile label="Income Check" value={result.incomeVerified ? 'Passed' : 'Failed'} positive={result.incomeVerified} />
            <ResultTile label="Signature" value={result.signatureVerified ? 'Valid' : 'Invalid'} positive={result.signatureVerified} />
            <ResultTile label="Revocation" value={result.revocationVerified ? 'Active' : 'Revoked'} positive={result.revocationVerified} />
            <ResultTile label="Status" value={result.status} positive={result.verified} />
          </div>

          <div className="rounded-[1.75rem] bg-slate-950 p-6 text-slate-100">
            <p className="text-xs uppercase tracking-[0.2em] text-teal-300">Proof package summary</p>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <p>Verifier: {result.verifierName || 'Verifier'}</p>
              <p>Name Check: {result.nameVerified ? 'Passed' : 'Skipped / Failed'}</p>
              <p>Issuer Check: {result.issuerVerified ? 'Passed' : 'Failed'}</p>
              <p>Age Check: {result.ageVerified ? 'Passed' : 'Failed'}</p>
              <p>State Check: {result.stateVerified ? 'Passed' : 'Failed'}</p>
              <p>Degree Check: {result.degreeVerified ? 'Passed' : 'Failed'}</p>
              <p>Income Check: {result.incomeVerified ? 'Passed' : 'Failed'}</p>
              <p>Issuer Signature: {result.signatureVerified ? 'Valid' : 'Invalid'}</p>
              <p>Revocation Check: {result.revocationVerified ? 'Passed' : 'Failed'}</p>
              <p>Status: {result.status}</p>
              {result.proofPackage && (
                <>
                  <p>Issuer: {result.proofPackage.issuer}</p>
                  <p>Request ID: {result.proofPackage.requestId}</p>
                  <p>Revocation ID: {result.proofPackage.revocationId}</p>
                  <p className="break-all">Issuer signature: {result.proofPackage.issuerSignature}</p>
                  <p className="break-all">Proof hash: {result.proofPackage.proofHash}</p>
                  <p className="break-all">Nullifier: {result.proofPackage.nullifier}</p>
                </>
              )}
              {timestamp && <p>Timestamp: {new Date(timestamp).toLocaleString()}</p>}
              {result.chainReference && <p className="break-all">Chain reference: {result.chainReference}</p>}
            </div>
          </div>
        </>
      )}

      <div className="rounded-[1.75rem] bg-white p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-teal-700">Verifier history</p>
        <div className="mt-4 space-y-3">
          {history.length === 0 ? (
            <div className="rounded-[1.25rem] bg-stone-100 p-4 text-sm text-slate-600">No verification history available.</div>
          ) : (
            history.map((item) => (
              <div key={item.id} className="rounded-[1.25rem] bg-stone-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-semibold text-slate-900">{item.userEmail}</p>
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
    </div>
  );
}

function ResultTile({ label, value, positive }: { label: string; value: string; positive: boolean }) {
  return (
    <div className={`rounded-[1.75rem] p-5 ${positive ? 'bg-emerald-50' : 'bg-rose-50'}`}>
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className={`mt-3 text-2xl font-semibold ${positive ? 'text-emerald-700' : 'text-rose-700'}`}>{value}</p>
    </div>
  );
}
