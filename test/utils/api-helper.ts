import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AccountUser } from '../../src/account-users/schemas/account-user.schema';

/**
 * Helper class for API request operations
 */
export class ApiHelper {
  constructor(private app: INestApplication) {}

  /**
   * Get a basic request instance
   */
  getRequest() {
    return request(this.app.getHttpServer());
  }

  /**
   * Get an authenticated request instance
   */
  getAuthenticatedRequest(user: AccountUser, accessToken?: string) {
    const req = request(this.app.getHttpServer());
    if (accessToken) {
      req.set('Authorization', `Bearer ${accessToken}`);
    }
    return req;
  }

  /**
   * Get a request with API key
   */
  getApiKeyRequest(apiKey: string) {
    return request(this.app.getHttpServer()).set('x-api-key', apiKey);
  }

  /**
   * Get a request with both JWT and API key
   */
  getAuthenticatedApiKeyRequest(user: AccountUser, apiKey: string, accessToken?: string) {
    const req = request(this.app.getHttpServer())
      .set('x-api-key', apiKey);
    
    if (accessToken) {
      req.set('Authorization', `Bearer ${accessToken}`);
    }
    
    return req;
  }

  /**
   * Upload a file
   */
  uploadFile(endpoint: string, file: any, accessToken?: string, additionalFields: any = {}) {
    const req = request(this.app.getHttpServer())
      .post(endpoint)
      .attach('file', file.buffer, file.originalname);

    if (accessToken) {
      req.set('Authorization', `Bearer ${accessToken}`);
    }

    // Add additional form fields
    Object.keys(additionalFields).forEach(key => {
      req.field(key, additionalFields[key]);
    });

    return req;
  }

  /**
   * Make a GET request
   */
  get(endpoint: string, accessToken?: string, queryParams: any = {}) {
    const req = request(this.app.getHttpServer())
      .get(endpoint);

    if (accessToken) {
      req.set('Authorization', `Bearer ${accessToken}`);
    }

    if (Object.keys(queryParams).length > 0) {
      req.query(queryParams);
    }

    return req;
  }

  /**
   * Make a POST request
   */
  post(endpoint: string, data: any = {}, accessToken?: string) {
    const req = request(this.app.getHttpServer())
      .post(endpoint)
      .send(data);

    if (accessToken) {
      req.set('Authorization', `Bearer ${accessToken}`);
    }

    return req;
  }

  /**
   * Make a PUT request
   */
  put(endpoint: string, data: any = {}, accessToken?: string) {
    const req = request(this.app.getHttpServer())
      .put(endpoint)
      .send(data);

    if (accessToken) {
      req.set('Authorization', `Bearer ${accessToken}`);
    }

    return req;
  }

  /**
   * Make a PATCH request
   */
  patch(endpoint: string, data: any = {}, accessToken?: string) {
    const req = request(this.app.getHttpServer())
      .patch(endpoint)
      .send(data);

    if (accessToken) {
      req.set('Authorization', `Bearer ${accessToken}`);
    }

    return req;
  }

  /**
   * Make a DELETE request
   */
  delete(endpoint: string, accessToken?: string) {
    const req = request(this.app.getHttpServer())
      .delete(endpoint);

    if (accessToken) {
      req.set('Authorization', `Bearer ${accessToken}`);
    }

    return req;
  }

  /**
   * Make a request with custom headers
   */
  requestWithHeaders(endpoint: string, headers: Record<string, string>, method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET', data?: any) {
    const req = request(this.app.getHttpServer());
    
    // Set headers
    Object.keys(headers).forEach(key => {
      req.set(key, headers[key]);
    });

    // Set method and data
    switch (method) {
      case 'GET':
        req.get(endpoint);
        break;
      case 'POST':
        req.post(endpoint).send(data || {});
        break;
      case 'PUT':
        req.put(endpoint).send(data || {});
        break;
      case 'PATCH':
        req.patch(endpoint).send(data || {});
        break;
      case 'DELETE':
        req.delete(endpoint);
        break;
    }

    return req;
  }

  /**
   * Test pagination parameters
   */
  testPagination(endpoint: string, accessToken?: string) {
    return {
      async testValidPagination() {
        const response = await this.get(endpoint, accessToken, { page: 1, limit: 10 });
        return response;
      },
      async testInvalidPagination() {
        const response = await this.get(endpoint, accessToken, { page: -1, limit: 0 });
        return response;
      },
      async testLargeLimit() {
        const response = await this.get(endpoint, accessToken, { page: 1, limit: 1000 });
        return response;
      }
    };
  }

  /**
   * Test search parameters
   */
  testSearch(endpoint: string, accessToken?: string) {
    return {
      async testValidSearch(searchTerm: string) {
        const response = await this.get(endpoint, accessToken, { search: searchTerm });
        return response;
      },
      async testEmptySearch() {
        const response = await this.get(endpoint, accessToken, { search: '' });
        return response;
      },
      async testSpecialCharacters(searchTerm: string) {
        const response = await this.get(endpoint, accessToken, { search: searchTerm });
        return response;
      }
    };
  }

  /**
   * Test sorting parameters
   */
  testSorting(endpoint: string, accessToken?: string) {
    return {
      async testValidSort(sortBy: string, sortOrder: 'asc' | 'desc' = 'asc') {
        const response = await this.get(endpoint, accessToken, { sortBy, sortOrder });
        return response;
      },
      async testInvalidSort(sortBy: string) {
        const response = await this.get(endpoint, accessToken, { sortBy, sortOrder: 'invalid' });
        return response;
      }
    };
  }

  /**
   * Test file download
   */
  downloadFile(endpoint: string, accessToken?: string) {
    const req = request(this.app.getHttpServer())
      .get(endpoint);

    if (accessToken) {
      req.set('Authorization', `Bearer ${accessToken}`);
    }

    return req;
  }

  /**
   * Test file upload with validation
   */
  testFileUpload(endpoint: string, accessToken?: string) {
    return {
      async testValidFile(file: any, additionalFields: any = {}) {
        return this.uploadFile(endpoint, file, accessToken, additionalFields);
      },
      async testInvalidFileType(file: any, additionalFields: any = {}) {
        return this.uploadFile(endpoint, file, accessToken, additionalFields);
      },
      async testOversizedFile(file: any, additionalFields: any = {}) {
        return this.uploadFile(endpoint, file, accessToken, additionalFields);
      },
      async testMissingFile(additionalFields: any = {}) {
        const req = request(this.app.getHttpServer())
          .post(endpoint);

        if (accessToken) {
          req.set('Authorization', `Bearer ${accessToken}`);
        }

        Object.keys(additionalFields).forEach(key => {
          req.field(key, additionalFields[key]);
        });

        return req;
      }
    };
  }
}
