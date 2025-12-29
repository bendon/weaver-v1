import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Settings as SettingsIcon, Bell, MessageSquare, Clock, Save } from 'lucide-react';

interface AutomationRule {
  id: string;
  trigger_name: string;
  enabled: boolean;
  template_override?: string;
  settings: any;
}

export const SettingsView: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'automation' | 'notifications' | 'general'>('automation');

  const { data: rulesData, isLoading } = useQuery({
    queryKey: ['automationRules'],
    queryFn: async () => {
      try {
        return await api.getAutomationRules();
      } catch (err) {
        return { rules: [] };
      }
    },
  });

  const updateRuleMutation = useMutation({
    mutationFn: async ({ ruleId, data }: { ruleId: string; data: any }) => {
      return await api.updateAutomationRule(ruleId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automationRules'] });
    },
  });

  const rules = rulesData?.rules || [];

  const automationTriggers = [
    { name: 'welcome', label: 'Welcome Message', description: 'Send when booking is created' },
    { name: 'documents_reminder', label: 'Documents Reminder', description: '14 days before trip' },
    { name: 'packing_tips', label: 'Packing Tips', description: '7 days before trip' },
    { name: 'flight_reminder_24h', label: 'Flight Reminder (24h)', description: '24 hours before departure' },
    { name: 'flight_reminder_3h', label: 'Flight Reminder (3h)', description: '3 hours before departure' },
    { name: 'daily_checkin', label: 'Daily Check-in', description: 'During active trips' },
    { name: 'flight_alerts', label: 'Flight Alerts', description: 'Real-time flight status changes' },
    { name: 'welcome_home', label: 'Welcome Home', description: 'After trip completion' },
  ];

  const handleToggleRule = (ruleId: string, enabled: boolean) => {
    updateRuleMutation.mutate({ ruleId, data: { enabled } });
  };

  return (
    <div className="settings-view">
      <div className="settings-header">
        <div>
          <h1 className="settings-title">Settings</h1>
          <p className="settings-subtitle">Configure your automation and preferences</p>
        </div>
      </div>

      <div className="settings-tabs">
        <button
          onClick={() => setActiveTab('automation')}
          className={`settings-tab ${activeTab === 'automation' ? 'active' : ''}`}
        >
          <Bell size={18} />
          Automation
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`settings-tab ${activeTab === 'notifications' ? 'active' : ''}`}
        >
          <MessageSquare size={18} />
          Notifications
        </button>
        <button
          onClick={() => setActiveTab('general')}
          className={`settings-tab ${activeTab === 'general' ? 'active' : ''}`}
        >
          <SettingsIcon size={18} />
          General
        </button>
      </div>

      <div className="settings-content">
        {activeTab === 'automation' && (
          <div className="automation-settings">
            <div className="settings-section">
              <h2>Automation Rules</h2>
              <p className="section-description">
                Enable or disable automated messages sent to travelers at different stages of their journey.
              </p>
            </div>

            {isLoading ? (
              <div className="loading-state">
                <p>Loading automation rules...</p>
              </div>
            ) : (
              <div className="automation-rules-list">
                {automationTriggers.map((trigger) => {
                  const rule = rules.find((r: AutomationRule) => r.trigger_name === trigger.name);
                  const isEnabled = rule?.enabled ?? true;

                  return (
                    <div key={trigger.name} className="automation-rule-card">
                      <div className="rule-info">
                        <h3 className="rule-name">{trigger.label}</h3>
                        <p className="rule-description">{trigger.description}</p>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={isEnabled}
                          onChange={(e) => {
                            if (rule) {
                              handleToggleRule(rule.id, e.target.checked);
                            }
                          }}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="settings-section">
              <h2>Quiet Hours</h2>
              <p className="section-description">
                Messages won't be sent during these hours (except urgent alerts).
              </p>
              <div className="quiet-hours-settings">
                <div className="form-group">
                  <label>Start Time</label>
                  <input type="time" defaultValue="22:00" />
                </div>
                <div className="form-group">
                  <label>End Time</label>
                  <input type="time" defaultValue="07:00" />
                </div>
                <div className="form-group">
                  <label>
                    <input type="checkbox" defaultChecked />
                    Bypass quiet hours for urgent alerts
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="notifications-settings">
            <div className="settings-section">
              <h2>Notification Preferences</h2>
              <p className="section-description">
                Configure how you receive notifications about bookings and alerts.
              </p>
            </div>

            <div className="notification-options">
              <div className="notification-option">
                <div>
                  <h3>Flight Alerts</h3>
                  <p>Get notified when flights are delayed, cancelled, or have gate changes</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" defaultChecked />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="notification-option">
                <div>
                  <h3>Traveler Messages</h3>
                  <p>Get notified when travelers send messages via WhatsApp</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" defaultChecked />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="notification-option">
                <div>
                  <h3>Booking Updates</h3>
                  <p>Get notified when bookings are created, updated, or completed</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" defaultChecked />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'general' && (
          <div className="general-settings">
            <div className="settings-section">
              <h2>General Settings</h2>
              <p className="section-description">
                Manage your account and organization settings.
              </p>
            </div>

            <div className="general-options">
              <div className="form-group">
                <label>Organization Name</label>
                <input type="text" placeholder="Your organization name" />
              </div>
              <div className="form-group">
                <label>Timezone</label>
                <select defaultValue="Africa/Nairobi">
                  <option value="Africa/Nairobi">Africa/Nairobi</option>
                  <option value="Africa/Dar_es_Salaam">Africa/Dar_es_Salaam</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
              <div className="form-group">
                <label>Message Tone</label>
                <select defaultValue="friendly">
                  <option value="friendly">Friendly</option>
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                </select>
              </div>
              <div className="form-group">
                <label>
                  <input type="checkbox" defaultChecked />
                  Use emojis in messages
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

