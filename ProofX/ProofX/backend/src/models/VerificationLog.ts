import { Schema, model } from 'mongoose';

export interface IVerificationLogDocument {
  userId: string;
  companyId: string;
  result: boolean;
  timestamp: Date;
}

const VerificationLogSchema = new Schema<IVerificationLogDocument>({
  userId: { type: String, required: true },
  companyId: { type: String, required: true },
  result: { type: Boolean, required: true },
  timestamp: { type: Date, default: Date.now },
});

export default model<IVerificationLogDocument>('VerificationLog', VerificationLogSchema);
