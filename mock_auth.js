// Execute this in browser console
localStorage.setItem('auth_token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFkbWluIFRlc3QiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE1MTYyMzkwMjIsImV4cCI6OTk5OTk5OTk5OX0.mock_signature');
localStorage.setItem('user', JSON.stringify({
  id: 1,
  name: 'Admin Test',
  email: 'admin@test.com',
  role: 'admin',
  stationId: 1
}));
console.log('Mock auth set, refreshing page...');
window.location.reload();
