const API_BASE_URL = 'http://localhost:8000';

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.detail || `HTTP ${response.status}: ${response.statusText}`,
      response.status
    );
  }
  return response.json();
};

const api = {
  // Upload a contract file
  uploadContract: async (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/contracts/upload`, {
      method: 'POST',
      body: formData,
    });

    return handleResponse(response);
  },

  // Get all contracts
  getContracts: async () => {
    const response = await fetch(`${API_BASE_URL}/contracts`);
    return handleResponse(response);
  },

  // Get specific contract details
  getContract: async (contractId) => {
    const response = await fetch(`${API_BASE_URL}/contracts/${contractId}`);
    return handleResponse(response);
  },

  // Get contract status
  getContractStatus: async (contractId) => {
    const response = await fetch(`${API_BASE_URL}/contracts/${contractId}/status`);
    return handleResponse(response);
  },

  // Download contract file
  downloadContract: async (contractId) => {
    const response = await fetch(`${API_BASE_URL}/contracts/${contractId}/download`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.detail || `HTTP ${response.status}: ${response.statusText}`,
        response.status
      );
    }
    return response.blob();
  }
};

export default api;
export { ApiError };
