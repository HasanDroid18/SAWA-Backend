const mongoose = require('mongoose');

const donationSchema = mongoose.Schema({
  donationItemName: {
    type: String,
    required: true,
    trim: true,
  },
  donationItemImage: {
    type: String, // File path for the donation item image
    required: true,
  },
  donationItemPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  description: {
    type: String,
    trim: true,
    default: "",
  },
  quantity: {
    type: Number, // Total quantity of the donation item
    required: true,
    default: 1,
    min: 0,
  },
  totalDonatedAmount: {
    type: Number, // Total amount donated for this item
    default: 0,
    min: 0,
  },
  requestedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Users who requested this donation
  }],
  donations: [{
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // User who donated
      required: true,
    },
    amount: {
      type: Number, // Amount donated by the user
      required: true,
      min: 0,
    },
    invoiceImage: {
      type: String, // File path for the invoice/payment proof
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
},
{ timestamps: true }
);

module.exports = mongoose.model("Donation", donationSchema);