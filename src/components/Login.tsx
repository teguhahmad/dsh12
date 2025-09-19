import React, { useState } from 'react';
import { Eye, EyeOff, LogIn, Shield, User, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LoginProps {
  onLogin: (user: { id: string; name: string; email: string; role: 'user' | 'superadmin'; managed_accounts: string[]; access_token?: string; refresh_token?: string }) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Try to sign in with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (authError) {
        // If Supabase auth fails, fall back to demo users for development
        const demoUsers = [
          {
            email: 'admin@kimostudio.com',
            password: 'admin123',
            userData: { id: '1', name: 'Super Admin', role: 'superadmin' as const, managed_accounts: [] }
          },
          {
            email: 'john@kimostudio.com', 
            password: 'user123',
            userData: { id: '2', name: 'John Doe', role: 'user' as const, managed_accounts: ['1'] }
          },
          {
            email: 'jane@kimostudio.com',
            password: 'user123', 
            userData: { id: '3', name: 'Jane Smith', role: 'user' as const, managed_accounts: [] }
          }
        ];

        const demoUser = demoUsers.find(u => u.email === formData.email && u.password === formData.password);
        
        if (demoUser) {
          // Create a demo session for development
          await supabase.auth.setSession({
            access_token: `demo_token_${demoUser.userData.id}`,
            refresh_token: `demo_refresh_${demoUser.userData.id}`,
          });
          
          onLogin({
            ...demoUser.userData,
            email: formData.email,
            access_token: `demo_token_${demoUser.userData.id}`,
            refresh_token: `demo_refresh_${demoUser.userData.id}`,
          });
        } else {
          setError('Email atau password tidak valid');
        }
      } else if (authData.user) {
        // Real Supabase authentication successful
        try {
          // Try to fetch user data from the users table
          let userData = null;
          try {
            const { data, error: userError } = await supabase
              .from('users')
              .select('*')
              .eq('email', authData.user.email)
              .limit(1);
            
            if (userError) {
              throw userError;
            }
            userData = data && data.length > 0 ? data[0] : null;
          } catch (queryError: any) {
            // If it's just a "no rows found" error, that's expected for new users
            if (queryError.code !== 'PGRST116') {
              throw queryError;
            }
          }

          // If user doesn't exist in users table, create a default user entry
          if (!userData) {
            const newUser = {
              id: authData.user.id,
              name: authData.user.email?.split('@')[0] || 'User',
              email: authData.user.email || '',
              role: 'user' as const,
              managed_accounts: [],
            };

            const { data: insertedUser, error: insertError } = await supabase
              .from('users')
              .insert([newUser])
              .select()
              .maybeSingle();

            if (insertError) {
              console.error('Could not create user record:', insertError);
              // Fall back to basic user info from auth
              onLogin({
                ...newUser,
                access_token: authData.session?.access_token,
                refresh_token: authData.session?.refresh_token,
              });
            } else {
              onLogin({
                ...(insertedUser || newUser),
                access_token: authData.session?.access_token,
                refresh_token: authData.session?.refresh_token,
              });
            }
          } else {
            onLogin({
              ...userData,
              access_token: authData.session?.access_token,
              refresh_token: authData.session?.refresh_token,
            });
          }
        } catch (userFetchError) {
          console.error('Error in user data handling:', userFetchError);
          // Fall back to basic user info from auth
          onLogin({
            id: authData.user.id,
            name: authData.user.email?.split('@')[0] || 'User',
            email: authData.user.email || '',
            role: 'user' as const,
            managed_accounts: [],
            access_token: authData.session?.access_token,
            refresh_token: authData.session?.refresh_token,
          });
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Terjadi kesalahan saat login. Silakan coba lagi.');
    }

    setIsLoading(false);
  };

  const handleDemoLogin = (userType: 'admin' | 'user') => {    
    setFormData({
      email: userType === 'admin' ? 'admin@kimostudio.com' : 'john@kimostudio.com',
      password: userType === 'admin' ? 'admin123' : 'user123',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Kimo Studio</h1>
          <p className="text-gray-600">Sales Report Dashboard</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Masuk ke Akun</h2>
            <p className="text-gray-600">Silakan masuk untuk mengakses dashboard</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-900">Login Gagal</h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                placeholder="Masukkan email Anda"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                  placeholder="Masukkan password Anda"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Masuk</span>
                </>
              )}
            </button>
          </form>

        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            © 2025 Kimo Studio. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;