const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    capacity: { type: Number, default: 1, min: 1 },
    minimumHeight: { type: Number, default: 0, min: 0 },
    category: {
      type: String,
      enum: ['thrill', 'family', 'kids', 'water', 'show'],
      default: 'family',
    },
    price: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['active', 'maintenance'],
      default: 'active',
    },
    imageUrl: { type: String, default: '' },
    audioUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ride', rideSchema);
