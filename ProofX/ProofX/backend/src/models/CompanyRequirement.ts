import { Schema, model } from 'mongoose';

export interface ICompanyRequirementDocument {
  companyId: string;
  rules: {
    requestId?: string;
    minAge?: number;
    degree?: string;
    state?: string;
    minIncome?: number;
    requireWhitelistedIssuer?: boolean;
    requireActiveCredential?: boolean;
  };
}

const CompanyRequirementSchema = new Schema<ICompanyRequirementDocument>({
  companyId: { type: String, required: true, unique: true },
  rules: {
    requestId: String,
    minAge: Number,
    degree: String,
    state: String,
    minIncome: Number,
    requireWhitelistedIssuer: Boolean,
    requireActiveCredential: Boolean,
  },
});

export default model<ICompanyRequirementDocument>('CompanyRequirement', CompanyRequirementSchema);
