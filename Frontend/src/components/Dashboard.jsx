import { useState } from 'react';
import ContractUpload from './ContractUpload';
import ContractList from './ContractList';
import ContractDetail from './ContractDetail';
import StatIcon from './StatIcon';
import useContractStats from '../hooks/useContractStats';

const Dashboard = ({ user }) => {
  const [currentView, setCurrentView] = useState('overview'); // 'overview', 'upload', 'list', 'detail'
  const [selectedContract, setSelectedContract] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Use the custom hook for dynamic statistics
  const { stats, loading: statsLoading, error: statsError, refetch: refetchStats } = useContractStats(refreshTrigger);

  const handleUploadSuccess = (result) => {
    console.log('Upload successful:', result);
    setRefreshTrigger(prev => prev + 1);
    // Refetch stats to update dashboard
    refetchStats();
    // Show success message or redirect to list view
    setCurrentView('list');
  };

  const handleContractSelect = (contract) => {
    console.log('handleContractSelect called with:', contract);
    setSelectedContract(contract);
    setCurrentView('detail');
    console.log('Set currentView to detail, selectedContract:', contract);
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedContract(null);
  };

  const quickActions = [
    {
      name: 'Upload Contract',
      description: 'Upload and analyze a new contract document',
      icon: (
        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      ),
      bgColor: 'bg-blue-50',
      hoverColor: 'hover:bg-blue-100',
      action: () => setCurrentView('upload'),
    },
    {
      name: 'View All Contracts',
      description: 'Browse and search through all contracts',
      icon: (
        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      bgColor: 'bg-green-50',
      hoverColor: 'hover:bg-green-100',
      action: () => setCurrentView('list'),
    },
    {
      name: 'Analytics Dashboard',
      description: 'View processing statistics and insights',
      icon: (
        <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      bgColor: 'bg-purple-50',
      hoverColor: 'hover:bg-purple-100',
      action: () => console.log('Analytics coming soon'),
    },
    {
      name: 'Export Data',
      description: 'Export contract data and analysis results',
      icon: (
        <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      bgColor: 'bg-orange-50',
      hoverColor: 'hover:bg-orange-100',
      action: () => console.log('Export coming soon'),
    },
  ];

  if (currentView === 'detail' && selectedContract) {
    return (
      <div className="flex-1 bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
        <ContractDetail 
          contract={selectedContract} 
          onBack={handleBackToList}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 min-h-screen">
      {/* Navigation Bar */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <nav className="flex space-x-8">
              <button
                onClick={() => setCurrentView('overview')}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  currentView === 'overview'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setCurrentView('upload')}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  currentView === 'upload'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Upload
              </button>
              <button
                onClick={() => setCurrentView('list')}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  currentView === 'list'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Contracts
              </button>
            </nav>
            
            <div className="text-sm text-gray-600">
              Welcome back, <span className="font-medium">{user?.name || 'User'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {currentView === 'overview' && (
          <div className="space-y-6">
            {/* Header with Refresh Button */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
                <p className="text-gray-600 mt-1">Real-time contract processing statistics and insights</p>
              </div>
              <button
                onClick={refetchStats}
                disabled={statsLoading}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <svg 
                  className={`w-4 h-4 mr-2 ${statsLoading ? 'animate-spin' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {statsLoading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {statsLoading ? (
                // Loading skeleton for stats
                Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-6 h-6 bg-gray-300 rounded"></div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                        <div className="h-8 bg-gray-300 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : statsError ? (
                // Error state
                <div className="col-span-full bg-red-50 border border-red-200 rounded-lg p-6">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-red-800 font-medium">Failed to load statistics</span>
                  </div>
                  <p className="text-red-600 text-sm mt-1">{statsError}</p>
                  <button 
                    onClick={refetchStats}
                    className="mt-3 px-4 py-2 bg-red-100 text-red-800 rounded-md text-sm font-medium hover:bg-red-200 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                // Actual stats
                stats.map((stat, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <StatIcon type={stat.iconType} />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            {stat.label}
                          </dt>
                          <dd className="flex items-baseline">
                            <div className="text-2xl font-semibold text-gray-900">
                              {stat.value}
                            </div>
                            {stat.change && stat.change !== '0' && stat.change !== '0%' && (
                              <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                                stat.changeType === 'positive' ? 'text-green-600' : 
                                stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-500'
                              }`}>
                                {stat.changeType === 'positive' && stat.change.startsWith('+') ? '' : 
                                 stat.changeType === 'negative' ? '' : ''}
                                {stat.change}
                              </div>
                            )}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
                {!statsLoading && !statsError && (
                  <div className="flex items-center text-sm text-green-600">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                    Live Data
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.action}
                    className={`${action.bgColor} ${action.hoverColor} p-4 rounded-lg border border-gray-200 text-left transition-colors duration-200`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {action.icon}
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          {action.name}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {action.description}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentView === 'upload' && (
          <ContractUpload onUploadSuccess={handleUploadSuccess} />
        )}

        {currentView === 'list' && (
          <ContractList 
            onSelectContract={handleContractSelect}
            refreshTrigger={refreshTrigger}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
