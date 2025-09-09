import { BaseE2ETest } from '../../utils/base-e2e-test';

describe('Healthcheck Controller (e2e)', () => {
  let testSuite: BaseE2ETest;

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.beforeAll();
  });

  beforeEach(async () => {
    await testSuite.beforeEach();
  });

  afterEach(async () => {
    await testSuite.afterEach();
  });

  afterAll(async () => {
    await testSuite.afterAll();
  });

  describe('GET /api/healthcheck', () => {
    it('should return server health status', async () => {
      const response = await testSuite.getRequest()
        .get('/api/healthcheck')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.status).toBe('ok');
      expect(response.body.timestamp).toBeDefined();
    });

    it('should return 200 status code', async () => {
      await testSuite.getRequest()
        .get('/api/healthcheck')
        .expect(200);
    });

    it('should not require authentication', async () => {
      // This endpoint should be accessible without authentication
      const response = await testSuite.getRequest()
        .get('/api/healthcheck')
        .expect(200);

      expect(response.body.status).toBe('ok');
    });

    it('should return consistent response format', async () => {
      const response = await testSuite.getRequest()
        .get('/api/healthcheck')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(typeof response.body.status).toBe('string');
      expect(typeof response.body.timestamp).toBe('string');
    });

    it('should handle multiple concurrent requests', async () => {
      const requests = Array(10).fill(null).map(() =>
        testSuite.getRequest()
          .get('/api/healthcheck')
          .expect(200)
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.body.status).toBe('ok');
      });
    });
  });
});
