import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WorkspaceShell from '../components/WorkspaceShell';

const userNavItems = [
  { label: 'Upload', path: '/user/upload' },
  { label: 'Profile & QR', path: '/user/profile' },
  { label: 'Notifications', path: '/user/notifications' },
];

const UserUpload = () => {
  const [photo, setPhoto] = useState<File | null>(null);
  const [certificates, setCertificates] = useState<FileList | null>(null);
  const navigate = useNavigate();

  const handleGenerate = () => {
    navigate('/user/profile');
  };

  return (
    <WorkspaceShell
      role="USER"
      handle="ayush@123"
      sectionLabel="USER SIDE"
      pageTitle="Upload Dashboard"
      pageDescription="Upload your photo and certificate, then generate an identity record from OCR-style extraction."
      navItems={userNavItems}
      activePath="/user/upload"
      sidePanel={
        <div>
          <h3 className="text-[2rem] leading-tight">Extracted data preview</h3>
          <div className="workspace-preview-box dark" style={{ marginTop: '1rem' }}>
            <p>Your extracted profile will appear here after upload.</p>
          </div>
        </div>
      }
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div></div>
        <div className="workspace-caption-pill">Button goal: "Generate Identity"</div>
      </div>

      <div className="workspace-form-grid" style={{ marginTop: '1rem' }}>
        <div className="workspace-field">
          <label>Photo</label>
          <input
            type="file"
            className="workspace-input"
            onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
          />
        </div>
        <div className="workspace-field">
          <label>Certificate</label>
          <input
            type="file"
            multiple
            className="workspace-input"
            onChange={(e) => setCertificates(e.target.files)}
          />
        </div>
      </div>

      <div className="workspace-form-grid three" style={{ marginTop: '0.9rem' }}>
        <div className="workspace-field">
          <label>Name</label>
          <input className="workspace-input" defaultValue="Rahul Sharma" />
        </div>
        <div className="workspace-field">
          <label>DOB</label>
          <input className="workspace-input" defaultValue="10/05/2000" />
        </div>
        <div className="workspace-field">
          <label>Degree</label>
          <input className="workspace-input" defaultValue="B.Tech" />
        </div>
      </div>

      <div className="workspace-action-row">
        <button
          type="button"
          className="workspace-primary-button"
          onClick={handleGenerate}
          disabled={!photo && !certificates}
        >
          Generate Identity
        </button>
      </div>
    </WorkspaceShell>
  );
};

export default UserUpload;
