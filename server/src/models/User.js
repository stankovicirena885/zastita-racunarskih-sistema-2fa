import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const RecoveryCodeSchema = new Schema(
  {
    codeHash: { type: String, required: true },
    usedAt: { type: Date, default: null },
  },
  { _id: false }
);

const TwoFATotpSchema = new Schema(
  {
    enabled: { type: Boolean, default: false },
    secret: { type: String, default: null },
    enabledAt: { type: Date, default: null },
  },
  { _id: false }
);

const UserSchema = new Schema(
  {
    email: { type: String, unique: true, index: true },
    passwordHash: String,
    totp: { type: TwoFATotpSchema, default: {} },
    recoveryCodes: { type: [RecoveryCodeSchema], default: [] },
  },
  { timestamps: true }
);

export default model('User', UserSchema);
