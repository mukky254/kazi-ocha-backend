require('dotenv').config();

console.log('=== Environment Test ===');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✅ Present' : '❌ Missing');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('CLIENT_URL:', process.env.CLIENT_URL);
console.log('ALLOWED_ORIGINS:', process.env.ALLOWED_ORIGINS);
console.log('=====================');

if (process.env.MONGODB_URI) {
  console.log('MONGODB_URI loaded successfully!');
} else {
  console.log('❌ MONGODB_URI is missing! Check your .env file location and format.');
}
