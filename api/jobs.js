const connectDB = require('../utils/database');
const Job = require('../models/Job');
const cors = require('../middleware/cors');

module.exports = async (req, res) => {
  // Apply CORS
  await new Promise((resolve, reject) => {
    cors(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });

  await connectDB();

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GET - Get all jobs
    if (req.method === 'GET') {
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
    }
    
    // POST - Create new job
    else if (req.method === 'POST') {
      const jobData = req.body;
      
      // Validate required fields
      if (!jobData.title || !jobData.description || !jobData.location || !jobData.phone) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: title, description, location, phone'
        });
      }
      
      // Format phone numbers
      const formatPhone = (phone) => {
        return phone.replace(/\D/g, '');
      };
      
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
    }
    
    // PUT - Update job
    else if (req.method === 'PUT') {
      const { id } = req.query;
      const updateData = req.body;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Job ID is required'
        });
      }
      
      const job = await Job.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true
      });
      
      if (!job) {
        return res.status(404).json({
          success: false,
          error: 'Job not found'
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Job updated successfully!',
        job
      });
    }
    
    // DELETE - Delete job
    else if (req.method === 'DELETE') {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Job ID is required'
        });
      }
      
      const job = await Job.findByIdAndDelete(id);
      
      if (!job) {
        return res.status(404).json({
          success: false,
          error: 'Job not found'
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Job deleted successfully!'
      });
    }
    
    else {
      res.status(405).json({
        success: false,
        error: 'Method not allowed'
      });
    }
    
  } catch (error) {
    console.error('Jobs API error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
};