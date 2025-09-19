import React, { useMemo } from 'react';
import { 
  Trophy, 
  Target, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Award,
  Star,
  BarChart3,
  Calculator,
  Percent
} from 'lucide-react';
import { Account, SalesData, IncentiveRule, User, IncentiveCalculation } from '../types';
import { useSupabase } from '../hooks/useSupabase';

interface IncentiveOverviewProps {
  accounts: Account[];
  salesData: SalesData[];
  incentiveRules: IncentiveRule[];
  currentUser: User;
}

const IncentiveOverview: React.FC<IncentiveOverviewProps> = ({
  accounts,
  salesData,
  incentiveRules,
  currentUser
}) => {
  const { fetchUsers } = useSupabase();
  const [allUsers, setAllUsers] = React.useState<User[]>([]);

  // Load all users for name mapping
  React.useEffect(() => {
    const loadUsers = async () => {
      if (currentUser.role === 'superadmin') {
        try {
          const users = await fetchUsers();
          setAllUsers(users);
        } catch (error) {
          console.error('Error loading users:', error);
        }
      }
    };
    
    loadUsers();
  }, [currentUser.role, fetchUsers]);
  const calculateUserIncentive = (
    userId: string, 
    userAccounts: Account[], 
    allSalesData: SalesData[], 
    rules: IncentiveRule[]
  ): IncentiveCalculation | null => {
    if (userAccounts.length === 0) return null;

    // Find the best matching rule for this user
    const applicableRules = rules.filter(rule => rule.is_active);
    if (applicableRules.length === 0) return null;

    // Get sales data for user's accounts
    const userSalesData = allSalesData.filter(data => 
      userAccounts.some(acc => acc.id === data.account_id)
    );

    // Calculate totals
    const totalRevenue = userSalesData.reduce((sum, data) => sum + data.total_purchases, 0);
    const totalCommission = userSalesData.reduce((sum, data) => sum + data.gross_commission, 0);
    const commissionRate = totalRevenue > 0 ? (totalCommission / totalRevenue) * 100 : 0;
    
    // Find the best matching rule based on commission rate
    let bestRule: IncentiveRule | null = null;
    for (const rule of applicableRules) {
      if (commissionRate >= rule.commission_rate_min && 
          (rule.commission_rate_max === 100 || commissionRate <= rule.commission_rate_max)) {
        bestRule = rule;
        break;
      }
    }

    if (!bestRule) {
      // Return calculation with no applicable rule
      return {
        user_id: userId,
        user_name: getUserName(userId),
        total_revenue: totalRevenue,
        total_commission: totalCommission,
        commission_rate: commissionRate,
        applicable_rule: null,
        current_tier: null,
        next_tier: null,
        incentive_amount: 0,
        progress_percentage: 0,
        remaining_to_next_tier: 0,
        managed_accounts_count: userAccounts.length,
      };
    }

    // Filter accounts that meet minimum commission threshold for the selected rule
    const qualifyingAccountIds = new Set<string>();
    userAccounts.forEach(account => {
      const accountSalesData = userSalesData.filter(data => data.account_id === account.id);
      const accountCommission = accountSalesData.reduce((sum, data) => sum + data.gross_commission, 0);
      
      if (accountCommission >= bestRule.min_commission_threshold) {
        qualifyingAccountIds.add(account.id);
      }
    });

    // Calculate revenue from qualifying accounts only
    const qualifyingRevenue = userSalesData
      .filter(data => qualifyingAccountIds.has(data.account_id))
      .reduce((sum, data) => sum + data.total_purchases, 0);

    // Find current tier and calculate incentive
    let incentiveAmount = 0;
    let currentTier = null;
    let nextTier = null;

    const sortedTiers = [...bestRule.tiers].sort((a, b) => a.revenue_threshold - b.revenue_threshold);
    
    for (let i = 0; i < sortedTiers.length; i++) {
      const tier = sortedTiers[i];
      if (qualifyingRevenue >= tier.revenue_threshold) {
        currentTier = tier;
        
        // Calculate incentive for this tier
        const tierRevenue = i === 0 
          ? Math.min(qualifyingRevenue, sortedTiers[i + 1]?.revenue_threshold || qualifyingRevenue) - tier.revenue_threshold
          : Math.min(qualifyingRevenue, sortedTiers[i + 1]?.revenue_threshold || qualifyingRevenue) - tier.revenue_threshold;
        
        incentiveAmount += tierRevenue * (tier.incentive_rate / 100);
      } else {
        nextTier = tier;
        break;
      }
    }

    // Calculate progress to next tier
    let progressPercentage = 0;
    let remainingToNextTier = 0;

    if (nextTier) {
      const currentThreshold = currentTier?.revenue_threshold || bestRule.base_revenue_threshold;
      const nextThreshold = nextTier.revenue_threshold;
      const progress = qualifyingRevenue - currentThreshold;
      const totalNeeded = nextThreshold - currentThreshold;
      
      progressPercentage = Math.min((progress / totalNeeded) * 100, 100);
      remainingToNextTier = Math.max(nextThreshold - qualifyingRevenue, 0);
    } else if (currentTier) {
      progressPercentage = 100;
    }

    return {
      user_id: userId,
      user_name: getUserName(userId),
      total_revenue: totalRevenue,
      total_commission: totalCommission,
      commission_rate: commissionRate,
      applicable_rule: bestRule,
      current_tier: currentTier,
      next_tier: nextTier,
      incentive_amount: incentiveAmount,
      progress_percentage: progressPercentage,
      remaining_to_next_tier: remainingToNextTier,
      managed_accounts_count: userAccounts.length,
    };
  };

  const getUserName = (userId: string): string => {
    if (userId === currentUser.id) return currentUser.name;
    
    // Find user from allUsers array
    const user = allUsers.find(u => u.id === userId);
    if (user) {
      return user.name;
    }
    
    // Fallback to user ID if not found
    return `User ${userId.slice(0, 8)}`;
  };

  // Calculate incentives for all users
  const incentiveCalculations = useMemo(() => {
    const activeRules = incentiveRules.filter(rule => rule.is_active);
    if (activeRules.length === 0) return [];

    // Get all users who manage accounts
    const userCalculations: IncentiveCalculation[] = [];
    
    // For superadmin view, calculate for all users
    if (currentUser.role === 'superadmin') {
      // Get unique user IDs from accounts
      const userIds = [...new Set(accounts.map(acc => acc.user_id).filter(Boolean))];
      
      userIds.forEach(userId => {
        const userAccounts = accounts.filter(acc => acc.user_id === userId);
        const calculation = calculateUserIncentive(userId, userAccounts, salesData, activeRules);
        if (calculation) {
          userCalculations.push(calculation);
        }
      });
    } else {
      // For regular users, only show their own calculation
      const userAccounts = accounts.filter(acc => 
        currentUser.managed_accounts.includes(acc.id)
      );
      const calculation = calculateUserIncentive(currentUser.id, userAccounts, salesData, activeRules);
      if (calculation) {
        userCalculations.push(calculation);
      }
    }

    return userCalculations.sort((a, b) => b.incentive_amount - a.incentive_amount);
  }, [accounts, salesData, incentiveRules, currentUser, allUsers]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const totalIncentives = incentiveCalculations.reduce((sum, calc) => sum + calc.incentive_amount, 0);
  const activeRules = incentiveRules.filter(rule => rule.is_active);
  const primaryActiveRule = activeRules[0]; // Show the first active rule in the header

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Incentive Overview</h1>
          <p className="text-gray-600">
            {currentUser.role === 'superadmin' 
              ? 'Monitor incentive performance across all team members'
              : 'Track your incentive progress and earnings'}
          </p>
        </div>
        <div className="flex items-center space-x-2 bg-purple-100 text-purple-800 px-4 py-2 rounded-lg">
          <Trophy className="w-5 h-5" />
          <span className="font-medium">
            {primaryActiveRule ? primaryActiveRule.name : 'No Active Rules'}
          </span>
        </div>
      </div>

      {activeRules.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <Target className="w-6 h-6 text-yellow-600" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-900">No Active Incentive Rules</h3>
              <p className="text-yellow-800">
                {currentUser.role === 'superadmin' 
                  ? 'Please activate incentive rules to start calculating incentives.'
                  : 'Contact your administrator to activate incentive rules.'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(totalIncentives)}
                  </div>
                  <p className="text-sm text-gray-600">Total Incentives</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {incentiveCalculations.filter(calc => calc.incentive_amount > 0).length}
                  </div>
                  <p className="text-sm text-gray-600">Earning Incentives</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(primaryActiveRule.base_revenue_threshold)}
                  </div>
                  <p className="text-sm text-gray-600">Base Threshold</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-red-100 rounded-lg flex items-center justify-center">
                  <Percent className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {primaryActiveRule.commission_rate_min}% - {primaryActiveRule.commission_rate_max === 100 ? '∞' : `${primaryActiveRule.commission_rate_max}%`}
                  </div>
                  <p className="text-sm text-gray-600">Commission Range</p>
                </div>
              </div>
            </div>
          </div>

          {/* Incentive Calculations */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">
                {currentUser.role === 'superadmin' ? 'Team Performance' : 'Your Performance'}
              </h3>
            </div>

            {incentiveCalculations.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {incentiveCalculations.map((calculation) => (
                  <div key={calculation.user_id} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center">
                          {calculation.incentive_amount > 0 ? (
                            <Award className="w-6 h-6 text-purple-600" />
                          ) : (
                            <Calculator className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{calculation.user_name}</h4>
                          <p className="text-sm text-gray-600">
                            {calculation.managed_accounts_count} accounts managed
                          </p>
                          {calculation.applicable_rule && (
                            <p className="text-xs text-purple-600 font-medium">
                              Rule: {calculation.applicable_rule.name}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(calculation.incentive_amount)}
                        </div>
                        <p className="text-sm text-gray-600">Incentive Earned</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-sm font-medium text-gray-600 mb-1">Total Revenue</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {formatCurrency(calculation.total_revenue)}
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-sm font-medium text-gray-600 mb-1">Total Commission</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {formatCurrency(calculation.total_commission)}
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-sm font-medium text-gray-600 mb-1">Commission Rate</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {calculation.commission_rate.toFixed(2)}%
                        </div>
                      </div>
                    </div>

                    {calculation.current_tier && (
                      <div className="bg-purple-50 rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Star className="w-4 h-4 text-purple-600" />
                            <span className="text-sm font-medium text-purple-900">Current Tier</span>
                          </div>
                          <span className="text-sm font-semibold text-purple-900">
                            {calculation.current_tier.incentive_rate}% rate
                          </span>
                        </div>
                        <div className="text-sm text-purple-800">
                          Threshold: {formatCurrency(calculation.current_tier.revenue_threshold)}
                        </div>
                      </div>
                    )}

                    {calculation.next_tier && (
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <TrendingUp className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-900">Next Tier Progress</span>
                          </div>
                          <span className="text-sm font-semibold text-blue-900">
                            {calculation.progress_percentage.toFixed(1)}%
                          </span>
                        </div>
                        
                        <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(calculation.progress_percentage, 100)}%` }}
                          ></div>
                            {calculation.progress_percentage > 10 && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xs font-medium text-white">
                                  {calculation.progress_percentage.toFixed(1)}%
                                </span>
                              </div>
                            )}
                        </div>
                        
                        <div className="grid grid-cols-1 gap-2 text-xs text-blue-800">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Current Revenue:</span>
                            <span>{formatCurrency(calculation.total_revenue)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Next Tier Target:</span>
                            <span>{formatCurrency(calculation.next_tier.revenue_threshold)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Remaining Needed:</span>
                            <span className="text-orange-700 font-semibold">{formatCurrency(calculation.remaining_to_next_tier)}</span>
                          </div>
                          <div className="flex justify-between items-center pt-1 border-t border-blue-200">
                          <span>
                              Next Tier Rate: <span className="font-semibold">{calculation.next_tier.incentive_rate}%</span>
                          </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {!calculation.applicable_rule ? (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                        <div className="flex items-center space-x-2">
                          <Target className="w-4 h-4 text-yellow-600" />
                          <span className="text-sm font-medium text-yellow-900">
                            No applicable incentive rule found for this commission rate ({calculation.commission_rate.toFixed(2)}%)
                          </span>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Performance Data</h3>
                <p className="text-gray-600">
                  {currentUser.role === 'superadmin' 
                    ? 'No users have qualifying accounts or sales data yet.'
                    : 'You don\'t have any qualifying accounts or sales data yet.'}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default IncentiveOverview;
