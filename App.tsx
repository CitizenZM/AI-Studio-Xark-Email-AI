
import React from 'react';
import { AppProvider, useApp } from './AppContext';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import PublisherList from './components/PublisherList';
import Inbox from './components/Inbox';
import AdminSettings from './components/AdminSettings';
import Deliverability from './components/Deliverability';
import PublisherDetails from './components/PublisherDetails';
import BulkOutreachModal from './components/BulkOutreachModal';

const AppContent: React.FC = () => {
  const { selectedPublisherId, activeTab, setActiveTab, bulkOutreachPublishers } = useApp();

  const renderContent = () => {
    // Priority routing for detail view if active
    if (selectedPublisherId) {
      return <PublisherDetails />;
    }

    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'publishers': return <PublisherList />;
      case 'inbox': return <Inbox />;
      case 'deliverability': return <Deliverability />;
      case 'admin': return <AdminSettings />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
      {bulkOutreachPublishers && <BulkOutreachModal />}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
