import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  User, 
  Search, 
  Filter, 
  X, 
  Save,
  Shield,
  Users,
  Mail,
  Calendar,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { User as UserType, Account, Category } from '../types';
import { useSupabase } from '../hooks/useSupabase';
import { supabase } from '../lib/supabase';

interface TeamManagementProps {
  accounts: Account[];
  categories: Category[];
  currentUser: UserType;
}

const TeamManagement: React.FC<TeamManagementProps> = ({ accounts, categories, currentUser }) => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showPassword, setShowPassword] = useState(false);
  const [accountSearchTerm, setAccountSearchTerm] = useState('');
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [signupResult, setSignupResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user' as 'user' | 'superadmin',
    managed_accounts: [] as string[],
  });

  const {
    fetchUsers,
    addUser,
    updateUser,
    deleteUser,
  } = useSupabase();

  // Load users from Supabase
  useEffect(() => {
    const loadUsers = async () => {
      if (currentUser.role !== 'superadmin') {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setLoadError(null);
      
      try {
        const usersData = await fetchUsers();
        setUsers(usersData);
      } catch (err) {
        console.error('Error loading users:', err);
        setLoadError(err instanceof Error ? err.message : 'Failed to load users');
      } finally {
        setIsLoading(false);
      }
    };

    loadUsers();
  }, []);

  // Check if current user is superadmin
  if (currentUser.role !== 'superadmin') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
            <p className="text-gray-600">Manage user accounts and permissions</p>
          </div>
        </div>

        {/* Loading skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-6 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-4 w-1/4"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                  <div className="flex space-x-2">
                    <div className="w-8 h-8 bg-gray-200 rounded"></div>
                    <div className="w-8 h-8 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (loadError) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
            <p className="text-gray-600">Manage user accounts and permissions</p>
          </div>
        </div>

        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Users</h3>
            <p className="text-gray-600 mb-4">{loadError}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  // Filter accounts for selection in modal
  const filteredAccountsForSelection = accounts.filter(account =>
    account.username.toLowerCase().includes(accountSearchTerm.toLowerCase()) ||
    account.email.toLowerCase().includes(accountSearchTerm.toLowerCase()) ||
    account.account_code.toLowerCase().includes(accountSearchTerm.toLowerCase()) ||
    getCategoryName(account.category_id).toLowerCase().includes(accountSearchTerm.toLowerCase())
  );

  const getCategoryName = (categoryId: string) => {
    if (!categoryId) return 'Belum Diatur';
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || 'Belum Diatur';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingUser(true);
    setSignupResult(null);
    
    try {
      if (editingUser) {
        // For updates, ensure we have proper permissions and send all necessary fields
        const updateData: Partial<UserType> = {
          name: formData.name,
          role: formData.role,
          managed_accounts: formData.managed_accounts,
        };
        
        // Only include email if it's different (though it shouldn't change)
        if (formData.email !== editingUser.email) {
          updateData.email = formData.email;
        }
        
        const updatedUser = await updateUser(editingUser.id, updateData);
        if (updatedUser) {
          setUsers(prev => prev.map(user => user.id === editingUser.id ? updatedUser : user));
          setSignupResult({ success: true, message: 'User updated successfully!' });
          setTimeout(() => {
            closeModal();
          }, 2000);
        } else {
          throw new Error('Failed to update user - no data returned');
        }
      } else {
        // Create user with Supabase Auth (same as sign up)
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: undefined, // Disable email confirmation
            data: {
              name: formData.name,
              role: formData.role,
            }
          }
        });

        if (authError) {
          throw authError;
        }

        if (authData.user) {
          // Create user record in users table
          const newUserData = {
            id: authData.user.id,
            name: formData.name,
            email: formData.email,
            role: formData.role,
            managed_accounts: formData.managed_accounts,
          };
          
          const newUser = await addUser(newUserData);
          if (newUser) {
            setUsers(prev => [...prev, newUser]);
            setSignupResult({ 
              success: true, 
              message: `User account created successfully! Login credentials have been set up for ${formData.email}` 
            });
            
            // Auto-close modal after success
            setTimeout(() => {
              closeModal();
            }, 3000);
          } else {
            // If user creation in database fails, we should clean up the auth user
            try {
              await supabase.auth.admin.deleteUser(authData.user.id);
            } catch (cleanupError) {
              console.warn('Could not clean up auth user:', cleanupError);
            }
            throw new Error('Failed to create user record in database');
          }
        } else {
          throw new Error('Failed to create authentication account');
        }
      }
    } catch (err: any) {
      console.error('Error saving user:', err);
      let errorMessage = 'An error occurred while saving the user.';
      
      if (err.message?.includes('User already registered') || err.message?.includes('already been registered')) {
        errorMessage = 'A user with this email address already exists.';
      } else if (err.message?.includes('Password')) {
        errorMessage = 'Password must be at least 6 characters long.';
      } else if (err.message?.includes('Invalid email')) {
        errorMessage = 'Please enter a valid email address.';
      } else if (err.message?.includes('permission') || err.message?.includes('RLS')) {
        errorMessage = 'Permission denied. Please check your access rights.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setSignupResult({ success: false, message: errorMessage });
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleEdit = (user: UserType) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // Don't show existing password
      role: user.role,
      managed_accounts: user.managed_accounts,
    });
    setSignupResult(null);
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'user',
      managed_accounts: [],
    });
    setSignupResult(null);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (id === currentUser.id) {
      alert('You cannot delete your own account.');
      return;
    }
    
    if (confirm('Are you sure you want to delete this user? This will also delete their authentication account and cannot be undone.')) {
      try {
        // First delete from our users table
        const success = await deleteUser(id);
        if (success) {
          // Then delete from Supabase Auth (if it exists)
          try {
            await supabase.auth.admin.deleteUser(id);
          } catch (authError) {
            console.warn('Could not delete auth user (may not exist):', authError);
          }
          
          setUsers(prev => prev.filter(user => user.id !== id));
        }
      } catch (err) {
        console.error('Error deleting user:', err);
        alert('Failed to delete user. Please try again.');
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setAccountSearchTerm('');
    setSignupResult(null);
    setIsCreatingUser(false);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'user',
      managed_accounts: [],
    });
    setShowPassword(false);
  };

  const handleAccountToggle = (accountId: string) => {
    setFormData(prev => ({
      ...prev,
      managed_accounts: prev.managed_accounts.includes(accountId)
        ? prev.managed_accounts.filter(id => id !== accountId)
        : [...prev.managed_accounts, accountId]
    }));
  };

  const getAccountName = (accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId);
    return account ? `${account.username} (${account.account_code})` : 'Unknown Account';
  };

  const getUserStats = (user: UserType) => {
    return {
      managedAccounts: user.managed_accounts.length,
      joinDate: new Date(user.created_at).toLocaleDateString('id-ID', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
    };
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
            <p className="text-gray-600">Manage user accounts and permissions</p>
          </div>
          <button
            onClick={handleAdd}
            className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add User</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{users.length}</div>
                <p className="text-sm text-gray-600">Total Users</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-blue-100 rounded-lg flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.role === 'user').length}
                </div>
                <p className="text-sm text-gray-600">Regular Users</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-red-100 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.role === 'superadmin').length}
                </div>
                <p className="text-sm text-gray-600">Super Admins</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Roles</option>
                <option value="user">Users</option>
                <option value="superadmin">Super Admins</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">
              Users ({filteredUsers.length})
            </h3>
          </div>
          
          {filteredUsers.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {filteredUsers.map((user) => {
                const stats = getUserStats(user);
                const isCurrentUser = user.id === currentUser.id;
                
                return (
                  <div key={user.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                          {user.role === 'superadmin' ? (
                            <Shield className="w-6 h-6 text-purple-600" />
                          ) : (
                            <User className="w-6 h-6 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h3 className="font-semibold text-gray-900">{user.name}</h3>
                            {isCurrentUser && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                You
                              </span>
                            )}
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.role === 'superadmin' 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {user.role === 'superadmin' ? 'Super Admin' : 'User'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                            <span className="flex items-center space-x-1">
                              <Mail className="w-3 h-3" />
                              <span>{user.email}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>Joined {stats.joinDate}</span>
                            </span>
                            {user.role === 'user' && (
                              <span className="flex items-center space-x-1">
                                <Users className="w-3 h-3" />
                                <span>{stats.managedAccounts} accounts</span>
                              </span>
                            )}
                          </div>
                          {user.role === 'user' && user.managed_accounts.length > 0 && (
                            <div className="mt-2">
                              {user.managed_accounts.length <= 5 ? (
                                <div className="flex flex-wrap gap-1">
                                  {user.managed_accounts.map(accountId => (
                                    <span key={accountId} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
                                      {getAccountName(accountId)}
                                    </span>
                                  ))}
                                </div>
                              ) : user.managed_accounts.length <= 20 ? (
                                <div className="space-y-1">
                                  <div className="flex flex-wrap gap-1">
                                    {user.managed_accounts.slice(0, 3).map(accountId => (
                                      <span key={accountId} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
                                        {getAccountName(accountId)}
                                      </span>
                                    ))}
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700 font-medium">
                                      +{user.managed_accounts.length - 3} more accounts
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Click "Edit" to view all managed accounts
                                  </div>
                                </div>
                              ) : (
                                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 border border-blue-200">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                        <Users className="w-3 h-3 text-white" />
                                      </div>
                                      <div>
                                        <div className="text-sm font-semibold text-blue-900">
                                          {user.managed_accounts.length} Affiliate Accounts
                                        </div>
                                        <div className="text-xs text-blue-700">
                                          Large portfolio - Click "Edit" to manage
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-xs text-blue-600 font-medium">
                                        High Volume User
                                      </div>
                                      <div className="text-xs text-blue-500">
                                        {user.managed_accounts.length > 100 ? '100+' : user.managed_accounts.length} accounts
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleEdit(user)}
                          className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                          <span>Edit</span>
                        </button>
                        
                        {!isCurrentUser && (
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="flex items-center space-x-2 text-red-600 hover:text-red-700 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {users.length === 0 ? 'No users yet' : 'No users match your filters'}
              </h3>
              <p className="text-gray-600 mb-4">
                {users.length === 0 
                  ? 'Get started by adding your first team member'
                  : 'Try adjusting your search or filter criteria'
                }
              </p>
              {users.length === 0 && (
                <button
                  onClick={handleAdd}
                  className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Add Your First User
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
                  {editingUser ? 'Edit User' : 'Create New User Account'}
                </h2>
                <button
                  onClick={closeModal}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Sign up result */}
              {signupResult && (
                <div className={`border rounded-lg p-4 mb-6 flex items-start space-x-3 ${
                  signupResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}>
                  {signupResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                  )}
                  <div>
                    <h3 className={`font-medium ${
                      signupResult.success ? 'text-green-900' : 'text-red-900'
                    }`}>
                      {signupResult.success ? 'Account Created Successfully!' : 'Account Creation Failed'}
                    </h3>
                    <p className={`text-sm ${
                      signupResult.success ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {signupResult.message}
                    </p>
                    {signupResult.success && !editingUser && (
                      <div className="mt-2 p-2 bg-green-100 rounded text-xs text-green-800">
                        <strong>Login Details:</strong><br />
                        Email: {formData.email}<br />
                        Password: {formData.password}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter full name"
                      required
                      disabled={isCreatingUser}
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
                      disabled={isCreatingUser || !!editingUser}
                    />
                    {editingUser && (
                      <p className="text-xs text-gray-500 mt-1">Email cannot be changed after account creation</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {editingUser ? 'New Password (leave blank to keep current)' : 'Password *'}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder={editingUser ? "Enter new password" : "Enter password"}
                        required={!editingUser}
                        minLength={6}
                        disabled={isCreatingUser}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        disabled={isCreatingUser}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {!editingUser && (
                      <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters long</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role *
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as 'user' | 'superadmin' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                      disabled={isCreatingUser}
                    >
                      <option value="user">User</option>
                      <option value="superadmin">Super Admin</option>
                    </select>
                  </div>
                </div>

                {/* Account Management (only for regular users) */}
                {formData.role === 'user' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Managed Accounts
                    </label>
                   
                   {/* Account Search */}
                   <div className="mb-3">
                     <div className="relative">
                       <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                       <input
                         type="text"
                         placeholder="Search accounts..."
                         value={accountSearchTerm}
                         onChange={(e) => setAccountSearchTerm(e.target.value)}
                         className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                         disabled={isCreatingUser}
                       />
                     </div>
                   </div>
                   
                    <div className="border border-gray-300 rounded-lg p-4 max-h-48 overflow-y-auto">
                     {filteredAccountsForSelection.length > 0 ? (
                        <div className="space-y-2">
                         {filteredAccountsForSelection.map((account) => (
                           <label key={account.id} className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded border border-gray-100">
                              <input
                                type="checkbox"
                                checked={formData.managed_accounts.includes(account.id)}
                                onChange={() => handleAccountToggle(account.id)}
                                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                disabled={isCreatingUser}
                              />
                             <div className="flex-1 ml-3">
                               <div className="flex items-center justify-between">
                                 <div className="flex-1">
                                   <div className="flex items-center space-x-2 mb-1">
                                     <span className="text-sm font-medium text-gray-900">{account.username}</span>
                                     <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                       {account.account_code}
                                     </span>
                                   </div>
                                   <div className="text-xs text-gray-500 space-y-0.5">
                                     <div>{account.email}</div>
                                     <div>{account.phone}</div>
                                   </div>
                                 </div>
                                 <div className="flex flex-col items-end space-y-1">
                                   <div className="text-xs text-gray-600 font-medium">
                                     {(() => {
                                       const category = categories.find(cat => cat.id === account.category_id);
                                       return category?.name || 'No Category';
                                     })()}
                                   </div>
                                   <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                     account.status === 'active' ? 'bg-green-100 text-green-800' :
                                     account.status === 'violation' ? 'bg-red-100 text-red-800' :
                                     'bg-gray-100 text-gray-800'
                                   }`}>
                                     {account.status === 'active' ? 'Aktif' : 
                                      account.status === 'violation' ? 'Pelanggaran' : 'Non-Aktif'}
                                   </span>
                                 </div>
                               </div>
                             </div>
                            </label>
                          ))}
                        </div>
                     ) : accounts.length > 0 ? (
                       <p className="text-sm text-gray-500 text-center py-4">
                         No accounts match your search.
                       </p>
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-4">
                          No accounts available. Please create accounts first.
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Select which accounts this user can manage. Super admins have access to all accounts.
                    </p>
                  </div>
                )}
                
                <div className="flex space-x-3 pt-6 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={isCreatingUser}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingUser}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isCreatingUser ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>{editingUser ? 'Updating...' : 'Creating Account...'}</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>{editingUser ? 'Update' : 'Create'} User</span>
                      </>
                    )}
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

export default TeamManagement;
