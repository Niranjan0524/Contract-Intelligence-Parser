import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

/**
 * Custom hook for fetching and calculating real-time dashboard statistics
 * @param {number} refreshTrigger - Trigger to refresh data
 * @returns {Object} Statistics object with loading state and error handling
 */
const useContractStats = (refreshTrigger = 0) => {
  const [stats, setStats] = useState({
    totalContracts: 0,
    processedToday: 0,
    highRiskItems: 0,
    accuracyRate: 0,
    // Previous day data for comparison
    previousTotalContracts: 0,
    previousProcessedToday: 0,
    previousHighRiskItems: 0,
    previousAccuracyRate: 0,
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Calculate statistics from contract data
   * @param {Array} contracts - Array of contract objects
   * @returns {Object} Calculated statistics
   */
  const calculateStats = (contracts) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Filter contracts by date
    const todayContracts = contracts.filter(contract => {
      const contractDate = new Date(contract.created_at);
      return contractDate >= today;
    });

    const yesterdayContracts = contracts.filter(contract => {
      const contractDate = new Date(contract.created_at);
      return contractDate >= yesterday && contractDate < today;
    });

    // Calculate total contracts
    const totalContracts = contracts.length;
    const previousTotalContracts = contracts.filter(contract => {
      const contractDate = new Date(contract.created_at);
      return contractDate < today;
    }).length;

    // Calculate processed today (completed status)
    const processedToday = todayContracts.filter(contract => 
      contract.status === 'completed'
    ).length;
    const previousProcessedToday = yesterdayContracts.filter(contract => 
      contract.status === 'completed'
    ).length;

    // Calculate high risk items (score < 60 or failed status)
    const highRiskItems = contracts.filter(contract => 
      contract.status === 'failed' || (contract.score && contract.score < 60)
    ).length;
    const previousHighRiskItems = contracts.filter(contract => {
      const contractDate = new Date(contract.created_at);
      return contractDate < today && (contract.status === 'failed' || (contract.score && contract.score < 60));
    }).length;

    // Calculate accuracy rate (average score of completed contracts)
    const completedContracts = contracts.filter(contract => 
      contract.status === 'completed' && contract.score !== null && contract.score !== undefined
    );
    const accuracyRate = completedContracts.length > 0 
      ? Math.round(completedContracts.reduce((sum, contract) => sum + contract.score, 0) / completedContracts.length)
      : 0;

    const previousCompletedContracts = contracts.filter(contract => {
      const contractDate = new Date(contract.created_at);
      return contractDate < today && contract.status === 'completed' && contract.score !== null && contract.score !== undefined;
    });
    const previousAccuracyRate = previousCompletedContracts.length > 0
      ? Math.round(previousCompletedContracts.reduce((sum, contract) => sum + contract.score, 0) / previousCompletedContracts.length)
      : 0;

    return {
      totalContracts,
      processedToday,
      highRiskItems,
      accuracyRate,
      previousTotalContracts,
      previousProcessedToday,
      previousHighRiskItems,
      previousAccuracyRate,
    };
  };

  /**
   * Calculate percentage change between current and previous values
   * @param {number} current - Current value
   * @param {number} previous - Previous value
   * @returns {Object} Change object with value and type
   */
  const calculateChange = (current, previous) => {
    if (previous === 0) {
      return {
        value: current > 0 ? `+${current}` : '0',
        type: current > 0 ? 'positive' : 'neutral',
        percentage: current > 0 ? '+100%' : '0%'
      };
    }

    const difference = current - previous;
    const percentageChange = Math.round((difference / previous) * 100);
    
    return {
      value: difference >= 0 ? `+${difference}` : `${difference}`,
      type: difference >= 0 ? 'positive' : 'negative',
      percentage: difference >= 0 ? `+${percentageChange}%` : `${percentageChange}%`
    };
  };

  /**
   * Fetch contracts and calculate statistics
   */
  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all contracts (we need all data for accurate statistics)
      const response = await api.getContracts({ 
        limit: 100, // Get contracts for statistics
        page: 1,
        sortBy: 'created_at',
        sortOrder: 'desc'
      });

      const contracts = response.contracts || [];
      const calculatedStats = calculateStats(contracts);
      
      setStats(calculatedStats);
    } catch (err) {
      console.error('Error fetching contract statistics:', err);
      setError(err.message || 'Failed to fetch statistics');
      
      // Set default stats on error
      setStats({
        totalContracts: 0,
        processedToday: 0,
        highRiskItems: 0,
        accuracyRate: 0,
        previousTotalContracts: 0,
        previousProcessedToday: 0,
        previousHighRiskItems: 0,
        previousAccuracyRate: 0,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch stats on mount and when refreshTrigger changes
  useEffect(() => {
    fetchStats();
  }, [fetchStats, refreshTrigger]);

  // Format statistics for dashboard display
  const formattedStats = [
    {
      label: 'Total Contracts',
      value: stats.totalContracts.toString(),
      change: calculateChange(stats.totalContracts, stats.previousTotalContracts).percentage,
      changeType: calculateChange(stats.totalContracts, stats.previousTotalContracts).type,
      iconType: 'contracts',
    },
    {
      label: 'Processed Today',
      value: stats.processedToday.toString(),
      change: calculateChange(stats.processedToday, stats.previousProcessedToday).value,
      changeType: calculateChange(stats.processedToday, stats.previousProcessedToday).type,
      iconType: 'processed',
    },
    {
      label: 'High Risk Items',
      value: stats.highRiskItems.toString(),
      change: calculateChange(stats.highRiskItems, stats.previousHighRiskItems).value,
      changeType: stats.highRiskItems < stats.previousHighRiskItems ? 'positive' : 
                 stats.highRiskItems > stats.previousHighRiskItems ? 'negative' : 'neutral',
      iconType: 'risk',
    },
    {
      label: 'Accuracy Rate',
      value: `${stats.accuracyRate}%`,
      change: calculateChange(stats.accuracyRate, stats.previousAccuracyRate).percentage,
      changeType: calculateChange(stats.accuracyRate, stats.previousAccuracyRate).type,
      iconType: 'accuracy',
    },
  ];

  return {
    stats: formattedStats,
    rawStats: stats,
    loading,
    error,
    refetch: fetchStats
  };
};

export default useContractStats;
