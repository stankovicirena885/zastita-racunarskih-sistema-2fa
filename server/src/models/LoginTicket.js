import mongoose from 'mongoose';
const { Schema, model, Types } = mongoose;

const LoginTicketSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', index: true, required: true },
    purpose: { type: String, enum: ['2fa'], default: '2fa' },
    expiresAt: { type: Date, index: { expires: '5m' } }, // TTL index
  },
  { timestamps: true }
);

export default model('LoginTicket', LoginTicketSchema);
