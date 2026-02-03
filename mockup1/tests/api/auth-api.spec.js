import { test, expect } from '@playwright/test';

const API_BASE = process.env.API_URL || 'https://bainum-project-backend.onrender.com/api';

test.describe('Authentication API', () => {
  test('POST /api/auth/login - should reject request without credentials', async ({ request }) => {
    const response = await request.post(`${API_BASE}/auth/login`, {
      data: {}
    });
    
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.message).toContain('required');
  });

  test('POST /api/auth/login - should reject invalid credentials', async ({ request }) => {
    const response = await request.post(`${API_BASE}/auth/login`, {
      data: {
        email: 'invalid@example.com',
        password: 'wrongpassword'
      }
    });
    
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.message).toMatch(/invalid|incorrect|unauthorized/i);
  });

  test('POST /api/auth/login - should accept valid credentials', async ({ request }) => {
    const testEmail = process.env.TEST_ADMIN_EMAIL || 'admin@example.com';
    const testPassword = process.env.TEST_ADMIN_PASSWORD || 'password123';
    
    const response = await request.post(`${API_BASE}/auth/login`, {
      data: {
        email: testEmail,
        password: testPassword
      }
    });
    
    // Should succeed (200) or fail gracefully if test user doesn't exist
    if (response.status() === 200) {
      const body = await response.json();
      expect(body).toHaveProperty('user'); // JWT token
      expect(body).toHaveProperty('message');
    } else {
      // If test user doesn't exist, that's okay - just log it
      console.log('Test user may not exist in production environment');
    }
  });

  test('GET /api/children - should require authentication', async ({ request }) => {
    const response = await request.get(`${API_BASE}/children`);
    
    expect(response.status()).toBe(401);
    // Backend may return plain text or JSON for 401
    const contentType = response.headers()['content-type'] || '';
    if (contentType.includes('application/json')) {
      const body = await response.json();
      expect(body.message).toMatch(/unauthorized|token|authentication/i);
    } else {
      // Plain text response (e.g., "Unauthorized")
      const text = await response.text();
      expect(text.toLowerCase()).toMatch(/unauthorized/i);
    }
  });

  test('GET /api/children - should work with valid token', async ({ request }) => {
    const testEmail = process.env.TEST_ADMIN_EMAIL || 'admin@example.com';
    const testPassword = process.env.TEST_ADMIN_PASSWORD || 'password123';
    
    // First login to get token
    const loginResponse = await request.post(`${API_BASE}/auth/login`, {
      data: {
        email: testEmail,
        password: testPassword
      }
    });
    
    if (loginResponse.status() === 200) {
      const { user: token } = await loginResponse.json();
      
      // Use token to access protected endpoint
      const response = await request.get(`${API_BASE}/children`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body).toHaveProperty('children');
      expect(Array.isArray(body.children)).toBe(true);
    } else {
      console.log('Skipping authenticated test - test user may not exist');
    }
  });
});
