'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statistics, setStatistics] = useState<any>(null)
  const [pagination, setPagination] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const router = useRouter()

  useEffect(() => {
    fetchUsers()
  }, [currentPage, searchTerm])

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }
      
      const params = new URLSearchParams()
      params.append('page', currentPage.toString())
      params.append('limit', '15')
      if (searchTerm) params.append('search', searchTerm)
      
      const response = await axios.get(`${API_URL}/api/admin/users?${params}`, { headers })
      setUsers(response.data.users || [])
      setStatistics(response.data.statistics || {})
      setPagination(response.data.pagination || {})
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUserClick = (userId: number) => {
    router.push(`/admin/users/${userId}`)
  }

  const updateUserStatus = async (userId: number, status: string, event: React.MouseEvent) => {
    event.stopPropagation() // Prevent navigation when clicking status button
    
    try {
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }
      
      await axios.put(`${API_URL}/api/admin/users/${userId}/status`, { status }, { headers })
      fetchUsers() // Refresh the list
    } catch (error) {
      console.error('Failed to update user status:', error)
    }
  }

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        fontSize: '18px',
        color: '#718096'
      }}>
        Loading users...
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#1a202c', margin: 0, marginBottom: '8px' }}>
              Users Management
            </h1>
            <p style={{ color: '#718096', fontSize: '16px', margin: 0 }}>
              Manage user accounts, permissions, and view detailed analytics
            </p>
          </div>
          <div style={{ 
            background: '#e6fffa', 
            color: '#319795', 
            padding: '12px 20px', 
            borderRadius: '12px', 
            fontSize: '14px', 
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>👥</span>
            {pagination?.total || users.length} Total Users
          </div>
        </div>

        {/* Search and Filters */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search users by name, email, or job title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '14px',
              background: 'white'
            }}
          />
          <button 
            onClick={() => fetchUsers()}
            style={{
              padding: '12px 20px',
              background: '#319795',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            🔍 Search
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#1a202c', marginBottom: '8px' }}>
            {statistics?.seatUtilization || 0}%
          </div>
          <div style={{ color: '#718096', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Seat Utilization
          </div>
        </div>
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#1a202c', marginBottom: '8px' }}>
            {statistics?.twoFactorEnabled || 0}
          </div>
          <div style={{ color: '#718096', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            2FA Enabled
          </div>
        </div>
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#1a202c', marginBottom: '8px' }}>
            {statistics?.avgActivation || 0}%
          </div>
          <div style={{ color: '#718096', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Recent Activity
          </div>
        </div>
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#1a202c', marginBottom: '8px' }}>
            {statistics?.recentInvites || 0}
          </div>
          <div style={{ color: '#718096', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            New This Month
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1a202c', margin: 0 }}>
            All Users
          </h2>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  User
                </th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Contact
                </th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Role & Status
                </th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Security
                </th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Joined
                </th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr 
                  key={user.id}
                  onClick={() => handleUserClick(user.id)}
                  style={{ 
                    cursor: 'pointer',
                    borderBottom: '1px solid #f7fafc',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '20px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: '#1a202c',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '16px',
                        fontWeight: '600'
                      }}>
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', color: '#1a202c', fontSize: '16px' }}>
                          {user.username}
                        </div>
                        <div style={{ color: '#718096', fontSize: '14px' }}>
                          {user.job_title || 'User'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '20px 24px' }}>
                    <div>
                      <div style={{ color: '#4a5568', fontSize: '14px', marginBottom: '4px' }}>
                        {user.email}
                      </div>
                      <div style={{ color: '#718096', fontSize: '13px' }}>
                        {user.phone || 'No phone'}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '20px 24px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span style={{
                        background: user.role === 'admin' ? '#fed7d7' : '#e6fffa',
                        color: user.role === 'admin' ? '#e53e3e' : '#319795',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        textTransform: 'capitalize',
                        width: 'fit-content'
                      }}>
                        {user.role}
                      </span>
                      <span style={{
                        background: user.status === 'active' ? '#c6f6d5' : '#fed7d7',
                        color: user.status === 'active' ? '#22543d' : '#742a2a',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        textTransform: 'capitalize',
                        width: 'fit-content'
                      }}>
                        {user.status}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '20px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        background: user.two_factor_enabled ? '#c6f6d5' : '#fed7d7',
                        color: user.two_factor_enabled ? '#22543d' : '#742a2a',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {user.two_factor_enabled ? '🔐 2FA' : '🔓 No 2FA'}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '20px 24px' }}>
                    <div style={{ color: '#718096', fontSize: '14px' }}>
                      {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td style={{ padding: '20px 24px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {user.status === 'active' ? (
                        <button
                          onClick={(e) => updateUserStatus(user.id, 'suspended', e)}
                          style={{
                            background: '#fed7d7',
                            color: '#e53e3e',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            fontWeight: '500'
                          }}
                        >
                          Suspend
                        </button>
                      ) : (
                        <button
                          onClick={(e) => updateUserStatus(user.id, 'active', e)}
                          style={{
                            background: '#c6f6d5',
                            color: '#22543d',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            fontWeight: '500'
                          }}
                        >
                          Activate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ padding: '20px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: '#718096', fontSize: '14px' }}>
            Showing {((currentPage - 1) * 15) + 1} to {Math.min(currentPage * 15, pagination?.total || 0)} of {pagination?.total || 0} users
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              style={{ 
                background: currentPage === 1 ? '#f7fafc' : '#319795', 
                border: 'none', 
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                color: currentPage === 1 ? '#cbd5e0' : 'white',
                fontSize: '14px',
                padding: '8px 16px',
                borderRadius: '6px',
                fontWeight: '500'
              }}
            >
              Previous
            </button>
            <span style={{ 
              padding: '8px 16px', 
              color: '#4a5568', 
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center'
            }}>
              Page {currentPage} of {pagination?.pages || 1}
            </span>
            <button 
              onClick={() => setCurrentPage(Math.min(pagination?.pages || 1, currentPage + 1))}
              disabled={currentPage === (pagination?.pages || 1)}
              style={{ 
                background: currentPage === (pagination?.pages || 1) ? '#f7fafc' : '#319795', 
                border: 'none', 
                cursor: currentPage === (pagination?.pages || 1) ? 'not-allowed' : 'pointer',
                color: currentPage === (pagination?.pages || 1) ? '#cbd5e0' : 'white',
                fontSize: '14px',
                padding: '8px 16px',
                borderRadius: '6px',
                fontWeight: '500'
              }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}