const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Application name is required'],
      unique: true,
      trim: true,
      maxlength: [64, 'Application name cannot exceed 64 characters']
    },
    displayName: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      trim: true,
      maxlength: [256, 'Description cannot exceed 256 characters']
    },
    currentStableVersion: {
      type: String,
      required: [true, 'Current stable version is required'],
      trim: true,
      default: 'v1.0.0'
    },
    environment: {
      type: String,
      enum: ['production', 'staging', 'canary'],
      default: 'production'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Application', applicationSchema);
