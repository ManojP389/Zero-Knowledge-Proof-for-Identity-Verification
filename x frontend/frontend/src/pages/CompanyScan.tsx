import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { BrowserMultiFormatReader } from '@zxing/library';
import WorkspaceShell from '../components/WorkspaceShell';
import {
  buildVerificationResult,
  getActiveRequest,
  type VerificationRequest,
} from '../lib/proofxMock';

const companyNavItems = [
  { label: 'Requirements', path: '/company/requirements' },
  { label: 'Scan QR', path: '/company/scan' },
  { label: 'Result', path: '/company/result' },
];

type LocationState = {
  request?: VerificationRequest;
};

const CompanyScan = () => {
  const webcamRef = useRef<Webcam>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [scanError, setScanError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const request = (location.state as LocationState | null)?.request ?? getActiveRequest();

  useEffect(() => {
    return () => {
      codeReaderRef.current?.reset();
    };
  }, []);

  const completeVerification = (code: string) => {
    const result = buildVerificationResult(code, request);
    navigate('/company/result', { state: { result } });
  };

  const extractCode = (rawValue: string) => {
    try {
      const parsed = JSON.parse(rawValue) as { code?: string };
      return parsed.code?.trim() ?? rawValue.trim();
    } catch {
      return rawValue.trim();
    }
  };

  const startScanning = async () => {
    setScanError('');
    codeReaderRef.current = new BrowserMultiFormatReader();

    try {
      const result = await codeReaderRef.current.decodeOnceFromVideoDevice(
        undefined,
        'proofx-camera-feed',
      );
      completeVerification(extractCode(result.getText()));
    } catch {
      setScanError('Camera scan did not complete. Use manual verification if needed.');
      codeReaderRef.current?.reset();
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) {
      setScanError('Paste the verification token or 10-digit code.');
      return;
    }

    completeVerification(manualCode.trim());
  };

  return (
    <div>
      <div className="workspace-status-dot"></div>
      <WorkspaceShell
        role="COMPANY"
        handle="channa@123"
        sectionLabel="COMPANY SIDE"
        pageTitle="QR Scanner Page"
        pageDescription="Use the webcam to scan a proof token or paste a token from a verifier link."
        navItems={companyNavItems}
        activePath="/company/scan"
        sidePanel={
          <form onSubmit={handleManualSubmit}>
            <h3 className="text-[2rem] leading-tight">Manual verification</h3>
            <p style={{ marginTop: '0.8rem' }}>
              Paste the token from `https://yourapp.com/verify?token=abc123` if the webcam is unavailable.
            </p>
            <textarea
              className="workspace-textarea"
              style={{ marginTop: '1rem' }}
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Paste token only, not the whole raw user data"
            />
            <button type="submit" className="workspace-mint-button" style={{ marginTop: '1rem', width: '100%' }}>
              Verify QR
            </button>
            {scanError ? <p style={{ marginTop: '0.8rem', color: '#ffb8b8' }}>{scanError}</p> : null}
          </form>
        }
      >
        <div className="workspace-camera-frame">
          <Webcam
            ref={webcamRef}
            audio={false}
            id="proofx-camera-feed"
            className="w-full h-80 object-cover"
            videoConstraints={{ facingMode: 'environment' }}
          />
        </div>

        <div className="workspace-camera-hint">
          Point your camera at the user QR code.
        </div>

        <div className="workspace-action-row">
          <button type="button" className="workspace-mint-button" onClick={startScanning}>
            Start Camera Scan
          </button>
          <div className="workspace-caption-pill">Active code: {request.code}</div>
        </div>
      </WorkspaceShell>
    </div>
  );
};

export default CompanyScan;
