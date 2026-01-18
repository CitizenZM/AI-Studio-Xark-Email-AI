
import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { User, UserRole, Publisher, Thread, Message, Template, SendingProfile, WarmupSchedule } from './types';
import { mockPublishers, mockThreads, mockMessages, mockTemplates, mockSendingProfiles, mockWarmupSchedules } from './mockData';

interface Notification {
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  publishers: Publisher[];
  threads: Thread[];
  messages: Message[];
  templates: Template[];
  sendingProfiles: SendingProfile[];
  warmupSchedules: WarmupSchedule[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedPublisherId: string | null;
  setSelectedPublisherId: (id: string | null) => void;
  bulkOutreachPublishers: Publisher[] | null;
  setBulkOutreachPublishers: (pubs: Publisher[] | null) => void;
  notification: Notification | null;
  notify: (message: string, type?: 'success' | 'error' | 'info') => void;
  addMessage: (msg: Message) => void;
  addMessages: (msgs: Message[]) => void;
  updateThread: (threadId: string, updates: Partial<Thread>) => void;
  addPublisher: (pub: Publisher) => void;
  addPublishers: (pubs: Publisher[]) => void;
  updatePublisher: (pubId: string, updates: Partial<Publisher>) => void;
  updateSendingProfile: (profileId: string, updates: Partial<SendingProfile>) => void;
  createThread: (thread: Thread) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'user1',
    name: 'Alex Rivera',
    role: UserRole.OPERATOR,
    avatar: 'https://picsum.photos/seed/alex/100/100'
  });

  const [activeTab, setActiveTabState] = useState('dashboard');
  const [publishers, setPublishers] = useState<Publisher[]>(mockPublishers);
  const [threads, setThreads] = useState<Thread[]>(mockThreads);
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [templates] = useState<Template[]>(mockTemplates);
  const [sendingProfiles, setSendingProfiles] = useState<SendingProfile[]>(mockSendingProfiles);
  const [warmupSchedules] = useState<WarmupSchedule[]>(mockWarmupSchedules);
  const [selectedPublisherId, setSelectedPublisherId] = useState<string | null>(null);
  const [bulkOutreachPublishers, setBulkOutreachPublishers] = useState<Publisher[] | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);

  const setActiveTab = useCallback((tab: string) => {
    setActiveTabState(tab);
    setSelectedPublisherId(null);
    setBulkOutreachPublishers(null);
  }, []);

  const notify = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  }, []);

  const addMessage = useCallback((msg: Message) => {
    setMessages(prev => [...prev, msg]);
    if (msg.direction === 'outbound') {
      setSendingProfiles(prev => prev.map(p => p.id === 'sp1' ? { ...p, sent_today: p.sent_today + 1 } : p));
    }
  }, []);

  const addMessages = useCallback((newMsgs: Message[]) => {
    setMessages(prev => [...prev, ...newMsgs]);
    const outboundCount = newMsgs.filter(m => m.direction === 'outbound').length;
    if (outboundCount > 0) {
      setSendingProfiles(prev => prev.map(p => p.id === 'sp1' ? { ...p, sent_today: p.sent_today + outboundCount } : p));
    }
  }, []);

  const updateThread = useCallback((threadId: string, updates: Partial<Thread>) => {
    setThreads(prev => prev.map(t => t.id === threadId ? { ...t, ...updates } : t));
  }, []);

  const createThread = useCallback((thread: Thread) => {
    setThreads(prev => [thread, ...prev]);
  }, []);

  const addPublisher = useCallback((pub: Publisher) => {
    setPublishers(prev => [pub, ...prev]);
  }, []);

  const addPublishers = useCallback((newPubs: Publisher[]) => {
    setPublishers(prev => [...newPubs, ...prev]);
  }, []);

  const updatePublisher = useCallback((pubId: string, updates: Partial<Publisher>) => {
    setPublishers(prev => prev.map(p => p.id === pubId ? { ...p, ...updates } : p));
  }, []);

  const updateSendingProfile = useCallback((profileId: string, updates: Partial<SendingProfile>) => {
    setSendingProfiles(prev => prev.map(p => p.id === profileId ? { ...p, ...updates } : p));
  }, []);

  const value = useMemo(() => ({
    currentUser,
    setCurrentUser,
    publishers,
    threads,
    messages,
    templates,
    sendingProfiles,
    warmupSchedules,
    activeTab,
    setActiveTab,
    selectedPublisherId,
    setSelectedPublisherId,
    bulkOutreachPublishers,
    setBulkOutreachPublishers,
    notification,
    notify,
    addMessage,
    addMessages,
    updateThread,
    addPublisher,
    addPublishers,
    updatePublisher,
    updateSendingProfile,
    createThread
  }), [currentUser, publishers, threads, messages, templates, sendingProfiles, warmupSchedules, activeTab, selectedPublisherId, bulkOutreachPublishers, notification, setActiveTab, notify, addMessage, addMessages, updateThread, createThread, addPublisher, addPublishers, updatePublisher, updateSendingProfile]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
