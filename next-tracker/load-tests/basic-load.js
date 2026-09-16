import http from 'k6/http';
import { check, sleep } from 'k6';

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp up to 20 users over 30 seconds
    { duration: '1m', target: 20 },   // Stay at 20 users for 1 minute
    { duration: '30s', target: 0 },   // Ramp down to 0 users over 30 seconds
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.01'],   // Error rate must be less than 1%
  },
};

// The base URL of the deployed application
// You can override this using environment variables: k6 run -e TARGET_URL=http://your-server-ip:3000 basic-load.js
const BASE_URL = __ENV.TARGET_URL || 'http://localhost:3000';

export default function () {
  // 1. Visit the Dashboard (Home page)
  let res = http.get(`${BASE_URL}/`);
  
  check(res, {
    'homepage loaded successfully': (r) => r.status === 200,
  });

  sleep(1); // Wait for 1 second

  // 2. Visit the Reports page
  res = http.get(`${BASE_URL}/reports`);
  
  check(res, {
    'reports page loaded successfully': (r) => r.status === 200,
  });

  sleep(2); // Wait for 2 seconds (simulating user reading the report)

  // 3. Visit the Settings page
  res = http.get(`${BASE_URL}/settings`);
  
  check(res, {
    'settings page loaded successfully': (r) => r.status === 200,
  });

  sleep(1);
}
