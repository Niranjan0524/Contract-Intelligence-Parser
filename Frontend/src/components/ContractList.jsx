import { useState, useEffect } from 'react';
import api, { ApiError } from '../services/api';
import { FaDownload } from "react-icons/fa6";

const ContractList = ({ onSelectContract, refreshTrigger }) => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [processingContracts, setProcessingContracts] = useState(new Set());

  // ✅ Auto-polling for processing contracts
  useEffect(() => {
    let interval = null;
    
    if (processingContracts.size > 0) {
      console.log(`Starting polling for ${processingContracts.size} processing contracts`);
      interval = setInterval(async () => {
        console.log('Checking status for processing contracts...');
        
        for (const contractId of processingContracts) {
          try {
            const statusData = await api.getContractStatus(contractId);
            
            if (statusData.status === 'completed' || statusData.status === 'failed') {
              console.log(`Contract ${contractId} finished processing with status: ${statusData.status}`);
              
              // Contract finished processing, remove from tracking
              setProcessingContracts(prev => {
                const newSet = new Set(prev);
                newSet.delete(contractId);
                return newSet;
              });
              
              // Refresh contracts list
              fetchContracts();
            }
          } catch (error) {
            console.error(`Error checking status for ${contractId}:`, error);
          }
        }
      }, 3000); // Check every 3 seconds
    }
    
    return () => {
      if (interval) {
        console.log('Clearing polling interval');
        clearInterval(interval);
      }
    };
  }, [processingContracts]);

  useEffect(() => {
    fetchContracts();
  }, [refreshTrigger]);

  const handleDownloadContract = async (event, contract) => {
    event.stopPropagation();
    
    try {
      console.log('Downloading contract:', contract.contract_id);
      
      // ✅ Get the blob from API
      const blob = await api.downloadContract(contract.contract_id);
      
      // ✅ Validate blob
      if (!blob || blob.size === 0) {
        throw new Error('Downloaded file is empty');
      }
      
      // ✅ Create URL directly from blob (no need for new Blob())
      const url = window.URL.createObjectURL(blob);
      
      // ✅ Create download link
      const a = document.createElement('a');
      a.href = url;
      
      // ✅ Use original filename with fallback
      const filename = contract.original_filename || 
                      contract.filename || 
                      `contract-${contract.contract_id.slice(0, 8)}.pdf`;
      a.download = filename;
      
      // ✅ Trigger download
      document.body.appendChild(a);
      a.click();
      
      // ✅ Cleanup
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      console.log('Download completed successfully:', filename);
      
    } catch (error) {
      console.error('Failed to download contract:', error);
      
      // ✅ Show user-friendly error message
      alert(`Download failed: ${error.message}`);
    }
  };

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const data = await api.getContracts({
        sortBy: 'created_at',
        sortOrder: 'desc'
      });
      
      setContracts(data.contracts || []);
      
      // ✅ Track which contracts are still processing
      const processing = new Set(
        (data.contracts || [])
          .filter(contract => contract.status === 'processing')
          .map(contract => contract.contract_id)
      );
      
      setProcessingContracts(processing);
      
      if (processing.size > 0) {
        console.log(`Found ${processing.size} contracts still processing:`, [...processing]);
      }
      
    } catch (error) {
      console.error('Failed to fetch contracts:', error);
      setContracts([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'processing':
        return (
          <div className="w-4 h-4">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
          </div>
        );
      case 'failed':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredContracts = contracts.filter(contract =>{
    if (!contract || !contract.contract_id) return false;
    const contractId = contract.contract_id.toLowerCase();
    const filename = contract.filename ? contract.filename.toLowerCase() : "";
    const searchLower = searchTerm.toLowerCase();

    return contractId.includes(searchLower) || filename.includes(searchLower);
  });

  const sortedContracts = [...filteredContracts].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading contracts...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-semibold text-gray-900">Contract List</h2>
            {/* ✅ Polling indicator */}
            {processingContracts.size > 0 && (
              <div className="flex items-center space-x-1 px-2 py-1 bg-blue-50 rounded-full">
                <div className="animate-pulse rounded-full h-2 w-2 bg-blue-500"></div>
                <span className="text-xs text-blue-600 font-medium">
                  {processingContracts.size} processing
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search contracts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Sort */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split("-");
                setSortBy(field);
                setSortOrder(order);
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="created_at-desc">Newest First</option>
              <option value="created_at-asc">Oldest First</option>
              <option value="status-asc">Status A-Z</option>
              <option value="status-desc">Status Z-A</option>
            </select>
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {sortedContracts.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No contracts found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by uploading your first contract.
            </p>
          </div>
        ) : (
          sortedContracts.map((contract) => (
            <div
              key={contract._id}
              className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors duration-150"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-8 w-8 text-red-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        Contract {contract.contract_id.slice(0, 8)}...
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(contract.created_at)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                      contract.status
                    )}`}
                  >
                    <span className="mr-1.5">
                      {getStatusIcon(contract.status)}
                    </span>
                    {contract.status.charAt(0).toUpperCase() +
                      contract.status.slice(1)}
                  </span>
                  <FaDownload
                    onClick={() => handleDownloadContract(event, contract)}
                  />
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    onClick={() => {
                      console.log("Contract clicked:", contract);
                      console.log(
                        "onSelectContract function:",
                        onSelectContract
                      );
                      if (onSelectContract) {
                        onSelectContract(contract);
                      }
                    }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ContractList;
