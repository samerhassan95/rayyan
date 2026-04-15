'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function UserDashboard() {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem('user')
    const token = localStorage.getItem('token')
    
    if (!userData || !token) {
      router.push('/login')
      return
    }
    
    const parsedUser = JSON.parse(userData)
    if (parsedUser.role === 'admin') {
      router.push('/admin')
      return
    }
    
    setUser(parsedUser)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f7fafc' }}>
      {/* Header */}
      <div style={{ 
        background: 'white', 
        borderBottom: '1px solid #e2e8f0',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#1a202c' }}>
          RAYYAN
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ color: '#4a5568' }}>Welcome, {user.username}</span>
          <button 
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              background: '#e53e3e',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: '40px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: '700', color: '#1a202c', marginBottom: '8px' }}>
              User Dashboard
            </h2>
            <p style={{ color: '#718096', fontSize: '18px' }}>
              Welcome to your personal dashboard
            </p>
          </div>

          {/* User Info Card */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            marginBottom: '24px'
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#1a202c', marginBottom: '16px' }}>
              Account Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '14px', color: '#718096', fontWeight: '500' }}>Name</label>
                <p style={{ fontSize: '16px', color: '#1a202c', marginTop: '4px' }}>{user.username}</p>
              </div>
              <div>
                <label style={{ fontSize: '14px', color: '#718096', fontWeight: '500' }}>Email</label>
                <p style={{ fontSize: '16px', color: '#1a202c', marginTop: '4px' }}>{user.email}</p>
              </div>
              <div>
                <label style={{ fontSize: '14px', color: '#718096', fontWeight: '500' }}>Role</label>
                <p style={{ fontSize: '16px', color: '#1a202c', marginTop: '4px' }}>
                  <span style={{
                    background: '#e6fffa',
                    color: '#319795',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    {user.role.toUpperCase()}
                  </span>
                </p>
              </div>
              <div>
                <label style={{ fontSize: '14px', color: '#718096', fontWeight: '500' }}>Status</label>
                <p style={{ fontSize: '16px', color: '#1a202c', marginTop: '4px' }}>
                  <span style={{
                    background: '#f0fff4',
                    color: '#38a169',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    ACTIVE
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#1a202c', marginBottom: '16px' }}>
              Quick Actions
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <button style={{
                padding: '16px',
                background: '#319795',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'left'
              }}>
                <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '4px' }}>
                  View Profile
                </div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>
                  Update your account information
                </div>
              </button>
              
              <button style={{
                padding: '16px',
                background: '#3182ce',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'left'
              }}>
                <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '4px' }}>
                  Subscription
                </div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>
                  Manage your subscription
                </div>
              </button>
              
              <button style={{
                padding: '16px',
                background: '#805ad5',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'left'
              }}>
                <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '4px' }}>
                  Support
                </div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>
                  Get help and support
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}