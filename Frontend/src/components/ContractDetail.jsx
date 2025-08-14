import { useState, useEffect } from 'react';
import api, { ApiError } from '../services/api';

const ContractDetail = ({ contract, onBack }) => {
  const [contractData, setContractData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (contract) {
      fetchContractData();
    }
  }, [contract]);

  const fetchContractData = async () => {
    try {
      setLoading(true);
      const data = await api.getContract(contract.contract_id);
      setContractData(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to load contract details');
      }
      console.error('Error fetching contract data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'text-green-600 bg-green-100';
    if (confidence >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getConfidenceLabel = (confidence) => {
    if (confidence >= 80) return 'High';
    if (confidence >= 60) return 'Medium';
    return 'Low';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading contract details...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-red-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 19c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error Loading Contract</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <button
            onClick={fetchContractData}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Mock extracted data since the backend doesn't return it yet
  const extractedData = {
    entities: {
      persons: ['John Smith', 'Sarah Johnson'],
      dates: ['2024-01-15', '2024-12-31'],
      money: ['$50,000', '$1,250']
    },
    fields: {
      party_identification: {
        parties: ['ABC Corp', 'XYZ Ltd'],
        registration_details: ['REG-12345'],
        signatories: ['John Smith']
      },
      account_information: {
        emails: ['john@abccorp.com', 'sarah@xyzltd.com'],
        account_numbers: ['ACC-789456']
      },
      financial_details: {
        amounts: ['$50,000', '$1,250']
      },
      payment_structure: {
        terms: ['Net 30']
      },
      revenue_classification: {
        recurring: true
      },
      service_level_agreements: {
        sla_terms: ['99% uptime', 'penalty clause']
      }
    },
    confidence_score: 85
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Contract Details</h1>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor(extractedData.confidence_score)}`}>
              {getConfidenceLabel(extractedData.confidence_score)} Confidence ({extractedData.confidence_score}%)
            </span>
            <a
              href={`http://localhost:8000/contracts/${contract.contract_id}/download`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download PDF
            </a>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Contract ID:</span>
            <p className="font-mono text-gray-900">{contract.contract_id}</p>
          </div>
          <div>
            <span className="text-gray-500">Status:</span>
            <p className="capitalize text-gray-900">{contractData.status}</p>
          </div>
          <div>
            <span className="text-gray-500">Uploaded:</span>
            <p className="text-gray-900">{formatDate(contractData.created_at)}</p>
          </div>
        </div>
      </div>

      {/* Extracted Entities */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Extracted Entities</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Persons</h3>
            <div className="space-y-1">
              {extractedData.entities.persons.map((person, index) => (
                <span key={index} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1 mb-1">
                  {person}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Dates</h3>
            <div className="space-y-1">
              {extractedData.entities.dates.map((date, index) => (
                <span key={index} className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded mr-1 mb-1">
                  {date}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Money</h3>
            <div className="space-y-1">
              {extractedData.entities.money.map((amount, index) => (
                <span key={index} className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded mr-1 mb-1">
                  {amount}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Contract Fields */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Party Identification */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-md font-semibold text-gray-900 mb-4">Party Identification</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Parties</label>
              <div className="mt-1 space-y-1">
                {extractedData.fields.party_identification.parties.map((party, index) => (
                  <p key={index} className="text-sm text-gray-900">{party}</p>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Registration Details</label>
              <div className="mt-1 space-y-1">
                {extractedData.fields.party_identification.registration_details.map((reg, index) => (
                  <p key={index} className="text-sm text-gray-900 font-mono">{reg}</p>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Account Information */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-md font-semibold text-gray-900 mb-4">Account Information</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Email Addresses</label>
              <div className="mt-1 space-y-1">
                {extractedData.fields.account_information.emails.map((email, index) => (
                  <p key={index} className="text-sm text-blue-600">{email}</p>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Account Numbers</label>
              <div className="mt-1 space-y-1">
                {extractedData.fields.account_information.account_numbers.map((account, index) => (
                  <p key={index} className="text-sm text-gray-900 font-mono">{account}</p>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Financial Details */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-md font-semibold text-gray-900 mb-4">Financial Details</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Amounts</label>
              <div className="mt-1 space-y-1">
                {extractedData.fields.financial_details.amounts.map((amount, index) => (
                  <p key={index} className="text-sm text-green-600 font-semibold">{amount}</p>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Payment Structure */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-md font-semibold text-gray-900 mb-4">Payment Structure</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Terms</label>
              <div className="mt-1 space-y-1">
                {extractedData.fields.payment_structure.terms.map((term, index) => (
                  <p key={index} className="text-sm text-gray-900">{term}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Raw Text Preview */}
      {contractData.raw_text && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-md font-semibold text-gray-900 mb-4">Raw Text Preview</h3>
          <div className="bg-gray-50 rounded-md p-4 max-h-64 overflow-y-auto">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap">
              {contractData.raw_text.substring(0, 1000)}...
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractDetail;
