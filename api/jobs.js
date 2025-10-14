const express = require('express');
const router = express.Router();
const Job = require('../models/Job');

// GET all jobs
router.get('/', async (req, res) => {
  try {
    console.log('GET /api/jobs called');
    const jobs = await Job.find({ isActive: true }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: jobs.length,
      jobs: jobs
    });
  } catch (error) {
    console.error('Jobs GET error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST create job (simplified)
router.post('/', async (req, res) => {
  try {
    console.log('POST /api/jobs called');
    const jobData = req.body;
    
    // Basic validation
    if (!jobData.title || !jobData.description || !jobData.location) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, description, location'
      });
    }
    
    const job = new Job({
      title: jobData.title,
      description: jobData.description,
      location: jobData.location,
      category: jobData.category || 'general',
      phone: jobData.phone || '',
      employerName: jobData.employerName || 'Anonymous'
    });
    
    await job.save();
    
    res.status(201).json({
      success: true,
      message: 'Job posted successfully!',
      job: job
    });
  } catch (error) {
    console.error('Jobs POST error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
