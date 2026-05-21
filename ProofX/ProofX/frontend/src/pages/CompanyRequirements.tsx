import { useEffect, useState } from 'react';
import { apiFetch, logout } from '../api';
import { VerificationHistoryItem } from '../types';

interface RequirementRules {
  requestId?: string;
  minAge?: number;
  degree?: string;
  state?: string;
  minIncome?: number;
  requireWhitelistedIssuer?: boolean;
  requireActiveCredential?: boolean;
  name?: string;
  issuer?: string;
}

interface RequirementsResponse {
  rules: RequirementRules;
  locked: boolean;
  deletedAt: string | null;
  accountChainReference: string | null;
  requirementChainReference: string | null;
  verificationHistory: VerificationHistoryItem[];
}

interface SaveResponse {
  message: string;
  rules: RequirementRules;
  chainReference: string;
}

interface DeleteResponse {
  message: string;
  deletedAt: string | null;
  chainReference: string;
}

export default function CompanyRequirements() {
  const [minAge, setMinAge] = useState('');
  const [degree, setDegree] = useState('');
  const [stateValue, setStateValue] = useState('');
  const [minIncome, setMinIncome] = useState('');
  const [name, setName] = useState('');
  const [issuer, setIssuer] = useState('');
  const [requireWhitelistedIssuer, setRequireWhitelistedIssuer] = useState(true);
  const [requireActiveCredential, setRequireActiveCredential] = useState(true);
  const [requestId, setRequestId] = useState('');
  const [status, setStatus] = useState('');
  const [chainReference, setChainReference] = useState('');
  const [accountChainReference, setAccountChainReference] = useState('');
  const [locked, setLocked] = useState(false);
  const [deletedAt, setDeletedAt] = useState<string | null>(null);
  const [history, setHistory] = useState<VerificationHistoryItem[]>([]);

  useEffect(() => {
    const loadRequirements = async () => {
      try {
        const response = await apiFetch<RequirementsResponse>('/company/requirements');
        if (typeof response.rules.minAge === 'number') {
          setMinAge(String(response.rules.minAge));
        }
        if (response.rules.degree) {
          setDegree(response.rules.degree);
        }
        if (response.rules.state) {
          setStateValue(response.rules.state);
        }
        if (typeof response.rules.minIncome === 'number') {
          setMinIncome(String(response.rules.minIncome));
        }
        if (response.rules.name) {
          setName(response.rules.name);
        }
        if (response.rules.issuer) {
          setIssuer(response.rules.issuer);
        }
        if (response.rules.requestId) {
          setRequestId(response.rules.requestId);
        }
        if (typeof response.rules.requireWhitelistedIssuer === 'boolean') {
          setRequireWhitelistedIssuer(response.rules.requireWhitelistedIssuer);
        }
        if (typeof response.rules.requireActiveCredential === 'boolean') {
          setRequireActiveCredential(response.rules.requireActiveCredential);
        }
        setLocked(response.locked);
        setDeletedAt(response.deletedAt);
        setHistory(response.verificationHistory || []);
        setAccountChainReference(response.accountChainReference || '');
        setChainReference(response.requirementChainReference || '');
      } catch (err) {
        setStatus(err instanceof Error ? err.message : 'Failed to load requirements');
      }
    };

    void loadRequirements();
  }, []);

  const save = async () => {
    try {
      const result = await apiFetch<SaveResponse>('/company/set-requirements', {
        method: 'POST',
        body: JSON.stringify({
          minAge: minAge ? Number(minAge) : undefined,
          degree: degree || undefined,
          state: stateValue || undefined,
          minIncome: minIncome ? Number(minIncome) : undefined,
          name: name || undefined,
          issuer: issuer || undefined,
          requireWhitelistedIssuer,
          requireActiveCredential,
        }),
      });
      setRequestId(result.rules.requestId || '');
      setChainReference(result.chainReference);
      setLocked(true);
      setStatus('Verifier requirement policy stored permanently. Empty fields were ignored.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Save failed');
    }
  };

  const deleteAccount = async () => {
    try {
      const result = await apiFetch<DeleteResponse>('/company/account', {
        method: 'DELETE',
      });
      setDeletedAt(result.deletedAt);
      setStatus(result.message);
      setChainReference(result.chainReference);
      logout();
      window.location.href = '/auth';
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const acceptedCount = history.filter((item) => item.result).length;
  const rejectedCount = history.length - acceptedCount;
  const disabled = locked || Boolean(deletedAt);

  return (
    <div className="space-y-6 rounded-[2.2rem] border border-white/70 bg-white/78 p-8 shadow-[0_28px_80px_rgba(15,23,42,0.08)] xl:min-h-[calc(100vh-14rem)]">
      <div>
        <p className="text-sm uppercase tracking-[0.25em] text-teal-700">Verifier side</p>
        <h2 className="mt-2 font-serif text-3xl font-semibold">Verifier Account Policy</h2>
        <p className="mt-2 max-w-2xl text-slate-600">
          Each verifier account can create one permanent requirement policy. Leaving a field empty means it is not required for verification.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard label="Account status" value={deletedAt ? 'Deleted' : locked ? 'Locked policy' : 'Setup pending'} />
        <SummaryCard label="Accepted" value={String(acceptedCount)} />
        <SummaryCard label="Rejected" value={String(rejectedCount)} />
        <SummaryCard label="Checks logged" value={String(history.length)} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Name contains</span>
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Optional" disabled={disabled} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Minimum age</span>
          <input type="number" min="0" value={minAge} onChange={(event) => setMinAge(event.target.value)} placeholder="Optional" disabled={disabled} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Degree equals</span>
          <input value={degree} onChange={(event) => setDegree(event.target.value)} placeholder="Optional" disabled={disabled} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">State equals</span>
          <input value={stateValue} onChange={(event) => setStateValue(event.target.value)} placeholder="Optional" disabled={disabled} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Minimum income</span>
          <input type="number" min="0" value={minIncome} onChange={(event) => setMinIncome(event.target.value)} placeholder="Optional" disabled={disabled} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Issuer equals</span>
          <input value={issuer} onChange={(event) => setIssuer(event.target.value)} placeholder="Optional" disabled={disabled} />
        </label>
        <label className="flex items-center gap-3 rounded-[1.5rem] bg-stone-100 px-4 py-3">
          <input
            type="checkbox"
            checked={requireWhitelistedIssuer}
            onChange={(event) => setRequireWhitelistedIssuer(event.target.checked)}
            className="h-4 w-4"
            disabled={disabled}
          />
          <span className="text-sm font-medium text-slate-700">Require whitelisted issuer</span>
        </label>
        <label className="flex items-center gap-3 rounded-[1.5rem] bg-stone-100 px-4 py-3">
          <input
            type="checkbox"
            checked={requireActiveCredential}
            onChange={(event) => setRequireActiveCredential(event.target.checked)}
            className="h-4 w-4"
            disabled={disabled}
          />
          <span className="text-sm font-medium text-slate-700">Require active, non-revoked credential</span>
        </label>
      </div>

      <div className="flex flex-wrap gap-3">
        <button onClick={save} disabled={disabled} className="rounded-full px-6">
          {locked ? 'Policy stored permanently' : 'Create Permanent Policy'}
        </button>
        <button onClick={deleteAccount} disabled={Boolean(deletedAt)} className="rounded-full bg-rose-100 px-6 text-rose-700 hover:bg-rose-200">
          Delete verifier account
        </button>
      </div>

      {status && <div className="rounded-[1.5rem] bg-stone-100 p-4 text-sm text-slate-700">{status}</div>}
      {requestId && (
        <div className="rounded-[1.5rem] bg-emerald-50 p-4 text-sm text-emerald-800">
          Request ID: <span className="font-semibold">{requestId}</span>
        </div>
      )}
      {accountChainReference && (
        <div className="rounded-[1.5rem] bg-white p-4 text-sm text-slate-700">
          Verifier account anchor: <span className="break-all">{accountChainReference}</span>
        </div>
      )}
      {chainReference && (
        <div className="rounded-[1.75rem] bg-slate-950 p-5 text-slate-100">
          <p className="text-xs uppercase tracking-[0.2em] text-teal-300">Blockchain reference</p>
          <p className="mt-2 break-all text-sm text-slate-300">{chainReference}</p>
        </div>
      )}

      <div className="rounded-[1.75rem] border border-stone-200 bg-stone-50 p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-teal-700">Verifier history</p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900">Accepted and rejected users</h3>
          </div>
          <div className="rounded-full bg-white px-4 py-2 text-sm text-slate-600">{history.length} total records</div>
        </div>
        <div className="mt-5 space-y-3">
          {history.length === 0 ? (
            <div className="rounded-[1.25rem] bg-white p-4 text-sm text-slate-600">No verifications recorded yet.</div>
          ) : (
            history.map((item) => (
              <div key={item.id} className="rounded-[1.25rem] bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
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

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}
