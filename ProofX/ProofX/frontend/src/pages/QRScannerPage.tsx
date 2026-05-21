import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BrowserQRCodeReader } from '@zxing/browser';
import { apiFetch } from '../api';
import { VerificationResult } from '../types';

export default function QRScannerPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [manualToken, setManualToken] = useState('');
  const [scanResult, setScanResult] = useState('');
  const [status, setStatus] = useState('Initializing scanner...');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const initialToken = searchParams.get('token');
    if (initialToken) {
      setManualToken(initialToken);
    }
  }, [searchParams]);

  useEffect(() => {
    const codeReader = new BrowserQRCodeReader();
    let controls: { stop: () => void } | null = null;

    const startScanner = async () => {
      if (!videoRef.current) {
        setStatus('Camera not available');
        return;
      }

      try {
        controls = await codeReader.decodeFromVideoDevice(undefined, videoRef.current, (result) => {
          if (result) {
            const tokenUrl = result.getText();
            setScanResult(tokenUrl);
            void handleScan(tokenUrl);
            controls?.stop();
          }
        });
        setStatus('Point your camera at the user QR code.');
      } catch {
        setStatus('Camera access unavailable. Use the token field below instead.');
      }
    };

    void startScanner();

    return () => {
      controls?.stop();
    };
  }, []);

  const verifyToken = async (token: string) => {
    const data = await apiFetch<VerificationResult>('/company/verify-qr', {
      method: 'POST',
      body: JSON.stringify({ token: extractToken(token) }),
    });
    window.localStorage.setItem('proofx_verification_result', JSON.stringify(data));
    navigate('/company/result');
  };

  const handleScan = async (result: string) => {
    try {
      const url = new URL(result);
      const token = url.searchParams.get('token');
      if (!token) {
        setStatus('No token found in scanned QR code.');
        return;
      }

      setStatus('Verifying QR token...');
      await verifyToken(token);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Verification failed');
    }
  };

  const submitManualToken = async () => {
    try {
      setStatus('Verifying token...');
      await verifyToken(manualToken);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Verification failed';
      setStatus(message.includes('already been used') ? 'Proof rejected: this QR was already used.' : message);
    }
  };

  return (
    <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.15fr)_420px]">
      <section className="space-y-6 rounded-[2.2rem] border border-white/70 bg-white/78 p-8 shadow-[0_28px_80px_rgba(15,23,42,0.08)] xl:min-h-[calc(100vh-14rem)]">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-teal-700">Verifier side</p>
          <h2 className="mt-2 font-serif text-3xl font-semibold">Proof QR Scanner</h2>
          <p className="mt-2 text-slate-600">Scan the user&apos;s proof QR. The result returns only pass/fail checks for your saved request.</p>
        </div>
        <div className="rounded-[1.75rem] border border-stone-200 bg-stone-100 p-4">
          <video ref={videoRef} className="aspect-video w-full rounded-[1.25rem] bg-slate-950 object-cover" muted playsInline />
        </div>
        {scanResult && (
          <div className="rounded-[1.5rem] bg-stone-100 p-4 text-sm text-slate-700">
            <p className="font-semibold">Scanned URL</p>
            <p className="mt-2 break-all">{scanResult}</p>
          </div>
        )}
        {status && <div className="rounded-[1.5rem] bg-stone-100 p-4 text-sm text-slate-700">{status}</div>}
      </section>

      <aside className="rounded-[2.2rem] border border-white/70 bg-slate-950 p-8 text-slate-100 shadow-[0_28px_80px_rgba(15,23,42,0.12)] 2xl:min-h-[calc(100vh-14rem)]">
        <h3 className="text-2xl font-semibold">Manual verification</h3>
        <p className="mt-3 text-sm text-slate-300">Paste the token from `https://yourapp.com/verify?token=abc123` if the webcam is unavailable.</p>
        <textarea
          className="mt-5 min-h-[160px] resize-none rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20"
          value={manualToken}
          onChange={(event) => setManualToken(event.target.value)}
          placeholder="Paste token only, not the whole raw user data"
        />
        <button onClick={submitManualToken} disabled={!manualToken} className="mt-4 w-full rounded-full bg-teal-500 text-slate-950 hover:bg-teal-400">
          Verify QR
        </button>
      </aside>
    </div>
  );
}

function extractToken(input: string) {
  const trimmed = input.trim();
  try {
    const url = new URL(trimmed);
    return url.searchParams.get('token') || trimmed;
  } catch {
    return trimmed;
  }
}
