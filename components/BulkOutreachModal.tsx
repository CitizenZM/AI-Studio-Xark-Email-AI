
import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { Icons } from '../constants';
import { Publisher, Template } from '../types';
import { geminiService } from '../geminiService';

interface Draft {
  publisherId: string;
  subject: string;
  body: string;
  status: 'pending' | 'drafting' | 'ready' | 'sent' | 'error';
}

const BulkOutreachModal: React.FC = () => {
  const { bulkOutreachPublishers, setBulkOutreachPublishers, templates, notify, addMessages, createThread, currentUser } = useApp();
  const [step, setStep] = useState<'template' | 'drafting' | 'review'>('template');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!bulkOutreachPublishers) return null;

  const handleStartDrafting = async () => {
    if (!selectedTemplateId) return;
    const template = templates.find(t => t.id === selectedTemplateId);
    if (!template) return;

    setStep('drafting');
    setIsProcessing(true);
    
    const initialDrafts: Draft[] = bulkOutreachPublishers.map(p => ({
      publisherId: p.id,
      subject: '',
      body: '',
      status: 'pending'
    }));
    setDrafts(initialDrafts);

    // Process drafts one by one (simulated or real sequential calls to Gemini)
    for (let i = 0; i < bulkOutreachPublishers.length; i++) {
      const pub = bulkOutreachPublishers[i];
      setDrafts(prev => prev.map((d, idx) => idx === i ? { ...d, status: 'drafting' } : d));

      try {
        const result = await geminiService.generateDraft(
          template.prompt_system,
          {
            company: pub.company,
            contact_person: pub.contact_person,
            website: pub.website,
            type: pub.type,
            tier: pub.priority_tier
          }
        );

        setDrafts(prev => prev.map((d, idx) => idx === i ? { 
          ...d, 
          subject: result.subject, 
          body: result.body, 
          status: 'ready' 
        } : d));
      } catch (err) {
        setDrafts(prev => prev.map((d, idx) => idx === i ? { ...d, status: 'error' } : d));
      }
    }

    setIsProcessing(false);
    setStep('review');
  };

  const handleSendAll = () => {
    const readyDrafts = drafts.filter(d => d.status === 'ready');
    if (readyDrafts.length === 0) return;

    const newMessages = readyDrafts.map(d => {
      const pub = bulkOutreachPublishers.find(p => p.id === d.publisherId);
      const threadId = `t-bulk-${Date.now()}-${d.publisherId}`;
      
      // Create a thread for each individual outreach
      createThread({
        id: threadId,
        publisher_id: d.publisherId,
        thread_token: `tok-${Math.random().toString(36).substr(2, 9)}`,
        status: 'waiting_reply',
        last_message_at: new Date().toISOString(),
        subject: d.subject
      });

      return {
        id: `m-bulk-${Date.now()}-${d.publisherId}`,
        thread_id: threadId,
        direction: 'outbound' as const,
        subject: d.subject,
        body_text: d.body,
        created_by_user_id: currentUser.id,
        sent_at: new Date().toISOString()
      };
    });

    addMessages(newMessages);
    setDrafts(prev => prev.map(d => d.status === 'ready' ? { ...d, status: 'sent' } : d));
    notify(`Successfully sent ${newMessages.length} personalized emails.`, 'success');
    setTimeout(() => setBulkOutreachPublishers(null), 1500);
  };

  const updateDraftContent = (pubId: string, field: 'subject' | 'body', value: string) => {
    setDrafts(prev => prev.map(d => d.publisherId === pubId ? { ...d, [field]: value } : d));
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8">
      <div className="absolute inset-0 bg-[#0a0a0b]/90 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => !isProcessing && setBulkOutreachPublishers(null)} />
      
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-5xl max-h-[90vh] rounded-[32px] shadow-2xl overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="px-8 py-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600/20 rounded-2xl flex items-center justify-center">
              <Icons.PaperAirplane className="w-6 h-6 text-indigo-400 -rotate-45" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white tracking-tight">Bulk AI Outreach</h3>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Targeting {bulkOutreachPublishers.length} Publishers</p>
            </div>
          </div>
          <button 
            disabled={isProcessing}
            onClick={() => setBulkOutreachPublishers(null)}
            className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-500 hover:text-white transition-all disabled:opacity-20"
          >
            <Icons.Settings className="w-6 h-6 rotate-45" /> {/* Using settings as close for now */}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-zinc-950/20">
          {step === 'template' && (
            <div className="max-w-2xl mx-auto space-y-8 py-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center space-y-2">
                <h4 className="text-2xl font-black text-white tracking-tight">Select Campaign Template</h4>
                <p className="text-zinc-500 font-medium">Gemini will use this template to personalize each email based on publisher data.</p>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {templates.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplateId(t.id)}
                    className={`p-6 rounded-3xl border text-left transition-all ${
                      selectedTemplateId === t.id 
                        ? 'bg-indigo-600/10 border-indigo-500 shadow-lg ring-1 ring-indigo-500/50' 
                        : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-white text-lg">{t.name}</span>
                      {selectedTemplateId === t.id && (
                        <div className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                          <Icons.ChevronRight className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-zinc-400 line-clamp-2 italic">{t.prompt_user}</p>
                  </button>
                ))}
              </div>

              <div className="flex justify-center pt-6">
                <button
                  disabled={!selectedTemplateId}
                  onClick={handleStartDrafting}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-12 py-4 rounded-2xl font-black text-lg transition-all shadow-xl shadow-indigo-600/20 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Generate AI Drafts
                </button>
              </div>
            </div>
          )}

          {step === 'drafting' && (
            <div className="flex flex-col items-center justify-center py-20 space-y-8 animate-in fade-in duration-500">
               <div className="w-24 h-24 relative">
                  <div className="absolute inset-0 border-8 border-indigo-500/10 rounded-full" />
                  <div className="absolute inset-0 border-8 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                     <Icons.Sparkles className="w-8 h-8 text-indigo-400 animate-pulse" />
                  </div>
               </div>
               <div className="text-center space-y-2">
                  <h4 className="text-3xl font-black text-white tracking-tight italic">Personalizing...</h4>
                  <p className="text-zinc-500 font-medium max-w-sm">
                    Gemini is analyzing {bulkOutreachPublishers.length} publishers to create unique outreach messages.
                  </p>
               </div>
               <div className="w-full max-w-md bg-zinc-900 h-2 rounded-full overflow-hidden border border-zinc-800">
                  <div 
                    className="bg-indigo-500 h-full transition-all duration-500" 
                    style={{ width: `${(drafts.filter(d => d.status === 'ready' || d.status === 'error').length / drafts.length) * 100}%` }} 
                  />
               </div>
               <div className="grid grid-cols-5 gap-2 max-w-lg w-full">
                  {drafts.map((d, i) => (
                    <div 
                      key={i} 
                      className={`h-1.5 rounded-full transition-colors ${
                        d.status === 'ready' ? 'bg-emerald-500' : 
                        d.status === 'drafting' ? 'bg-indigo-500 animate-pulse' : 
                        d.status === 'error' ? 'bg-rose-500' : 'bg-zinc-800'
                      }`} 
                    />
                  ))}
               </div>
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="flex justify-between items-center mb-8 bg-zinc-900/40 p-6 rounded-3xl border border-zinc-800">
                 <div>
                    <h4 className="text-xl font-black text-white">Review personalized drafts</h4>
                    <p className="text-sm text-zinc-500">We've generated {drafts.length} unique messages. You can edit them individually below.</p>
                 </div>
                 <button
                   onClick={handleSendAll}
                   className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-2xl font-black transition-all shadow-xl shadow-emerald-600/20 active:scale-95"
                 >
                   Send All Individually
                 </button>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {drafts.map((d) => {
                  const pub = bulkOutreachPublishers.find(p => p.id === d.publisherId);
                  if (!pub) return null;
                  return (
                    <div key={d.publisherId} className={`bg-zinc-900/50 border rounded-3xl p-6 transition-all ${d.status === 'sent' ? 'border-emerald-500/30 opacity-60' : 'border-zinc-800 hover:border-zinc-700'}`}>
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-4">
                          <img src={pub.avatar_url} className="w-12 h-12 rounded-2xl object-cover ring-2 ring-zinc-800" alt="" />
                          <div>
                            <p className="font-bold text-white text-lg">{pub.company}</p>
                            <p className="text-xs text-zinc-500 uppercase font-black tracking-widest">{pub.contact_person} • {pub.website}</p>
                          </div>
                        </div>
                        {d.status === 'sent' ? (
                          <div className="flex items-center gap-2 text-emerald-400 font-black text-xs uppercase bg-emerald-400/10 px-3 py-1.5 rounded-xl">
                            <Icons.ChevronRight className="w-4 h-4 rotate-90" /> {/* Success check mock */}
                            Sent
                          </div>
                        ) : (
                          <span className="text-[10px] font-black bg-zinc-800 text-zinc-500 px-2 py-1 rounded uppercase">Personalized</span>
                        )}
                      </div>
                      
                      <div className="space-y-4">
                        <input 
                          type="text" 
                          value={d.subject}
                          onChange={(e) => updateDraftContent(d.publisherId, 'subject', e.target.value)}
                          disabled={d.status === 'sent'}
                          className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none font-bold"
                          placeholder="Email Subject"
                        />
                        <textarea
                          value={d.body}
                          onChange={(e) => updateDraftContent(d.publisherId, 'body', e.target.value)}
                          disabled={d.status === 'sent'}
                          className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-300 focus:ring-1 focus:ring-indigo-500 outline-none min-h-[150px] resize-none leading-relaxed"
                          placeholder="Email Body"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-zinc-800 flex justify-between items-center bg-zinc-900/80 backdrop-blur-md">
           <button 
             onClick={() => setBulkOutreachPublishers(null)}
             disabled={isProcessing}
             className="text-sm font-bold text-zinc-500 hover:text-white transition-colors"
           >
             Cancel Session
           </button>
           
           <div className="flex items-center gap-4">
              {step === 'review' && (
                <button
                  onClick={() => setStep('template')}
                  className="text-zinc-400 hover:text-white font-bold text-sm px-4"
                >
                  Start Over
                </button>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default BulkOutreachModal;
