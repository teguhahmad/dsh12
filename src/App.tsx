import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import AccountManagement from './components/AccountManagement';
import DataUpload from './components/DataUpload';
import Reports from './components/Reports';
import IncentiveRules from './components/IncentiveRules';
import IncentiveGameMap from './components/IncentiveGameMap';
import IncentiveOverview from './components/IncentiveOverview';
import TeamManagement from './components/TeamManagement';
import Profile from './components/Profile';
import Login from './components/Login';
import { Account, Category, SalesData, User, IncentiveRule } from './types';
import { useSupabase } from './hooks/useSupabase';
import { supabase } from './lib/supabase';

interface DateFilter {
  startDate: string;
  endDate: string;
  preset: string;
}

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [incentiveRules, setIncentiveRules] = useState<IncentiveRule[]>([]);
  const [dateFilter, setDateFilter] = useState<DateFilter>({
    startDate: '',
    endDate: '',
    preset: '30'
  });

  const {
    loading,
    error,
    fetchCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    fetchAccounts,
    addAccount,
    updateAccount,
    deleteAccount,
    fetchSalesData,
    addSalesData,
    deleteSalesData,
    fetchIncentiveRules,
    addIncentiveRule,
    updateIncentiveRule,
    deleteIncentiveRule,
  } = useSupabase();

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [categoriesData, accountsData, salesDataResult, rulesData] = await Promise.all([
          fetchCategories(),
          fetchAccounts(),
          fetchSalesData(),
          fetchIncentiveRules(),
        ]);
        
        setCategories(categoriesData);
        setAccounts(accountsData);
        setSalesData(salesDataResult);
        setIncentiveRules(rulesData);
      } catch (err) {
        console.error('Error loading data:', err);
      }
    };

    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  const handleLogin = async (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = async () => {
    // Only sign out from Supabase if this is not a demo user
    if (currentUser && !currentUser.email.startsWith('demo_')) {
      try {
        await supabase.auth.signOut();
      } catch (error) {
        console.warn('Supabase logout failed:', error);
      }
    }
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  const handleTabChange = (tab: string) => {
    if (tab === 'logout') {
      handleLogout();
    } else {
      setActiveTab(tab);
    }
  };

  // Account management handlers
  const handleAddAccount = async (accountData: Omit<Account, 'id' | 'created_at' | 'account_code'>) => {
    const account = await addAccount({
      ...accountData,
      account_code: `ACC${Date.now().toString().slice(-6)}`, // Generate simple account code
    });
    if (account) {
      setAccounts(prev => [...prev, account]);
    }
  };

  const handleUpdateAccount = async (id: string, updates: Partial<Account>) => {
    const updatedAccount = await updateAccount(id, updates);
    if (updatedAccount) {
      setAccounts(prev => prev.map(acc => acc.id === id ? updatedAccount : acc));
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (confirm('Are you sure you want to delete this account? This will also delete all associated sales data.')) {
      const success = await deleteAccount(id);
      if (success) {
        setAccounts(prev => prev.filter(acc => acc.id !== id));
        setSalesData(prev => prev.filter(data => data.account_id !== id));
      }
    }
  };

  // Category management handlers
  const handleAddCategory = async (categoryData: Omit<Category, 'id' | 'created_at'>) => {
    const category = await addCategory(categoryData);
    if (category) {
      setCategories(prev => [...prev, category]);
    }
  };

  const handleUpdateCategory = async (id: string, updates: Partial<Category>) => {
    const updatedCategory = await updateCategory(id, updates);
    if (updatedCategory) {
      setCategories(prev => prev.map(cat => cat.id === id ? updatedCategory : cat));
    }
  };

  const handleDeleteCategory = async (id: string) => {
    // Fetch latest account data to ensure we have current state
    const latestAccounts = await fetchAccounts();
    const accountsUsingCategory = latestAccounts.filter(acc => acc.category_id === id);
    
    if (accountsUsingCategory.length > 0) {
      alert(`Cannot delete category. ${accountsUsingCategory.length} account(s) are still using this category. Please reassign or delete those accounts first.`);
      return;
    }
    
    if (confirm('Are you sure you want to delete this category?')) {
      const success = await deleteCategory(id);
      if (success) {
        setCategories(prev => prev.filter(cat => cat.id !== id));
      }
    }
  };

  // Sales data handlers
  const handleUploadData = async (accountId: string, data: Omit<SalesData, 'id' | 'account_id' | 'created_at'>[]) => {
    const salesDataWithAccountId = data.map(item => ({
      ...item,
      account_id: accountId,
    }));
    
    const uploadedData = await addSalesData(salesDataWithAccountId);
    if (uploadedData.length > 0) {
      setSalesData(prev => {
        // Remove existing data for the same account and dates, then add new data
        const filtered = prev.filter(existing => 
          !(existing.account_id === accountId && 
            data.some(newItem => newItem.date === existing.date))
        );
        return [...filtered, ...uploadedData];
      });
    }
  };

  const handleDeleteSalesData = async (accountId: string, dateRange?: { start: string; end: string }) => {
    const success = await deleteSalesData(accountId, dateRange);
    if (success) {
      setSalesData(prev => {
        if (dateRange) {
          return prev.filter(data => 
            !(data.account_id === accountId && 
              data.date >= dateRange.start && 
              data.date <= dateRange.end)
          );
        } else {
          return prev.filter(data => data.account_id !== accountId);
        }
      });
    }
  };

  // Incentive rules handlers
  const handleUpdateIncentiveRules = (rules: IncentiveRule[]) => {
    setIncentiveRules(rules);
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            accounts={accounts}
            salesData={salesData}
            dateFilter={dateFilter}
            onDateFilterChange={setDateFilter}
            currentUser={currentUser}
          />
        );
      case 'accounts':
        return (
          <AccountManagement
            accounts={accounts}
            categories={categories}
            currentUser={currentUser}
            onAddAccount={handleAddAccount}
            onUpdateAccount={handleUpdateAccount}
            onDeleteAccount={handleDeleteAccount}
            onAddCategory={handleAddCategory}
            onUpdateCategory={handleUpdateCategory}
            onDeleteCategory={handleDeleteCategory}
          />
        );
      case 'upload':
        return (
          <DataUpload
            accounts={accounts}
            salesData={salesData}
            categories={categories}
            currentUser={currentUser}
            onUploadData={handleUploadData}
            onDeleteSalesData={handleDeleteSalesData}
          />
        );
      case 'reports':
        return (
          <Reports
            accounts={accounts}
            salesData={salesData}
            categories={categories}
            dateFilter={dateFilter}
            onDateFilterChange={setDateFilter}
            currentUser={currentUser}
          />
        );
      case 'incentives':
        return (
          <IncentiveRules
            incentiveRules={incentiveRules}
            onUpdateRules={handleUpdateIncentiveRules}
          />
        );
      case 'incentive-game':
        return (
          <IncentiveGameMap
            accounts={accounts}
            salesData={salesData}
            incentiveRules={incentiveRules}
            currentUser={currentUser}
          />
        );
      case 'incentive-overview':
        return (
          <IncentiveOverview
            accounts={accounts}
            salesData={salesData}
            incentiveRules={incentiveRules}
            currentUser={currentUser}
          />
        );
      case 'team':
        return (
          <TeamManagement
            accounts={accounts}
            categories={categories}
            currentUser={currentUser}
          />
        );
      case 'profile':
        return <Profile currentUser={currentUser} />;
      default:
        return (
          <Dashboard
            accounts={accounts}
            salesData={salesData}
            dateFilter={dateFilter}
            onDateFilterChange={setDateFilter}
            currentUser={currentUser}
          />
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        currentUser={currentUser}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">Error: {error}</p>
            </div>
          )}
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default App;