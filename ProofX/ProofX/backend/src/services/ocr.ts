import crypto from 'crypto';

export interface ExtractedProfile {
  name: string;
  dob: string;
  degree: string;
  state: string;
  income: number;
  issuer: string;
  revocationId: string;
  issuerSignature: string;
  photoDataUrl?: string;
  documentHash: string;
  sourceSummary: string[];
}

interface UploadLikeFile {
  originalname?: string;
  buffer?: Buffer;
  mimetype?: string;
  fieldname?: string;
}

interface ExtractionInput {
  files?: UploadLikeFile[];
  issuer?: string;
}

interface CategorizedFiles {
  identity: UploadLikeFile[];
  degree: UploadLikeFile[];
  income: UploadLikeFile[];
  address: UploadLikeFile[];
  supporting: UploadLikeFile[];
  photo: UploadLikeFile[];
  unknown: UploadLikeFile[];
}

const degreePatterns = [
  { pattern: /b\.?\s?tech/i, value: 'B.Tech' },
  { pattern: /m\.?\s?tech/i, value: 'M.Tech' },
  { pattern: /b\.?\s?sc/i, value: 'B.Sc' },
  { pattern: /m\.?\s?sc/i, value: 'M.Sc' },
  { pattern: /mba/i, value: 'MBA' },
  { pattern: /bca/i, value: 'BCA' },
];

function inferDegree(text: string) {
  for (const entry of degreePatterns) {
    if (entry.pattern.test(text)) {
      return entry.value;
    }
  }

  return 'B.Tech';
}

function getFileText(file: UploadLikeFile) {
  return `${file.originalname || ''}\n${file.buffer?.toString('utf8') || ''}`;
}

function categorizeFiles(files: UploadLikeFile[]): CategorizedFiles {
  return files.reduce<CategorizedFiles>(
    (accumulator, file) => {
      const name = (file.originalname || '').toLowerCase();
      if (file.fieldname === 'photo') {
        accumulator.photo.push(file);
      } else if (/aadhaar|aadhar|identity|uidai|pan/.test(name)) {
        accumulator.identity.push(file);
      } else if (/degree|academic|certificate/.test(name)) {
        accumulator.degree.push(file);
      } else if (/income|salary|bank|loan/.test(name)) {
        accumulator.income.push(file);
      } else if (/address|residence|utility|state/.test(name)) {
        accumulator.address.push(file);
      } else if (/support|summary|additional/.test(name)) {
        accumulator.supporting.push(file);
      } else if (file.mimetype?.startsWith('image/')) {
        accumulator.photo.push(file);
      } else {
        accumulator.unknown.push(file);
      }
      return accumulator;
    },
    {
      identity: [],
      degree: [],
      income: [],
      address: [],
      supporting: [],
      photo: [],
      unknown: [],
    },
  );
}

