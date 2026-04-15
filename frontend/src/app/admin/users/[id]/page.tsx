'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

// Modal Component
const Modal = ({ isOpen, onClose, title, children, type = 'info' }: {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  type?: 'info' | 'success' | 'warning' | 'error'
}) => {
  if (!isOpen) return null

  const getModalColors = () => {
    switch (type) {
      case 'success':
        return { border: '#10b981', background: '#ecfdf5', icon: '✅' }
      case 'warning':
        return { border: '#f59e0b', background: '#fffbeb', icon: '⚠️' }
      case 'error':
        return { border: '#ef4444', background: '#fef2f2', icon: '❌' }
      default:
        return { border: '#3b82f6', background: '#eff6ff', icon: 'ℹ️' }
    }
  }

  const colors = getModalColors()

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        background: 'white', borderRadius: '12px', padding: '24px',
        maxWidth: '500px', width: '90%', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        border: `2px solid ${colors.border}`
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px',
          padding: '16px', background: colors.background, borderRadius: '8px'
        }}>
          <span style={{ fontSize: '24px' }}>{colors.icon}</span>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1a202c' }}>
            {title}
          </h3>
        </div>
        <div style={{ marginBottom: '24px' }}>{children}</div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            background: '#e2e8f0', color: '#4a5568', border: 'none',
            padding: '10px 20px', borderRadius: '8px', cursor: 'pointer'
          }}>Close</button>
        </div>
      </div>
    </div>
  )
}

