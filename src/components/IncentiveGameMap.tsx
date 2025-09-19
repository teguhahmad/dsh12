import React, { useState, useEffect, useMemo } from 'react';
import { 
  Trophy, 
  Target, 
  Star, 
  Crown, 
  Zap, 
  TrendingUp, 
  Users, 
  Calendar,
  Filter,
  Award,
  Flame,
  Gem,
  Shield,
  Rocket,
  ChevronRight,
  Lock,
  Unlock,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { Account, SalesData, IncentiveRule, User, IncentiveCalculation } from '../types';
interface IncentiveGameMapProps {
  accounts: Account[];
  salesData: SalesData[];
  incentiveRules: IncentiveRule[];
  currentUser: User;
}
interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}
const IncentiveGameMap: React.FC<IncentiveGameMapProps> = ({ 
  accounts, 
  salesData, 
  incentiveRules,
  currentUser 
}) => {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedUser, setSelectedUser] = useState<string>(currentUser.role === 'user' ? currentUser.id : 'all');
  const [countdown, setCountdown] = useState<CountdownTime>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  // Sample users data - in real app this would come from props or API
  const users: User[] = useMemo(() => [
    // Include current user
    currentUser,
    // Add other sample users if current user is superadmin
    ...(currentUser.role === 'superadmin' ? [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@kimostudio.com',
        role: 'user' as const,
        managed_accounts: accounts.length > 0 ? [accounts[0].id] : [], // manages first account if available
        created_at: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'Jane Smith',
        email: 'jane@kimostudio.com',
        role: 'user' as const,
        managed_accounts: accounts.length > 1 ? [accounts[1].id] : [], // manages second account if available
        created_at: new Date().toISOString(),
      }
    ] : [])
  ], [currentUser, accounts]);
  // Countdown timer effect
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      // Set timezone to WIB (UTC+7)
      const wibOffset = 7 * 60; // 7 hours in minutes
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      const wibTime = new Date(utc + (wibOffset * 60000));
      // Get end of current month in WIB
      const currentYear = wibTime.getFullYear();
      const currentMonth = wibTime.getMonth();
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
      const timeDiff = endOfMonth.getTime() - wibTime.getTime();
      if (timeDiff > 0) {
        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
        setCountdown({ days, hours, minutes, seconds });
      } else {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);
  // Filter sales data by selected month
  const filteredSalesData = useMemo(() => {
    const [year, month] = selectedMonth.split('-');
    const filtered = salesData.filter(data => {
      const dataDate = new Date(data.date);
      return dataDate.getFullYear() === parseInt(year) && 
             dataDate.getMonth() === parseInt(month) - 1;
    });
    
    console.log('Filtered Sales Data:', {
      selectedMonth,
      totalSalesData: salesData.length,
      filteredCount: filtered.length,
      sampleData: filtered.slice(0, 3)
    });
    
    return filtered;
  }, [salesData, selectedMonth]);
  // Calculate incentives for users
  const incentiveCalculations = useMemo(() => {
    const calculations: IncentiveCalculation[] = [];
    const usersToCalculate = currentUser.role === 'superadmin' 
      ? users.filter(u => u.role === 'user')
      : [currentUser];
    usersToCalculate.forEach(user => {
      // Get accounts managed by this user
      let userAccounts: Account[] = [];
      
      if (currentUser.role === 'superadmin') {
        // For superadmin viewing other users, use their managed accounts
        userAccounts = accounts.filter(acc => user.managed_accounts.includes(acc.id));
      } else {
        // For regular users, use their own managed accounts
        userAccounts = accounts.filter(acc => currentUser.managed_accounts.includes(acc.id));
      }
      // Get all sales data for user's accounts
      const userSalesData = filteredSalesData.filter(data => 
        userAccounts.some(acc => acc.id === data.account_id)
      );
      
      // Debug logging to verify data connection
      if (user.id === currentUser.id) {
        console.log('Debug - Current User Data:', {
          userId: user.id,
          userName: user.name,
          managedAccounts: currentUser.managed_accounts,
          userAccounts: userAccounts.map(acc => ({ id: acc.id, username: acc.username })),
          salesDataCount: userSalesData.length,
          totalSalesData: filteredSalesData.length,
          selectedMonth,
          userSalesData: userSalesData.slice(0, 3) // Show first 3 records for debugging
        });
      }
      // Calculate total commission and revenue for all accounts (to determine average commission rate)
      const allTotalRevenue = userSalesData.reduce((sum, data) => sum + (data.total_purchases || 0), 0);
      const allTotalCommission = userSalesData.reduce((sum, data) => sum + (data.gross_commission || 0), 0);
      const averageCommissionRate = allTotalRevenue > 0 ? (allTotalCommission / allTotalRevenue) * 100 : 0;
      
      // Debug logging for calculations
      if (user.id === currentUser.id) {
        console.log('Debug - Calculations:', {
          allTotalRevenue,
          allTotalCommission,
          averageCommissionRate
        });
      }
      // Find applicable incentive rule
      const applicableRule = incentiveRules.find(rule => 
        rule.is_active &&
        averageCommissionRate >= rule.commission_rate_min &&
        (rule.commission_rate_max === 100 ? averageCommissionRate >= rule.commission_rate_min : averageCommissionRate <= rule.commission_rate_max)
      );
      // Filter accounts that meet minimum commission threshold for incentive calculation
      let qualifyingAccountsData: typeof userSalesData = [];
      let totalRevenue = 0;
      let totalCommission = 0;
      if (applicableRule) {
        // Group sales data by account and check if each account meets minimum commission threshold
        const accountGroups = userSalesData.reduce((groups, data) => {
          if (!groups[data.account_id]) {
            groups[data.account_id] = [];
          }
          groups[data.account_id].push(data);
          return groups;
        }, {} as Record<string, typeof userSalesData>);
        // Check each account's total commission against minimum threshold
        Object.entries(accountGroups).forEach(([accountId, accountData]) => {
          const accountTotalCommission = accountData.reduce((sum, data) => sum + (data.gross_commission || 0), 0);
          // Only include accounts that meet minimum commission threshold
          if (accountTotalCommission >= applicableRule.min_commission_threshold) {
            qualifyingAccountsData.push(...accountData);
          }
        });
        // Calculate totals from qualifying accounts only
        totalRevenue = qualifyingAccountsData.reduce((sum, data) => sum + (data.total_purchases || 0), 0);
        totalCommission = qualifyingAccountsData.reduce((sum, data) => sum + (data.gross_commission || 0), 0);
      } else {
        // If no applicable rule, use all data for display purposes
        totalRevenue = allTotalRevenue;
        totalCommission = allTotalCommission;
      }
      let currentTier = null;
      let nextTier = null;
      let incentiveAmount = 0;
      let progressPercentage = 0;
      let remainingToNextTier = 0;
      if (applicableRule && totalRevenue >= applicableRule.base_revenue_threshold) {
        // Find current tier
        const sortedTiers = [...applicableRule.tiers].sort((a, b) => a.revenue_threshold - b.revenue_threshold);
        for (let i = sortedTiers.length - 1; i >= 0; i--) {
          if (totalRevenue >= sortedTiers[i].revenue_threshold) {
            currentTier = sortedTiers[i];
            nextTier = sortedTiers[i + 1] || null;
            break;
          }
        }
        if (currentTier) {
          incentiveAmount = (totalRevenue * currentTier.incentive_rate) / 100;
        }
        if (nextTier) {
          remainingToNextTier = nextTier.revenue_threshold - totalRevenue;
          progressPercentage = ((totalRevenue - currentTier.revenue_threshold) / 
                              (nextTier.revenue_threshold - currentTier.revenue_threshold)) * 100;
        } else if (currentTier) {
          progressPercentage = 100;
        }
      } else if (applicableRule) {
        // User has qualifying commission but hasn't reached base threshold
        remainingToNextTier = applicableRule.base_revenue_threshold - totalRevenue;
        progressPercentage = (totalRevenue / applicableRule.base_revenue_threshold) * 100;
        nextTier = applicableRule.tiers[0];
      }
      calculations.push({
        user_id: user.id,
        user_name: user.name,
        total_revenue: totalRevenue,
        total_commission: totalCommission,
        commission_rate: averageCommissionRate,
        applicable_rule: applicableRule,
        current_tier: currentTier,
        next_tier: nextTier,
        incentive_amount: incentiveAmount,
        progress_percentage: Math.min(progressPercentage, 100),
        remaining_to_next_tier: remainingToNextTier,
        managed_accounts_count: userAccounts.length,
      });
    });
    return calculations;
  }, [users, accounts, filteredSalesData, incentiveRules, currentUser]);
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };
  const getTierIcon = (tierIndex: number, isUnlocked: boolean) => {
    const icons = [Target, Star, Trophy, Crown, Gem, Rocket];
    const Icon = icons[tierIndex % icons.length];
    return <Icon className={`w-6 h-6 ${isUnlocked ? 'text-yellow-500' : 'text-gray-400'}`} />;
  };
  const getTierColor = (tierIndex: number, isUnlocked: boolean) => {
    const colors = [
      'from-blue-400 to-blue-600',
      'from-green-400 to-green-600', 
      'from-purple-400 to-purple-600',
      'from-orange-400 to-orange-600',
      'from-pink-400 to-pink-600',
      'from-indigo-400 to-indigo-600'
    ];
    return isUnlocked ? colors[tierIndex % colors.length] : 'from-gray-300 to-gray-400';
  };
  const displayedCalculations = selectedUser === 'all' 
    ? incentiveCalculations 
    : incentiveCalculations.filter(calc => calc.user_id === selectedUser);
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <span>Incentive Quest</span>
          </h1>
          <p className="text-gray-600">Raih target penjualan dan dapatkan insentif menarik!</p>
        </div>
      </div>

      {/* Countdown Timer */}
      <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Deadline Quest Bulan Ini</h2>
              <p className="text-red-100">Waktu Indonesia Barat (WIB)</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="bg-white bg-opacity-20 rounded-lg p-3">
              <div className="text-2xl font-bold">{countdown.days}</div>
              <div className="text-xs text-red-100">Hari</div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-3">
              <div className="text-2xl font-bold">{countdown.hours}</div>
              <div className="text-xs text-red-100">Jam</div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-3">
              <div className="text-2xl font-bold">{countdown.minutes}</div>
              <div className="text-xs text-red-100">Menit</div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-3">
              <div className="text-2xl font-bold">{countdown.seconds}</div>
              <div className="text-xs text-red-100">Detik</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <label className="text-sm font-medium text-gray-700">Bulan:</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          {currentUser.role === 'superadmin' && (
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <label className="text-sm font-medium text-gray-700">User:</label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">Semua User</option>
                {users.filter(u => u.role === 'user').map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
      {/* Game Map */}
      <div className="space-y-8">
        {displayedCalculations.map((calc) => (
          <div key={calc.user_id} className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 overflow-hidden">
            {/* User Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                    <Users className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{calc.user_name}</h2>
                    <p className="text-indigo-100">
                      Mengelola {calc.managed_accounts_count} akun affiliate
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">
                    {formatCurrency(calc.incentive_amount)}
                  </div>
                  <p className="text-indigo-100">Insentif Bulan Ini</p>
                </div>
              </div>
            </div>
            {/* Stats Cards */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {formatCurrency(calc.total_revenue)}
                    </div>
                    <p className="text-sm text-gray-600">Total Penjualan</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Award className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {formatCurrency(calc.total_commission)}
                    </div>
                    <p className="text-sm text-gray-600">Total Komisi</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Flame className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {calc.commission_rate.toFixed(2)}%
                    </div>
                    <p className="text-sm text-gray-600">Rate Komisi</p>
                  </div>
                </div>
              </div>
            </div>
            {calc.applicable_rule ? (
              <>
                {/* Rule Assignment Info */}
                <div className="px-6 mb-6">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                        <Target className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-blue-900 mb-2">
                          🎯 Anda Tergabung dalam: {calc.applicable_rule.name}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="bg-white rounded-lg p-3 border border-blue-200">
                            <div className="text-sm text-blue-700 font-medium">Rate Komisi Anda</div>
                            <div className="text-xl font-bold text-blue-900">{calc.commission_rate.toFixed(2)}%</div>
                          </div>
                          <div className="bg-white rounded-lg p-3 border border-blue-200">
                            <div className="text-sm text-blue-700 font-medium">Range Rules Ini</div>
                            <div className="text-xl font-bold text-blue-900">
                              {calc.applicable_rule.commission_rate_min}% - {calc.applicable_rule.commission_rate_max === 100 ? '∞' : `${calc.applicable_rule.commission_rate_max}%`}
                            </div>
                          </div>
                        </div>
                        <p className="text-blue-800 text-sm leading-relaxed">
                          {calc.applicable_rule.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Progress Section */}
                <div className="px-6 mb-6">
                  <div className="bg-white rounded-xl p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Progress Quest: {calc.applicable_rule.name}
                      </h3>
                      {calc.next_tier && (
                        <div className="text-right">
                          <div className="text-sm text-gray-600">Sisa untuk tier berikutnya:</div>
                          <div className="text-lg font-bold text-orange-600">
                            {formatCurrency(calc.remaining_to_next_tier)}
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Game-style Progress Bar */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Trophy className="w-5 h-5 text-yellow-500" />
                          <span className="text-sm font-medium text-gray-700">
                            {calc.current_tier ? `Tier ${calc.applicable_rule.tiers.findIndex(t => t.id === calc.current_tier?.id) + 1}` : 'Belum Unlock'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">
                            {formatCurrency(calc.total_revenue)} / {formatCurrency(calc.next_tier?.revenue_threshold || calc.applicable_rule.base_revenue_threshold)}
                          </span>
                          <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold">
                            {calc.progress_percentage.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                      {/* Game-style progress bar with segments */}
                      <div className="relative w-full bg-gray-200 rounded-full h-6 overflow-hidden border-2 border-gray-300">
                        {/* Background pattern */}
                        <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-gray-200"></div>
                        {/* Progress fill */}
                        <div 
                          className="relative h-full bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${calc.progress_percentage}%` }}
                        >
                          {/* Shine effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
                          {/* Progress segments */}
                          <div className="absolute inset-0 flex">
                            {Array.from({ length: 10 }).map((_, i) => (
                              <div key={i} className="flex-1 border-r border-white border-opacity-30 last:border-r-0"></div>
                            ))}
                          </div>
                        </div>
                        {/* Progress text overlay */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-bold text-white drop-shadow-lg">
                            {calc.progress_percentage.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                    {calc.next_tier && calc.remaining_to_next_tier > 0 && (
                      <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl p-4 relative overflow-hidden">
                        {/* Animated background */}
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-100 to-red-100 opacity-50 animate-pulse"></div>
                        <div className="flex items-center space-x-3">
                          <div className="relative z-10 w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center animate-bounce">
                            <Zap className="w-6 h-6 text-white" />
                          </div>
                          <div className="relative z-10 flex-1">
                            <h4 className="font-semibold text-orange-900">Hampir Sampai!</h4>
                            <p className="text-orange-700 text-sm">
                              Tingkatkan penjualan sebesar <strong>{formatCurrency(calc.remaining_to_next_tier)}</strong> lagi 
                              untuk mencapai tier berikutnya dan dapatkan insentif {calc.next_tier.incentive_rate}%!
                            </p>
                          </div>
                          <div className="relative z-10 text-right">
                            <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                              +{calc.next_tier.incentive_rate}%
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {/* Show higher tiers available */}
                    {calc.current_tier && calc.applicable_rule.tiers.length > calc.applicable_rule.tiers.findIndex(t => t.id === calc.current_tier?.id) + 1 && (
                      <div className="mt-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-500 rounded-lg flex items-center justify-center">
                            <Crown className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-purple-900">Tier Lebih Tinggi Tersedia!</h4>
                            <p className="text-purple-700 text-sm">
                              Masih ada {calc.applicable_rule.tiers.length - calc.applicable_rule.tiers.findIndex(t => t.id === calc.current_tier?.id) - 1} tier lagi 
                              dengan insentif hingga {Math.max(...calc.applicable_rule.tiers.map(t => t.incentive_rate))}%
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                              Max {Math.max(...calc.applicable_rule.tiers.map(t => t.incentive_rate))}%
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {/* Tier Map */}
                <div className="px-6 pb-6">
                  <div className="bg-white rounded-xl p-6 border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center space-x-2">
                      <Shield className="w-5 h-5" />
                      <span>Peta Insentif</span>
                    </h3>
                    <div className="relative">
                      {/* Connection Lines */}
                      <div className="absolute top-8 left-8 right-8 h-0.5 bg-gray-200 z-0"></div>
                      {/* Tiers */}
                      <div className="relative z-10 flex justify-between items-start">
                        {calc.applicable_rule.tiers.map((tier, index) => {
                          const isUnlocked = calc.total_revenue >= tier.revenue_threshold;
                          const isCurrent = calc.current_tier?.id === tier.id;
                          return (
                            <div key={tier.id} className="flex flex-col items-center space-y-3">
                              {/* Tier Icon */}
                              <div className={`
                                w-16 h-16 rounded-full flex items-center justify-center relative
                                ${isUnlocked 
                                  ? `bg-gradient-to-br ${getTierColor(index, true)} shadow-lg transform scale-110` 
                                  : 'bg-gray-200 border-2 border-gray-300'
                                }
                                ${isCurrent ? 'ring-4 ring-yellow-300 ring-opacity-50 animate-pulse' : ''}
                                transition-all duration-300
                              `}>
                                {isUnlocked ? (
                                  getTierIcon(index, true)
                                ) : (
                                  <Lock className="w-6 h-6 text-gray-500" />
                                )}
                                {isCurrent && (
                                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                                    <Crown className="w-4 h-4 text-yellow-800" />
                                  </div>
                                )}
                              </div>
                              {/* Tier Info */}
                              <div className="text-center">
                                <div className={`text-sm font-semibold ${isUnlocked ? 'text-gray-900' : 'text-gray-500'}`}>
                                  Tier {index + 1}
                                </div>
                                <div className={`text-xs ${isUnlocked ? 'text-gray-600' : 'text-gray-400'}`}>
                                  {formatCurrency(tier.revenue_threshold)}
                                </div>
                                <div className={`text-sm font-bold ${isUnlocked ? 'text-green-600' : 'text-gray-400'}`}>
                                  {tier.incentive_rate}%
                                </div>
                              </div>
                              {/* Arrow to next tier */}
                              {index < calc.applicable_rule.tiers.length - 1 && (
                                <ChevronRight className="w-4 h-4 text-gray-400 absolute top-6 -right-2" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* No Applicable Rule */
              <div className="px-6 pb-6">
                {/* Commission Rate Analysis */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-6 mb-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-amber-900 mb-3">
                        📊 Analisis Rate Komisi Anda
                      </h3>
                      <div className="bg-white rounded-lg p-4 border border-amber-200 mb-4">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-amber-900 mb-1">
                            {calc.commission_rate.toFixed(2)}%
                          </div>
                          <div className="text-sm text-amber-700">Rate Komisi Rata-rata Anda</div>
                        </div>
                      </div>
                      {/* Rules Recommendation */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-amber-900">🎯 Rekomendasi Rules untuk Anda:</h4>
                        {incentiveRules.filter(rule => rule.is_active).map(rule => {
                          const isRateMatch = calc.commission_rate >= rule.commission_rate_min && 
                            (rule.commission_rate_max === 100 ? calc.commission_rate >= rule.commission_rate_min : calc.commission_rate <= rule.commission_rate_max);
                          return (
                            <div key={rule.id} className={`border-2 rounded-lg p-4 ${
                              isRateMatch 
                                ? 'border-green-300 bg-green-50' 
                                : 'border-gray-300 bg-gray-50'
                            }`}>
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-bold text-gray-900">{rule.name}</h5>
                                <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                                  isRateMatch 
                                    ? 'bg-green-500 text-white' 
                                    : 'bg-gray-400 text-white'
                                }`}>
                                  {isRateMatch ? '✓ COCOK' : '✗ TIDAK COCOK'}
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-3 mb-3">
                                <div className="text-sm">
                                  <span className="text-gray-600">Range Rate:</span>
                                  <span className="font-semibold ml-1">
                                    {rule.commission_rate_min}% - {rule.commission_rate_max === 100 ? '∞' : `${rule.commission_rate_max}%`}
                                  </span>
                                </div>
                                <div className="text-sm">
                                  <span className="text-gray-600">Min Komisi/Akun:</span>
                                  <span className="font-semibold ml-1">
                                    {formatCurrency(rule.min_commission_threshold)}
                                  </span>
                                </div>
                              </div>
                              {isRateMatch ? (
                                <div className="bg-green-100 border border-green-300 rounded-lg p-3">
                                  <h6 className="font-semibold text-green-900 mb-2">🎉 Strategi untuk Rules Ini:</h6>
                                  <ul className="text-sm text-green-800 space-y-1">
                                    <li>• Pastikan setiap akun mencapai komisi minimum {formatCurrency(rule.min_commission_threshold)}</li>
                                    <li>• Target penjualan total: {formatCurrency(rule.base_revenue_threshold)} untuk mulai dapat insentif</li>
                                    <li>• Insentif maksimal: {Math.max(...rule.tiers.map(t => t.incentive_rate))}% dari total penjualan</li>
                                    <li>• Fokus pada akun dengan performa terbaik untuk mencapai tier tinggi</li>
                                  </ul>
                                </div>
                              ) : (
                                <div className="bg-gray-100 border border-gray-300 rounded-lg p-3">
                                  <p className="text-sm text-gray-700">
                                    {calc.commission_rate < rule.commission_rate_min 
                                      ? `Rate komisi Anda (${calc.commission_rate.toFixed(2)}%) masih di bawah minimum ${rule.commission_rate_min}% untuk rules ini`
                                      : `Rate komisi Anda (${calc.commission_rate.toFixed(2)}%) melebihi maksimum ${rule.commission_rate_max}% untuk rules ini`
                                    }
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {/* Action Plan */}
                      {(() => {
                        const matchingRule = incentiveRules.find(rule => 
                          rule.is_active &&
                          calc.commission_rate >= rule.commission_rate_min && 
                          (rule.commission_rate_max === 100 ? true : calc.commission_rate <= rule.commission_rate_max)
                        );
                        if (matchingRule) {
                          return (
                            <div className="mt-4 bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300 rounded-xl p-4">
                              <h4 className="font-bold text-green-900 mb-3 flex items-center space-x-2">
                                <Rocket className="w-5 h-5" />
                                <span>🚀 Rencana Aksi Anda</span>
                              </h4>
                              <div className="space-y-2 text-sm text-green-800">
                                <div className="flex items-start space-x-2">
                                  <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                                  <div>
                                    <strong>Kualifikasi Akun:</strong> Pastikan setiap akun mencapai komisi minimum {formatCurrency(matchingRule.min_commission_threshold)}
                                  </div>
                                </div>
                                <div className="flex items-start space-x-2">
                                  <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                                  <div>
                                    <strong>Target Penjualan:</strong> Raih total penjualan {formatCurrency(matchingRule.base_revenue_threshold)} untuk unlock insentif pertama
                                  </div>
                                </div>
                                <div className="flex items-start space-x-2">
                                  <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                                  <div>
                                    <strong>Optimasi Tier:</strong> Tingkatkan penjualan secara bertahap untuk mencapai tier dengan insentif {Math.max(...matchingRule.tiers.map(t => t.incentive_rate))}%
                                  </div>
                                </div>
                              </div>
                              {/* Show tier progression for matching rule */}
                              <div className="mt-4 bg-white rounded-lg p-3 border border-green-200">
                                <h5 className="font-semibold text-green-900 mb-2">📈 Tier Progression:</h5>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                                  {matchingRule.tiers.map((tier, index) => (
                                    <div key={tier.id} className="bg-green-50 border border-green-200 rounded p-2 text-center">
                                      <div className="font-bold text-green-900">Tier {index + 1}</div>
                                      <div className="text-green-700">{formatCurrency(tier.revenue_threshold)}</div>
                                      <div className="font-semibold text-green-800">{tier.incentive_rate}%</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-8 border border-gray-100 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                    <Lock className="w-10 h-10 text-gray-400" />
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Quest Belum Terbuka</h3>
                  <p className="text-gray-600 mb-6">
                    {calc.total_commission === 0 
                      ? 'Mulai berjualan untuk mendapatkan komisi dan insentif!'
                      : `Komisi saat ini: ${formatCurrency(calc.total_commission)}`
                    }
                  </p>
                  {/* Show progress to unlock incentives */}
                  {calc.total_commission > 0 && incentiveRules.filter(rule => rule.is_active).length > 0 && (
                    <div className="space-y-4">
                      {incentiveRules.filter(rule => rule.is_active).map(rule => {
                        // Check how many accounts meet the minimum commission threshold
                        const userAccounts = currentUser.role === 'superadmin' 
                          ? accounts.filter(acc => users.find(u => u.id === calc.user_id)?.managed_accounts.includes(acc.id))
                          : accounts.filter(acc => currentUser.managed_accounts.includes(acc.id));
                        const userSalesData = filteredSalesData.filter(data => 
                          userAccounts.some(acc => acc.id === data.account_id)
                        );
                        // Group by account and check qualifying accounts
                        const accountGroups = userSalesData.reduce((groups, data) => {
                          if (!groups[data.account_id]) {
                            groups[data.account_id] = [];
                          }
                          groups[data.account_id].push(data);
                          return groups;
                        }, {} as Record<string, typeof userSalesData>);
                        const qualifyingAccounts = Object.entries(accountGroups).filter(([accountId, accountData]) => {
                          const accountTotalCommission = accountData.reduce((sum, data) => sum + data.gross_commission, 0);
                          return accountTotalCommission >= rule.min_commission_threshold;
                        });
                        const totalQualifyingCommission = qualifyingAccounts.reduce((sum, [accountId, accountData]) => {
                          return sum + accountData.reduce((accSum, data) => accSum + data.gross_commission, 0);
                        }, 0);
                        const hasQualifyingAccounts = qualifyingAccounts.length > 0;
                        const isRateQualified = calc.commission_rate >= rule.commission_rate_min && calc.commission_rate <= rule.commission_rate_max;
                        const isRateQualifiedFixed = calc.commission_rate >= rule.commission_rate_min && 
                          (rule.commission_rate_max === 100 ? calc.commission_rate >= rule.commission_rate_min : calc.commission_rate <= rule.commission_rate_max);
                        return (
                          <div key={rule.id} className={`border-2 rounded-xl p-4 ${
                            hasQualifyingAccounts && isRateQualifiedFixed 
                              ? 'border-green-300 bg-green-50' 
                              : 'border-orange-300 bg-orange-50'
                          }`}>
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-bold text-gray-900">{rule.name}</h4>
                              <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                                hasQualifyingAccounts && isRateQualifiedFixed 
                                  ? 'bg-green-500 text-white' 
                                  : 'bg-orange-500 text-white'
                              }`}>
                                {hasQualifyingAccounts && isRateQualifiedFixed ? 'QUALIFIED!' : 'LOCKED'}
                              </div>
                            </div>
                            {/* Qualifying Accounts Info */}
                            <div className="mb-3">
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">Akun yang Memenuhi Syarat:</span>
                                <span className="font-semibold">
                                  {qualifyingAccounts.length} dari {Object.keys(accountGroups).length} akun
                                </span>
                              </div>
                              <div className="text-sm mb-2">
                                <span className="text-gray-600">Total Komisi dari Akun yang Memenuhi Syarat: </span>
                                <span className="font-semibold text-green-600">
                                  {formatCurrency(totalQualifyingCommission)}
                                </span>
                              </div>
                              <div className="text-sm mb-2">
                                <span className="text-gray-600">Minimum Komisi per Akun: </span>
                                <span className="font-semibold">
                                  {formatCurrency(rule.min_commission_threshold)}
                                </span>
                              </div>
                              {!hasQualifyingAccounts && (
                                <p className="text-xs text-orange-600 mt-2 p-2 bg-orange-100 rounded">
                                  Tidak ada akun yang memenuhi minimum komisi {formatCurrency(rule.min_commission_threshold)}
                                </p>
                              )}
                            </div>
                            {/* Commission Rate Check */}
                            <div className="text-sm">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600">Rate Komisi Rata-rata:</span>
                                <span className={`font-semibold ${
                                  isRateQualifiedFixed ? 'text-green-600' : 'text-orange-600'
                                }`}>
                                  {calc.commission_rate.toFixed(2)}% 
                                  ({rule.commission_rate_min}% - {rule.commission_rate_max === 100 ? '∞' : `${rule.commission_rate_max}%`})
                                  {isRateQualifiedFixed ? ' ✓' : ' ✗'}
                                </span>
                              </div>
                            </div>
                            {hasQualifyingAccounts && isRateQualifiedFixed && (
                              <div className="mt-3 p-3 bg-green-100 rounded-lg">
                                <p className="text-green-800 text-sm font-semibold">
                                  🎉 Selamat! Anda memenuhi syarat untuk quest ini. 
                                  Mulai dari tier pertama dengan target {formatCurrency(rule.base_revenue_threshold)}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {incentiveRules.filter(rule => rule.is_active).length > 0 && calc.total_commission === 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                      <h4 className="font-semibold text-blue-900 mb-3">🎯 Quest Tersedia:</h4>
                      <div className="space-y-3">
                        {incentiveRules.filter(rule => rule.is_active).map(rule => (
                          <div key={rule.id} className="bg-white rounded-lg p-3 border border-blue-200">
                            <div className="font-semibold text-blue-900">{rule.name}</div>
                            <div className="text-sm text-blue-700">
                              Min komisi per akun: {formatCurrency(rule.min_commission_threshold)} | 
                              Rate: {rule.commission_rate_min}%-{rule.commission_rate_max === 100 ? '∞' : `${rule.commission_rate_max}%`}
                            </div>
                            <div className="text-xs text-blue-600 mt-1">
                              Insentif hingga {Math.max(...rule.tiers.map(t => t.incentive_rate))}%
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {displayedCalculations.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Data Insentif</h3>
          <p className="text-gray-600">
            {currentUser.role === 'superadmin' 
              ? 'Belum ada user dengan data penjualan untuk bulan ini'
              : currentUser.managed_accounts.length === 0
                ? 'Anda belum memiliki akun yang dikelola. Hubungi admin untuk mendapatkan akses akun.'
                : `Belum ada data penjualan untuk bulan ${selectedMonth}. Upload data penjualan untuk melihat perhitungan insentif.`
            }
          </p>
          {currentUser.role === 'user' && currentUser.managed_accounts.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Akun yang Anda kelola:</strong>
              </p>
              <div className="mt-2 flex flex-wrap gap-2 justify-center">
                {currentUser.managed_accounts.map(accountId => {
                  const account = accounts.find(acc => acc.id === accountId);
                  return account ? (
                    <span key={accountId} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {account.username} ({account.account_code})
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default IncentiveGameMap;