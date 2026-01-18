import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../AppContext';
import { Icons } from '../constants';
import { geminiService } from '../geminiService';
import { UserRole } from '../types';

const Inbox: React.FC = () => {
  const { threads, messages, publishers, currentUser, addMessage, updateThread, templates, notify } = useApp();
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(threads[0]?.id || null);
  const [replyText, setReplyText] = useState('');
  const [isDrafting, setIsDrafting] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedThread = threads.find(t => t.id === selectedThreadId);
  const selectedPublisher = publishers.find(p => p.id === selectedThread?.publisher_id);
  const threadMessages = messages.filter(m => m.thread_id === selectedThreadId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threadMessages]);

  const handleSend = () => {
    if (!replyText.trim() || !selectedThreadId) return;
    
    const newMsg = {
      id: `m-${Date.now()}`,
      thread_id: selectedThreadId,
      direction: 'outbound' as const,
      subject: selectedThread?.subject || 'Reply',
      body_text: replyText,
      created_by_user_id: currentUser.id,
      sent_at: new Date().toISOString()
    };
    
    addMessage(newMsg);
    updateThread(selectedThreadId, { last_message_at: new Date().toISOString() });
    
    setReplyText('');
    setSelectedTemplateId('');
    setAttachments([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    notify('Message sent successfully', 'success');
  };

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateId = e.target.value;
    setSelectedTemplateId(templateId);
    if (templateId) {
      const template = templates.find(t => t.id === templateId);
      if (template && selectedPublisher) {
        let preview = template.prompt_user
          .replace('{{company}}', selectedPublisher.company)
          .replace('{{website}}', selectedPublisher.website);
        setReplyText(preview);
      }
    } else {
      setReplyText('');
    }
  };

  const generateAIDraft = async () => {
    if (!selectedPublisher) {
      notify('Please select a conversation first', 'error');
      return;
    }
    
    setIsDrafting(true);
    try {
      const activeTemplate = templates.find(t => t.id === selectedTemplateId) || templates[0];
      const systemPrompt = activeTemplate?.prompt_system || "You are a professional outreach manager.";
      const conversationHistory = threadMessages.map(m => `${m.direction}: ${m.body_text}`).join('\n');
      
      const draft = await geminiService.generateDraft(
        systemPrompt,
        { 
          company: selectedPublisher.company, 
          website: selectedPublisher.website,
          tier: selectedPublisher.priority_tier,
          bio: selectedPublisher.bio,
          promo_methods: selectedPublisher.promo_methods,
          contact_person: selectedPublisher.contact_person,
          traffic_estimate: selectedPublisher.traffic_estimate,
          vertical_fit: selectedPublisher.vertical_fit
        },
        conversationHistory
      );
      
      setReplyText(draft.body);
      notify('AI Draft generated', 'info');
    } catch (error) {
      notify('Failed to generate AI draft', 'error');
    } finally {
      setIsDrafting(false);
    }
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setAttachments(prev => [...prev, ...files]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="h-[calc(100vh-12rem)] flex bg-zinc-900/50 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
      {/* Thread List */}
      <div className="w-80 border-r border-zinc-800 flex flex-col bg-zinc-900/20">
        <div className="p-4 border-b border-zinc-800 bg-zinc-900/50">
          <h3 className="font-bold text-white mb-2">Conversations</h3>
          <div className="relative">
             <Icons.Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
             <input type="text" placeholder="Search inbox..." className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {threads.map(t => {
            const pub = publishers.find(p => p.id === t.publisher_id);
            const active = selectedThreadId === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setSelectedThreadId(t.id)}
                className={`w-full p-4 text-left border-b border-zinc-800/50 transition-all ${active ? 'bg-indigo-600/10 border-l-4 border-l-indigo-500' : 'hover:bg-zinc-800/30'}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`font-bold ${active ? 'text-indigo-400' : 'text-zinc-200'}`}>{pub?.company}</span>
                  <span className="text-[10px] text-zinc-500 uppercase">{new Date(t.last_message_at).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-zinc-400 line-clamp-1 font-medium">{t.subject}</p>
                <div className="mt-2 flex items-center gap-2">
                   <span className="text-[10px] bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-tight">{t.status}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Conversation Window */}
      <div className="flex-1 flex flex-col bg-zinc-950/30">
        {selectedThread ? (
          <>
            <div className="p-4 border-b border-zinc-800 bg-zinc-900/30 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <img src={selectedPublisher?.avatar_url} className="w-8 h-8 rounded-lg object-cover ring-1 ring-zinc-700" alt="" />
                <div>
                  <h3 className="font-bold text-white">{selectedPublisher?.company}</h3>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{selectedThread.subject}</p>
                </div>
              </div>
              <div className="flex gap-2">
                 <button className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 transition-colors"><Icons.Settings className="w-5 h-5" /></button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {threadMessages.map(m => (
                <div key={m.id} className={`flex ${m.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] rounded-2xl p-4 shadow-sm border ${
                    m.direction === 'outbound' 
                      ? 'bg-indigo-600 border-indigo-500 text-white rounded-tr-none' 
                      : 'bg-zinc-800 border-zinc-700 text-zinc-200 rounded-tl-none'
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.body_text}</p>
                    <div className={`mt-2 text-[10px] ${m.direction === 'outbound' ? 'text-indigo-200' : 'text-zinc-500'} font-semibold uppercase tracking-wider`}>
                      {m.direction === 'outbound' ? 'Sent by Xark' : 'Publisher'} • {new Date(m.sent_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-zinc-800 bg-zinc-900/30">
              <div className="mb-3 flex justify-between items-end">
                <div className="flex-1 max-w-sm">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1 ml-1">Contextual Template</label>
                  <select 
                    value={selectedTemplateId} 
                    onChange={handleTemplateChange}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-300 outline-none focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer"
                  >
                    <option value="">Manual Response</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-2 shadow-inner relative group/composer">
                {isDrafting && (
                  <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm rounded-2xl z-20 flex flex-col items-center justify-center transition-all">
                    <div className="flex gap-2 mb-3">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" />
                    </div>
                    <span className="text-[11px] font-black text-white uppercase tracking-[0.25em] animate-pulse">Gemini Drafting...</span>
                  </div>
                )}
                
                <textarea 
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Draft your message..."
                  className="w-full bg-transparent p-4 text-sm focus:outline-none min-h-[140px] resize-none text-zinc-200 font-medium leading-relaxed"
                />

                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 px-4 pb-2 animate-in slide-in-from-bottom-2">
                    {attachments.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-xl group/file transition-all hover:border-zinc-600">
                        <Icons.PaperClip className="w-3 h-3 text-indigo-400" />
                        <span className="text-[10px] font-bold text-zinc-300 truncate max-w-[120px]">{file.name}</span>
                        <button 
                          onClick={() => removeAttachment(idx)}
                          className="p-1 hover:bg-zinc-700 rounded-md transition-colors"
                        >
                          <Icons.Trash className="w-3 h-3 text-zinc-500 hover:text-rose-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-between items-center p-2 pt-0">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={generateAIDraft}
                      disabled={isDrafting}
                      className="group flex items-center gap-2 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white px-4 py-2 rounded-xl text-xs font-black transition-all border border-indigo-500/20 active:scale-95 disabled:opacity-50"
                    >
                      <Icons.Sparkles className={`w-4 h-4 ${isDrafting ? 'animate-spin' : 'group-hover:animate-pulse'}`} />
                      {isDrafting ? 'DRAFTING...' : 'AI SMART DRAFT'}
                    </button>
                    
                    <button 
                      onClick={handleAttachmentClick}
                      className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-xl transition-all"
                      title="Attach Assets"
                    >
                      <Icons.PaperClip className="w-5 h-5" />
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      onChange={handleFileChange} 
                      multiple
                    />
                  </div>

                  <button 
                    onClick={handleSend}
                    disabled={!replyText.trim() || isDrafting}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white p-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/30 active:scale-95 flex items-center gap-2 px-6 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <span className="text-xs font-black uppercase tracking-wider">Send Message</span>
                    <Icons.PaperAirplane className="w-4 h-4 -rotate-45" />
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-700">
            <Icons.Inbox className="w-20 h-20 mb-4 opacity-10" />
            <p className="text-sm font-black uppercase tracking-[0.2em]">Select an active thread</p>
          </div>
        )}
      </div>

      {/* Publisher Sidebar */}
      <div className="w-72 border-l border-zinc-800 p-6 space-y-8 bg-zinc-950/20 overflow-y-auto custom-scrollbar">
         <div>
            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">Partner Profile</h4>
            <div className="space-y-4">
               <div className="bg-zinc-900/50 p-3 rounded-2xl border border-zinc-800/50">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Entity</p>
                  <p className="text-sm font-black text-white">{selectedPublisher?.company || '-'}</p>
               </div>
               <div className="bg-zinc-900/50 p-3 rounded-2xl border border-zinc-800/50">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Secure Channel</p>
                  {currentUser.role === UserRole.ADMIN ? (
                    <p className="text-xs font-mono font-bold text-indigo-400 break-all">{selectedPublisher?.email_encrypted || '-'}</p>
                  ) : (
                    <div className="flex items-center gap-2 text-zinc-500">
                      <Icons.Settings className="w-3 h-3" />
                      <span className="text-[10px] italic font-black uppercase">Channel Masked</span>
                    </div>
                  )}
               </div>
               <div className="grid grid-cols-2 gap-2">
                  <div className="bg-zinc-900/50 p-3 rounded-2xl border border-zinc-800/50">
                    <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Priority</p>
                    <span className="text-[10px] font-black text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded-lg border border-indigo-400/20">T{selectedPublisher?.priority_tier || '-'}</span>
                  </div>
                  <div className="bg-zinc-900/50 p-3 rounded-2xl border border-zinc-800/50">
                    <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Region</p>
                    <p className="text-xs text-zinc-300 font-bold">{selectedPublisher?.country || '-'}</p>
                  </div>
               </div>
            </div>
         </div>

         <div>
            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">Vertical Alignment</h4>
            <div className="flex flex-wrap gap-2">
               {selectedPublisher?.vertical_fit.map(v => (
                 <span key={v} className="text-[10px] font-black bg-zinc-900 border border-zinc-800 text-zinc-400 px-3 py-1.5 rounded-xl uppercase tracking-tighter">{v}</span>
               ))}
            </div>
         </div>

         <div className="pt-4 border-t border-zinc-800">
            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Intelligence</h4>
            <div className="bg-indigo-600/5 border border-indigo-600/10 p-4 rounded-2xl">
               <p className="text-xs text-zinc-400 leading-relaxed font-medium italic line-clamp-4">
                 {selectedPublisher?.bio || "No intelligence data available for this publisher profile."}
               </p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Inbox;