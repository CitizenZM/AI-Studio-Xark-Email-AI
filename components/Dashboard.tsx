
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useApp } from '../AppContext';

const data = [
  { name: 'Mon', outreach: 40, replies: 24 },
  { name: 'Tue', outreach: 30, replies: 13 },
  { name: 'Wed', outreach: 20, replies: 98 },
  { name: 'Thu', outreach: 27, replies: 39 },
  { name: 'Fri', outreach: 18, replies: 48 },
  { name: 'Sat', outreach: 23, replies: 38 },
  { name: 'Sun', outreach: 34, replies: 43 },
];

const Dashboard: React.FC = () => {
  const { publishers, threads } = useApp();

  const stats = [
    { label: 'Total Publishers', value: publishers.length, change: '+12%', color: 'text-indigo-500' },
    { label: 'Active Outreach', value: publishers.filter(p => p.outreach_status === 'working').length, change: '+5%', color: 'text-emerald-500' },
    { label: 'Open Threads', value: threads.filter(t => t.status !== 'closed').length, change: '-2%', color: 'text-amber-500' },
    { label: 'Response Rate', value: '18.4%', change: '+1.2%', color: 'text-pink-500' },
  ];

  return (
    <div className="space-y-8">
      {/* KPI Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl shadow-sm hover:border-zinc-700 transition-colors group">
            <p className="text-zinc-500 text-sm font-medium mb-1">{stat.label}</p>
            <div className="flex items-end gap-3">
              <h3 className="text-3xl font-bold text-white group-hover:scale-105 transition-transform origin-left">{stat.value}</h3>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full mb-1 ${stat.change.startsWith('+') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl shadow-sm">
          <h4 className="text-lg font-bold text-white mb-6">Outreach Velocity</h4>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorOutreach" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '12px' }}
                  itemStyle={{ color: '#e4e4e7' }}
                />
                <Area type="monotone" dataKey="outreach" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorOutreach)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Tiers */}
        <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl shadow-sm">
          <h4 className="text-lg font-bold text-white mb-6">Vertical Fit Dist.</h4>
          <div className="space-y-6">
            {[
              { label: 'SaaS', percent: 45, color: 'bg-indigo-500' },
              { label: 'FinTech', percent: 25, color: 'bg-emerald-500' },
              { label: 'Travel', percent: 15, color: 'bg-amber-500' },
              { label: 'E-commerce', percent: 15, color: 'bg-rose-500' },
            ].map((item, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400 font-medium">{item.label}</span>
                  <span className="text-white font-bold">{item.percent}%</span>
                </div>
                <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color}`} style={{ width: `${item.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
