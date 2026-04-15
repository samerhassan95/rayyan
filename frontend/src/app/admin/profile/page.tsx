'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export default function AdminProfile() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState('Personal Info')
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    phone: '',
    address: '',
    job_title: '',
    bio: '',
    profile_image: ''
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [sessions, setSessions] = useState<any[]>([])
  const [activityLog, setActivityLog] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    fetchProfileData()
  }, [])

  const fetchProfileData = async () => {
    try {
      const token = localStorage.getItem('token')
      const userData = localStorage.getItem('user')
      const headers = { Authorization: `Bearer ${token}` }

      if (userData) {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
        
        // Fetch full user details
        const response = await axios.get(`${API_URL}/api/admin/users/${parsedUser.id}`, { headers })
        const userDetails = response.data.user
        
        setProfileData({
          username: userDetails.username || '',
          email: userDetails.email || '',
          phone: userDetails.phone || '',
          address: userDetails.address || '',
          job_title: userDetails.job_title || '',
          bio: userDetails.bio || '',
          profile_image: userDetails.profile_image || ''
        })
        
        setSessions(response.data.sessions || [])
        
        // Fetch activity log
        const activityResponse = await axios.get(`${API_URL}/api/admin/activity-log`, { headers })
        setActivityLog(activityResponse.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch profile data:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async () => {
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }

      await axios.put(`${API_URL}/api/admin/users/${user.id}`, profileData, { headers })
      
      // Update localStorage
      const updatedUser = { ...user, ...profileData }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      setUser(updatedUser)
      
      setMessage('✅ Profile updated successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('❌ Failed to update profile')
      setTimeout(() => setMessage(''), 3000)
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage('❌ Passwords do not match')
      setTimeout(() => setMessage(''), 3000)
      return
    }

    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }

      await axios.put(`${API_URL}/api/auth/change-password`, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      }, { headers })

      setMessage('✅ Password changed successfully!')
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
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
      fetchProfileData() // Refresh data
      setMessage('✅ Session terminated')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('❌ Failed to terminate session')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const tabs = [
    { id: 'Personal Info', icon: '👤' },
    { id: 'Security', icon: '🔒' },
    { id: 'Activity', icon: '📊' },
    { id: 'Sessions', icon: '💻' }
  ]

  if (loading) {
    return <div className="loading">Loading profile...</div>
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <button 
          onClick={() => router.back()}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: '#319795', 
            cursor: 'pointer',
            marginBottom: '16px',
            fontSize: '14px'
          }}
        >
          ← Back to Dashboard
        </button>
        <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#1a202c', marginBottom: '8px' }}>
          Admin Profile
        </h1>
        <p style={{ color: '#718096' }}>
          Manage your account settings and preferences
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
        {/* Profile Navigation */}
        <div>
          {/* Profile Card */}
          <div className="content-card" style={{ marginBottom: '24px' }}>
            <div className="card-content" style={{ textAlign: 'center' }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: '#1a202c',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '32px',
                fontWeight: '600',
                margin: '0 auto 16px'
              }}>
                {profileData.username?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>
                {profileData.username || 'Admin User'}
              </h3>
              <p style={{ color: '#718096', fontSize: '14px', marginBottom: '16px' }}>
                {profileData.job_title || 'System Administrator'}
              </p>
              <div style={{
                background: '#e6fffa',
                color: '#319795',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '600',
                display: 'inline-block'
              }}>
                ADMIN
              </div>
            </div>
          </div>

          {/* Navigation */}
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

        {/* Profile Content */}
        <div className="content-card">
          <div className="card-content">
            {activeTab === 'Personal Info' && (
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '24px' }}>
                  Personal Information
                </h3>

                <div className="form-grid">
                  <div className="form-group">
                    <label>USERNAME</label>
                    <input 
                      type="text" 
                      value={profileData.username}
                      onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>EMAIL</label>
                    <input 
                      type="email" 
                      value={profileData.email}
                      onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                      disabled
                      style={{ background: '#f7fafc', cursor: 'not-allowed' }}
                    />
                    <small style={{ color: '#718096', fontSize: '12px' }}>Email cannot be changed</small>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>PHONE</label>
                    <input 
                      type="tel" 
                      value={profileData.phone}
                      onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div className="form-group">
                    <label>JOB TITLE</label>
                    <input 
                      type="text" 
                      value={profileData.job_title}
                      onChange={(e) => setProfileData(prev => ({ ...prev, job_title: e.target.value }))}
                      placeholder="System Administrator"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>ADDRESS</label>
                  <input 
                    type="text" 
                    value={profileData.address}
                    onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="123 Main St, City, State 12345"
                  />
                </div>

                <div className="form-group">
                  <label>BIO</label>
                  <textarea 
                    rows={4}
                    value={profileData.bio}
                    onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <button 
                  className="btn btn-primary" 
                  onClick={updateProfile}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}

            {activeTab === 'Security' && (
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '24px' }}>
                  Security Settings
                </h3>

                <div style={{ marginBottom: '32px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '16px' }}>
                    Change Password
                  </h4>

                  <div className="form-group">
                    <label>CURRENT PASSWORD</label>
                    <input 
                      type="password" 
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      placeholder="Enter current password"
                    />
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>NEW PASSWORD</label>
                      <input 
                        type="password" 
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        placeholder="Enter new password"
                      />
                    </div>
                    <div className="form-group">
                      <label>CONFIRM PASSWORD</label>
                      <input 
                        type="password" 
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>

                  <button 
                    className="btn btn-primary" 
                    onClick={changePassword}
                    disabled={saving || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                  >
                    {saving ? 'Updating...' : 'Change Password'}
                  </button>
                </div>

                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '16px' }}>
                    Two-Factor Authentication
                  </h4>
                  <div style={{ 
                    background: '#f7fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '16px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '24px' }}>📱</span>
                      <div>
                        <div style={{ fontWeight: '500', color: '#1a202c' }}>Authenticator App</div>
                        <div style={{ fontSize: '14px', color: '#718096' }}>
                          Add an extra layer of security to your account
                        </div>
                      </div>
                      <button className="btn btn-secondary" style={{ marginLeft: 'auto' }}>
                        Enable 2FA
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Activity' && (
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '24px' }}>
                  Recent Activity
                </h3>

                <div style={{ space: '16px' }}>
                  {activityLog.length > 0 ? activityLog.map((activity, index) => (
                    <div key={index} style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '16px',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      marginBottom: '12px'
                    }}>
                      <div style={{ fontSize: '24px' }}>
                        {activity.action === 'login' ? '🔐' : 
                         activity.action === 'update' ? '✏️' : 
                         activity.action === 'delete' ? '🗑️' : '📝'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '500', color: '#1a202c' }}>
                          {activity.description}
                        </div>
                        <div style={{ fontSize: '14px', color: '#718096' }}>
                          {new Date(activity.created_at).toLocaleString()}
                        </div>
                      </div>
                      <div style={{ fontSize: '12px', color: '#718096' }}>
                        {activity.ip_address}
                      </div>
                    </div>
                  )) : (
                    // Mock activity data
                    [
                      { action: 'login', description: 'Logged in to admin dashboard', created_at: new Date(), ip_address: '192.168.1.1' },
                      { action: 'update', description: 'Updated user profile settings', created_at: new Date(Date.now() - 3600000), ip_address: '192.168.1.1' },
                      { action: 'delete', description: 'Deleted inactive user account', created_at: new Date(Date.now() - 7200000), ip_address: '192.168.1.1' }
                    ].map((activity, index) => (
                      <div key={index} style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '16px',
                        background: '#f8fafc',
                        borderRadius: '8px',
                        marginBottom: '12px'
                      }}>
                        <div style={{ fontSize: '24px' }}>
                          {activity.action === 'login' ? '🔐' : 
                           activity.action === 'update' ? '✏️' : 
                           activity.action === 'delete' ? '🗑️' : '📝'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '500', color: '#1a202c' }}>
                            {activity.description}
                          </div>
                          <div style={{ fontSize: '14px', color: '#718096' }}>
                            {activity.created_at.toLocaleString()}
                          </div>
                        </div>
                        <div style={{ fontSize: '12px', color: '#718096' }}>
                          {activity.ip_address}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'Sessions' && (
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '24px' }}>
                  Active Sessions
                </h3>

                <div style={{ space: '16px' }}>
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
                    // Mock session data
                    [
                      { id: 1, device_info: 'MacBook Pro', browser: 'Chrome 118', location: 'New York, US', ip_address: '192.168.1.1', is_current: true, last_activity: new Date() },
                      { id: 2, device_info: 'iPhone 14', browser: 'Safari', location: 'New York, US', ip_address: '192.168.1.2', is_current: false, last_activity: new Date(Date.now() - 3600000) }
                    ].map((session, index) => (
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
                            Last active: {session.last_activity.toLocaleString()}
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
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}