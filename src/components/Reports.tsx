import React, { useState, useMemo } from 'react';
import { BarChart3, Download, Calendar, Filter } from 'lucide-react';
import { Account, SalesData, Category } from '../types';

interface DateFilter {
  startDate: string;
  endDate: string;
  preset: string;
}

interface ReportsProps {
  accounts: Account[];
  salesData: SalesData[];
  categories: Category[];
  dateFilter: DateFilter;
  onDateFilterChange: (filter: DateFilter) => void;
  currentUser?: {
    id: string;
    name: string;
    email: string;
    role: 'user' | 'superadmin';
    managed_accounts: string[];
  };
}

const Reports: React.FC<ReportsProps> = ({ accounts, salesData, categories, dateFilter, onDateFilterChange, currentUser }) => {
  // Filter accounts and sales data based on user role
  const filteredAccountsByRole = React.useMemo(() => {
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

  const [selectedAccount, setSelectedAccount] = useState('all');
  
  const filteredData = useMemo(() => {
    let filtered = filteredSalesDataByUser;
    
    // Filter by account
    if (selectedAccount !== 'all') {
      filtered = filtered.filter(data => data.account_id === selectedAccount);
    }
    
    // Filter by date range
    if (dateFilter.preset === 'custom' && dateFilter.startDate && dateFilter.endDate) {
      const startDate = new Date(dateFilter.startDate);
      const endDate = new Date(dateFilter.endDate);
      filtered = filtered.filter(data => {
        const dataDate = new Date(data.date);
        return dataDate >= startDate && dataDate <= endDate;
      });
    } else if (dateFilter.preset !== 'all') {
      const daysAgo = parseInt(dateFilter.preset);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
      filtered = filtered.filter(data => new Date(data.date) >= cutoffDate);
    }
    
    return filtered;
  }, [filteredSalesDataByUser, selectedAccount, dateFilter]);

  const handleDateFilterChange = (field: string, value: string) => {
    const newFilter = { ...dateFilter, [field]: value };
    
    // Reset custom dates when switching to preset
    if (field === 'preset' && value !== 'custom') {
      newFilter.startDate = '';
      newFilter.endDate = '';
    }
    
    onDateFilterChange(newFilter);
  };
  const reportMetrics = useMemo(() => {
    const totalCommission = filteredData.reduce((sum, data) => sum + data.gross_commission, 0);
    const totalRevenue = filteredData.reduce((sum, data) => sum + data.total_purchases, 0);
    const totalOrders = filteredData.reduce((sum, data) => sum + data.orders, 0);
    const totalClicks = filteredData.reduce((sum, data) => sum + data.clicks, 0);
    const totalProductsSold = filteredData.reduce((sum, data) => sum + data.products_sold, 0);
    const totalNewBuyers = filteredData.reduce((sum, data) => sum + data.new_buyers, 0);
    
    return {
      totalCommission,
      totalRevenue,
      totalOrders,
      totalClicks,
      totalProductsSold,
      totalNewBuyers,
      avgCommissionRate: totalRevenue > 0 ? (totalCommission / totalRevenue) * 100 : 0,
      conversionRate: totalClicks > 0 ? (totalOrders / totalClicks) * 100 : 0,
    };
  }, [filteredData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const exportToCSV = () => {
    const headers = [
      'Date',
      'Account',
      'Clicks',
      'Orders',
      'Gross Commission (IDR)',
      'Products Sold',
      'Total Purchases (IDR)',
      'New Buyers'
    ];

    const csvData = filteredData.map(data => {
      const account = accounts.find(acc => acc.id === data.account_id);
      return [
        data.date,
        account?.username || 'Unknown',
        data.clicks,
        data.orders,
        data.gross_commission,
        data.products_sold,
        data.total_purchases,
        data.new_buyers
      ];
    });

    const csvContent = [headers, ...csvData]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getCategoryName = (categoryId: string) => {
    if (!categoryId) return 'Belum Diatur';
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || 'Belum Diatur';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">
            {currentUser?.role === 'superadmin' 
              ? 'Detailed sales and commission reports for all accounts'
              : `Detailed sales and commission reports for your ${filteredAccountsByRole.length} accounts`}
          </p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Account:</label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="all">All Accounts</option>
              {filteredAccountsByRole.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.username} ({account.account_code}) - {getCategoryName(account.category_id)}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <label className="text-sm text-gray-600">Period:</label>
            <select 
              value={dateFilter.preset}
              onChange={(e) => handleDateFilterChange('preset', e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
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
                className="px-3 py-1 border border-gray-300 rounded text-sm"
              />
              <span className="text-gray-400 text-sm">to</span>
              <input
                type="date"
                value={dateFilter.endDate}
                onChange={(e) => handleDateFilterChange('endDate', e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(reportMetrics.totalCommission)}
          </div>
          <p className="text-sm text-gray-600">Total Commission</p>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(reportMetrics.totalRevenue)}
          </div>
          <p className="text-sm text-gray-600">Total Revenue</p>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="text-2xl font-bold text-purple-600">
            {reportMetrics.totalOrders.toLocaleString()}
          </div>
          <p className="text-sm text-gray-600">Total Orders</p>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="text-2xl font-bold text-orange-600">
            {reportMetrics.conversionRate.toFixed(2)}%
          </div>
          <p className="text-sm text-gray-600">Conversion Rate</p>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Daily Performance Data</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clicks</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commission</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conv. Rate</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 50)
                .map((data, index) => {
                  const account = filteredAccountsByRole.find(acc => acc.id === data.account_id);
                  const convRate = data.clicks > 0 ? (data.orders / data.clicks) * 100 : 0;
                  
                  return (
                    <tr key={`${data.account_id}-${data.date}-${index}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(data.date).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{account?.username}</div>
                        <div className="text-sm text-gray-500">{account?.account_code}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {data.clicks.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {data.orders.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        {formatCurrency(data.gross_commission)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(data.total_purchases)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {convRate.toFixed(2)}%
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
          
          {filteredData.length === 0 && (
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No data found</h3>
              <p className="text-gray-600">Try adjusting your filters or upload some sales data</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;