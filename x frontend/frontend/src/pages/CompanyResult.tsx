import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import WorkspaceShell from '../components/WorkspaceShell';
import {
  buildVerificationResult,
  getActiveRequest,
  type VerificationResult,
} from '../lib/proofxMock';

const companyNavItems = [
  { label: 'Requirements', path: '/company/requirements' },
  { label: 'Scan QR', path: '/company/scan' },
  { label: 'Result', path: '/company/result' },
];

type LocationState = {
  result?: VerificationResult;
};

const CompanyResult = () => {
  const location = useLocation();

  const result = useMemo(() => {
    const incoming = (location.state as LocationState | null)?.result;
    if (incoming) {
      return incoming;
    }

    const request = getActiveRequest();
    return buildVerificationResult(request.code, request);
  }, [location.state]);

  const hasProof = Boolean(result.proof);

  return (
    <div>
      <div className="workspace-status-dot"></div>
      <WorkspaceShell
        role="COMPANY"
        handle="channa@123"
        sectionLabel="COMPANY SIDE"
        pageTitle="Result"
        pageDescription="Review the selective disclosure outcome and the hashes that your teammates can later replace with real blockchain responses."
        navItems={companyNavItems}
        activePath="/company/result"
      >
        {!hasProof ? (
          <div className="workspace-result-box">
            No verification result available.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '0.9rem' }}>
            <div className={result.verified ? 'workspace-result-box success' : 'workspace-result-box fail'}>
              {result.verified ? 'Verification successful.' : result.failureReason}
            </div>
            <div className="workspace-inline-card">
              Requirement hash: {result.request.requirementHash}
            </div>
            <div className="workspace-inline-card">
              Credential hash: {result.proof?.blockchainCredentialHash}
            </div>
            <div className="workspace-inline-card">
              Audit hash: {result.proof?.blockchainAuditHash}
            </div>
          </div>
        )}
      </WorkspaceShell>
    </div>
  );
};

export default CompanyResult;
