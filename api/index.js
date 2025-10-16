app.get('/api/debug-db', async (req, res) => {
  const mongoose = require('mongoose');
  const originalMongoose = mongoose;
  
  console.log('=== MONGODB DEBUG START ===');
  
  try {
    const uri = process.env.MONGODB_URI;
    console.log('URI present:', !!uri);
    console.log('URI length:', uri ? uri.length : 0);
    
    if (uri) {
      // Mask password for security in logs
      const maskedUri = uri.replace(/:(.*)@/, ':****@');
      console.log('Masked URI:', maskedUri);
    }

    // Create a fresh mongoose instance for testing
    const testMongoose = new originalMongoose.Mongoose();
    
    // Add detailed event listeners
    testMongoose.connection.on('connecting', () => {
      console.log('🔄 MongoDB connecting...');
    });
    
    testMongoose.connection.on('connected', () => {
      console.log('✅ MongoDB connected!');
    });
    
    testMongoose.connection.on('error', (err) => {
      console.log('❌ MongoDB error:', err.message);
    });
    
    testMongoose.connection.on('disconnected', () => {
      console.log('🔌 MongoDB disconnected');
    });

    console.log('Attempting connection...');
    
    await testMongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 15000,
      bufferCommands: false,
    });

    console.log('Connection method completed');
    console.log('Ready state:', testMongoose.connection.readyState);
    
    // Try to ping the database
    try {
      await testMongoose.connection.db.admin().ping();
      console.log('✅ Database ping successful');
    } catch (pingError) {
      console.log('❌ Database ping failed:', pingError.message);
    }

    await testMongoose.disconnect();
    
    res.json({
      success: true,
      readyState: testMongoose.connection.readyState,
      message: 'Connection test completed - check Vercel logs for details'
    });

  } catch (error) {
    console.log('❌ Connection failed with error:', error.message);
    console.log('Error name:', error.name);
    console.log('Error code:', error.code);
    
    res.json({
      success: false,
      error: error.message,
      errorName: error.name,
      errorCode: error.code,
      note: 'Check Vercel logs for detailed connection events'
    });
  }
  
  console.log('=== MONGODB DEBUG END ===');
});