function inferDob(text: string) {
  const isoDateMatch = text.match(/\b(19|20)\d{2}[-/](0[1-9]|1[0-2])[-/](0[1-9]|[12]\d|3[01])\b/);
  if (isoDateMatch) {
    return isoDateMatch[0].replace(/\//g, '-');
  }

  const slashDateMatch = text.match(/\b([0-2]\d|3[01])[/-](0\d|1[0-2])[/-]((?:19|20)\d{2})\b/);
  if (slashDateMatch) {
    return `${slashDateMatch[3]}-${slashDateMatch[2]}-${slashDateMatch[1]}`;
  }

  return '2000-05-10';
}

function inferName(text: string) {
  const explicitMatch = text.match(/\bname[:\s]+([a-z][a-z\s]{2,40})/i);
  if (explicitMatch?.[1]) {
    return explicitMatch[1]
      .trim()
      .split(/\s+/)
      .slice(0, 3)
      .map((token) => token.charAt(0).toUpperCase() + token.slice(1).toLowerCase())
      .join(' ');
  }

  const cleaned = text
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b(photo|certificate|degree|resume|document|proofx|aadhaar|pan|income|address)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const tokens = cleaned.split(' ').filter(Boolean);
  if (tokens.length >= 2) {
    return tokens
      .slice(0, 2)
      .map((token) => token.charAt(0).toUpperCase() + token.slice(1).toLowerCase())
      .join(' ');
  }

  return 'Rahul Sharma';
}

function inferStateFromText(text: string) {
  const states = ['Karnataka', 'Tamil Nadu', 'Kerala', 'Maharashtra', 'Delhi', 'Telangana', 'Andhra Pradesh'];
  return states.find((state) => new RegExp(state, 'i').test(text)) || 'Karnataka';
}

function inferIncome(text: string) {
  const incomeMatch = text.match(/\b(?:income|salary|annual income)[:\s₹rs.]*([0-9][0-9,]{4,})\b/i);
  if (incomeMatch?.[1]) {
    const parsed = Number(incomeMatch[1].replace(/,/g, ''));
    if (Number.isFinite(parsed) && parsed >= 0) {
      return parsed;
    }
  }

  const genericAmount = text.match(/\b([0-9][0-9,]{5,})\b/);
  if (genericAmount?.[1]) {
    const parsed = Number(genericAmount[1].replace(/,/g, ''));
    if (Number.isFinite(parsed) && parsed >= 0) {
      return parsed;
    }
  }

  return 650000;
}

export async function extractProfileFromDocuments(input: ExtractionInput = {}): Promise<ExtractedProfile> {
  const files = input.files || [];
  const categorized = categorizeFiles(files);
  const photo = categorized.photo[0];
  const allText = files.map((file) => getFileText(file)).join('\n');
  const identityText = categorized.identity.map((file) => getFileText(file)).join('\n');
  const degreeText = categorized.degree.map((file) => getFileText(file)).join('\n');
  const incomeText = categorized.income.map((file) => getFileText(file)).join('\n');
  const addressText = categorized.address.map((file) => getFileText(file)).join('\n');
  const supportingText = categorized.supporting.map((file) => getFileText(file)).join('\n');
  const hash = crypto
    .createHash('sha256')
    .update(files.map((file) => file.buffer || Buffer.from(file.originalname || '')).reduce((acc, item) => Buffer.concat([acc, item]), Buffer.alloc(0)))
    .digest('hex');

  const issuerSource = [identityText, supportingText, allText].find((value) => value.trim().length > 0) || '';
  const issuerMatch = issuerSource.match(/\b(?:issuer|issuing source)[:\s]+([A-Za-z][A-Za-z\s]+)/i);
  const issuer = input.issuer || issuerMatch?.[1]?.trim() || 'DigiLocker';
  const revocationId = `rev_${hash.slice(0, 12)}`;
  const issuerSignature = crypto
    .createHash('sha256')
    .update(`issuer:${issuer}:${hash}:${revocationId}`)
    .digest('hex');

  const nameText = [identityText, supportingText, degreeText, allText].find((value) => value.trim().length > 0) || allText;
  const dobText = [identityText, supportingText, allText].find((value) => value.trim().length > 0) || allText;
  const degreeSource = [degreeText, supportingText, allText].find((value) => value.trim().length > 0) || allText;
  const incomeSource = [incomeText, supportingText, allText].find((value) => value.trim().length > 0) || allText;
  const stateSource = [addressText, identityText, supportingText, allText].find((value) => value.trim().length > 0) || allText;

  const profile = {
    name: inferName(nameText),
    dob: inferDob(dobText),
    degree: inferDegree(degreeSource),
    state: inferStateFromText(stateSource),
    income: inferIncome(incomeSource),
    issuer,
    revocationId,
    issuerSignature,
    photoDataUrl: photo?.buffer
      ? `data:image/${photo.originalname?.toLowerCase().endsWith('.svg') ? 'svg+xml' : 'png'};base64,${photo.buffer.toString('base64')}`
      : undefined,
    documentHash: hash || crypto.createHash('sha256').update(allText || 'proofx-demo').digest('hex'),
    sourceSummary: files.length > 0 ? files.map((file) => file.originalname || 'uploaded-document') : ['demo-document'],
  };

  return profile;
}
