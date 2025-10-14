const express = require('express');
const router = express.Router();
const Job = require('../models/Job');

// GET all jobs
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, category, location, search } = req.query;
    
    let filter = { isActive: true };
    
    if (category) filter.category = category;
    if (location) filter.location = new RegExp(location, 'i');
    if (search) {
      filter.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { location: new RegExp(search, 'i') }
      ];
    }
    
    const jobs = await Job.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Job.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      jobs,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST create job
router.post('/', async (req, res) => {
  try {
    const jobData = req.body;
    
    if (!jobData.title || !jobData.description || !jobData.location || !jobData.phone) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }
    
    const formatPhone = (phone) => phone.replace(/\D/g, '');
    
    const job = new Job({
      ...jobData,
      phone: formatPhone(jobData.phone),
      whatsapp: jobData.whatsapp ? formatPhone(jobData.whatsapp) : '',
      employerId: jobData.employerId || `user_${Date.now()}`,
      employerName: jobData.employerName || 'Anonymous'
    });
    
    await job.save();
    
    res.status(201).json({
      success: true,
      message: 'Job posted successfully!',
      job
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