// Confirmation Modal
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm' }: {
  isOpen: boolean, onClose: () => void, onConfirm: () => void
  title: string, message: string, confirmText?: string
}) => {
  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        background: 'white', borderRadius: '12px', padding: '24px',
        maxWidth: '400px', width: '90%', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>{title}</h3>
        <p style={{ margin: '0 0 24px 0', color: '#4a5568' }}>{message}</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button onClick={onClose} style={{
            background: '#e2e8f0', color: '#4a5568', border: 'none',
            padding: '10px 20px', borderRadius: '8px', cursor: 'pointer'
          }}>Cancel</button>
          <button onClick={onConfirm} style={{
            background: '#ef4444', color: 'white', border: 'none',
            padding: '10px 20px', borderRadius: '8px', cursor: 'pointer'
          }}>{confirmText}</button>
        </div>
      </div>
    </div>
  )
}
// Usage Activity Chart Component
const UsageActivityChart = ({ period, userId }: { period: string, userId: string | string[] }) => {
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchUsageActivity()
  }, [period, userId])

  const fetchUsageActivity = async () => {
    if (!userId) return
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }
      const response = await axios.get(`${API_URL}/api/admin/users/${userId}/usage-activity?period=${period}`, { headers })
      setChartData(response.data.usageActivity || [])
    } catch (error) {
      console.error('Failed to fetch usage activity:', error)
      setChartData([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#718096' }}>
        Loading chart data...
      </div>
    )
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div style={{ height: '250px', background: '#f8fafc', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#718096', flexDirection: 'column', gap: '8px' }}>
        <div style={{ fontSize: '24px' }}>📊</div>
        <div>No usage data available</div>
      </div>
    )
  }

  // Chart calculations
  const chartWidth = 800, chartHeight = 200
  const padding = { top: 20, right: 40, bottom: 40, left: 60 }
  const innerWidth = chartWidth - padding.left - padding.right
  const innerHeight = chartHeight - padding.top - padding.bottom

  const values = chartData.map(d => d.value)
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const valueRange = maxValue - minValue || 1

  const points = chartData.map((item, index) => ({
    x: padding.left + (index / (chartData.length - 1)) * innerWidth,
    y: padding.top + innerHeight - ((item.value - minValue) / valueRange) * innerHeight,
    value: item.value,
    date: item.date
  }))

  // Create smooth curve path
  let pathData = `M ${points[0].x} ${points[0].y}`
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    const cpx = (prev.x + curr.x) / 2
    pathData += ` Q ${cpx} ${prev.y} ${curr.x} ${curr.y}`
  }

  const areaPath = pathData + ` L ${points[points.length - 1].x} ${chartHeight - padding.bottom} L ${padding.left} ${chartHeight - padding.bottom} Z`

  // Generate X-axis labels (show 5 evenly spaced dates)
  const xLabels = []
  const labelCount = 5
  for (let i = 0; i < labelCount; i++) {
    const dataIndex = Math.floor((i / (labelCount - 1)) * (chartData.length - 1))
    const item = chartData[dataIndex]
    const x = padding.left + (dataIndex / (chartData.length - 1)) * innerWidth
    const date = new Date(item.date)
    
    let label
    if (period === 'Year') {
      label = date.toLocaleDateString('en-US', { month: 'short' })
    } else if (period === 'Month') {
      label = `${date.getDate().toString().padStart(2, '0')} ${date.toLocaleDateString('en-US', { month: 'short' })}`
    } else {
      label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
    
    xLabels.push({ label, x })
  }

  // Generate Y-axis labels
  const yLabels = []
  for (let i = 0; i <= 4; i++) {
    const value = minValue + (valueRange * i / 4)
    const y = padding.top + innerHeight - (i / 4) * innerHeight
    yLabels.push({ value: Math.round(value), y })
  }

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg width={chartWidth} height={chartHeight + 40} style={{ display: 'block', margin: '0 auto' }}>
        <defs>
          <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#319795" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#319795" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {yLabels.map((label, index) => (
          <line
            key={`grid-${index}`}
            x1={padding.left}
            y1={label.y}
            x2={chartWidth - padding.right}
            y2={label.y}
            stroke="#f1f5f9"
            strokeWidth="1"
          />
        ))}

        {/* Area under curve */}
        <path d={areaPath} fill="url(#chartGradient)" />

        {/* Main curve line */}
        <path d={pathData} fill="none" stroke="#319795" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points */}
        {points.map((point, index) => (
          <circle
            key={`point-${index}`}
            cx={point.x}
            cy={point.y}
            r="4"
            fill="#319795"
            stroke="white"
            strokeWidth="2"
          >
            <title>{`${point.date}: ${point.value} units`}</title>
          </circle>
        ))}

        {/* Y-axis labels */}
        {yLabels.map((label, index) => (
          <text
            key={`y-label-${index}`}
            x={padding.left - 10}
            y={label.y + 4}
            textAnchor="end"
            fontSize="12"
            fill="#718096"
          >
            {label.value}
          </text>
        ))}

        {/* X-axis labels */}
        {xLabels.map((label, index) => (
          <text
            key={`x-label-${index}`}
            x={label.x}
            y={chartHeight - padding.bottom + 20}
            textAnchor="middle"
            fontSize="12"
            fill="#718096"
          >
            {label.label}
          </text>
        ))}
      </svg>

      {/* Chart summary */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginTop: '16px',
        padding: '12px 16px',
        background: '#f8fafc',
        borderRadius: '8px',
        fontSize: '12px',
        color: '#4a5568'
      }}>
        <div>
          <strong>Period:</strong> {period} | <strong>Points:</strong> {chartData.length}
        </div>
        <div>
          <strong>Range:</strong> {minValue} - {maxValue} | <strong>Avg:</strong> {Math.round(values.reduce((a, b) => a + b, 0) / values.length)}
        </div>
      </div>
    </div>
  )
}
export default function UserDetail() {
  const [userDetail, setUserDetail] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [editForm, setEditForm] = useState<any>({})
  const [chartPeriod, setChartPeriod] = useState('Month')
  const [supportTicketsFilter, setSupportTicketsFilter] = useState('all')
  
  // Modal states
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [modalMessage, setModalMessage] = useState('')
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {})
  const [confirmTitle, setConfirmTitle] = useState('')
  const [confirmMessage, setConfirmMessage] = useState('')
  
  const router = useRouter()
  const params = useParams()
  const userId = params.id

  useEffect(() => {
    if (userId) {
      fetchUserDetail(Number(userId))
    }
  }, [userId])

  const fetchUserDetail = async (id: number) => {
    try {
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }
      const response = await axios.get(`${API_URL}/api/admin/users/${id}`, { headers })
      
      console.log('✅ User detail response:', response.data)
      
      setUserDetail(response.data)
      setEditForm({
        username: response.data.user.username,
        email: response.data.user.email,
        phone: response.data.user.phone || '',
        address: response.data.user.address || '',
        job_title: response.data.user.job_title || '',
        bio: response.data.user.bio || ''
      })
    } catch (error) {
      console.error('Failed to fetch user details:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }
      await axios.put(`${API_URL}/api/admin/users/${userId}`, editForm, { headers })
      setIsEditingProfile(false)
      fetchUserDetail(Number(userId))
      setModalMessage('Profile updated successfully!')
      setShowSuccessModal(true)
    } catch (error) {
      console.error('Failed to update profile:', error)
      setModalMessage('Failed to update profile. Please try again.')
      setShowErrorModal(true)
    }
  }

  const suspendUser = async () => {
    const newStatus = userDetail.user.status === 'active' ? 'suspended' : 'active'
    const actionText = newStatus === 'suspended' ? 'suspend' : 'activate'
    
    setConfirmTitle(`${actionText.charAt(0).toUpperCase() + actionText.slice(1)} User`)
    setConfirmMessage(`Are you sure you want to ${actionText} ${userDetail.user.username}?`)
    setConfirmAction(() => async () => {
      try {
        const token = localStorage.getItem('token')
        const headers = { Authorization: `Bearer ${token}` }
        await axios.put(`${API_URL}/api/admin/users/${userId}/status`, { status: newStatus }, { headers })
        fetchUserDetail(Number(userId))
        setModalMessage(`User ${actionText}d successfully!`)
        setShowSuccessModal(true)
        setShowConfirmModal(false)
      } catch (error) {
        console.error('Failed to update user status:', error)
        setModalMessage(`Failed to ${actionText} user. Please try again.`)
        setShowErrorModal(true)
        setShowConfirmModal(false)
      }
    })
    setShowConfirmModal(true)
  }

  const toggleTwoFactor = async () => {
    const newStatus = !userDetail?.user?.two_factor_enabled
    const actionText = newStatus ? 'enable' : 'disable'
    
    setConfirmTitle(`${actionText.charAt(0).toUpperCase() + actionText.slice(1)} 2FA`)
    setConfirmMessage(`Are you sure you want to ${actionText} two-factor authentication?`)
    setConfirmAction(() => async () => {
      try {
        const token = localStorage.getItem('token')
        const headers = { Authorization: `Bearer ${token}` }
        await axios.put(`${API_URL}/api/admin/users/${userId}/two-factor`, { enabled: newStatus }, { headers })
        fetchUserDetail(Number(userId))
        setModalMessage(`Two-factor authentication ${actionText}d successfully!`)
        setShowSuccessModal(true)
        setShowConfirmModal(false)
      } catch (error) {
        console.error('Failed to toggle 2FA:', error)
        setModalMessage(`Failed to ${actionText} 2FA. Please try again.`)
        setShowErrorModal(true)
        setShowConfirmModal(false)
      }
    })
    setShowConfirmModal(true)
  }
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px', fontSize: '18px', color: '#718096' }}>
        Loading user details...
      </div>
    )
  }

  if (!userDetail) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', color: '#718096', textAlign: 'center' }}>
        <div style={{ fontSize: '64px', marginBottom: '24px' }}>❌</div>
        <h3 style={{ fontSize: '24px', fontWeight: '600', color: '#1a202c', marginBottom: '12px' }}>User Not Found</h3>
        <button onClick={() => router.push('/admin/users')} style={{ background: '#319795', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer' }}>
          ← Back to Users
        </button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <button onClick={() => router.push('/admin/users')} style={{ background: 'none', border: '1px solid #e2e8f0', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', marginBottom: '16px' }}>
          ← Back to Users
        </button>
      </div>

      {/* User Profile */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '32px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px' }}>
          <div style={{ width: '120px', height: '120px', borderRadius: '12px', background: '#1a202c', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '48px', fontWeight: '600' }}>
            {userDetail.user.username?.charAt(0)?.toUpperCase()}
          </div>
          
          <div style={{ flex: 1 }}>
            {isEditingProfile ? (
              <div>
                <input
                  type="text"
                  value={editForm.username}
                  onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                  style={{
                    fontSize: '28px', fontWeight: '600', color: '#1a202c',
                    border: '2px solid #e2e8f0', borderRadius: '8px',
                    padding: '4px 8px', background: 'white', marginBottom: '8px', width: '300px'
                  }}
                />
                <input
                  type="text"
                  value={editForm.job_title}
                  onChange={(e) => setEditForm({...editForm, job_title: e.target.value})}
                  placeholder="Job Title"
                  style={{
                    color: '#718096', fontSize: '16px', marginBottom: '16px',
                    border: '1px solid #e2e8f0', borderRadius: '4px',
                    padding: '8px', width: '300px', display: 'block'
                  }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>📧</span>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                      style={{
                        color: '#4a5568', border: '1px solid #e2e8f0',
                        borderRadius: '4px', padding: '4px 8px', width: '200px'
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>📍</span>
                    <input
                      type="text"
                      value={editForm.address}
                      onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                      placeholder="Address"
                      style={{
                        color: '#4a5568', border: '1px solid #e2e8f0',
                        borderRadius: '4px', padding: '4px 8px', width: '200px'
                      }}
                    />
                  </div>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                    placeholder="Phone Number"
                    style={{
                      color: '#4a5568', border: '1px solid #e2e8f0',
                      borderRadius: '4px', padding: '8px', width: '300px', marginRight: '16px'
                    }}
                  />
                </div>
                <div>
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                    placeholder="Bio"
                    rows={3}
                    style={{
                      color: '#4a5568', border: '1px solid #e2e8f0',
                      borderRadius: '4px', padding: '8px', width: '400px', resize: 'vertical'
                    }}
                  />
                </div>
              </div>
            ) : (
              <div>
                <h1 style={{ fontSize: '28px', fontWeight: '600', color: '#1a202c', margin: 0 }}>
                  {userDetail.user.username}
                </h1>
                <p style={{ color: '#718096', fontSize: '16px', marginBottom: '16px' }}>
                  {userDetail.user.job_title || 'Platform User'}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '16px' }}>
                  <span>📧 {userDetail.user.email}</span>
                  <span>📍 {userDetail.user.address || 'Location not set'}</span>
                </div>
                {userDetail.user.phone && (
                  <div style={{ marginBottom: '8px' }}>
                    <span>📞 {userDetail.user.phone}</span>
                  </div>
                )}
                {userDetail.user.bio && (
                  <div style={{ marginBottom: '16px', color: '#4a5568', fontStyle: 'italic' }}>
                    "{userDetail.user.bio}"
                  </div>
                )}
                <div style={{ display: 'flex', gap: '12px' }}>
                  {userDetail.user.acquisition_source && (
                    <span style={{
                      background: '#e6fffa', color: '#319795', padding: '4px 12px',
                      borderRadius: '16px', fontSize: '12px', fontWeight: '500'
                    }}>
                      {userDetail.user.acquisition_source}
                    </span>
                  )}
                  <span style={{
                    background: '#e6fffa', color: '#319795', padding: '4px 12px',
                    borderRadius: '16px', fontSize: '12px', fontWeight: '500'
                  }}>
                    {userDetail.user.role}
                  </span>
                  <span style={{
                    background: userDetail.user.status === 'active' ? '#e6fffa' : '#fed7d7',
                    color: userDetail.user.status === 'active' ? '#319795' : '#e53e3e',
                    padding: '4px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: '500'
                  }}>
                    {userDetail.user.status}
                  </span>
                </div>
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            {!isEditingProfile ? (
              <>
                <button onClick={() => setIsEditingProfile(true)} style={{ background: '#e2e8f0', color: '#4a5568', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer' }}>
                  ✏️ Edit Profile
                </button>
                <button onClick={suspendUser} style={{ background: '#e53e3e', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer' }}>
                  {userDetail.user.status === 'active' ? '🚫 Suspend' : '✅ Activate'}
                </button>
              </>
            ) : (
              <>
                <button onClick={handleSaveProfile} style={{ background: '#319795', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer' }}>
                  💾 Save
                </button>
                <button onClick={() => setIsEditingProfile(false)} style={{ background: '#e2e8f0', color: '#4a5568', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer' }}>
                  ❌ Cancel
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
        <div style={{ textAlign: 'center', padding: '20px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#1a202c', marginBottom: '4px' }}>
            ${userDetail?.statistics?.totalPayments || '0.00'}
          </div>
          <div style={{ fontSize: '12px', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            TOTAL PAYMENTS
          </div>
        </div>
        <div style={{ textAlign: 'center', padding: '20px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#1a202c', marginBottom: '4px' }}>
            {userDetail?.statistics?.activeSubscriptions || '0'}
          </div>
          <div style={{ fontSize: '12px', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            ACTIVE SUBSCRIPTIONS
          </div>
        </div>
        <div style={{ textAlign: 'center', padding: '20px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#1a202c', marginBottom: '4px' }}>
            ${userDetail?.statistics?.totalSpend || '0.00'}
          </div>
          <div style={{ fontSize: '12px', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            TOTAL SPEND
          </div>
        </div>
        <div style={{ textAlign: 'center', padding: '20px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#1a202c', marginBottom: '4px' }}>
            {userDetail?.statistics?.openTickets || '0'} Open
          </div>
          <div style={{ fontSize: '12px', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            SUPPORT TICKETS
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
        {/* Left Column */}
        <div>
          {/* Usage Activity Chart */}
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1a202c', marginBottom: '4px' }}>Usage Activity</h3>
                <p style={{ color: '#718096', fontSize: '14px' }}>Resource consumption over the selected period</p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['Week', 'Month', 'Year'].map(period => (
                  <button key={period} style={{
                    background: chartPeriod === period ? '#319795' : '#e2e8f0',
                    color: chartPeriod === period ? 'white' : '#4a5568',
                    border: 'none', fontSize: '12px', padding: '6px 12px',
                    borderRadius: '6px', cursor: 'pointer', fontWeight: '500'
                  }} onClick={() => setChartPeriod(period)}>
                    {period}
                  </button>
                ))}
              </div>
            </div>
            <UsageActivityChart period={chartPeriod} userId={userId} />
          </div>

          {/* Support Tickets */}
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1a202c' }}>Support Tickets</h3>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <select value={supportTicketsFilter} onChange={(e) => setSupportTicketsFilter(e.target.value)} style={{ padding: '4px 8px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px' }}>
                  <option value="all">All Tickets</option>
                  <option value="open">Open</option>
                  <option value="pending">Pending</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#718096' }}>TICKET ID</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#718096' }}>SUBJECT</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#718096' }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {userDetail?.supportTickets?.length > 0 ? (
                    userDetail.supportTickets
                      .filter((ticket: any) => supportTicketsFilter === 'all' || ticket.status === supportTicketsFilter)
                      .slice(0, 5)
                      .map((ticket: any) => (
                      <tr key={ticket.id} style={{ borderBottom: '1px solid #f7fafc' }}>
                        <td style={{ padding: '16px' }}>#{ticket.ticket_number}</td>
                        <td style={{ padding: '16px' }}>{ticket.subject}</td>
                        <td style={{ padding: '16px' }}>
                          <span style={{
                            background: ticket.status === 'open' ? '#fed7d7' : ticket.status === 'pending' ? '#feebc8' : '#c6f6d5',
                            color: ticket.status === 'open' ? '#742a2a' : ticket.status === 'pending' ? '#7b341e' : '#22543d',
                            padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '500'
                          }}>
                            {ticket.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={3} style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>No support tickets found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {/* Right Column - Security Context */}
        <div>
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1a202c', marginBottom: '20px' }}>Security Context</h3>
            
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: '#4a5568' }}>🔐 2FA Status</span>
                <button onClick={toggleTwoFactor} style={{
                  background: userDetail?.user?.two_factor_enabled ? '#e6fffa' : '#fed7d7',
                  color: userDetail?.user?.two_factor_enabled ? '#319795' : '#e53e3e',
                  padding: '2px 8px', borderRadius: '4px', fontSize: '12px',
                  fontWeight: '600', border: 'none', cursor: 'pointer'
                }}>
                  {userDetail?.user?.two_factor_enabled ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: '#4a5568' }}>🔒 Data Encryption</span>
                <span style={{ background: '#e6fffa', color: '#319795', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600' }}>
                  AES-256
                </span>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: '#4a5568' }}>Access Tier</span>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ fontSize: '16px', fontWeight: '600', color: '#1a202c' }}>Level 4</span>
              </div>
              <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '80%', height: '100%', background: '#319795' }}></div>
              </div>
            </div>

            <button 
              style={{
                background: '#319795',
                color: 'white',
                border: 'none',
                padding: '10px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                width: '100%'
              }}
              onClick={() => {
                setModalMessage('Permission management feature coming soon!')
                setShowSuccessModal(true)
              }}
            >
              + Add New Permission
            </button>
          </div>
        </div>
      </div>
      
      {/* Modals */}
      <Modal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} title="Success" type="success">
        <p style={{ margin: 0, color: '#4a5568' }}>{modalMessage}</p>
      </Modal>

      <Modal isOpen={showErrorModal} onClose={() => setShowErrorModal(false)} title="Error" type="error">
        <p style={{ margin: 0, color: '#4a5568' }}>{modalMessage}</p>
      </Modal>

      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmAction}
        title={confirmTitle}
        message={confirmMessage}
        confirmText="Confirm"
      />
    </div>
  )
}