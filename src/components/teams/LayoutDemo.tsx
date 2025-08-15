import React, { useState } from 'react';
import { Users, Settings, FileText, BarChart3 } from 'lucide-react';
import DashboardLayout from './DashboardLayout';
import CrudLayout from './CrudLayout';
import ErpLayout from './ErpLayout';
import SettingsLayout from './SettingsLayout';

export const LayoutDemo: React.FC = () => {
  const [activeLayout, setActiveLayout] = useState<'dashboard' | 'crud' | 'erp' | 'settings'>('dashboard');

  const layouts = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, description: 'Simple dashboard layout with consistent spacing' },
    { id: 'crud', label: 'CRUD', icon: FileText, description: 'CRUD operations layout with side panel support' },
    { id: 'erp', label: 'ERP', icon: Users, description: 'ERP-style layout for business applications' },
    { id: 'settings', label: 'Settings', icon: Settings, description: 'Two-column layout with side panel content' },
  ];

  const renderLayoutContent = () => {
    switch (activeLayout) {
      case 'dashboard':
        return (
          <DashboardLayout>
            <div className="p-6 space-y-6">
              <h1 className="text-2xl font-bold">Dashboard Layout Demo</h1>
              <p className="text-muted-foreground">
                This layout provides consistent spacing and positioning for dashboard views.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-card border border-border rounded-lg p-4">
                    <h3 className="font-medium mb-2">Card {i}</h3>
                    <p className="text-sm text-muted-foreground">Sample content for demonstration</p>
                  </div>
                ))}
              </div>
            </div>
          </DashboardLayout>
        );

      case 'crud':
        return (
          <CrudLayout>
            <div className="p-6 space-y-6">
              <h1 className="text-2xl font-bold">CRUD Layout Demo</h1>
              <p className="text-muted-foreground">
                This layout is designed for CRUD operations with side panel support.
              </p>
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-medium mb-4">Sample CRUD Content</h3>
                <p className="text-muted-foreground mb-4">
                  This area would typically contain forms, tables, or other CRUD-related content.
                </p>
                <div className="flex gap-3">
                  <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg">
                    Create
                  </button>
                  <button className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg">
                    Read
                  </button>
                  <button className="bg-accent text-accent-foreground px-4 py-2 rounded-lg">
                    Update
                  </button>
                  <button className="bg-destructive text-destructive-foreground px-4 py-2 rounded-lg">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </CrudLayout>
        );

      case 'erp':
        return (
          <ErpLayout>
            <div className="p-6 space-y-6">
              <h1 className="text-2xl font-bold">ERP Layout Demo</h1>
              <p className="text-muted-foreground">
                This layout is specialized for ERP-style forms and business applications.
              </p>
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-medium mb-4">Sample ERP Form</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Company Name</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-border rounded-lg"
                      placeholder="Enter company name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Industry</label>
                    <select className="w-full px-3 py-2 border border-border rounded-lg">
                      <option>Select industry</option>
                      <option>Technology</option>
                      <option>Healthcare</option>
                      <option>Finance</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <textarea
                      className="w-full px-3 py-2 border border-border rounded-lg"
                      rows={3}
                      placeholder="Enter description"
                    />
                  </div>
                </div>
              </div>
            </div>
          </ErpLayout>
        );

      case 'settings':
        return (
          <SettingsLayout
            topCardTitle="Settings Layout Demo"
            topCardContent="This demonstrates the two-column layout with side panel"
            bottomCardContent={
              <div className="space-y-4">
                <div className="bg-card border border-border rounded-lg p-4">
                  <h4 className="font-medium mb-3">Quick Actions</h4>
                  <div className="space-y-2">
                    <button className="w-full text-left px-3 py-2 rounded hover:bg-muted text-sm">
                      Save Changes
                    </button>
                    <button className="w-full text-left px-3 py-2 rounded hover:bg-muted text-sm">
                      Reset to Default
                    </button>
                    <button className="w-full text-left px-3 py-2 rounded hover:bg-muted text-sm">
                      Export Settings
                    </button>
                  </div>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                  <h4 className="font-medium mb-3">Info</h4>
                  <p className="text-sm text-muted-foreground">
                    This layout is perfect for settings pages with additional side panel content.
                  </p>
                </div>
              </div>
            }
          >
            <div className="space-y-6">
              <h1 className="text-2xl font-bold">Settings Layout Demo</h1>
              <p className="text-muted-foreground">
                This layout provides a two-column structure with main content and side panel.
              </p>
              <div className="space-y-4">
                <div className="bg-card border border-border rounded-lg p-4">
                  <h3 className="font-medium mb-2">General Settings</h3>
                  <p className="text-sm text-muted-foreground">Configure your general preferences here.</p>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                  <h3 className="font-medium mb-2">Privacy Settings</h3>
                  <p className="text-sm text-muted-foreground">Manage your privacy and security settings.</p>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                  <h3 className="font-medium mb-2">Notification Preferences</h3>
                  <p className="text-sm text-muted-foreground">Customize how you receive notifications.</p>
                </div>
              </div>
            </div>
          </SettingsLayout>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Layout Selector */}
      <div className="bg-card border-b border-border p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Layout Components Demo</h1>
          <div className="flex flex-wrap gap-2">
            {layouts.map((layout) => (
              <button
                key={layout.id}
                onClick={() => setActiveLayout(layout.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  activeLayout === layout.id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-foreground border-border hover:bg-muted'
                }`}
              >
                <layout.icon className="h-4 w-4" />
                {layout.label}
              </button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {layouts.find(l => l.id === activeLayout)?.description}
          </p>
        </div>
      </div>

      {/* Layout Content */}
      {renderLayoutContent()}
    </div>
  );
};
