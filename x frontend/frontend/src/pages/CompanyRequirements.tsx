import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WorkspaceShell from '../components/WorkspaceShell';
import { saveActiveRequest } from '../lib/proofxMock';

const companyNavItems = [
  { label: 'Requirements', path: '/company/requirements' },
  { label: 'Scan QR', path: '/company/scan' },
  { label: 'Result', path: '/company/result' },
];

const CompanyRequirements = () => {
  const [age, setAge] = useState('18');
  const [degree, setDegree] = useState('B.Tech');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const request = saveActiveRequest({
      verifierName: 'TechCorp Hiring',
      minAge: Number(age),
      requiredDegree: degree,
    });
    navigate('/company/scan', { state: { request } });
  };

  return (
    <WorkspaceShell
      role="COMPANY"
      handle="channa@123"
      sectionLabel="COMPANY SIDE"
      pageTitle="Requirement Setup"
      pageDescription="Define the predicates you want to verify. These rules are stored off-chain for app logic and optionally anchored on-chain."
      navItems={companyNavItems}
      activePath="/company/requirements"
    >
      <form onSubmit={handleSubmit}>
        <div className="workspace-form-grid">
          <div className="workspace-field">
            <label>Age ≥ ?</label>
            <input
              type="number"
              className="workspace-input"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
          </div>
          <div className="workspace-field">
            <label>Degree = ?</label>
            <input
              className="workspace-input"
              value={degree}
              onChange={(e) => setDegree(e.target.value)}
            />
          </div>
        </div>

        <div className="workspace-action-row">
          <button type="submit" className="workspace-primary-button">
            Submit Requirements
          </button>
        </div>
      </form>
    </WorkspaceShell>
  );
};

export default CompanyRequirements;
