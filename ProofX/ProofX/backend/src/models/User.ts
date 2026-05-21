import { Schema, model } from 'mongoose';

export interface IUserDocument {
  email: string;
  passwordHash: string;
  role: 'user' | 'company';
  profile?: {
    name?: string;
    dob?: string;
    degree?: string;
    state?: string;
    income?: number;
    issuer?: string;
    revocationId?: string;
    issuerSignature?: string;
    photoDataUrl?: string;
    documentHash?: string;
    sourceSummary?: string[];
  };
  qrToken?: string;
  proof?: {
    publicSignals: {
      documentCommitment: string;
      issuer: string;
      revocationId: string;
      issuerSignature: string;
      issuedClaimSet: string[];
    };
    proofData: {
      scheme: string;
      proof: string;
      commitment: string;
      generatedAt: string;
    };
  };
}

const UserSchema = new Schema<IUserDocument>({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, required: true, enum: ['user', 'company'] },
  profile: {
    name: String,
    dob: String,
    degree: String,
    state: String,
    income: Number,
    issuer: String,
    revocationId: String,
    issuerSignature: String,
    photoDataUrl: String,
    documentHash: String,
    sourceSummary: [String],
  },
  qrToken: String,
  proof: {
    publicSignals: {
      documentCommitment: String,
      issuer: String,
      revocationId: String,
      issuerSignature: String,
      issuedClaimSet: [String],
    },
    proofData: {
      scheme: String,
      proof: String,
      commitment: String,
      generatedAt: String,
    },
  },
});

export default model<IUserDocument>('User', UserSchema);
