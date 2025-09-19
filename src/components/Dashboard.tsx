import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  ShoppingCart, 
  MousePointer, 
  Percent,
  Users,
  TrendingUp,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle,
  Star,
  FileText,
  Shield
} from 'lucide-react';
import MetricCard from './MetricCard';
import { DashboardMetrics, Account, SalesData, User } from '../types';

interface DateFilter {
  startDate: string;
  endDate: string;
  preset: string;
}

interface DashboardProps {
  accounts: Account[];
  salesData: SalesData[];
  dateFilter: DateFilter;
  onDateFilterChange: (filter: DateFilter) => void;
  currentUser?: User;
}

const Dashboard: React.FC<DashboardProps> = ({ accounts, salesData, dateFilter, onDateFilterChange, currentUser }) => {
  // Filter accounts and sales data based on user role
  const filteredAccounts = React.useMemo(() => {
    if (!currentUser) return [];
    
    if (currentUser.role === 'superadmin') {
      return accounts;
    } else {
      // Regular users can only see accounts they manage
      return accounts.filter(account => 
        currentUser.managed_accounts.includes(account.id)
      );
    }
  }, [accounts, currentUser]);

  const filteredSalesDataByUser = React.useMemo(() => {
    if (!currentUser) return [];
    
    if (currentUser.role === 'superadmin') {
      return salesData;
    } else {
      // Regular users can only see sales data for accounts they manage
      return salesData.filter(data => 
        currentUser.managed_accounts.includes(data.account_id)
      );
    }
  }, [salesData, currentUser]);

  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalCommission: 0,
    totalRevenue: 0,
    totalOrders: 0,
    totalClicks: 0,
    commissionPercentage: 0,
    conversionRate: 0,
  });

  const [dailyData, setDailyData] = useState<any[]>([]);
  const [filteredSalesData, setFilteredSalesData] = useState<SalesData[]>([]);

  // Calculate payment status statistics for superadmin
  const paymentStats = React.useMemo(() => {
    if (currentUser?.role !== 'superadmin') return null;
    
    const stats = {
      total: filteredAccounts.length,
      belumDiatur: filteredAccounts.filter(acc => acc.payment_data === 'belum diatur').length,
      utamakan: filteredAccounts.filter(acc => acc.payment_data === 'utamakan').length,
      dimasukkan: filteredAccounts.filter(acc => acc.payment_data === 'dimasukkan').length,
      disetujui: filteredAccounts.filter(acc => acc.payment_data === 'disetujui').length,
      sah: filteredAccounts.filter(acc => acc.payment_data === 'sah').length,
    };
    
    return stats;
  }, [filteredAccounts, currentUser]);

  // Get accounts that need immediate attention (utamakan status)
  const priorityAccounts = React.useMemo(() => {
    if (currentUser?.role !== 'superadmin') return [];
    return filteredAccounts.filter(acc => acc.payment_data === 'utamakan');
  }, [filteredAccounts, currentUser]);

  // Filter sales data based on date filter
  useEffect(() => {
    let filtered = filteredSalesDataByUser;
    
    if (dateFilter.preset === 'custom' && dateFilter.startDate && dateFilter.endDate) {
      const startDate = new Date(dateFilter.startDate);
      const endDate = new Date(dateFilter.endDate);
      filtered = filteredSalesDataByUser.filter(data => {
        const dataDate = new Date(data.date);
        return dataDate >= startDate && dataDate <= endDate;
      });
    } else if (dateFilter.preset !== 'all') {
      const daysAgo = parseInt(dateFilter.preset);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
      filtered = filteredSalesDataByUser.filter(data => new Date(data.date) >= cutoffDate);
    }
    
    setFilteredSalesData(filtered);
  }, [filteredSalesDataByUser, dateFilter]);

  useEffect(() => {
    // Calculate metrics from sales data
    const totalCommission = filteredSalesData.reduce((sum, data) => sum + data.gross_commission, 0);
    const totalRevenue = filteredSalesData.reduce((sum, data) => sum + data.total_purchases, 0);
    const totalOrders = filteredSalesData.reduce((sum, data) => sum + data.orders, 0);
    const totalClicks = filteredSalesData.reduce((sum, data) => sum + data.clicks, 0);
    
    const commissionPercentage = totalRevenue > 0 ? (totalCommission / totalRevenue) * 100 : 0;
    const conversionRate = totalClicks > 0 ? (totalOrders / totalClicks) * 100 : 0;

    setMetrics({
      totalCommission,
      totalRevenue,
      totalOrders,
      totalClicks,
      commissionPercentage,
      conversionRate,
    });

    // Prepare daily data for charts (last 7 days with data)
    const groupedData = filteredSalesData.reduce((acc, data) => {
      const date = data.date;
      if (!acc[date]) {
        acc[date] = {
          date,
          commission: 0,
          revenue: 0,
          orders: 0,
          clicks: 0,
        };
      }
      acc[date].commission += data.gross_commission;
      acc[date].revenue += data.total_purchases;
      acc[date].orders += data.orders;
      acc[date].clicks += data.clicks;
      return acc;
    }, {} as any);

    const dailyArray = Object.values(groupedData)
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 7)
      .reverse();

    setDailyData(dailyArray);
  }, [filteredSalesData]);

  const handleDateFilterChange = (field: string, value: string) => {
    const newFilter = { ...dateFilter, [field]: value };
    
    // Reset custom dates when switching to preset
    if (field === 'preset' && value !== 'custom') {
      newFilter.startDate = '';
      newFilter.endDate = '';
    }
    
    onDateFilterChange(newFilter);
  };
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Detailed overview of your affiliate performance</p>
        </div>
        <div className="flex items-center space-x-3 flex-wrap">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <select 
              value={dateFilter.preset}
              onChange={(e) => handleDateFilterChange('preset', e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
              <option value="all">All time</option>
              <option value="custom">Custom range</option>
            </select>
          </div>
          
          {dateFilter.preset === 'custom' && (
            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={dateFilter.startDate}
                onChange={(e) => handleDateFilterChange('startDate', e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <span className="text-gray-400">to</span>
              <input
                type="date"
                value={dateFilter.endDate}
                onChange={(e) => handleDateFilterChange('endDate', e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          )}
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Commission"
          value={formatCurrency(metrics.totalCommission)}
          icon={DollarSign}
          trend={{ value: 12.1, isPositive: true }}
          subtitle="Gross commission earned"
        />
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(metrics.totalRevenue)}
          icon={TrendingUp}
          trend={{ value: 8.5, isPositive: true }}
          subtitle="Total purchases generated"
        />
        <MetricCard
          title="Commission Rate"
          value={formatPercentage(metrics.commissionPercentage)}
          icon={Percent}
          trend={{ value: 2.4, isPositive: true }}
          subtitle="Average commission percentage"
        />
        <MetricCard
          title="Conversion Rate"
          value={formatPercentage(metrics.conversionRate)}
          icon={MousePointer}
          trend={{ value: 1.2, isPositive: false }}
          subtitle="Orders per clicks"
        />
      </div>

      {currentUser?.role === 'superadmin' && paymentStats && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                <Shield className="w-6 h-6 text-purple-600" />
                <span>Payment Status Overview</span>
              </h2>
              <p className="text-gray-600">Monitor account payment statuses and priority actions</p>
            </div>
            {priorityAccounts.length > 0 && (
              <div className="flex items-center space-x-2 bg-orange-100 text-orange-800 px-4 py-2 rounded-lg">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">{priorityAccounts.length} accounts need attention</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Total Accounts */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{paymentStats.total}</div>
                  <p className="text-sm text-gray-600">Total Accounts</p>
                </div>
              </div>
            </div>

            {/* Belum Diatur */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{paymentStats.belumDiatur}</div>
                  <p className="text-sm text-gray-600">Belum Diatur</p>
                  <div className="text-xs text-gray-500 mt-1">
                    {paymentStats.total > 0 ? ((paymentStats.belumDiatur / paymentStats.total) * 100).toFixed(1) : 0}%
                  </div>
                </div>
              </div>
            </div>

            {/* Utamakan - Priority */}
            <div className={`bg-white rounded-xl border-2 p-6 ${
              paymentStats.utamakan > 0 ? 'border-orange-300 bg-orange-50' : 'border-gray-100'
            }`}>
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  paymentStats.utamakan > 0 
                    ? 'bg-gradient-to-br from-orange-400 to-red-500 animate-pulse' 
                    : 'bg-gradient-to-br from-yellow-100 to-orange-200'
                }`}>
                  <Star className={`w-6 h-6 ${paymentStats.utamakan > 0 ? 'text-white' : 'text-orange-600'}`} />
                </div>
                <div>
                  <div className={`text-2xl font-bold ${
                    paymentStats.utamakan > 0 ? 'text-orange-900' : 'text-gray-900'
                  }`}>
                    {paymentStats.utamakan}
                  </div>
                  <p className={`text-sm ${paymentStats.utamakan > 0 ? 'text-orange-700' : 'text-gray-600'}`}>
                    Utamakan
                  </p>
                  {paymentStats.utamakan > 0 && (
                    <div className="text-xs text-orange-600 font-medium mt-1 flex items-center space-x-1">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Needs Action!</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Dimasukkan */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{paymentStats.dimasukkan}</div>
                  <p className="text-sm text-gray-600">Dimasukkan</p>
                  <div className="text-xs text-gray-500 mt-1">
                    {paymentStats.total > 0 ? ((paymentStats.dimasukkan / paymentStats.total) * 100).toFixed(1) : 0}%
                  </div>
                </div>
              </div>
            </div>

            {/* Disetujui + Sah */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{paymentStats.disetujui + paymentStats.sah}</div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <div className="text-xs text-gray-500 mt-1">
                    Disetujui: {paymentStats.disetujui} | Sah: {paymentStats.sah}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Priority Accounts Alert */}
          {priorityAccounts.length > 0 && (
            <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl p-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center animate-pulse">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-orange-900 mb-2">
                    🚨 Priority Accounts Requiring Immediate Action
                  </h3>
                  <p className="text-orange-800 mb-4">
                    {priorityAccounts.length} account{priorityAccounts.length > 1 ? 's have' : ' has'} been marked as "Utamakan" and need{priorityAccounts.length === 1 ? 's' : ''} immediate attention from your team.
                  </p>
                  <div className="space-y-2">
                    {priorityAccounts.slice(0, 5).map((account) => (
                      <div key={account.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-orange-200">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                            <Users className="w-4 h-4 text-orange-600" />
                          </div>
                          <div>
                            <div className="font-medium text-orange-900">{account.username}</div>
                            <div className="text-sm text-orange-700">{account.account_code} • {account.email}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-500 text-white">
                            PRIORITY
                          </span>
                          <span className="text-xs text-orange-600">
                            {new Date(account.created_at).toLocaleDateString('id-ID')}
                          </span>
                        </div>
                      </div>
                    ))}
                    {priorityAccounts.length > 5 && (
                      <div className="text-center py-2">
                        <span className="text-sm text-orange-700">
                          +{priorityAccounts.length - 5} more accounts need attention
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex space-x-3">
                    <button className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium">
                      View All Priority Accounts
                    </button>
                    <button className="bg-white text-orange-700 border border-orange-300 px-4 py-2 rounded-lg hover:bg-orange-50 transition-colors text-sm font-medium">
                      Mark as Processed
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Commission Overview Chart */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Commission Overview</h3>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-sm text-gray-600">This period</span>
              </div>
            </div>
          </div>
          
          <div className="h-64 flex items-end space-x-2">
            {dailyData.map((data, index) => {
              const maxCommission = Math.max(...dailyData.map(d => d.commission));
              const height = maxCommission > 0 ? (data.commission / maxCommission) * 200 : 0;
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-gray-100 rounded-t-lg relative group cursor-pointer">
                    <div 
                      className="bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-lg transition-all duration-300 hover:from-purple-700 hover:to-purple-500"
                      style={{ height: `${height}px` }}
                    ></div>
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      {formatCurrency(data.commission)}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 mt-2">
                    {new Date(data.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Account Statistics */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Account Statistics</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium text-gray-700">Active Accounts</span>
              </div>
              <span className="text-lg font-bold text-gray-900">{accounts.length}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <ShoppingCart className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium text-gray-700">Total Orders</span>
              </div>
              <span className="text-lg font-bold text-gray-900">{metrics.totalOrders.toLocaleString()}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <MousePointer className="w-5 h-5 text-orange-500" />
                <span className="text-sm font-medium text-gray-700">Total Clicks</span>
              </div>
              <span className="text-lg font-bold text-gray-900">{metrics.totalClicks.toLocaleString()}</span>
            </div>
          </div>

          {/* Commission Donut Chart Placeholder */}
          <div className="mt-6">
            <div className="flex items-center justify-center">
              <div className="relative w-32 h-32">
                <div className="w-32 h-32 rounded-full border-8 border-gray-200"></div>
                <div 
                  className="absolute top-0 w-32 h-32 rounded-full border-8 border-purple-500 transform -rotate-90"
                  style={{ 
                    borderTopColor: 'transparent',
                    borderRightColor: 'transparent',
                    borderBottomColor: 'transparent',
                  }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">
                      {formatPercentage(metrics.commissionPercentage)}
                    </div>
                    <div className="text-xs text-gray-500">Avg Commission</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;