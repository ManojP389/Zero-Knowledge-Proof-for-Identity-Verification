# ZeroProof Demo Data

Synthetic demo-only identities. Do not use real Aadhaar, PAN, salary slips, or personal photos in the hackathon demo.

Current demo bundle per user:

- `photo.svg`
- `aadhaar.svg`
- `degree-certificate.svg`
- `income-certificate.svg`
- `address-proof.svg`
- `supporting-document.svg`
- `bundle.json`

Use `photo.svg` as the photo upload and upload the five files from `bundle.json.documents` as the supporting document set. The dashboard now derives identity fields from those documents instead of asking the user to type them manually.

`document.svg` is kept for backward compatibility with the older one-document demo flow.

Recommended verifier scenarios:

- Bank KYC: `minAge=18`, `state=Karnataka`, active credential required.
- Employer: `minAge=21`, `degree=B.Tech`, active credential required.
- Loan: `minAge=21`, `minIncome=500000`, whitelisted issuer required.
- State subsidy: `state=Karnataka`, `minIncome=0`, active credential required.
