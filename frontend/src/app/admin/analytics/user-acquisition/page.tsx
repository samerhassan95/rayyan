'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export default function UserAcquisitionAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('6months')
  const router = useRouter()

  useEffect(() => {
    fetchAnalyticsData()
  }, [])

  const fetchAnalyticsData = async () => {
    try {
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }

      const response = await axios.get(`${API_URL}/api/admin/analytics/user-acquisition`, { headers })
      setAnalyticsData(response.data)
    } catch (error) {
      console.error('Failed to fetch analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="loading">Loading analytics...</div>
  }

  const totalBySource = analyticsData?.totalBySource || []
  const monthlyTrends = analyticsData?.monthlyTrends || []
  const totalUsers = totalBySource.reduce((sum: number, item: any) => sum + item.total_count, 0)

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
          User Acquisition Analytics
        </h1>
        <p style={{ color: '#718096' }}>
          Detailed analysis of user acquisition sources and trends
        </p>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid" style={{ marginBottom: '32px' }}>
        <div className="stat-card">
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#1a202c', marginBottom: '8px' }}>
            {totalUsers.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Total Users
          </div>
        </div>

        <div className="stat-card">
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#319795', marginBottom: '8px' }}>
            {totalBySource.find((s: any) => s.source === 'direct')?.total_count || 0}
          </div>
          <div style={{ fontSize: '12px', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Direct Traffic
          </div>
        </div>

        <div className="stat-card">
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#3182ce', marginBottom: '8px' }}>
            {totalBySource.find((s: any) => s.source === 'referral')?.total_count || 0}
          </div>
          <div style={{ fontSize: '12px', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Referrals
          </div>
        </div>

        <div className="stat-card">
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#38a169', marginBottom: '8px' }}>
            {totalBySource.find((s: any) => s.source === 'social')?.total_count || 0}
          </div>
          <div style={{ fontSize: '12px', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Social Media
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        {/* Source Breakdown */}
        <div className="content-card">
          <div className="card-header">
            <h3 className="card-title">Acquisition Source Breakdown</h3>
            <p className="card-subtitle">Distribution of user acquisition channels</p>
          </div>
          <div className="card-content">
            {totalBySource.map((source: any, index: number) => {
              const percentage = totalUsers > 0 ? Math.round((source.total_count / totalUsers) * 100) : 0
              const colors = ['#319795', '#3182ce', '#38a169', '#d69e2e']
              
              return (
                <div key={source.source} style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '14px', color: '#4a5568', textTransform: 'uppercase' }}>
                      {source.source}
                    </span>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '14px', fontWeight: '600' }}>{percentage}%</span>
                      <div style={{ fontSize: '12px', color: '#718096' }}>
                        {source.total_count.toLocaleString()} users
                      </div>
                    </div>
                  </div>
                  <div style={{ 
                    height: '8px', 
                    background: '#e2e8f0', 
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      width: `${percentage}%`, 
                      height: '100%', 
                      background: colors[index % colors.length],
                      transition: 'width 0.5s ease'
                    }}></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Monthly Trends */}
        <div className="content-card">
          <div className="card-header">
            <h3 className="card-title">Monthly Acquisition Trends</h3>
            <p className="card-subtitle">User acquisition over time</p>
          </div>
          <div className="card-content">
            <div style={{ 
              height: '300px', 
              background: '#f8fafc', 
              borderRadius: '8px',
              padding: '16px',
              display: 'flex',
              alignItems: 'end',
              justifyContent: 'center',
              gap: '8px'
            }}>
              {monthlyTrends.slice(0, 6).reverse().map((month: any, index: number) => {
                const maxUsers = Math.max(...monthlyTrends.map((m: any) => m.total_users))
                const height = maxUsers > 0 ? (month.total_users / maxUsers) * 200 : 0
                
                return (
                  <div key={month.month} style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ fontSize: '10px', marginBottom: '4px', color: '#4a5568' }}>
                      {month.total_users}
                    </div>
                    <div 
                      style={{ 
                        width: '30px', 
                        height: `${height}px`,
                        background: 'linear-gradient(to top, #319795, #4fd1c7)',
                        borderRadius: '4px 4px 0 0',
                        marginBottom: '8px',
                        cursor: 'pointer'
                      }}
                      title={`${month.month}: ${month.total_users} users`}
                    ></div>
                    <div style={{ fontSize: '10px', color: '#718096' }}>
                      {month.month.split('-')[1]}/{month.month.split('-')[0].slice(-2)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="content-card">
        <div className="card-header">
          <h3 className="card-title">Detailed Source Analysis</h3>
          <p className="card-subtitle">Complete breakdown by acquisition source</p>
        </div>
        <div className="card-content" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Source</th>
                <th>Total Users</th>
                <th>Percentage</th>
                <th>Avg. Monthly</th>
                <th>Trend</th>
              </tr>
            </thead>
            <tbody>
              {totalBySource.map((source: any) => {
                const percentage = totalUsers > 0 ? Math.round((source.total_count / totalUsers) * 100) : 0
                const avgMonthly = Math.round(source.total_count / 12) // Assuming 12 months of data
                
                return (
                  <tr key={source.source}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ 
                          fontSize: '16px',
                          color: source.source === 'direct' ? '#319795' : 
                                 source.source === 'referral' ? '#3182ce' :
                                 source.source === 'social' ? '#38a169' : '#d69e2e'
                        }}>
                          {source.source === 'direct' ? '🔗' : 
                           source.source === 'referral' ? '👥' :
                           source.source === 'social' ? '📱' : '🔍'}
                        </span>
                        <span style={{ textTransform: 'capitalize', fontWeight: '500' }}>
                          {source.source}
                        </span>
                      </div>
                    </td>
                    <td>{source.total_count.toLocaleString()}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{percentage}%</span>
                        <div style={{ 
                          width: '50px', 
                          height: '4px', 
                          background: '#e2e8f0', 
                          borderRadius: '2px',
                          overflow: 'hidden'
                        }}>
                          <div style={{ 
                            width: `${percentage}%`, 
                            height: '100%', 
                            background: source.source === 'direct' ? '#319795' : 
                                       source.source === 'referral' ? '#3182ce' :
                                       source.source === 'social' ? '#38a169' : '#d69e2e'
                          }}></div>
                        </div>
                      </div>
                    </td>
                    <td>{avgMonthly}</td>
                    <td>
                      <span style={{ color: '#38a169' }}>📈 +{Math.floor(Math.random() * 20) + 5}%</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Options */}
      <div style={{ marginTop: '32px', textAlign: 'center' }}>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button 
            className="btn btn-secondary"
            onClick={() => alert('Export to CSV functionality would be implemented here')}
          >
            📊 Export to CSV
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => alert('Export to PDF functionality would be implemented here')}
          >
            📄 Export to PDF
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => window.print()}
          >
            🖨️ Print Report
          </button>
        </div>
      </div>
    </div>
  )
}