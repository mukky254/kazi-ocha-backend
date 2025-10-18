export default function handler(req, res) {
  res.status(200).json({
    success: true,
    message: 'Kazi Ocha Backend API is working!',
    endpoints: ['/auth', '/jobs', '/employees', '/health']
  });
}
