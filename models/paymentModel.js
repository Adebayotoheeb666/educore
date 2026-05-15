const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fee: { type: mongoose.Schema.Types.ObjectId, ref: 'Fee', required: true },
  method: { type: String, enum: ['cash', 'transfer', 'paystack', 'flutterwave'], required: true },
  transactionRef: { type: String },
  amountDue: { type: Number, required: true },
  amountPaid: { type: Number, default: 0 },
  balance: { type: Number, required: true },
  installments: [{
    amount: { type: Number },
    date: { type: Date, default: Date.now },
    method: { type: String }
  }],
  status: { type: String, enum: ['pending', 'partial', 'paid'], default: 'pending' },
  receiptUrl: { type: String }
}, { timestamps: true });

paymentSchema.index({ school: 1, student: 1 });
paymentSchema.index({ school: 1, status: 1 });
paymentSchema.index({ school: 1, createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
