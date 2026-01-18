
import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { Icons } from '../constants';
import { PublisherStatus, OutreachStatus, PriorityTier, Publisher, PerformancePoint } from '../types';

const AdminSettings: React.FC = () => {
  const { templates, addPublishers, notify, setActiveTab } = useApp();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<{ count: number; partner: string } | null>(null);

  const generateMockPerformance = (): PerformancePoint[] => {
    const points: PerformancePoint[] = [];
    for (let i = 0; i < 30; i++) {
      points.push({
        date: `2024-05-${String(i + 1).padStart(2, '0')}`,
        clicks: Math.floor(Math.random() * 200) + 50,
        conversions: Math.floor(Math.random() * 20) + 2,
        sales: Math.floor(Math.random() * 2000) + 500,
        commission: Math.floor(Math.random() * 200) + 50
      });
    }
    return points;
  };

  const simulateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setIsUploading(true);
    setUploadSuccess(null);

    const companyPrefixes = ['Global', 'Digital', 'Apex', 'NextGen', 'Infinite', 'Elite', 'Smart', 'Active', 'Stellar', 'Prime'];
    const companySuffixes = ['Media', 'Adventures', 'Marketing', 'Solutions', 'Publishing', 'Network', 'Partners', 'Growth', 'Labs', 'Hub'];
    const firstNames = ['James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson'];
    const domains = ['.com', '.io', '.net', '.org', '.co.uk', '.ai'];

    setTimeout(() => {
      const timestamp = Date.now();
      const count = 1050;
      const newPartners: Publisher[] = Array.from({ length: count }, (_, i) => {
        const idNum = i + 1;
        const tiers = [PriorityTier.A, PriorityTier.B, PriorityTier.C];
        const statuses = [OutreachStatus.COLD, OutreachStatus.WORKING, OutreachStatus.REPLIED];
        
        const prefix = companyPrefixes[Math.floor(Math.random() * companyPrefixes.length)];
        const suffix = companySuffixes[Math.floor(Math.random() * companySuffixes.length)];
        const companyName = idNum === 1 ? 'Global Ad Ventures' : `${prefix} ${suffix} ${idNum}`;
        
        const fName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const contactPerson = `${fName} ${lName}`;

        const domain = domains[Math.floor(Math.random() * domains.length)];
        const website = `${prefix.toLowerCase()}-${suffix.toLowerCase()}${idNum}${domain}`;

        return {
          id: `p-bulk-${timestamp}-${idNum}`,
          company: companyName,
          contact_person: contactPerson,
          website: website,
          type: idNum % 3 === 0 ? 'Content' : (idNum % 2 === 0 ? 'Media' : 'Coupon'),
          join_date: new Date().toISOString().split('T')[0],
          state: 'Global',
          country: idNum % 5 === 0 ? 'UK' : 'US',
          status: PublisherStatus.Joined,
          email_encrypted: `enc_contact_${idNum}@secure-xark.io`,
          priority_tier: tiers[idNum % 3],
          outreach_status: statuses[idNum % 3],
          last_contacted_at: null,
          vertical_fit: ['Tech', 'Marketing'],
          traffic_estimate: `${Math.floor(Math.random() * 500) + 10}K/mo`,
          bio: `Specialized in high-conversion traffic segments for ${companyName}. Managed by ${contactPerson}.`,
          avatar_url: `https://i.pravatar.cc/150?u=bulk-${idNum}`,
          promo_methods: ['Display Ads', 'Contextual'],
          categories: ['Software', 'Finance'],
          promoted_countries: ['US', 'Global'],
          performance: generateMockPerformance()
        };
      });

      addPublishers(newPartners);
      setIsUploading(false);
      setUploadSuccess({ count: newPartners.length, partner: newPartners[0].company });
      notify(`${newPartners.length} publishers successfully imported and encrypted`, 'success');
      
      if (e.target) e.target.value = '';
    }, 2500);
  };

  const handleViewPublishers = () => {
    setActiveTab('publishers');
  };

  return (
    <div className="max-w-4xl space-y-12 pb-20">
      <section>
        <div className="flex justify-between items-end mb-6">
          <div>
            <h3 className="text-2xl font-bold text-white mb-1">Publisher Database</h3>
            <p className="text-zinc-500 text-sm">Upload CSV or XLSX files to expand your publisher network.</p>
          </div>
        </div>
        
        {!uploadSuccess ? (
          <div className="bg-zinc-900/50 border-2 border-dashed border-zinc-800 rounded-3xl p-12 flex flex-col items-center justify-center text-center group hover:border-indigo-500/50 transition-all cursor-pointer relative overflow-hidden h-[320px]">
            {isUploading && (
              <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center z-20 animate-in fade-in duration-300">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 relative">
                    <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full" />
                    <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                  <div className="space-y-1 text-center">
                    <p className="font-black text-white text-lg">Processing 1,000+ Records...</p>
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Applying Identity Obfuscation</p>
                  </div>
                </div>
              </div>
            )}
            <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-inner">
              <Icons.Users className="w-8 h-8 text-indigo-400" />
            </div>
            <p className="text-white font-bold text-lg mb-1 tracking-tight">Drag and drop spreadsheet here</p>
            <p className="text-zinc-500 text-sm mb-6 font-medium">Supports bulk import up to 10,000 rows</p>
            <input 
              type="file" 
              className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-wait" 
              onChange={simulateUpload}
              accept=".csv,.xlsx"
              disabled={isUploading}
            />
            <button className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20 active:scale-95">
              Select Excel File
            </button>
          </div>
        ) : (
          <div className="bg-emerald-500/5 border-2 border-emerald-500/20 rounded-3xl p-12 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-500 h-[320px]">
            <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h4 className="text-2xl font-black text-white mb-2 tracking-tight">Bulk Import Success</h4>
            <p className="text-zinc-400 text-sm max-w-sm mb-8 font-medium">
              We've successfully added <span className="text-emerald-400 font-bold">{uploadSuccess.count.toLocaleString()} publishers</span> to your database. All identity data is encrypted.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setUploadSuccess(null)}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-6 py-2.5 rounded-xl font-bold transition-all text-sm"
              >
                New Upload
              </button>
              <button 
                onClick={handleViewPublishers}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-600/20 text-sm flex items-center gap-2"
              >
                <span>View Full List</span>
                <Icons.ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </section>

      <section>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-2xl font-bold text-white mb-1">Outreach Templates</h3>
            <p className="text-zinc-500 text-sm">Configure AI prompts and message structures for your team.</p>
          </div>
          <button className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2 transition-all">
             New Template
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {templates.map(t => (
            <div key={t.id} className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl hover:border-zinc-700 transition-colors space-y-4">
              <div className="flex justify-between items-start">
                 <h4 className="font-bold text-white text-lg tracking-tight">{t.name}</h4>
                 <button className="text-zinc-500 hover:text-white p-1 hover:bg-zinc-800 rounded-lg transition-all"><Icons.Settings className="w-4 h-4" /></button>
              </div>
              <div className="space-y-3">
                 <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">System Prompt</label>
                    <p className="text-xs text-zinc-400 bg-zinc-950 p-3 rounded-xl mt-1 line-clamp-2 border border-zinc-800 font-medium">{t.prompt_system}</p>
                 </div>
                 <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">User Prompt Context</label>
                    <p className="text-xs text-zinc-400 bg-zinc-950 p-3 rounded-xl mt-1 line-clamp-2 border border-zinc-800 font-medium">{t.prompt_user}</p>
                 </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-rose-500/5 border border-rose-500/20 p-8 rounded-3xl space-y-4">
        <h4 className="text-lg font-bold text-rose-500 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          Operator Privacy Protocol
        </h4>
        <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed font-medium">
          Zero-Exposure Rule is active. Operator-level accounts cannot bypass the encryption shield. Even with 10,000+ records, individual publisher contact data remains siloed from the browser client for all non-admin users.
        </p>
        <div className="pt-2">
           <button className="text-xs font-bold text-rose-400 underline underline-offset-4 decoration-rose-400/30 hover:decoration-rose-400 transition-all">View Access Audit</button>
        </div>
      </section>
    </div>
  );
};

export default AdminSettings;
