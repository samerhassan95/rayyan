'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { useLanguage } from '../../i18n/LanguageContext'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export default function AdminProfile() {
  const { t, isRTL } = useLanguage()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState(t('personal_info'))
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
    } catch (error: any) {
      console.error('Update failed:', error)
      setMessage(`❌ Failed to update profile: ${error.response?.data?.error || error.message}`)
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

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('photo', file)

    setSaving(true)
    setMessage('⏳ Uploading photo...')

    try {
      const token = localStorage.getItem('token')
      const headers = { 
        Authorization: `Bearer ${token}`
      }

      const response = await axios.post(`${API_URL}/api/admin/upload-profile-photo`, formData, { headers })
      const photoUrl = response.data.photoUrl

      setProfileData(prev => ({ ...prev, profile_image: photoUrl }))
      setMessage('✅ Photo uploaded! Don\'t forget to save changes.')
      setTimeout(() => setMessage(''), 3000)
    } catch (error: any) {
      console.error('Upload failed:', error)
      setMessage(`❌ Upload failed: ${error.response?.data?.error || 'Unknown error'}`)
      setTimeout(() => setMessage(''), 3000)
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    { id: t('personal_info'), icon: '👤' },
    { id: t('security'), icon: '🔒' },
    { id: t('activity'), icon: '📊' },
    { id: t('sessions'), icon: '💻' }
  ]

  if (loading) {
    return <div className="loading">{t('loading')}...</div>
  }

  return (
    <div style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
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
          {isRTL ? t('back_to_dashboard') + ' ←' : '← ' + t('back_to_dashboard')}
        </button>
        <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#1a202c', marginBottom: '8px' }}>
          {t('admin_profile')}
        </h1>
        <p style={{ color: '#718096' }}>
          {t('manage_account_settings')}
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
              <div 
                onClick={() => document.getElementById('profile-photo-input')?.click()}
                style={{
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
                  margin: '0 auto 16px',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  position: 'relative',
                  border: '2px solid #e2e8f0'
                }}
              >
                {profileData.profile_image ? (
                  <img 
                    src={profileData.profile_image.startsWith('http') ? profileData.profile_image : `${API_URL}${profileData.profile_image}`} 
                    alt="Profile" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  profileData.username?.charAt(0)?.toUpperCase() || 'A'
                )}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: 'rgba(0,0,0,0.4)',
                  color: 'white',
                  fontSize: '10px',
                  padding: '2px 0',
                  opacity: 0,
                  transition: 'opacity 0.2s',
                  display: 'flex',
                  justifyContent: 'center'
                }} className="photo-hover">
                  EDIT
                </div>
              </div>
              <input 
                id="profile-photo-input"
                type="file" 
                accept="image/*" 
                onChange={handlePhotoChange} 
                style={{ display: 'none' }}
              />
              <style jsx>{`
                div:hover .photo-hover {
                  opacity: 1 !important;
                }
              `}</style>
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
                {t('admin_user')}
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
            {activeTab === t('personal_info') && (
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '24px' }}>
                  {t('personal_info')}
                </h3>

                <div className="form-grid">
                  <div className="form-group">
                    <label>{t('username_label').toUpperCase()}</label>
                    <input 
                      type="text" 
                      value={profileData.username}
                      onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('email_label').toUpperCase()}</label>
                    <input 
                      type="email" 
                      value={profileData.email}
                      onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                      disabled
                      style={{ background: '#f7fafc', cursor: 'not-allowed' }}
                    />
                    <small style={{ color: '#718096', fontSize: '12px' }}>{t('email_cannot_be_changed')}</small>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>{t('phone').toUpperCase()}</label>
                    <input 
                      type="tel" 
                      value={profileData.phone}
                      onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('job_title_label').toUpperCase()}</label>
                    <input 
                      type="text" 
                      value={profileData.job_title}
                      onChange={(e) => setProfileData(prev => ({ ...prev, job_title: e.target.value }))}
                      placeholder="System Administrator"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>{t('address').toUpperCase()}</label>
                  <input 
                    type="text" 
                    value={profileData.address}
                    onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="123 Main St, City, State 12345"
                  />
                </div>

                <div className="form-group">
                  <label>{t('bio').toUpperCase()}</label>
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
                  {saving ? t('saving') + '...' : t('save_changes')}
                </button>
              </div>
            )}

            {activeTab === t('security') && (
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '24px' }}>
                  {t('security_settings')}
                </h3>

                <div style={{ marginBottom: '32px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '16px' }}>
                    {t('change_password')}
                  </h4>

                  <div className="form-group">
                    <label>{t('current_password').toUpperCase()}</label>
                    <input 
                      type="password" 
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      placeholder={t('enter_current_password')}
                    />
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>{t('new_password').toUpperCase()}</label>
                      <input 
                        type="password" 
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        placeholder={t('enter_new_password')}
                      />
                    </div>
                    <div className="form-group">
                      <label>{t('confirm_password').toUpperCase()}</label>
                      <input 
                        type="password" 
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder={t('confirm_new_password')}
                      />
                    </div>
                  </div>

                  <button 
                    className="btn btn-primary" 
                    onClick={changePassword}
                    disabled={saving || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                  >
                    {saving ? t('updating') + '...' : t('change_password')}
                  </button>
                </div>

                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '16px' }}>
                    {t('two_factor_auth')}
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
                        <div style={{ fontWeight: '500', color: '#1a202c' }}>{t('authenticator_app')}</div>
                        <div style={{ fontSize: '14px', color: '#718096' }}>
                          {t('add_extra_security')}
                        </div>
                      </div>
                      <button className="btn btn-secondary" style={{ marginLeft: 'auto' }}>
                        {t('enable_2fa')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === t('activity') && (
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '24px' }}>
                  {t('recent_activity')}
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

            {activeTab === t('sessions') && (
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '24px' }}>
                  {t('active_sessions')}
                </h3>

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
                          {t('last_active')}: {new Date(session.last_activity).toLocaleString()}
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
                          {t('current')}
                        </div>
                      ) : (
                        <button 
                          className="btn btn-danger"
                          style={{ fontSize: '12px', padding: '4px 8px' }}
                          onClick={() => terminateSession(session.id)}
                        >
                          {t('terminate')}
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
                            {t('last_active')}: {session.last_activity.toLocaleString()}
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
                            {t('current')}
                          </div>
                        ) : (
                          <button 
                            className="btn btn-danger"
                            style={{ fontSize: '12px', padding: '4px 8px' }}
                            onClick={() => terminateSession(session.id)}
                          >
                            {t('terminate')}
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