const mongoose = require('mongoose');

const onlineTransactionSchema = new mongoose.Schema(
  {
    txRef: { type: String, required: true, unique: true, index: true },
    flwRef: { type: String, index: true },
    type: {
      type: String,
      enum: ['school_fee', 'platform_subscription'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'successful', 'failed', 'cancelled'],
      default: 'pending',
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'NGN' },
    school: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
    fee: { type: mongoose.Schema.Types.ObjectId, ref: 'Fee' },
    payer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    plan: { type: String },
    billingCycle: { type: String, enum: ['monthly', 'yearly'] },
    customerEmail: { type: String },
    customerName: { type: String },
    description: { type: String },
    meta: { type: mongoose.Schema.Types.Mixed },
    gatewayResponse: { type: mongoose.Schema.Types.Mixed },
    failureReason: { type: String },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

onlineTransactionSchema.index({ school: 1, createdAt: -1 });
onlineTransactionSchema.index({ type: 1, status: 1 });
onlineTransactionSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('OnlineTransaction', onlineTransactionSchema);
