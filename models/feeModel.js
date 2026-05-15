const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  title: { type: String, required: true },
  session: { type: String, required: true },
  term: { type: String, required: true },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  items: [{
    name: { type: String, required: true },
    amount: { type: Number, required: true },
    mandatory: { type: Boolean, default: true }
  }],
  totalAmount: { type: Number, required: true },
  dueDate: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Fee', feeSchema);
