/**
 * API Client for connecting to the NestJS backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
// In a real app, this would be fetched dynamically or managed via a session
const ACCOUNT_ID = process.env.NEXT_PUBLIC_DEFAULT_ACCOUNT_ID || 'acc-test-123';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'test-api-key';

export const apiClient = {
  async get(endpoint: string) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
    });
    
    if (!response.ok) {
      throw new Error(`API GET request failed: ${response.statusText}`);
    }
    
    return response.json();
  },

  async post(endpoint: string, data: any) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API POST request failed: ${response.statusText}`);
    }

    return response.json();
  }
};

// DvP Specific API calls
export const dvpApi = {
  getSettlement: (id: string) => 
    apiClient.get(`/mletr-dvp/${ACCOUNT_ID}/settlements/${id}`),
    
  createSettlement: (data: { tradeDocumentId: string, buyerWalletAddress: string, sellerWalletAddress: string }) => 
    apiClient.post(`/mletr-dvp/${ACCOUNT_ID}/settlements`, data),
    
  initiateSettlement: (id: string) => 
    apiClient.post(`/mletr-dvp/${ACCOUNT_ID}/settlements/${id}/initiate`, {}),
    
  confirmPayment: (id: string, paymentTxHash: string) => 
    apiClient.post(`/mletr-dvp/${ACCOUNT_ID}/settlements/${id}/confirm-payment`, { paymentTxHash }),
    
  executeSettlement: (id: string) => 
    apiClient.post(`/mletr-dvp/${ACCOUNT_ID}/settlements/${id}/execute`, {}),
};
