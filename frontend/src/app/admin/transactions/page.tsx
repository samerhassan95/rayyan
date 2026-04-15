'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('Daily')
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('')
  const [dateRange, setDateRange] = useState({
    start: '2025-01-01',
    end: '2026-12-31'
  })
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    fetchData()
  }, [statusFilter, paymentTypeFilter, dateRange, currentPage, filter])

  const fetchData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      if (!token) {
        console.error('No token found - user needs to login');
        setLoading(false)
        return
      }
      
      const headers = { Authorization: `Bearer ${token}` }

      console.log('🔍 Fetching transactions data with filters:', {
        status: statusFilter,
        paymentType: paymentTypeFilter,
        dateRange,
        page: currentPage,
        chartPeriod: filter
      });

      // Fetch transactions with all filters
      const transactionsResponse = await axios.get(`${API_URL}/api/transactions`, {
        headers,
        params: {
          status: statusFilter,
          paymentMethod: paymentTypeFilter,
          startDate: dateRange.start,
          endDate: dateRange.end,
          page: currentPage,
          limit: 10
        }
      })

      console.log('✅ Transactions response:', transactionsResponse.data);

      // Fetch analytics with period filter
      const analyticsResponse = await axios.get(`${API_URL}/api/transactions/analytics`, {
        headers,
        params: {
          period: filter.toLowerCase(),
          startDate: dateRange.start,
          endDate: dateRange.end
        }
      })

      console.log('✅ Analytics response:', analyticsResponse.data);

      setTransactions(transactionsResponse.data.transactions || [])
      setAnalytics(analyticsResponse.data || {})
    } catch (error) {
      console.error('❌ Error fetching data:', error)
      console.error('Error details:', error.response?.data);
      
      // Set empty data instead of fallback
      setTransactions([])
      setAnalytics({
        totalRevenue: 0,
        monthlyVolume: 0,
        failedTransactions: 0,
        revenueGrowth: 0,
        revenueData: []
      })
    } finally {
      setLoading(false)
    }
  }

  const clearFilters = () => {
    setStatusFilter('')
    setPaymentTypeFilter('')
    setDateRange({
      start: '2025-01-01',
      end: '2026-12-31'
    })
    setCurrentPage(1)
  }

  const exportReport = async () => {
    try {
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }
      
      const response = await axios.get(`${API_URL}/api/transactions/export`, {
        headers,
        params: {
          format: 'csv',
          status: statusFilter,
          paymentMethod: paymentTypeFilter,
          startDate: dateRange.start,
          endDate: dateRange.end
        }
      })
      
      // Show success message
      const successDiv = document.createElement('div')
      successDiv.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 9999;
        background: linear-gradient(135deg, #319795 0%, #2d7d7d 100%);
        color: white; padding: 16px 24px; border-radius: 8px;
        box-shadow: 0 4px 12px rgba(49, 151, 149, 0.3);
        font-size: 14px; font-weight: 500;
      `
      successDiv.textContent = 'Export initiated! Download will start shortly.'
      document.body.appendChild(successDiv)
      
      setTimeout(() => {
        document.body.removeChild(successDiv)
      }, 4000)
      
    } catch (error) {
      console.error('Export failed:', error)
      
      // Show error message
      const errorDiv = document.createElement('div')
      errorDiv.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 9999;
        background: #f56565; color: white; padding: 16px 24px; border-radius: 8px;
        box-shadow: 0 4px 12px rgba(245, 101, 101, 0.3);
        font-size: 14px; font-weight: 500;
      `
      errorDiv.textContent = 'Export failed. Please try again.'
      document.body.appendChild(errorDiv)
      
      setTimeout(() => {
        document.body.removeChild(errorDiv)
      }, 4000)
    }
  }

  if (loading) {
    return <div className="loading">Loading transactions...</div>
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#1a202c', marginBottom: '8px' }}>
          Transactions
        </h1>
        <p style={{ color: '#718096' }}>
          Monitor and manage all financial activity across the platform.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid" style={{ marginBottom: '30px' }}>
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                TOTAL REVENUE
              </div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#1a202c' }}>
                ${analytics.totalRevenue?.toLocaleString() || '0'}
              </div>
              <div style={{ fontSize: '12px', color: '#718096', marginTop: '4px' }}>
                📈 vs. previous 30 days
              </div>
            </div>
            <div style={{ 
              fontSize: '12px', 
              fontWeight: '600',
              color: analytics.revenueGrowth >= 0 ? '#38a169' : '#e53e3e',
              background: analytics.revenueGrowth >= 0 ? '#f0fff4' : '#fed7d7',
              padding: '4px 8px',
              borderRadius: '4px'
            }}>
              {analytics.revenueGrowth >= 0 ? '+' : ''}{analytics.revenueGrowth || 0}%
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                MONTHLY VOLUME
              </div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#1a202c' }}>
                ${analytics.monthlyVolume?.toLocaleString() || '0'}
              </div>
              <div style={{ fontSize: '12px', color: '#718096', marginTop: '4px' }}>
                📊 Processed this month
              </div>
            </div>
            <div style={{ 
              fontSize: '12px', 
              fontWeight: '600',
              color: '#38a169',
              background: '#f0fff4',
              padding: '4px 8px',
              borderRadius: '4px'
            }}>
              +{analytics.volumeGrowth || 0}%
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                FAILED TRANSACTIONS
              </div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#1a202c' }}>
                {analytics.failedTransactions || 0}%
              </div>
              <div style={{ fontSize: '12px', color: '#718096', marginTop: '4px' }}>
                ⚠️ Industry avg: 2.1%
              </div>
            </div>
            <div style={{ 
              fontSize: '12px', 
              fontWeight: '600',
              color: '#e53e3e',
              background: '#fed7d7',
              padding: '4px 8px',
              borderRadius: '4px'
            }}>
              {analytics.failureChange || 0}%
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Trends Chart */}
      <div className="content-card" style={{ marginBottom: '30px' }}>
        <div className="card-header">
          <div>
            <h3 className="card-title">Revenue Trends</h3>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              className={`btn ${filter === 'Daily' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter('Daily')}
            >
              Daily
            </button>
            <button 
              className={`btn ${filter === 'Weekly' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter('Weekly')}
            >
              Weekly
            </button>
            <button 
              className={`btn ${filter === 'Monthly' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter('Monthly')}
            >
              Monthly
            </button>
          </div>
        </div>
        <div className="card-content">
          {analytics.revenueData && analytics.revenueData.length > 0 ? (
            <div>
              {/* Chart visualization */}
              <div style={{ 
                height: '300px', 
                background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', 
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-around',
                padding: '20px',
                position: 'relative'
              }}>
                {analytics.revenueData.map((data: any, index: number) => {
                  const maxRevenue = Math.max(...analytics.revenueData.map((r: any) => r.amount));
                  const height = maxRevenue > 0 ? (data.amount / maxRevenue) * 200 : 20;
                  
                  return (
                    <div key={index} style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <div style={{
                        width: '40px',
                        height: `${height}px`,
                        background: index === analytics.revenueData.length - 1 ? 
                          'linear-gradient(135deg, #319795 0%, #2d7d7d 100%)' : 
                          'linear-gradient(135deg, #e2e8f0 0%, #cbd5e0 100%)',
                        borderRadius: '4px 4px 0 0',
                        transition: 'all 0.3s ease',
                        boxShadow: index === analytics.revenueData.length - 1 ? 
                          '0 4px 12px rgba(49, 151, 149, 0.3)' : 'none',
                        position: 'relative'
                      }}>
                        <div style={{
                          position: 'absolute',
                          top: '-25px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          fontSize: '10px',
                          color: '#4a5568',
                          fontWeight: '500'
                        }}>
                          ${Math.round(data.amount / 1000)}k
                        </div>
                      </div>
                      <span style={{ 
                        fontSize: '12px', 
                        color: '#718096',
                        fontWeight: '500'
                      }}>
                        {data.date}
                      </span>
                    </div>
                  )
                })}
              </div>
              
              {/* Chart summary */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginTop: '16px',
                fontSize: '12px',
                color: '#718096'
              }}>
                <span>Period: {filter}</span>
                <span>Total: ${analytics.revenueData.reduce((sum: number, item: any) => sum + item.amount, 0).toLocaleString()}</span>
              </div>
            </div>
          ) : (
            <div style={{ 
              height: '300px', 
              background: '#f8fafc', 
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#718096',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ fontSize: '48px' }}>📈</div>
              <div>No revenue data available for selected period</div>
              <div style={{ fontSize: '12px' }}>Try adjusting your date range or filters</div>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Date Range */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              style={{ 
                padding: '8px 12px', 
                borderRadius: '6px', 
                border: '1px solid #e2e8f0',
                fontSize: '14px'
              }}
            />
            <span style={{ color: '#718096', fontSize: '14px' }}>to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              style={{ 
                padding: '8px 12px', 
                borderRadius: '6px', 
                border: '1px solid #e2e8f0',
                fontSize: '14px'
              }}
            />
          </div>

          {/* Payment Type Filter */}
          <select 
            style={{ 
              padding: '8px 12px', 
              borderRadius: '6px', 
              border: '1px solid #e2e8f0',
              fontSize: '14px',
              background: 'white'
            }}
            value={paymentTypeFilter}
            onChange={(e) => setPaymentTypeFilter(e.target.value)}
          >
            <option value="">All Payment Types</option>
            <option value="credit_card">Credit Card</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="digital_wallet">Digital Wallet</option>
            <option value="paypal">PayPal</option>
          </select>

          {/* Status Filter */}
          <select 
            style={{ 
              padding: '8px 12px', 
              borderRadius: '6px', 
              border: '1px solid #e2e8f0',
              fontSize: '14px',
              background: 'white'
            }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="successful">Successful</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn btn-secondary"
            onClick={clearFilters}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              background: 'white',
              color: '#4a5568',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Clear Filters
          </button>
          <button 
            className="btn btn-primary"
            onClick={exportReport}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              background: 'linear-gradient(135deg, #319795 0%, #2d7d7d 100%)',
              color: 'white',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            ↓ Export Report
          </button>
        </div>
      </div>

      <div style={{ color: '#718096', fontSize: '14px', marginBottom: '16px' }}>
        {transactions.length > 0 ? (
          `Showing ${((currentPage - 1) * 10) + 1} to ${Math.min(currentPage * 10, analytics.totalTransactions || transactions.length)} of ${analytics.totalTransactions || transactions.length} results`
        ) : (
          'No transactions found'
        )}
      </div>

      {/* Transactions Table */}
      <div className="content-card">
        <div style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>USER</th>
                <th>AMOUNT</th>
                <th>DATE</th>
                <th>PAYMENT METHOD</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: '#319795',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}>
                        {transaction.user.initials}
                      </div>
                      <div>
                        <div style={{ fontWeight: '500', color: '#1a202c' }}>
                          {transaction.user.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#718096' }}>
                          {transaction.user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontWeight: '600', color: '#1a202c' }}>
                    ${transaction.amount.toFixed(2)}
                  </td>
                  <td>{transaction.date}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>💳</span>
                      {transaction.paymentMethod}
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${transaction.status}`}>
                      {transaction.status.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <button style={{ 
                      background: 'none', 
                      border: 'none', 
                      cursor: 'pointer',
                      padding: '4px'
                    }}>
                      ⋯
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {transactions.length > 0 && (
        <div className="pagination" style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          gap: '8px',
          marginTop: '24px'
        }}>
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            style={{
              padding: '8px 12px',
              border: '1px solid #e2e8f0',
              background: currentPage === 1 ? '#f7fafc' : 'white',
              borderRadius: '6px',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              color: currentPage === 1 ? '#cbd5e0' : '#4a5568'
            }}
          >
            ‹
          </button>
          
          {/* Show page numbers */}
          {[...Array(Math.min(5, Math.ceil((analytics.totalTransactions || transactions.length) / 10)))].map((_, index) => {
            const pageNum = index + 1;
            return (
              <button 
                key={pageNum}
                className={currentPage === pageNum ? "active" : ""}
                onClick={() => setCurrentPage(pageNum)}
                style={{
                  padding: '8px 12px',
                  border: `1px solid ${currentPage === pageNum ? '#319795' : '#e2e8f0'}`,
                  background: currentPage === pageNum ? '#319795' : 'white',
                  color: currentPage === pageNum ? 'white' : '#4a5568',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: currentPage === pageNum ? '500' : 'normal'
                }}
              >
                {pageNum}
              </button>
            );
          })}
          
          <button 
            disabled={currentPage >= Math.ceil((analytics.totalTransactions || transactions.length) / 10)}
            onClick={() => setCurrentPage(prev => prev + 1)}
            style={{
              padding: '8px 12px',
              border: '1px solid #e2e8f0',
              background: currentPage >= Math.ceil((analytics.totalTransactions || transactions.length) / 10) ? '#f7fafc' : 'white',
              borderRadius: '6px',
              cursor: currentPage >= Math.ceil((analytics.totalTransactions || transactions.length) / 10) ? 'not-allowed' : 'pointer',
              color: currentPage >= Math.ceil((analytics.totalTransactions || transactions.length) / 10) ? '#cbd5e0' : '#4a5568'
            }}
          >
            ›
          </button>
        </div>
      )}
    </div>
  )
}