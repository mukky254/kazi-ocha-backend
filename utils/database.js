const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    return { db: cachedDb };
  }

  const client = await MongoClient.connect(MONGODB_URI);
  const db = client.db();
  
  cachedDb = db;
  return { db };
}

module.exports = { connectToDatabase };
