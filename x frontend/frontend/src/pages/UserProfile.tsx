import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';
import WorkspaceShell from '../components/WorkspaceShell';
import {
  DEFAULT_USER,
  createProofForRequest,
  getActiveRequest,
  getQrPayload,
  saveProof,
} from '../lib/proofxMock';

const userNavItems = [
  { label: 'Upload', path: '/user/upload' },
  { label: 'Profile & QR', path: '/user/profile' },
  { label: 'Notifications', path: '/user/notifications' },
];

const UserProfile = () => {
  const request = useMemo(() => getActiveRequest(), []);
  const [qrValue, setQrValue] = useState('');
  const navigate = useNavigate();

  const handleGenerateProof = () => {
    const proof = createProofForRequest(request);
    saveProof(proof);
  };

  const handleGenerateQr = () => {
    setQrValue(getQrPayload(request.code));
  };

  return (
    <WorkspaceShell
      role="USER"
      handle="ayush@123"
      sectionLabel="USER SIDE"
      pageTitle="Profile + QR Page"
      pageDescription="Preview extracted fields, generate your proof, and publish a single verifier QR without exposing raw documents."
      navItems={userNavItems}
      activePath="/user/profile"
      sidePanel={
        <div>
          <h3 className="text-[2rem] leading-tight">Single QR Code</h3>
          <p style={{ marginTop: '0.8rem' }}>
            This QR links to a verification token only. No raw data is embedded in the code.
          </p>
          <div className="workspace-inline-card" style={{ marginTop: '1.2rem', background: 'rgba(255,255,255,0.06)' }}>
            {qrValue ? (
              <div style={{ textAlign: 'center' }}>
                <div className="workspace-qr-wrap">
                  <QRCode value={qrValue} size={180} />
                </div>
                <p style={{ marginTop: '0.9rem' }}>{request.code}</p>
              </div>
            ) : (
              <p>Generate a proof first, then create your QR.</p>
            )}
          </div>
        </div>
      }
    >
      <div className="workspace-form-grid three">
        <div className="workspace-stat">
          <div className="workspace-stat-label">NAME</div>
          <div className="workspace-stat-value">{DEFAULT_USER.name}</div>
        </div>
        <div className="workspace-stat">
          <div className="workspace-stat-label">DOB</div>
          <div className="workspace-stat-value">Not available</div>
        </div>
        <div className="workspace-stat">
          <div className="workspace-stat-label">DEGREE</div>
          <div className="workspace-stat-value">{DEFAULT_USER.degree}</div>
        </div>
      </div>

      <div className="workspace-action-row">
        <button type="button" className="workspace-secondary-button" onClick={handleGenerateProof}>
          Generate Proof
        </button>
        <button type="button" className="workspace-mint-button" onClick={handleGenerateQr}>
          Generate QR
        </button>
        <button type="button" className="workspace-primary-button" onClick={() => navigate('/user/notifications')}>
          Notifications
        </button>
      </div>
    </WorkspaceShell>
  );
};

export default UserProfile;
