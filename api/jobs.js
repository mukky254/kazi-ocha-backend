const { connectToDatabase } = require('../utils/database');
const { ObjectId } = require('mongodb');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { db } = await connectToDatabase();
    const jobsCollection = db.collection('jobs');

    // GET - Get all jobs
    if (req.method === 'GET') {
      const jobs = await jobsCollection.find({ isActive: true })
        .sort({ createdAt: -1 })
        .toArray();
      
      res.status(200).json({
        success: true,
        jobs: jobs || []
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
      
      const job = {
        title: jobData.title,
        description: jobData.description,
        location: jobData.location,
        category: jobData.category || 'general',
        phone: formatPhone(jobData.phone),
        whatsapp: jobData.whatsapp ? formatPhone(jobData.whatsapp) : '',
        businessType: jobData.businessType || 'Individual',
        employerId: jobData.employerId || `user_${Date.now()}`,
        employerName: jobData.employerName || 'Anonymous',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await jobsCollection.insertOne(job);
      
      res.status(201).json({
        success: true,
        message: 'Job posted successfully!',
        job: { _id: result.insertedId, ...job }
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
      
      const result = await jobsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { ...updateData, updatedAt: new Date() } }
      );
      
      if (result.matchedCount === 0) {
        return res.status(404).json({
          success: false,
          error: 'Job not found'
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Job updated successfully!'
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
      
      const result = await jobsCollection.deleteOne({ 
        _id: new ObjectId(id) 
      });
      
      if (result.deletedCount === 0) {
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
