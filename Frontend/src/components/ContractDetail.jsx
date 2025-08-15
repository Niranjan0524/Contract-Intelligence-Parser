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
      setError('');
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    if (score >= 50) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreLabel = (score) => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Poor';
  };

  const InfoCard = ({ title, children, icon }) => (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center mb-4">
        {icon && <div className="mr-3 text-blue-600">{icon}</div>}
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      {children}
    </div>
  );

  const DataList = ({ items, title, emptyMessage = "No data available" }) => (
    <div className="mb-4">
      {title && <h4 className="font-medium text-gray-900 mb-2">{title}</h4>}
      {items && items.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
            >
              {item}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">{emptyMessage}</p>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading contract details...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading contract</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <div className="mt-4 space-x-3">
            <button
              onClick={fetchContractData}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Try Again
            </button>
            <button
              onClick={onBack}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!contractData) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <p className="text-gray-500 text-center py-8">No contract data available</p>
      </div>
    );
  }

  const score = contractData.score || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to List
          </button>
          
          <div className="flex items-center space-x-4">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(score)}`}>
              <span className="mr-1">Score:</span>
              <span className="font-semibold">{score}/100</span>
              <span className="ml-1">({getScoreLabel(score)})</span>
            </div>
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Contract Details</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-500">Contract ID:</span>
              <p className="font-mono text-gray-900">{contract.contract_id}</p>
            </div>
            <div>
              <span className="font-medium text-gray-500">Created:</span>
              <p className="text-gray-900">{formatDate(contractData.created_at)}</p>
            </div>
            <div>
              <span className="font-medium text-gray-500">File Path:</span>
              <p className="text-gray-900 truncate">{contractData.file_path}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Party Identification */}
        <InfoCard 
          title="Party Identification" 
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        >
          <DataList 
            items={contractData.party_identification?.persons} 
            title="Persons Involved"
            emptyMessage="No persons identified"
          />
        </InfoCard>

        {/* Account Information */}
        <InfoCard 
          title="Account Information" 
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        >
          <DataList 
            items={contractData.account_information?.emails} 
            title="Email Addresses"
            emptyMessage="No email addresses found"
          />
          <DataList 
            items={contractData.account_information?.account_numbers} 
            title="Account Numbers"
            emptyMessage="No account numbers found"
          />
        </InfoCard>

        {/* Financial Details */}
        <InfoCard 
          title="Financial Details" 
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        >
          <DataList 
            items={contractData.financial_details?.amounts} 
            title="Amount References"
            emptyMessage="No amounts found"
          />
          <DataList 
            items={contractData.financial_details?.money_entities} 
            title="Money Entities"
            emptyMessage="No money entities found"
          />
        </InfoCard>

        {/* Important Dates */}
        <InfoCard 
          title="Important Dates & Terms" 
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        >
          <DataList 
            items={contractData.financial_details?.dates} 
            title="Dates & Time References"
            emptyMessage="No dates found"
          />
        </InfoCard>

        {/* Payment Structure */}
        <InfoCard 
          title="Payment Structure" 
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        >
          <DataList 
            items={contractData.payment_structure?.terms} 
            title="Payment Terms"
            emptyMessage="No payment terms found"
          />
          <div className="mt-4">
            <h4 className="font-medium text-gray-900 mb-2">Revenue Classification</h4>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              contractData.revenue_classification?.recurring 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {contractData.revenue_classification?.recurring ? 'Recurring Revenue' : 'One-time Payment'}
            </span>
          </div>
        </InfoCard>

        {/* Service Level Agreements */}
        <InfoCard 
          title="Service Level Agreements" 
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        >
          <DataList 
            items={contractData.service_level_agreements?.sla_terms} 
            title="SLA Terms"
            emptyMessage="No SLA terms found"
          />
        </InfoCard>
      </div>

      {/* Raw Data Section (Collapsible) */}
      <details className="bg-white rounded-lg shadow-sm border">
        <summary className="px-6 py-4 cursor-pointer hover:bg-gray-50 focus:outline-none focus:bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Raw Extracted Data</h3>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </summary>
        <div className="px-6 pb-6 pt-2 border-t border-gray-200">
          <pre className="text-xs text-gray-600 bg-gray-50 p-4 rounded-md overflow-auto max-h-96">
            {JSON.stringify(contractData.raw_text, null, 2)}
          </pre>
        </div>
      </details>
    </div>
  );
};

export default ContractDetail;
