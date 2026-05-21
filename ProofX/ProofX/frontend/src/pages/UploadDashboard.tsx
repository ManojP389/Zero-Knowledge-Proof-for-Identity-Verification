import { useMemo, useState } from 'react';
import { apiFetch } from '../api';
import { ProfileData, ProofData } from '../types';

interface UploadResponse {
  profile: ProfileData;
  proof: ProofData;
  storage: {
    chainReference: string;
    visibility: string;
  };
}

type DocumentSlotKey = 'identity' | 'degree' | 'income' | 'address' | 'supporting' | 'other';

interface DocumentSlot {
  key: DocumentSlotKey;
  label: string;
  matcher: RegExp;
}

const documentSlots: DocumentSlot[] = [
  { key: 'identity', label: 'Aadhaar / identity source', matcher: /aadhaar|aadhar|identity|uidai|pan/i },
  { key: 'degree', label: 'Degree certificate', matcher: /degree|academic|certificate/i },
  { key: 'income', label: 'Income certificate', matcher: /income|salary|bank|loan/i },
  { key: 'address', label: 'Address proof', matcher: /address|residence|utility|state/i },
  { key: 'supporting', label: 'Additional supporting document', matcher: /support|summary|additional/i },
];

function mapDocumentsToSlots(files: File[]) {
  const mapping: Record<DocumentSlotKey, File | null> = {
    identity: null,
    degree: null,
    income: null,
    address: null,
    supporting: null,
    other: null,
  };

  for (const file of files) {
    const slot = documentSlots.find((entry) => entry.matcher.test(file.name));
    if (slot && !mapping[slot.key]) {
      mapping[slot.key] = file;
      continue;
    }

    const nextOpenSlot = documentSlots.find((entry) => !mapping[entry.key]);
    if (nextOpenSlot) {
      mapping[nextOpenSlot.key] = file;
    } else if (!mapping.other) {
      mapping.other = file;
    }
  }

  return mapping;
}

export default function UploadDashboard() {
  const [photo, setPhoto] = useState<File | null>(null);
  const [documents, setDocuments] = useState<File[]>([]);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [chainReference, setChainReference] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const documentMapping = useMemo(() => mapDocumentsToSlots(documents), [documents]);

  const upload = async () => {
    if (!photo && documents.length === 0) {
      setStatus('Upload at least one identity photo or document.');
      return;
    }

    setLoading(true);
    setStatus('');
    const form = new FormData();
    if (photo) {
      form.append('photo', photo);
    }
    documents.forEach((file) => form.append('documents', file));

    try {
      const result = await apiFetch<UploadResponse>('/user/upload-documents', {
        method: 'POST',
        body: form,
      });
      setProfile(result.profile);
      setChainReference(result.storage.chainReference);
      setStatus('Documents parsed. The confirmation cards below now map files by document type, not by selection order.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 rounded-[2.2rem] border border-white/70 bg-white/78 p-8 shadow-[0_28px_80px_rgba(15,23,42,0.08)] xl:min-h-[calc(100vh-14rem)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-teal-700">User side</p>
          <h2 className="mt-2 font-serif text-3xl font-semibold">Upload Dashboard</h2>
          <p className="mt-2 max-w-2xl text-slate-600">
            This dashboard extracts identity fields from uploaded files. The confirmation section now maps files to document types instead of relying on raw upload order.
          </p>
        </div>
        <div className="rounded-[1.5rem] bg-stone-100 px-4 py-3 text-sm text-slate-600">Demo mode: uploads simulate a future DigiLocker-style trusted ingestion flow.</div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <div className="space-y-5">
          <div className="rounded-[1.75rem] border border-stone-200 bg-stone-50 p-5">
            <h3 className="text-lg font-semibold text-slate-900">Trusted source bundle</h3>
            <p className="mt-2 text-sm text-slate-600">Upload a profile photo plus up to five supporting documents. Parser quality is strongest when filenames reflect the document type.</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Profile photo</span>
                <input type="file" accept="image/*" onChange={(event) => setPhoto(event.target.files?.[0] || null)} />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Identity and certificate files</span>
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  multiple
                  onChange={(event) => setDocuments(Array.from(event.target.files || []))}
                />
              </label>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {documentSlots.map((slot) => (
                <ConfirmationCard key={slot.key} label={slot.label} filename={documentMapping[slot.key]?.name || 'Not uploaded yet'} />
              ))}
              <ConfirmationCard label="Unmapped extra file" filename={documentMapping.other?.name || 'No extra file'} />
            </div>
          </div>

          <button onClick={upload} disabled={loading} className="rounded-full px-6">
            {loading ? 'Parsing documents...' : 'Parse Documents'}
          </button>

          {status && <div className="rounded-[1.5rem] bg-stone-100 p-4 text-sm text-slate-700">{status}</div>}
        </div>

        <div className="rounded-[1.75rem] bg-slate-950 p-6 text-slate-100">
          <h3 className="text-xl font-semibold">Extracted profile preview</h3>
          {profile ? (
            <div className="mt-4 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Metric label="Name" value={profile.name || '-'} />
                <Metric label="Date of birth" value={profile.dob || '-'} />
                <Metric label="Degree" value={profile.degree || '-'} />
                <Metric label="State" value={profile.state || '-'} />
                <Metric label="Income" value={profile.income ? `Rs. ${profile.income.toLocaleString('en-IN')}` : '-'} />
                <Metric label="Issuer" value={profile.issuer || '-'} />
                <Metric label="Revocation ID" value={profile.revocationId || '-'} />
                <Metric label="Source files" value={(profile.sourceSummary || []).join(', ') || '-'} />
              </div>
              <div className="rounded-[1.5rem] bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-teal-300">Blockchain anchor</p>
                <p className="mt-2 break-all text-sm text-slate-300">{chainReference}</p>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-300">The parsed identity profile appears here after upload.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ConfirmationCard({ label, filename }: { label: string; filename: string }) {
  return (
    <div className="rounded-[1.25rem] bg-white px-4 py-3 text-sm text-slate-700 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
      <p className="font-medium">{label}</p>
      <p className="mt-1 text-slate-500">{filename}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm text-white">{value}</p>
    </div>
  );
}
