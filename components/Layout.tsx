
import React from 'react';
import { Icons } from '../constants';
import { useApp } from '../AppContext';
import { UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  const { currentUser, setCurrentUser, notification } = useApp();

  const toggleRole = () => {
    setCurrentUser({
      ...currentUser,
      role: currentUser.role === UserRole.ADMIN ? UserRole.OPERATOR : UserRole.ADMIN
    });
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Icons.Dashboard },
    { id: 'publishers', label: 'Publishers', icon: Icons.Users },
    { id: 'inbox', label: 'Inbox', icon: Icons.Inbox },
    { id: 'deliverability', label: 'Deliverability', icon: Icons.Sparkles, adminOnly: true },
    { id: 'admin', label: 'Admin Settings', icon: Icons.Settings, adminOnly: true },
  ];

  return (
    <div className="flex h-screen bg-[#0a0a0b] text-zinc-300 overflow-hidden relative">
      {/* Global Toast Notification */}
      {notification && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4 duration-300`}>
          <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl border shadow-2xl backdrop-blur-xl ${
            notification.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
            notification.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
            'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
          }`}>
            {notification.type === 'success' && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
            {notification.type === 'error' && <div className="w-2 h-2 rounded-full bg-rose-500" />}
            {notification.type === 'info' && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
            <span className="text-sm font-bold">{notification.message}</span>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-800 flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white">X</div>
          <span className="text-xl font-bold text-white tracking-tight">XARK</span>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {navItems.map((item) => {
            if (item.adminOnly && currentUser.role !== UserRole.ADMIN) return null;
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  active 
                    ? 'bg-zinc-800/50 text-white shadow-sm ring-1 ring-zinc-700/50' 
                    : 'hover:bg-zinc-800/30 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <div className="flex items-center gap-3 px-2 mb-4">
            <img src={currentUser.avatar} alt={currentUser.name} className="w-10 h-10 rounded-full border border-zinc-700" />
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">{currentUser.name}</p>
              <p className="text-xs text-zinc-500 font-medium">{currentUser.role}</p>
            </div>
          </div>
          <button 
            onClick={toggleRole}
            className="w-full text-xs font-semibold py-2 px-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-400 transition-colors uppercase tracking-wider"
          >
            Switch to {currentUser.role === UserRole.ADMIN ? 'Operator' : 'Admin'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Header */}
        <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-8 bg-[#0a0a0b]/80 backdrop-blur-md sticky top-0 z-10">
          <h2 className="text-lg font-semibold text-white capitalize">{activeTab.replace('-', ' ')}</h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Icons.Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-zinc-900 border border-zinc-800 rounded-full pl-10 pr-4 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 w-64"
              />
            </div>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
