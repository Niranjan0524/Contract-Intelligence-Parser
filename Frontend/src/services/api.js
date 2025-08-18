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
  const responseData = await response.json();
  console.log('API Response:', responseData);
  return responseData;
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

  // Get all contracts with pagination and filtering
  getContracts: async (options = {}) => {
    const {
      page = 1,
      limit = 10,
      status,
      minScore,
      maxScore,
      sortBy = 'created_at',
      sortOrder = 'desc',
      search
    } = options;

    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sort_by: sortBy,
      sort_order: sortOrder
    });

    if (status) params.append('status', status);
    if (minScore !== undefined) params.append('min_score', minScore.toString());
    if (maxScore !== undefined) params.append('max_score', maxScore.toString());
    if (search) params.append('search', search);

    const response = await fetch(`${API_BASE_URL}/contracts?${params.toString()}`);
    return handleResponse(response);
  },

  // Get specific contract details
  getContract: async (contractId, options = {}) => {
    const params = new URLSearchParams();
    if (options.include_raw) {
      params.append('include_raw', 'true');
    }
    
    const url = `${API_BASE_URL}/contracts/${contractId}${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url);
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
  },

  // ✅ NEW: Get raw extracted data for a contract
  getContractRawData: async (contractId) => {
    const response = await fetch(`${API_BASE_URL}/contracts/${contractId}/raw`);
    return handleResponse(response);
  }
};

export default api;
export { ApiError };
