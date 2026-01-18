
import React from 'react';
import { useApp } from '../AppContext';
import { Icons } from '../constants';
import { SendingProfile, WarmupSchedule } from '../types';

const Deliverability: React.FC = () => {
  const { sendingProfiles, warmupSchedules } = useApp();

  const getStatusBadge = (status: SendingProfile['status']) => {
    switch (status) {
      case 'active': return <span className="text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Healthy</span>;
      case 'warmup': return <span className="text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Warming Up</span>;
      case 'paused': return <span className="text-rose-400 bg-rose-400/10 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Paused</span>;
    }
  };

  const getProviderIcon = (provider: SendingProfile['provider']) => {
    return <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-400">{provider[0]}</div>;
  };

  return (
    <div className="space-y-10 max-w-6xl">
      <header>
        <h3 className="text-2xl font-bold text-white mb-1">Deliverability & Warmup</h3>
        <p className="text-zinc-500 text-sm">Monitor domain reputation and manage automated warmup schedules.</p>
      </header>

      {/* Sending Profiles */}
      <section className="space-y-6">
        <div className="flex justify-between items-center">
          <h4 className="text-lg font-bold text-white">Sending Profiles</h4>
          <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all">Add New Domain</button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sendingProfiles.map(profile => {
            const usagePercent = Math.min(100, (profile.sent_today / profile.current_daily_limit) * 100);
            const warmupProgress = profile.status === 'warmup' ? 35 : 100; // Mock progress

            return (
              <div key={profile.id} className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl shadow-sm hover:border-zinc-700 transition-all group">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    {getProviderIcon(profile.provider)}
                    <div>
                      <h5 className="font-bold text-white text-lg">{profile.domain}</h5>
                      <p className="text-xs text-zinc-500">via {profile.provider}</p>
                    </div>
                  </div>
                  {getStatusBadge(profile.status)}
                </div>

                <div className="space-y-6">
                  {/* Daily Limit Usage */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-zinc-500">Daily Sending Usage</span>
                      <span className="text-zinc-300">{profile.sent_today} / {profile.current_daily_limit}</span>
                    </div>
                    <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${usagePercent > 90 ? 'bg-rose-500' : 'bg-indigo-500'}`} 
                        style={{ width: `${usagePercent}%` }} 
                      />
                    </div>
                  </div>

                  {/* Reputation / Warmup Progress */}
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="bg-zinc-950/50 border border-zinc-800/50 p-3 rounded-2xl">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Reputation Score</p>
                      <p className={`text-xl font-bold ${profile.reputation_score > 90 ? 'text-emerald-400' : 'text-amber-400'}`}>{profile.reputation_score}/100</p>
                    </div>
                    <div className="bg-zinc-950/50 border border-zinc-800/50 p-3 rounded-2xl">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Target Limit</p>
                      <p className="text-xl font-bold text-white">{profile.max_target_limit}/day</p>
                    </div>
                  </div>

                  {profile.status === 'warmup' && (
                    <div className="mt-2 bg-amber-500/5 border border-amber-500/10 p-4 rounded-2xl">
                       <div className="flex justify-between items-center mb-2">
                          <p className="text-xs font-bold text-amber-500 uppercase flex items-center gap-2">
                             <Icons.Sparkles className="w-3 h-3" />
                             Warmup in Progress
                          </p>
                          <span className="text-xs text-amber-500/70 font-bold">Day 5 / 14</span>
                       </div>
                       <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500" style={{ width: '35%' }} />
                       </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Warmup Schedules */}
      <section className="space-y-6">
        <h4 className="text-lg font-bold text-white">Automated Schedules</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {warmupSchedules.map(schedule => (
            <div key={schedule.id} className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl group hover:border-indigo-500/30 transition-all">
              <div className="flex justify-between items-center mb-4">
                <h5 className="font-bold text-white">{schedule.name}</h5>
                <Icons.ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-indigo-400" />
              </div>
              <div className="space-y-3">
                {schedule.steps.slice(0, 4).map((step, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs border-b border-zinc-800/50 pb-2 last:border-0 last:pb-0">
                    <span className="text-zinc-500">Day {step.day}</span>
                    <span className="text-zinc-300 font-bold">{step.limit} emails/day</span>
                  </div>
                ))}
                {schedule.steps.length > 4 && (
                  <p className="text-[10px] text-zinc-600 font-bold uppercase pt-1">+ {schedule.steps.length - 4} more steps</p>
                )}
              </div>
            </div>
          ))}
          <button className="border-2 border-dashed border-zinc-800 rounded-3xl flex flex-col items-center justify-center p-6 text-zinc-600 hover:border-indigo-500/30 hover:text-indigo-400 transition-all">
             <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center mb-2">
                <span className="text-xl">+</span>
             </div>
             <p className="text-xs font-bold uppercase tracking-wider">Create Schedule</p>
          </button>
        </div>
      </section>
    </div>
  );
};

export default Deliverability;
