import React from 'react';
import { 
  BarChart3, 
  Users, 
  Upload, 
  User as UserProfile, 
  LogOut,
  Home,
  FileText,
  Trophy,
  UserPlus,
  Shield
} from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  currentUser: User;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, currentUser }) => {
  // Filter menu items based on user role
  const allMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'accounts', label: 'Accounts', icon: Users },
    { id: 'upload', label: 'Upload Data', icon: Upload },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'incentives', label: 'Incentive Rules', icon: BarChart3, adminOnly: true },
    { id: 'incentive-game', label: 'Incentive Quest', icon: Trophy, userOnly: true },
    { id: 'incentive-overview', label: 'Incentive Overview', icon: Trophy, adminOnly: true },
    { id: 'team', label: 'Team', icon: UserPlus, adminOnly: true },
  ];
  
  const menuItems = allMenuItems.filter(item => 
    (!item.adminOnly || currentUser.role === 'superadmin') &&
    (!item.userOnly || currentUser.role === 'user')
  );

  const bottomItems = [
    { id: 'profile', label: 'Profile', icon: UserProfile },
    { id: 'logout', label: 'Log out', icon: LogOut },
  ];

  return (
    <div className="w-64 bg-white shadow-sm border-r border-gray-100 h-screen flex flex-col">
      <div className="p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
            {currentUser.role === 'superadmin' ? (
              <Shield className="w-6 h-6 text-white" />
            ) : (
              <BarChart3 className="w-6 h-6 text-white" />
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Kimo Studio</h1>
            <p className="text-xs text-gray-500">
              {currentUser.role === 'superadmin' ? 'Super Admin' : 'User'}
            </p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="px-4 pb-4">
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center">
              {currentUser.role === 'superadmin' ? (
                <Shield className="w-4 h-4 text-purple-600" />
              ) : (
                <UserProfile className="w-4 h-4 text-blue-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {currentUser.name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {currentUser.email}
              </p>
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === item.id
                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="space-y-1">
          {bottomItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === item.id
                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;