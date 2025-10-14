const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    maxlength: [100, 'Job title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Job description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['general', 'agriculture', 'construction', 'domestic', 'driving', 'retail'],
    default: 'general'
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required']
  },
  whatsapp: {
    type: String,
    default: ''
  },
  businessType: {
    type: String,
    default: 'Individual'
  },
  employerId: {
    type: String,
    required: true
  },
  employerName: {
    type: String,
    default: 'Anonymous'
  },
  salary: {
    type: String,
    default: ''
  },
  applicants: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better search performance
jobSchema.index({ title: 'text', description: 'text', location: 'text' });
jobSchema.index({ category: 1, location: 1 });
jobSchema.index({ createdAt: -1 });

module.exports = mongoose.models.Job || mongoose.model('Job', jobSchema);
