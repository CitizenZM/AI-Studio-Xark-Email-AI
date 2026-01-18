import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../AppContext';
import { Icons } from '../constants';
import { UserRole, MediaKitDocument, Thread, Message, PublisherStatus, PriorityTier, Publisher } from '../types';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { geminiService } from '../geminiService';

const PublisherDetails: React.FC = () => {
  const { 
    publishers, 
    selectedPublisherId, 
    setSelectedPublisherId, 
    currentUser, 
    updatePublisher, 
    notify,
    threads,
    messages,
    addMessage,
    updateThread,
    createThread,
    templates
  } = useApp();
  
  const [activeTab, setActiveTab] = useState<'info' | 'performance' | 'media' | 'email'>('info');
  const [isUploading, setIsUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const publisher = publishers.find(p => p.id === selectedPublisherId);
  const [editForm, setEditForm] = useState<Partial<Publisher>>({});

  // Email Tab Specific State
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isDrafting, setIsDrafting] = useState(false);
  const [showNewThreadForm, setShowNewThreadForm] = useState(false);
  const [newThreadSubject, setNewThreadSubject] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  // Sync edit form when entering edit mode or publisher changes
  useEffect(() => {
    if (publisher) {
      setEditForm({ ...publisher });
    }
  }, [publisher, isEditing]);

  // Filter threads and messages for this publisher
  const publisherThreads = threads.filter(t => t.publisher_id === selectedPublisherId);
  const threadMessages = messages.filter(m => m.thread_id === selectedThreadId);

  useEffect(() => {
    if (activeTab === 'email' && publisherThreads.length > 0 && !selectedThreadId) {
      setSelectedThreadId(publisherThreads[0].id);
    }
  }, [activeTab, publisherThreads, selectedThreadId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threadMessages]);

  if (!publisher) return null;

  const isAdmin = currentUser.role === UserRole.ADMIN;

  const tabs = [
    { id: 'info', label: 'Publisher Info' },
    { id: 'performance', label: 'Performance' },
    { id: 'media', label: 'Media Kit' },
    { id: 'email', label: 'Email' },
  ] as const;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    const fileList: File[] = Array.from(files);
    setTimeout(() => {
      const newDocs: MediaKitDocument[] = fileList.map((file: File) => ({
        id: `doc-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        type: file.type || 'application/octet-stream',
        upload_date: new Date().toISOString().split('T')[0],
        url: URL.createObjectURL(file)
      }));
      const currentMediaKits = publisher.media_kits || [];
      updatePublisher(publisher.id, { media_kits: [...newDocs, ...currentMediaKits] });
      setIsUploading(false);
      notify(`Successfully added ${fileList.length} documents.`, 'success');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }, 1500);
  };

  const handleSendReply = () => {
    if (!replyText.trim() || !selectedThreadId) return;
    const thread = threads.find(t => t.id === selectedThreadId);
    const newMsg: Message = {
      id: `m-pub-${Date.now()}`,
      thread_id: selectedThreadId,
      direction: 'outbound',
      subject: thread?.subject || 'Re: Partnership',
      body_text: replyText,
      created_by_user_id: currentUser.id,
      sent_at: new Date().toISOString()
    };
    addMessage(newMsg);
    updateThread(selectedThreadId, { last_message_at: new Date().toISOString() });
    setReplyText('');
    notify('Reply sent successfully', 'success');
  };

  const handleCreateNewThread = async () => {
    if (!newThreadSubject.trim() || !replyText.trim()) {
      notify('Please enter both a subject and a message', 'error');
      return;
    }

    const threadId = `t-new-${Date.now()}`;
    const newThread: Thread = {
      id: threadId,
      publisher_id: publisher.id,
      thread_token: `tok-${Math.random().toString(36).substr(2, 9)}`,
      status: 'waiting_reply',
      last_message_at: new Date().toISOString(),
      subject: newThreadSubject
    };

    const firstMsg: Message = {
      id: `m-first-${Date.now()}`,
      thread_id: threadId,
      direction: 'outbound',
      subject: newThreadSubject,
      body_text: replyText,
      created_by_user_id: currentUser.id,
      sent_at: new Date().toISOString()
    };

    createThread(newThread);
    addMessage(firstMsg);
    setSelectedThreadId(threadId);
    setShowNewThreadForm(false);
    setNewThreadSubject('');
    setReplyText('');
    notify('New outreach thread created', 'success');
  };

  const handleDownload = (doc: MediaKitDocument) => {
    if (!doc.url || doc.url === '#') {
      notify('Download URL not available for this mock document.', 'error');
      return;
    }
    const link = document.createElement('a');
    link.href = doc.url;
    link.download = doc.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify(`Starting download: ${doc.name}`, 'info');
  };

  const generateAIDraft = async (isNewThread: boolean = false) => {
    setIsDrafting(true);
    const template = templates.find(t => t.id === selectedTemplateId) || templates[0];
    const history = isNewThread ? '' : threadMessages.map(m => `${m.direction}: ${m.body_text}`).join('\n');
    
    try {
      // Fixed: Property names and mandatory tier property added
      const draft = await geminiService.generateDraft(
        template.prompt_system,
        {
          company: publisher.company,
          website: publisher.website,
          tier: publisher.priority_tier,
          contact_person: publisher.contact_person,
          bio: publisher.bio,
          vertical_fit: publisher.vertical_fit,
          promo_methods: publisher.promo_methods
        },
        history
      );
      setReplyText(draft.body);
      if (isNewThread) setNewThreadSubject(draft.subject);
    } catch (err) {
      notify('AI Drafting failed', 'error');
    } finally {
      setIsDrafting(false);
    }
  };

  const handleSaveInfo = () => {
    updatePublisher(publisher.id, editForm);
    setIsEditing(false);
    notify('Publisher information updated successfully', 'success');
  };

  const inputClasses = "w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all font-medium";
  const labelClasses = "text-[11px] font-black text-zinc-500 uppercase mb-2 tracking-[0.2em] block";

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs font-medium text-zinc-500 mb-2">
        <button onClick={() => setSelectedPublisherId(null)} className="hover:text-white transition-colors">Home</button>
        <Icons.ChevronRight className="w-3 h-3" />
        <button onClick={() => setSelectedPublisherId(null)} className="hover:text-white transition-colors">Publishers</button>
        <Icons.ChevronRight className="w-3 h-3" />
        <span className="text-zinc-300 font-bold">{publisher.company} Profile</span>
      </nav>

      {/* Profile Header Block */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-[32px] p-8 relative overflow-hidden group shadow-2xl">
        <div className="absolute top-0 right-0 p-8 flex gap-3">
          <button className="p-3 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-2xl transition-all shadow-lg backdrop-blur-md border border-zinc-700/50">
             <Icons.Users className="w-5 h-5" />
          </button>
          <button 
            onClick={() => { setActiveTab('email'); setShowNewThreadForm(true); }}
            className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
          >
             <Icons.PaperAirplane className="w-5 h-5 -rotate-12" />
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-10 items-start">
          <div className="relative">
            <img src={publisher.avatar_url} className="w-40 h-40 rounded-[40px] object-cover ring-8 ring-zinc-900/50 shadow-2xl" alt={publisher.company} />
            <div className="absolute -bottom-2 -right-2 bg-indigo-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-xl ring-4 ring-[#0a0a0b]">VERIFIED</div>
          </div>
          <div className="flex-1 space-y-6">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <h2 className="text-4xl font-black text-white tracking-tight">{publisher.company}</h2>
                <span className={`text-[11px] font-black px-3 py-1 rounded-full uppercase border shadow-sm ${
                   publisher.status === 'Joined' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                }`}>{publisher.status}</span>
              </div>
              <p className="text-indigo-400 text-sm font-bold flex items-center gap-2">
                <Icons.Sparkles className="w-4 h-4" />
                {isAdmin ? publisher.email_encrypted : 'Identity Shield Active'}
              </p>
            </div>
            <p className="text-zinc-400 text-base leading-relaxed max-w-3xl font-medium">{publisher.bio}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-between items-center">
        <div className="flex gap-1 bg-zinc-900/50 p-1.5 rounded-[22px] w-fit border border-zinc-800/50 backdrop-blur-xl">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-8 py-3 rounded-[18px] text-sm font-black transition-all duration-300 ${
                activeTab === tab.id 
                  ? 'bg-zinc-800 text-white shadow-2xl ring-1 ring-zinc-700/50' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        {activeTab === 'info' && (
          <div className="flex gap-3">
            {!isEditing ? (
              <button 
                onClick={() => setIsEditing(true)}
                className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-2xl text-xs font-black transition-all border border-zinc-700 shadow-lg flex items-center gap-2"
              >
                <Icons.Settings className="w-4 h-4" />
                EDIT PROFILE
              </button>
            ) : (
              <>
                <button 
                  onClick={() => setIsEditing(false)}
                  className="bg-zinc-900 hover:bg-zinc-800 text-zinc-500 px-6 py-3 rounded-2xl text-xs font-black transition-all border border-zinc-800"
                >
                  CANCEL
                </button>
                <button 
                  onClick={handleSaveInfo}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-2xl text-xs font-black transition-all shadow-xl shadow-indigo-600/20 flex items-center gap-2"
                >
                  SAVE CHANGES
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-700">
             {/* Corporate Identity & Contact */}
             <div className="bg-zinc-900/40 border border-zinc-800 p-10 rounded-[40px] space-y-10 shadow-lg">
                <h4 className="text-xl font-black text-white mb-8 border-b border-zinc-800 pb-4">Corporate Identity</h4>
                <div className="space-y-8">
                   <div>
                      <label className={labelClasses}>Legal Name</label>
                      {isEditing ? (
                        <input 
                          type="text" 
                          className={inputClasses}
                          value={editForm.company || ''}
                          onChange={(e) => setEditForm({...editForm, company: e.target.value})}
                        />
                      ) : (
                        <p className="text-lg text-white font-black">{publisher.company}</p>
                      )}
                   </div>
                   <div className="grid grid-cols-2 gap-8">
                      <div>
                         <label className={labelClasses}>Contact Principal</label>
                         {isEditing ? (
                           <input 
                             type="text" 
                             className={inputClasses}
                             value={editForm.contact_person || ''}
                             onChange={(e) => setEditForm({...editForm, contact_person: e.target.value})}
                           />
                         ) : (
                           <p className="text-base text-zinc-200 font-bold">{publisher.contact_person}</p>
                         )}
                      </div>
                      <div>
                         <label className={labelClasses}>Domain</label>
                         {isEditing ? (
                           <input 
                             type="text" 
                             className={inputClasses}
                             value={editForm.website || ''}
                             onChange={(e) => setEditForm({...editForm, website: e.target.value})}
                           />
                         ) : (
                           <a href={`https://${publisher.website}`} target="_blank" rel="noopener noreferrer" className="text-base text-indigo-400 hover:underline font-black flex items-center gap-2">
                              {publisher.website}
                           </a>
                         )}
                      </div>
                   </div>
                   <div>
                      <p className={labelClasses}>Email Gateway (Protected)</p>
                      {isAdmin ? (
                        <div className="bg-zinc-950/80 p-4 rounded-2xl border border-zinc-800 inline-flex items-center gap-3">
                          <p className="text-sm font-mono font-bold text-indigo-400">{publisher.email_encrypted}</p>
                          <span className="text-[9px] font-black bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded-lg uppercase border border-indigo-500/20">ADMIN ACCESS</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 text-zinc-500 bg-zinc-950/40 p-4 rounded-2xl border border-zinc-800/50 w-fit">
                           <Icons.Settings className="w-5 h-5 opacity-50" />
                           <span className="text-xs italic font-black uppercase tracking-widest">Operator Masking Active</span>
                        </div>
                      )}
                   </div>
                </div>
             </div>
             
             {/* Location & Status Details */}
             <div className="bg-zinc-900/40 border border-zinc-800 p-10 rounded-[40px] space-y-10 shadow-lg">
                <h4 className="text-xl font-black text-white mb-8 border-b border-zinc-800 pb-4">Partnership Metadata</h4>
                <div className="grid grid-cols-2 gap-8">
                   <div>
                      <label className={labelClasses}>Classification</label>
                      {isEditing ? (
                        <input 
                          type="text" 
                          className={inputClasses}
                          value={editForm.type || ''}
                          onChange={(e) => setEditForm({...editForm, type: e.target.value})}
                        />
                      ) : (
                        <p className="text-lg text-white font-black">{publisher.type}</p>
                      )}
                   </div>
                   <div>
                      <label className={labelClasses}>Active Since</label>
                      {isEditing ? (
                        <input 
                          type="date" 
                          className={inputClasses}
                          value={editForm.join_date || ''}
                          onChange={(e) => setEditForm({...editForm, join_date: e.target.value})}
                        />
                      ) : (
                        <p className="text-base text-zinc-300 font-bold">{publisher.join_date}</p>
                      )}
                   </div>
                   <div>
                      <label className={labelClasses}>Partnership Status</label>
                      {isEditing ? (
                        <select 
                          className={inputClasses}
                          value={editForm.status || ''}
                          onChange={(e) => setEditForm({...editForm, status: e.target.value as PublisherStatus})}
                        >
                          {Object.values(PublisherStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      ) : (
                        <span className={`text-[11px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest border shadow-sm ${
                          publisher.status === 'Joined' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                        }`}>{publisher.status}</span>
                      )}
                   </div>
                   <div>
                      <label className={labelClasses}>Priority Tier</label>
                      {isEditing ? (
                        <select 
                          className={inputClasses}
                          value={editForm.priority_tier || ''}
                          onChange={(e) => setEditForm({...editForm, priority_tier: e.target.value as PriorityTier})}
                        >
                          {Object.values(PriorityTier).map(t => <option key={t} value={t}>Tier {t}</option>)}
                        </select>
                      ) : (
                        <span className={`text-[11px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest border border-indigo-500/20 text-indigo-400 bg-indigo-400/10`}>Tier {publisher.priority_tier} Asset</span>
                      )}
                   </div>
                </div>

                <div className="pt-8 border-t border-zinc-800/50">
                   <h5 className="text-[11px] font-black text-zinc-500 uppercase mb-4 tracking-[0.2em]">Geographic Presence</h5>
                   <div className="grid grid-cols-2 gap-8">
                      <div>
                         <label className={labelClasses}>Region / State</label>
                         {isEditing ? (
                           <input 
                             type="text" 
                             className={inputClasses}
                             value={editForm.state || ''}
                             onChange={(e) => setEditForm({...editForm, state: e.target.value})}
                           />
                         ) : (
                           <p className="text-base text-zinc-200 font-bold">{publisher.state}</p>
                         )}
                      </div>
                      <div>
                         <label className={labelClasses}>Country</label>
                         {isEditing ? (
                           <input 
                             type="text" 
                             className={inputClasses}
                             value={editForm.country || ''}
                             onChange={(e) => setEditForm({...editForm, country: e.target.value})}
                           />
                         ) : (
                           <div className="flex items-center gap-2">
                             <span className="w-6 h-6 flex items-center justify-center bg-zinc-800 rounded-lg text-[9px] font-black text-white border border-zinc-700">{publisher.country}</span>
                             <p className="text-base text-zinc-200 font-bold">{publisher.country}</p>
                           </div>
                         )}
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'performance' && (
           <div className="bg-zinc-900/40 border border-zinc-800 p-10 rounded-[40px] h-[450px] shadow-xl relative overflow-hidden animate-in fade-in duration-500">
             <h4 className="text-xl font-black text-white mb-8 flex items-center gap-3">Performance Velocity</h4>
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={publisher.performance}>
                  <defs>
                    <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="5 5" stroke="#27272a" vertical={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '20px' }} />
                  <Area type="monotone" dataKey="clicks" stroke="#6366f1" strokeWidth={5} fill="url(#perfGrad)" />
                </AreaChart>
             </ResponsiveContainer>
           </div>
        )}

        {activeTab === 'media' && (
          <div className="space-y-10 animate-in fade-in duration-700">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-zinc-900/40 p-10 rounded-[40px] border border-zinc-800 shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                   <h4 className="text-3xl font-black text-white mb-2">Media Kit & Assets</h4>
                   <p className="text-zinc-400 text-base max-w-2xl font-medium">Verified traffic reports and brand guidelines.</p>
                </div>
                <div className="relative z-10 shrink-0">
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} multiple accept=".pdf,.doc,.docx,.zip,.png,.jpg,.jpeg,.xlsx,.csv" />
                  <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-4 rounded-2xl font-black transition-all shadow-xl flex items-center gap-3">
                    {isUploading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Icons.PaperClip className="w-5 h-5" />}
                    UPLOAD ASSETS
                  </button>
                </div>
             </div>

             {publisher.media_kits && publisher.media_kits.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                   {publisher.media_kits.map(doc => (
                      <div key={doc.id} className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-[32px] group hover:border-indigo-500/40 transition-all flex flex-col justify-between relative overflow-hidden backdrop-blur-md shadow-sm min-h-[180px]">
                         <div className="flex items-start justify-between mb-8 relative z-10">
                            <div className="w-16 h-16 bg-zinc-950 rounded-[20px] flex items-center justify-center shrink-0 border border-zinc-800 group-hover:bg-zinc-800 transition-colors">
                               {doc.type.includes('pdf') ? <span className="text-rose-400 font-black text-[10px]">PDF</span> : <Icons.PaperClip className="w-4 h-4 text-zinc-500" />}
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button onClick={() => handleDownload(doc)} className="p-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-zinc-300 hover:text-white transition-all"><Icons.Download className="w-5 h-5" /></button>
                               {isAdmin && <button onClick={() => {}} className="p-2.5 bg-rose-500/5 hover:bg-rose-500/10 rounded-xl text-zinc-500 hover:text-rose-400 transition-all"><Icons.Trash className="w-5 h-5" /></button>}
                            </div>
                         </div>
                         <div className="relative z-10">
                            <p className="text-base font-black text-white truncate mb-1" title={doc.name}>{doc.name}</p>
                            <div className="flex items-center gap-3">
                              <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">{doc.size}</p>
                              <div className="w-1 h-1 bg-zinc-800 rounded-full" />
                              <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">{doc.upload_date}</p>
                            </div>
                         </div>
                      </div>
                   ))}
                </div>
             ) : (
                <div className="bg-zinc-900/20 border-2 border-dashed border-zinc-800/50 rounded-[50px] p-24 flex flex-col items-center justify-center text-center shadow-inner group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                   <Icons.Inbox className="w-16 h-16 text-zinc-700 mb-6" />
                   <h4 className="text-2xl font-black text-white mb-2">No Assets Available</h4>
                   <p className="text-zinc-500 text-sm max-w-sm font-medium">Click to initialize the repository with campaign materials.</p>
                </div>
             )}
          </div>
        )}

        {activeTab === 'email' && (
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-[40px] shadow-xl overflow-hidden flex h-[600px] animate-in fade-in duration-500">
            {/* Sidebar: Publisher Thread List */}
            <div className="w-80 border-r border-zinc-800 flex flex-col bg-zinc-950/20">
              <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                <h4 className="text-sm font-black text-white uppercase tracking-widest">History</h4>
                <button 
                  onClick={() => setShowNewThreadForm(true)}
                  className="p-2 bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-xl transition-all"
                  title="New Outreach"
                >
                  <Icons.PaperAirplane className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {publisherThreads.length > 0 ? (
                  publisherThreads.map(t => (
                    <button
                      key={t.id}
                      onClick={() => { setSelectedThreadId(t.id); setShowNewThreadForm(false); }}
                      className={`w-full p-6 text-left border-b border-zinc-800/50 transition-all ${selectedThreadId === t.id && !showNewThreadForm ? 'bg-indigo-600/10 border-l-4 border-l-indigo-500' : 'hover:bg-zinc-800/20'}`}
                    >
                      <p className="text-sm font-bold text-white mb-1 truncate">{t.subject}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-zinc-500 uppercase font-black">{new Date(t.last_message_at).toLocaleDateString()}</span>
                        <span className="text-[10px] bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded font-black uppercase">{t.status}</span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-10 text-center">
                    <Icons.Inbox className="w-10 h-10 text-zinc-700 mx-auto mb-4" />
                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">No previous threads</p>
                  </div>
                )}
              </div>
            </div>

            {/* Main Chat/Form Area */}
            <div className="flex-1 flex flex-col bg-zinc-950/10">
              {showNewThreadForm ? (
                <div className="flex-1 p-10 space-y-8 animate-in slide-in-from-right-4 duration-500 overflow-y-auto custom-scrollbar">
                  <div className="border-b border-zinc-800 pb-6">
                    <h3 className="text-2xl font-black text-white tracking-tight">New Outreach Campaign</h3>
                    <p className="text-sm text-zinc-500 font-medium">Initiate a personalized conversation with {publisher.company}.</p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Subject Line</label>
                      <input 
                        type="text" 
                        value={newThreadSubject}
                        onChange={(e) => setNewThreadSubject(e.target.value)}
                        placeholder="e.g. Partnership Proposal for Xark Platform"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-inner"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                       <div>
                         <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Select Campaign Template</label>
                         <select 
                           value={selectedTemplateId} 
                           onChange={(e) => setSelectedTemplateId(e.target.value)}
                           className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 text-sm text-zinc-300 outline-none focus:ring-1 focus:ring-indigo-500"
                         >
                           <option value="">Manual Composition</option>
                           {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                         </select>
                       </div>
                       <div className="flex items-end">
                         <button 
                           onClick={() => generateAIDraft(true)}
                           disabled={isDrafting}
                           className="flex items-center gap-2 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white px-6 py-3 rounded-2xl text-xs font-black transition-all border border-indigo-500/20 disabled:opacity-50"
                         >
                           <Icons.Sparkles className={`w-4 h-4 ${isDrafting ? 'animate-spin' : ''}`} />
                           {isDrafting ? 'Drafting...' : 'AI Compose'}
                         </button>
                       </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Message Body</label>
                      <textarea 
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-6 text-sm text-zinc-200 min-h-[200px] outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-inner resize-none leading-relaxed"
                        placeholder="Start typing your personalized outreach..."
                      />
                    </div>

                    <div className="flex justify-end gap-4">
                       <button onClick={() => setShowNewThreadForm(false)} className="px-6 py-3 text-sm font-black text-zinc-500 hover:text-white transition-colors">Discard</button>
                       <button 
                         onClick={handleCreateNewThread}
                         className="bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-3 rounded-2xl font-black shadow-xl shadow-indigo-600/30 active:scale-95 flex items-center gap-2"
                       >
                         <span>Launch Thread</span>
                         <Icons.PaperAirplane className="w-4 h-4" />
                       </button>
                    </div>
                  </div>
                </div>
              ) : selectedThreadId ? (
                <>
                  <div className="p-6 border-b border-zinc-800 bg-zinc-900/30 flex justify-between items-center">
                    <div>
                      <h4 className="text-base font-black text-white">{threads.find(t => t.id === selectedThreadId)?.subject}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Active Thread Context</p>
                      </div>
                    </div>
                    <button onClick={() => setShowNewThreadForm(true)} className="flex items-center gap-2 text-[10px] font-black text-indigo-400 bg-indigo-400/10 px-3 py-1.5 rounded-xl border border-indigo-500/20 hover:bg-indigo-400 hover:text-white transition-all">
                      <Icons.PaperAirplane className="w-3 h-3" />
                      NEW THREAD
                    </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                    {threadMessages.map(m => (
                      <div key={m.id} className={`flex ${m.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] rounded-[24px] p-5 shadow-lg border ${
                          m.direction === 'outbound' 
                            ? 'bg-indigo-600 border-indigo-500 text-white rounded-tr-none' 
                            : 'bg-zinc-800 border-zinc-700 text-zinc-200 rounded-tl-none'
                        }`}>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{m.body_text}</p>
                          <div className={`mt-3 text-[9px] ${m.direction === 'outbound' ? 'text-indigo-200' : 'text-zinc-500'} font-black uppercase tracking-[0.1em] border-t ${m.direction === 'outbound' ? 'border-white/10' : 'border-zinc-700'} pt-2`}>
                            {new Date(m.sent_at).toLocaleString()} {m.direction === 'outbound' ? '• OPERATOR' : '• PARTNER'}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="p-8 border-t border-zinc-800 bg-zinc-900/20">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-[28px] p-2 shadow-2xl relative">
                      <textarea 
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Reply to this thread..."
                        className="w-full bg-transparent p-5 text-sm focus:outline-none min-h-[100px] max-h-[200px] resize-none text-zinc-200 font-medium"
                      />
                      <div className="flex justify-between items-center px-4 pb-3">
                        <div className="flex items-center gap-2">
                          <button 
                             onClick={() => generateAIDraft(false)}
                             disabled={isDrafting}
                             className="flex items-center gap-2 text-indigo-400 hover:bg-indigo-500/10 px-4 py-2 rounded-xl text-[10px] font-black transition-all"
                          >
                             <Icons.Sparkles className={`w-3 h-3 ${isDrafting ? 'animate-spin' : ''}`} />
                             {isDrafting ? 'THINKING...' : 'AI ASSIST'}
                          </button>
                        </div>
                        <button 
                          onClick={handleSendReply}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-black text-xs shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2 active:scale-95"
                        >
                          SEND REPLY
                          <Icons.PaperAirplane className="w-4 h-4 -rotate-45" />
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-zinc-700 space-y-4">
                  <Icons.Inbox className="w-20 h-20 opacity-10" />
                  <p className="text-sm font-black uppercase tracking-[0.2em]">Select thread or start outreach</p>
                  <button onClick={() => setShowNewThreadForm(true)} className="bg-zinc-800 hover:bg-zinc-700 text-white px-8 py-3 rounded-2xl font-black text-xs transition-all border border-zinc-700">NEW OUTREACH</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublisherDetails;