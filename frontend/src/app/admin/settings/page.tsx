'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('Profile Details')
  const [settings, setSettings] = useState({
    fullName: '',
    professionalTitle: '',
    email: '',
    bio: '',
    automaticTheme: true,
    realtimeAnalytics: false,
    region: 'United States (GMT-8)',
    apiVersion: 'v2.4 (Stable)',
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    newUserAlerts: true,
    paymentUpdates: true,
    marketingMessages: false,
    systemUpdates: true,
    twoFactorAuth: true,
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [sessions, setSessions] = useState<any[]>([])

  useEffect(() => {
    fetchSettings()
    fetchSessions()
  }, [])

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token')
      const userData = localStorage.getItem('user')
      const headers = { Authorization: `Bearer ${token}` }

      if (userData) {
        const user = JSON.parse(userData)
        setSettings(prev => ({
          ...prev,
          fullName: user.username || '',
          email: user.email || '',
          professionalTitle: user.job_title || 'System Administrator',
          bio: user.bio || 'Architecting the future of modular SaaS environments.'
        }))
      }

      // Fetch system settings
      const response = await axios.get(`${API_URL}/api/admin/settings`, { headers })
      // Update settings with system values if available
      
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSessions = async () => {
    try {
      const token = localStorage.getItem('token')
      const userData = localStorage.getItem('user')
      const headers = { Authorization: `Bearer ${token}` }

      if (userData) {
        const user = JSON.parse(userData)
        const response = await axios.get(`${API_URL}/api/admin/users/${user.id}`, { headers })
        setSessions(response.data.sessions || [])
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
    }
  }

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }

      // Save user profile
      const userData = localStorage.getItem('user')
      if (userData) {
        const user = JSON.parse(userData)
        await axios.put(`${API_URL}/api/admin/users/${user.id}`, {
          username: settings.fullName,
          job_title: settings.professionalTitle,
          bio: settings.bio
        }, { headers })

        // Update localStorage
        const updatedUser = { ...user, username: settings.fullName, job_title: settings.professionalTitle, bio: settings.bio }
        localStorage.setItem('user', JSON.stringify(updatedUser))
      }

      // Save system settings
      await axios.put(`${API_URL}/api/admin/settings`, {
        automatic_theme: settings.automaticTheme,
        realtime_analytics: settings.realtimeAnalytics,
        region: settings.region,
        api_version: settings.apiVersion,
        email_notifications: settings.emailNotifications,
        push_notifications: settings.pushNotifications,
        sms_notifications: settings.smsNotifications,
        new_user_alerts: settings.newUserAlerts,
        payment_updates: settings.paymentUpdates,
        marketing_messages: settings.marketingMessages,
        system_updates: settings.systemUpdates
      }, { headers })

      setMessage('✅ Settings saved successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('❌ Failed to save settings')
      setTimeout(() => setMessage(''), 3000)
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async () => {
    if (settings.newPassword !== settings.confirmPassword) {
      setMessage('❌ Passwords do not match')
      setTimeout(() => setMessage(''), 3000)
      return
    }

    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }

      await axios.put(`${API_URL}/api/auth/change-password`, {
        currentPassword: settings.currentPassword,
        newPassword: settings.newPassword
      }, { headers })

      setMessage('✅ Password changed successfully!')
      setSettings(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }))
      setTimeout(() => setMessage(''), 3000)
    } catch (error: any) {
      setMessage(`❌ ${error.response?.data?.error || 'Failed to change password'}`)
      setTimeout(() => setMessage(''), 3000)
    } finally {
      setSaving(false)
    }
  }

  const terminateSession = async (sessionId: number) => {
    try {
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }

      await axios.delete(`${API_URL}/api/admin/sessions/${sessionId}`, { headers })
      fetchSessions() // Refresh sessions
      setMessage('✅ Session terminated')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('❌ Failed to terminate session')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const terminateAllSessions = async () => {
    if (!confirm('Are you sure you want to terminate all sessions? You will be logged out.')) return

    try {
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }

      await axios.delete(`${API_URL}/api/admin/sessions/all`, { headers })
      
      // Logout user
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    } catch (error) {
      setMessage('❌ Failed to terminate sessions')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const tabs = [
    { id: 'Profile Details', icon: '👤' },
    { id: 'Security & Privacy', icon: '🔒' },
    { id: 'Notifications', icon: '🔔' },
    { id: 'Appearance', icon: '🎨' }
  ]

  const renderProfileDetails = () => (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1a202c', marginBottom: '8px' }}>
          Account Information
        </h3>
        <p style={{ color: '#718096', fontSize: '14px', marginBottom: '24px' }}>
          Basic details for your administrative profile.
        </p>

        <div className="form-grid">
          <div className="form-group">
            <label>FULL NAME</label>
            <input 
              type="text" 
              value={settings.fullName}
              onChange={(e) => handleSettingChange('fullName', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>PROFESSIONAL TITLE</label>
            <input 
              type="text" 
              value={settings.professionalTitle}
              onChange={(e) => handleSettingChange('professionalTitle', e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label>ADMINISTRATIVE EMAIL</label>
          <input 
            type="email" 
            value={settings.email}
            onChange={(e) => handleSettingChange('email', e.target.value)}
            disabled
            style={{ background: '#f7fafc', cursor: 'not-allowed' }}
          />
          <small style={{ color: '#718096', fontSize: '12px' }}>Email cannot be changed from this interface</small>
        </div>

        <div className="form-group">
          <label>BIO / SIGNATURE</label>
          <textarea 
            rows={3}
            value={settings.bio}
            onChange={(e) => handleSettingChange('bio', e.target.value)}
          />
        </div>

        <button 
          className="btn btn-primary" 
          onClick={saveSettings}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1a202c', marginBottom: '24px' }}>
          Interface Preferences
        </h3>

        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div>
              <div style={{ fontWeight: '500', color: '#1a202c' }}>Automatic Theme Transition</div>
              <div style={{ fontSize: '14px', color: '#718096' }}>Sync dashboard appearance with your OS settings</div>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
              <input 
                type="checkbox" 
                checked={settings.automaticTheme}
                onChange={(e) => handleSettingChange('automaticTheme', e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute',
                cursor: 'pointer',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: settings.automaticTheme ? '#319795' : '#cbd5e0',
                borderRadius: '24px',
                transition: '0.4s'
              }}>
                <span style={{
                  position: 'absolute',
                  content: '',
                  height: '18px',
                  width: '18px',
                  left: settings.automaticTheme ? '23px' : '3px',
                  bottom: '3px',
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  transition: '0.4s'
                }}></span>
              </span>
            </label>
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div>
              <div style={{ fontWeight: '500', color: '#1a202c' }}>Real-time Analytics Overlay</div>
              <div style={{ fontSize: '14px', color: '#718096' }}>Enable live streaming of user activity in header</div>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
              <input 
                type="checkbox" 
                checked={settings.realtimeAnalytics}
                onChange={(e) => handleSettingChange('realtimeAnalytics', e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute',
                cursor: 'pointer',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: settings.realtimeAnalytics ? '#319795' : '#cbd5e0',
                borderRadius: '24px',
                transition: '0.4s'
              }}>
                <span style={{
                  position: 'absolute',
                  content: '',
                  height: '18px',
                  width: '18px',
                  left: settings.realtimeAnalytics ? '23px' : '3px',
                  bottom: '3px',
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  transition: '0.4s'
                }}></span>
              </span>
            </label>
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label>REGION & LOCALIZATION</label>
            <select 
              value={settings.region}
              onChange={(e) => handleSettingChange('region', e.target.value)}
            >
              <option>United States (GMT-8)</option>
              <option>United Kingdom (GMT+0)</option>
              <option>Europe (GMT+1)</option>
              <option>Asia Pacific (GMT+8)</option>
            </select>
          </div>
          <div className="form-group">
            <label>DEFAULT API VERSION</label>
            <select 
              value={settings.apiVersion}
              onChange={(e) => handleSettingChange('apiVersion', e.target.value)}
            >
              <option>v2.4 (Stable)</option>
              <option>v2.3 (Legacy)</option>
              <option>v3.0 (Beta)</option>
            </select>
          </div>
        </div>

        <button 
          className="btn btn-primary" 
          onClick={saveSettings}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>

      <div style={{ 
        background: '#fed7d7', 
        border: '1px solid #feb2b2',
        borderRadius: '8px',
        padding: '16px',
        marginTop: '32px'
      }}>
        <h4 style={{ color: '#742a2a', marginBottom: '8px' }}>Danger Zone</h4>
        <p style={{ color: '#742a2a', fontSize: '14px', marginBottom: '16px' }}>
          Irreversible actions regarding your administrative environment.
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: '500', color: '#742a2a' }}>Archive Project Environment</div>
            <div style={{ fontSize: '14px', color: '#742a2a' }}>This will move all data to cold storage.</div>
          </div>
          <button className="btn btn-danger">Archive</button>
        </div>
      </div>
    </div>
  )

  const renderAppearance = () => (
    <div>
      <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1a202c', marginBottom: '8px' }}>
        Appearance
      </h3>
      <p style={{ color: '#718096', fontSize: '14px', marginBottom: '32px' }}>
        Customize the look and feel of your workspace.
      </p>

      <div style={{ marginBottom: '32px' }}>
        <h4 style={{ fontSize: '16px', fontWeight: '500', color: '#1a202c', marginBottom: '16px' }}>
          INTERFACE THEME
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div style={{ 
            border: '2px solid #319795',
            borderRadius: '8px',
            padding: '16px',
            background: 'white',
            cursor: 'pointer'
          }}>
            <div style={{ 
              height: '80px',
              background: '#f8fafc',
              borderRadius: '4px',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              color: '#718096'
            }}>
              Light Preview
            </div>
            <div style={{ textAlign: 'center', fontSize: '14px', fontWeight: '500' }}>Light Mode</div>
            <div style={{ 
              position: 'absolute',
              top: '8px',
              right: '8px',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: '#319795',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '12px'
            }}>
              ✓
            </div>
          </div>
          <div style={{ 
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '16px',
            background: 'white',
            cursor: 'pointer',
            position: 'relative'
          }}>
            <div style={{ 
              height: '80px',
              background: '#2d3748',
              borderRadius: '4px',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              color: '#a0aec0'
            }}>
              Dark Preview
            </div>
            <div style={{ textAlign: 'center', fontSize: '14px', fontWeight: '500' }}>Dark Mode</div>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <h4 style={{ fontSize: '16px', fontWeight: '500', color: '#1a202c', marginBottom: '16px' }}>
          Accent Color
        </h4>
        <p style={{ fontSize: '14px', color: '#718096', marginBottom: '16px' }}>
          The signature color for your navigation and controls.
        </p>
        <div style={{ display: 'flex', gap: '12px' }}>
          {['#319795', '#3182ce', '#805ad5', '#d53f8c', '#1a202c'].map((color, index) => (
            <div
              key={color}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: color,
                cursor: 'pointer',
                border: index === 0 ? '3px solid #319795' : '3px solid transparent',
                boxShadow: index === 0 ? '0 0 0 2px white, 0 0 0 4px #319795' : 'none'
              }}
            />
          ))}
        </div>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label>System Language</label>
          <p style={{ fontSize: '14px', color: '#718096', marginBottom: '8px' }}>
            Select your preferred interface language.
          </p>
          <select>
            <option>English (United States)</option>
            <option>Spanish (España)</option>
            <option>French (France)</option>
            <option>German (Deutschland)</option>
          </select>
        </div>
        <div className="form-group">
          <label>Timezone</label>
          <p style={{ fontSize: '14px', color: '#718096', marginBottom: '8px' }}>
            Coordinate your actions with your local time.
          </p>
          <select>
            <option>(GMT-08:00) Pacific Time (US & Canada)</option>
            <option>(GMT-05:00) Eastern Time (US & Canada)</option>
            <option>(GMT+00:00) Greenwich Mean Time</option>
            <option>(GMT+01:00) Central European Time</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
        <button className="btn btn-secondary">Discard changes</button>
        <button className="btn btn-primary">Save Appearance</button>
      </div>
    </div>
  )

  const renderNotifications = () => (
    <div>
      <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1a202c', marginBottom: '8px' }}>
        Communication Channels
      </h3>
      <p style={{ color: '#718096', fontSize: '14px', marginBottom: '32px' }}>
        Master switches for global delivery platforms.
      </p>

      <div style={{ marginBottom: '32px' }}>
        {[
          { key: 'emailNotifications', title: 'Email Notifications', desc: 'Receive summary and detail reports via email.', icon: '📧' },
          { key: 'pushNotifications', title: 'Push Notifications', desc: 'Desktop and mobile browser alerts.', icon: '📱' },
          { key: 'smsNotifications', title: 'SMS Notifications', desc: 'Direct messages for critical system failures.', icon: '💬' }
        ].map((item) => (
          <div key={item.key} style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '16px 0',
            borderBottom: '1px solid #f7fafc'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '20px' }}>{item.icon}</span>
              <div>
                <div style={{ fontWeight: '500', color: '#1a202c' }}>{item.title}</div>
                <div style={{ fontSize: '14px', color: '#718096' }}>{item.desc}</div>
              </div>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
              <input 
                type="checkbox" 
                checked={settings[item.key as keyof typeof settings] as boolean}
                onChange={(e) => handleSettingChange(item.key, e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute',
                cursor: 'pointer',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: (settings[item.key as keyof typeof settings] as boolean) ? '#319795' : '#cbd5e0',
                borderRadius: '24px',
                transition: '0.4s'
              }}>
                <span style={{
                  position: 'absolute',
                  content: '',
                  height: '18px',
                  width: '18px',
                  left: (settings[item.key as keyof typeof settings] as boolean) ? '23px' : '3px',
                  bottom: '3px',
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  transition: '0.4s'
                }}></span>
              </span>
            </label>
          </div>
        ))}
      </div>

      <h4 style={{ fontSize: '16px', fontWeight: '500', color: '#1a202c', marginBottom: '16px' }}>
        Preference Details
      </h4>
      <p style={{ fontSize: '14px', color: '#718096', marginBottom: '24px' }}>
        Granular control over specific event triggers.
      </p>

      {[
        { section: 'USER ACTIVITY', items: [
          { key: 'newUserAlerts', title: 'New user alerts', desc: 'Notify when a new administrator joins the team.' }
        ]},
        { section: 'FINANCIAL UPDATES', items: [
          { key: 'paymentUpdates', title: 'Payment updates', desc: 'Transaction success, failure, and billing cycle changes.' }
        ]},
        { section: 'PLATFORM GROWTH', items: [
          { key: 'marketingMessages', title: 'Marketing messages', desc: 'Occasional updates about new features and ecosystem news.' }
        ]},
        { section: 'SECURITY & CORE', items: [
          { key: 'systemUpdates', title: 'System updates', desc: 'Critical maintenance schedules and downtime alerts.' }
        ]}
      ].map((section) => (
        <div key={section.section} style={{ marginBottom: '24px' }}>
          <div style={{ 
            fontSize: '12px', 
            color: '#718096', 
            textTransform: 'uppercase', 
            letterSpacing: '0.5px',
            marginBottom: '12px'
          }}>
            {section.section}
          </div>
          {section.items.map((item) => (
            <div key={item.key} style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <div>
                <div style={{ fontWeight: '500', color: '#1a202c' }}>{item.title}</div>
                <div style={{ fontSize: '14px', color: '#718096' }}>{item.desc}</div>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
                <input 
                  type="checkbox" 
                  checked={settings[item.key as keyof typeof settings] as boolean}
                  onChange={(e) => handleSettingChange(item.key, e.target.checked)}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: (settings[item.key as keyof typeof settings] as boolean) ? '#319795' : '#cbd5e0',
                  borderRadius: '24px',
                  transition: '0.4s'
                }}>
                  <span style={{
                    position: 'absolute',
                    content: '',
                    height: '18px',
                    width: '18px',
                    left: (settings[item.key as keyof typeof settings] as boolean) ? '23px' : '3px',
                    bottom: '3px',
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    transition: '0.4s'
                  }}></span>
                </span>
              </label>
            </div>
          ))}
        </div>
      ))}

      <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
        <button className="btn btn-secondary">Discard Changes</button>
        <button className="btn btn-primary">Save Preferences</button>
      </div>
    </div>
  )

  const renderSecurityPrivacy = () => (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1a202c', marginBottom: '8px' }}>
              Change Password
            </h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>🛡️</span>
            <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
              <input 
                type="checkbox" 
                checked={settings.twoFactorAuth}
                onChange={(e) => handleSettingChange('twoFactorAuth', e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute',
                cursor: 'pointer',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: settings.twoFactorAuth ? '#319795' : '#cbd5e0',
                borderRadius: '24px',
                transition: '0.4s'
              }}>
                <span style={{
                  position: 'absolute',
                  content: '',
                  height: '18px',
                  width: '18px',
                  left: settings.twoFactorAuth ? '23px' : '3px',
                  bottom: '3px',
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  transition: '0.4s'
                }}></span>
              </span>
            </label>
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label>CURRENT PASSWORD</label>
            <input 
              type="password" 
              placeholder="••••••••••" 
              value={settings.currentPassword}
              onChange={(e) => handleSettingChange('currentPassword', e.target.value)}
            />
          </div>
          <div></div>
          <div className="form-group">
            <label>NEW PASSWORD</label>
            <input 
              type="password" 
              placeholder="••••••••••" 
              value={settings.newPassword}
              onChange={(e) => handleSettingChange('newPassword', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>CONFIRM NEW PASSWORD</label>
            <input 
              type="password" 
              placeholder="••••••••••" 
              value={settings.confirmPassword}
              onChange={(e) => handleSettingChange('confirmPassword', e.target.value)}
            />
          </div>
        </div>

        <button 
          className="btn btn-primary" 
          onClick={changePassword}
          disabled={saving || !settings.currentPassword || !settings.newPassword || !settings.confirmPassword}
        >
          {saving ? 'Updating...' : 'Update Password'}
        </button>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1a202c', marginBottom: '8px' }}>
          Two-Factor Auth
        </h3>
        <p style={{ color: '#718096', fontSize: '14px', marginBottom: '24px' }}>
          Add an extra layer of security to your account by requiring more than just a password to log in.
        </p>

        <div style={{ 
          background: '#f7fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ fontSize: '24px' }}>📱</span>
          <div>
            <div style={{ fontWeight: '500', color: '#1a202c' }}>Authenticator App</div>
            <div style={{ fontSize: '14px', color: settings.twoFactorAuth ? '#38a169' : '#e53e3e' }}>
              {settings.twoFactorAuth ? 'Configured and Active' : 'Not Configured'}
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1a202c' }}>
            Active Sessions
          </h3>
          <button 
            className="btn btn-danger" 
            style={{ fontSize: '12px', padding: '6px 12px' }}
            onClick={terminateAllSessions}
          >
            TERMINATE ALL SESSIONS
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {sessions.length > 0 ? sessions.map((session, index) => (
            <div key={session.id || index} style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '16px',
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              marginBottom: '12px'
            }}>
              <div style={{ fontSize: '24px' }}>
                {session.device_info?.includes('MacBook') ? '💻' : 
                 session.device_info?.includes('iPhone') ? '📱' : 
                 session.device_info?.includes('iPad') ? '📱' : '💻'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '500', color: '#1a202c' }}>
                  {session.device_info} • {session.browser}
                </div>
                <div style={{ fontSize: '14px', color: '#718096' }}>
                  {session.location} • {session.ip_address}
                </div>
                <div style={{ fontSize: '12px', color: '#718096' }}>
                  Last active: {new Date(session.last_activity).toLocaleString()}
                </div>
              </div>
              {session.is_current ? (
                <div style={{ 
                  background: '#38a169',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  Current
                </div>
              ) : (
                <button 
                  className="btn btn-danger"
                  style={{ fontSize: '12px', padding: '4px 8px' }}
                  onClick={() => terminateSession(session.id)}
                >
                  Terminate
                </button>
              )}
            </div>
          )) : (
            <div style={{ 
              padding: '32px',
              textAlign: 'center',
              color: '#718096',
              background: '#f7fafc',
              borderRadius: '8px'
            }}>
              No active sessions found
            </div>
          )}
        </div>
      </div>
    </div>
  )

  if (loading) {
    return <div className="loading">Loading settings...</div>
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#1a202c', marginBottom: '8px' }}>
          System Settings
        </h1>
        <p style={{ color: '#718096' }}>
          Manage your organizational identity, security protocols, and integration ecosystem from a centralized command center.
        </p>
      </div>

      {/* Message */}
      {message && (
        <div style={{ 
          marginBottom: '24px',
          padding: '12px 16px',
          borderRadius: '8px',
          backgroundColor: message.includes('✅') ? '#f0fff4' : '#fed7d7',
          color: message.includes('✅') ? '#22543d' : '#742a2a',
          border: `1px solid ${message.includes('✅') ? '#c6f6d5' : '#feb2b2'}`
        }}>
          {message}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '32px' }}>
        {/* Settings Navigation */}
        <div>
          <nav style={{ position: 'sticky', top: '24px' }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '12px 16px',
                  background: activeTab === tab.id ? '#e6fffa' : 'transparent',
                  color: activeTab === tab.id ? '#319795' : '#4a5568',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  marginBottom: '4px',
                  fontSize: '14px',
                  fontWeight: '500',
                  textAlign: 'left',
                  transition: 'all 0.2s ease'
                }}
              >
                <span>{tab.icon}</span>
                {tab.id}
              </button>
            ))}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="content-card">
          <div className="card-content">
            {activeTab === 'Profile Details' && renderProfileDetails()}
            {activeTab === 'Appearance' && renderAppearance()}
            {activeTab === 'Notifications' && renderNotifications()}
            {activeTab === 'Security & Privacy' && renderSecurityPrivacy()}
          </div>
        </div>
      </div>
    </div>
  )
}