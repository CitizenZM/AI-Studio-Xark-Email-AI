
import React, { useState, useMemo } from 'react';
import { useApp } from '../AppContext';
import { UserRole, Publisher, PriorityTier, OutreachStatus } from '../types';
import { Icons } from '../constants';

const PublisherList: React.FC = () => {
  const { publishers, currentUser, setSelectedPublisherId, setBulkOutreachPublishers } = useApp();
  const [selected, setSelected] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleCount, setVisibleCount] = useState(50);
  
  const filteredPublishers = useMemo(() => {
    if (!searchTerm.trim()) return publishers;
    const lowerSearch = searchTerm.toLowerCase();
    return publishers.filter(p => 
      p.company.toLowerCase().includes(lowerSearch) || 
      p.contact_person.toLowerCase().includes(lowerSearch) || 
      p.website.toLowerCase().includes(lowerSearch)
    );
  }, [publishers, searchTerm]);

  const displayedPublishers = useMemo(() => {
    return filteredPublishers.slice(0, visibleCount);
  }, [filteredPublishers, visibleCount]);

  const toggleSelect = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const isAdmin = currentUser.role === UserRole.ADMIN;

  const getTierColor = (tier: PriorityTier) => {
    switch (tier) {
      case PriorityTier.A: return 'text-indigo-400 bg-indigo-400/10';
      case PriorityTier.B: return 'text-emerald-400 bg-emerald-400/10';
      case PriorityTier.C: return 'text-zinc-400 bg-zinc-400/10';
      default: return 'text-zinc-400 bg-zinc-400/10';
    }
  };

  const getStatusColor = (status: OutreachStatus) => {
    switch (status) {
      case OutreachStatus.WORKING: return 'text-amber-400';
      case OutreachStatus.REPLIED: return 'text-indigo-400';
      case OutreachStatus.COLD: return 'text-zinc-500';
      default: return 'text-zinc-400';
    }
  };

  const handleBulkOutreach = () => {
    const selectedPubs = publishers.filter(p => selected.includes(p.id));
    setBulkOutreachPublishers(selectedPubs);
  };

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-black text-white tracking-tight">Publisher Directory</h3>
            <span className="bg-zinc-800 text-zinc-400 text-[10px] font-black px-2 py-0.5 rounded-md border border-zinc-700 uppercase tracking-tighter">
              {publishers.length.toLocaleString()} Total
            </span>
          </div>
          <p className="text-xs text-zinc-500 font-medium">Manage partnerships and outreach status at scale.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Icons.Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Quick search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
            />
          </div>
          <button 
            onClick={handleBulkOutreach}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed" 
            disabled={selected.length === 0}
          >
            <Icons.PaperAirplane className="w-4 h-4" />
            Bulk Outreach ({selected.length})
          </button>
          <button className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95">
            Filter
          </button>
        </div>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl relative">
        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="sticky top-0 bg-zinc-900 z-10 shadow-sm">
              <tr className="border-b border-zinc-800">
                <th className="px-6 py-4 w-12">
                  <input 
                    type="checkbox" 
                    className="rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-indigo-600"
                    onChange={(e) => setSelected(e.target.checked ? filteredPublishers.map(p => p.id) : [])}
                  />
                </th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Company</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Contact Person</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Website</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Email (Secure)</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Tier</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {displayedPublishers.map((p) => (
                <tr 
                  key={p.id} 
                  className="hover:bg-zinc-800/20 transition-colors group cursor-pointer"
                >
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <input 
                      type="checkbox" 
                      className="rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-indigo-600"
                      checked={selected.includes(p.id)}
                      onChange={() => toggleSelect(p.id)}
                    />
                  </td>
                  <td className="px-6 py-4" onClick={() => setSelectedPublisherId(p.id)}>
                    <div className="flex items-center gap-4">
                      {p.avatar_url ? (
                        <img src={p.avatar_url} className="w-10 h-10 rounded-xl object-cover ring-2 ring-zinc-800 shadow-sm" alt="" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-500 border border-zinc-700">
                          {p.company.charAt(0)}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span 
                          className="font-bold text-white group-hover:text-indigo-400 group-hover:underline decoration-indigo-400/30 transition-all truncate max-w-[150px]"
                        >
                          {p.company}
                        </span>
                        <span className="text-[10px] text-zinc-500 uppercase font-black tracking-tight">{p.type}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4" onClick={() => setSelectedPublisherId(p.id)}>
                    <span className="text-sm text-zinc-300 font-medium">{p.contact_person}</span>
                  </td>
                  <td className="px-6 py-4">
                    <a 
                      href={p.website.startsWith('http') ? p.website : `https://${p.website}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline font-bold font-mono transition-all inline-flex items-center gap-1 group/link"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {p.website}
                      <Icons.ChevronRight className="w-3 h-3 group-hover/link:translate-x-0.5 transition-transform" />
                    </a>
                  </td>
                  <td className="px-6 py-4" onClick={() => setSelectedPublisherId(p.id)}>
                    {isAdmin ? (
                      <span className="text-zinc-300 font-mono text-xs bg-zinc-800 px-2 py-1 rounded border border-zinc-700">{p.email_encrypted}</span>
                    ) : (
                      <div className="flex items-center gap-1.5 text-zinc-600 italic text-xs font-bold tracking-tight">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                        <span>OPERATOR SHIELD</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4" onClick={() => setSelectedPublisherId(p.id)}>
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider ${getTierColor(p.priority_tier)} shadow-sm`}>
                      Tier {p.priority_tier}
                    </span>
                  </td>
                  <td className="px-6 py-4" onClick={() => setSelectedPublisherId(p.id)}>
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(p.outreach_status).replace('text', 'bg')} shadow-sm`} />
                      <span className={`text-xs font-bold capitalize ${getStatusColor(p.outreach_status)}`}>{p.outreach_status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedPublisherId(p.id); }}
                        className="p-2 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white transition-all"
                      >
                        <Icons.Dashboard className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedPublisherId(p.id); }}
                        className="p-2 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white transition-all"
                      >
                        <Icons.ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {visibleCount < filteredPublishers.length && (
            <div className="p-8 flex justify-center bg-zinc-900/50">
              <button 
                onClick={handleLoadMore}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-10 py-3 rounded-2xl font-bold transition-all border border-zinc-700 shadow-lg"
              >
                Load More Results ({filteredPublishers.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </div>
        
        <div className="p-4 bg-zinc-900 border-t border-zinc-800 text-center">
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest italic">
            Displaying {displayedPublishers.length.toLocaleString()} of {filteredPublishers.length.toLocaleString()} matching records.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PublisherList;
