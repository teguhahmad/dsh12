import React, { useState } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  User, 
  Search, 
  Filter, 
  X, 
  Save,
  Mail,
  Phone,
  Building,
  Calendar,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Check,
  XIcon
} from 'lucide-react';
import { Account, Category, User as UserType } from '../types';
import CategoryManagement from './CategoryManagement';

interface AccountManagementProps {
  accounts: Account[];
  categories: Category[];
  currentUser: UserType;
  onAddAccount: (account: Omit<Account, 'id' | 'created_at' | 'account_code'>) => void;
  onUpdateAccount: (id: string, updates: Partial<Account>) => void;
  onDeleteAccount: (id: string) => void;
  onAddCategory: (category: Omit<Category, 'id' | 'created_at'>) => void;
  onUpdateCategory: (id: string, updates: Partial<Category>) => void;
  onDeleteCategory: (id: string) => void;
}

const AccountManagement: React.FC<AccountManagementProps> = ({
  accounts,
  categories,
  currentUser,
  onAddAccount,
  onUpdateAccount,
  onDeleteAccount,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}) => {
  // Filter accounts based on user role
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

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [showCategoryManagement, setShowCategoryManagement] = useState(false);
  const [editingField, setEditingField] = useState<{accountId: string, field: string} | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    status: 'active' as Account['status'],
    payment_data: 'belum diatur' as Account['payment_data'],
    category_id: '',
    user_id: currentUser?.id || null,
  });

  const getCategoryName = (categoryId: string) => {
    if (!categoryId) return 'Belum Diatur';
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || 'Belum Diatur';
  };

  // Filter accounts based on search and filters
  const filteredAccounts = filteredAccountsByRole.filter(account => {
    const matchesSearch = account.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.account_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.phone.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || account.status === statusFilter;
    const matchesPayment = paymentFilter === 'all' || account.payment_data === paymentFilter;
    const matchesCategory = categoryFilter === 'all' || account.category_id === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesPayment && matchesCategory;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingAccount) {
      onUpdateAccount(editingAccount.id, formData);
    } else {
      onAddAccount(formData);
    }
    
    closeModal();
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setFormData({
      username: account.username,
      email: account.email,
      phone: account.phone,
      status: account.status,
      payment_data: account.payment_data,
      category_id: account.category_id,
      user_id: account.user_id,
    });
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingAccount(null);
    setFormData({
      username: '',
      email: '',
      phone: '',
      status: 'active',
      payment_data: 'belum diatur',
      category_id: '',
      user_id: currentUser?.id || null,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAccount(null);
    setFormData({
      username: '',
      email: '',
      phone: '',
      status: 'active',
      payment_data: 'belum diatur',
      category_id: '',
      user_id: currentUser?.id || null,
    });
  };

  const handleInlineEdit = (accountId: string, field: string, value: string) => {
    onUpdateAccount(accountId, { [field]: value });
    setEditingField(null);
  };

  const getStatusColor = (status: Account['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'violation': return 'bg-red-100 text-red-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentColor = (payment: Account['payment_data']) => {
    switch (payment) {
      case 'belum diatur': return 'bg-gray-100 text-gray-800';
      case 'utamakan': return 'bg-yellow-100 text-yellow-800';
      case 'dimasukkan': return 'bg-blue-100 text-blue-800';
      case 'disetujui': return 'bg-green-100 text-green-800';
      case 'sah': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: Account['status']) => {
    switch (status) {
      case 'active': return 'Aktif';
      case 'violation': return 'Pelanggaran';
      case 'inactive': return 'Non-Aktif';
      default: return status;
    }
  };

  const getPaymentLabel = (payment: Account['payment_data']) => {
    switch (payment) {
      case 'belum diatur': return 'Belum Diatur';
      case 'utamakan': return 'Utamakan';
      case 'dimasukkan': return 'Dimasukkan';
      case 'disetujui': return 'Disetujui';
      case 'sah': return 'Sah';
      default: return payment;
    }
  };

  if (showCategoryManagement) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Category Management</h1>
            <p className="text-gray-600">Manage product categories for accounts</p>
          </div>
          <button
            onClick={() => setShowCategoryManagement(false)}
            className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <X className="w-4 h-4" />
            <span>Back to Accounts</span>
          </button>
        </div>
        
        <CategoryManagement
          categories={categories}
          onAddCategory={onAddCategory}
          onUpdateCategory={onUpdateCategory}
          onDeleteCategory={onDeleteCategory}
        />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Account Management</h1>
            <p className="text-gray-600">
              {currentUser?.role === 'superadmin' 
                ? 'Manage all affiliate accounts and their information'
                : `Manage your ${filteredAccountsByRole.length} affiliate accounts`}
            </p>
          </div>
          <div className="flex space-x-3">
            {currentUser?.role === 'superadmin' && (
              <button
                onClick={() => setShowCategoryManagement(true)}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Building className="w-4 h-4" />
                <span>Manage Categories</span>
              </button>
            )}
            <button
              onClick={handleAdd}
              className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Account</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                <User className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{filteredAccountsByRole.length}</div>
                <p className="text-sm text-gray-600">Total Accounts</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {filteredAccountsByRole.filter(acc => acc.status === 'active').length}
                </div>
                <p className="text-sm text-gray-600">Active</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-pink-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {filteredAccountsByRole.filter(acc => acc.status === 'violation').length}
                </div>
                <p className="text-sm text-gray-600">Violations</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {filteredAccountsByRole.filter(acc => acc.payment_data === 'utamakan').length}
                </div>
                <p className="text-sm text-gray-600">Priority</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="space-y-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search accounts by name, email, code, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            
            {/* Filter Options */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="violation">Violation</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">Payment:</span>
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">All Payment Status</option>
                  <option value="belum diatur">Belum Diatur</option>
                  <option value="utamakan">Utamakan</option>
                  <option value="dimasukkan">Dimasukkan</option>
                  <option value="disetujui">Disetujui</option>
                  <option value="sah">Sah</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">Category:</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  <option value="">Belum Diatur</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Accounts Table */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">
              Accounts ({filteredAccounts.length})
            </h3>
          </div>
          
          {filteredAccounts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAccounts.map((account) => (
                    <tr key={account.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center mr-3">
                            <User className="w-4 h-4 text-purple-600" />
                          </div>
                          <div className="text-sm font-medium text-gray-900">{account.username}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {account.account_code}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{account.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{account.phone}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingField?.accountId === account.id && editingField?.field === 'status' ? (
                          <div className="flex items-center space-x-2">
                            <select
                              defaultValue={account.status}
                              onChange={(e) => handleInlineEdit(account.id, 'status', e.target.value)}
                              className="text-xs px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              autoFocus
                            >
                              <option value="active">Aktif</option>
                              <option value="violation">Pelanggaran</option>
                              <option value="inactive">Non-Aktif</option>
                            </select>
                            <button
                              onClick={() => setEditingField(null)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditingField({accountId: account.id, field: 'status'})}
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium hover:opacity-80 transition-opacity ${getStatusColor(account.status)}`}
                          >
                            {getStatusLabel(account.status)}
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingField?.accountId === account.id && editingField?.field === 'payment_data' ? (
                          <div className="flex items-center space-x-2">
                            <select
                              defaultValue={account.payment_data}
                              onChange={(e) => handleInlineEdit(account.id, 'payment_data', e.target.value)}
                              className="text-xs px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              autoFocus
                            >
                              <option value="belum diatur">Belum Diatur</option>
                              <option value="utamakan">Utamakan</option>
                              <option value="dimasukkan">Dimasukkan</option>
                              <option value="disetujui">Disetujui</option>
                              <option value="sah">Sah</option>
                            </select>
                            <button
                              onClick={() => setEditingField(null)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditingField({accountId: account.id, field: 'payment_data'})}
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium hover:opacity-80 transition-opacity ${getPaymentColor(account.payment_data)}`}
                          >
                            {getPaymentLabel(account.payment_data)}
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingField?.accountId === account.id && editingField?.field === 'category_id' ? (
                          <div className="flex items-center space-x-2">
                            <select
                              defaultValue={account.category_id}
                              onChange={(e) => handleInlineEdit(account.id, 'category_id', e.target.value)}
                              className="text-xs px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              autoFocus
                            >
                              <option value="">Belum Diatur</option>
                              {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                  {category.name}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => setEditingField(null)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditingField({accountId: account.id, field: 'category_id'})}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:opacity-80 transition-opacity"
                          >
                            {getCategoryName(account.category_id)}
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(account.created_at).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => handleEdit(account)}
                            className="text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          
                          {currentUser?.role === 'superadmin' && (
                            <button
                              onClick={() => onDeleteAccount(account.id)}
                              className="text-red-600 hover:text-red-700 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filteredAccountsByRole.length === 0 ? 'No accounts assigned to you' : 'No accounts match your filters'}
              </h3>
              <p className="text-gray-600 mb-4">
                {filteredAccountsByRole.length === 0 
                  ? currentUser?.role === 'superadmin'
                    ? 'Get started by adding your first account'
                    : 'No accounts have been assigned to you yet. Contact your administrator.'
                  : 'Try adjusting your search or filter criteria'
                }
              </p>
              {filteredAccountsByRole.length === 0 && currentUser?.role === 'superadmin' && (
                <button
                  onClick={handleAdd}
                  className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Add Your First Account
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingAccount ? 'Edit Account' : 'Add New Account'}
                </h2>
                <button
                  onClick={closeModal}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Username *
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter username"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter email address"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter phone number"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Belum Diatur</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Status *
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as Account['status'] })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    >
                      <option value="active">Active</option>
                      <option value="violation">Violation</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Status *
                    </label>
                    <select
                      value={formData.payment_data}
                      onChange={(e) => setFormData({ ...formData, payment_data: e.target.value as Account['payment_data'] })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    >
                      <option value="belum diatur">Belum Diatur</option>
                      <option value="utamakan">Utamakan</option>
                      <option value="dimasukkan">Dimasukkan</option>
                      <option value="disetujui">Disetujui</option>
                      <option value="sah">Sah</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex space-x-3 pt-6 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{editingAccount ? 'Update' : 'Create'} Account</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AccountManagement;