'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import StatGroup from '../../components/StateCard';


const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export default function AdminSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [filterLoading, setFilterLoading] = useState(false)
  const [showNewSubscriptionModal, setShowNewSubscriptionModal] = useState(false)
  const [newSubscriptionData, setNewSubscriptionData] = useState({
    userEmail: '',
    planId: '',
    billingCycle: 'monthly'
  })
  const [createLoading, setCreateLoading] = useState(false)
  const [filter, setFilter] = useState('Monthly')
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [dateRange, setDateRange] = useState({
    start: '2025-01-01',
    end: '2026-12-31'
  })

  useEffect(() => {
    fetchData()
  }, [filter, statusFilter, currentPage, dateRange])

  const fetchData = async () => {
    try {
      setFilterLoading(true)
      const token = localStorage.getItem('token')
      
      console.log('🔍 Debug Info:');
      console.log('- Token exists:', !!token);
      console.log('- API URL:', API_URL);
      
      if (!token) {
        console.error('No token found - user needs to login');
        setLoading(false)
        setFilterLoading(false)
        return
      }
      
      const headers = { Authorization: `Bearer ${token}` }

      console.log('Making API calls with params:', {
        billingCycle: filter.toLowerCase() === 'monthly' ? 'monthly' : filter.toLowerCase() === 'yearly' ? 'yearly' : '',
        status: statusFilter,
        page: currentPage,
        startDate: dateRange.start,
        endDate: dateRange.end
      });

      const [subsResponse, analyticsResponse] = await Promise.all([
        axios.get(`${API_URL}/api/subscriptions`, {
          headers,
          params: {
            billingCycle: filter.toLowerCase() === 'monthly' ? 'monthly' : filter.toLowerCase() === 'yearly' ? 'yearly' : '',
            status: statusFilter,
            page: currentPage,
            startDate: dateRange.start,
            endDate: dateRange.end
          }
        }),
        axios.get(`${API_URL}/api/subscriptions/analytics`, { headers })
      ])

      console.log('✅ API Responses received:');
      console.log('- Subscriptions:', subsResponse.data);
      console.log('- Analytics:', analyticsResponse.data);

      if (subsResponse.data && subsResponse.data.subscriptions) {
        console.log('✅ Setting subscriptions:', subsResponse.data.subscriptions.length);
        setSubscriptions(subsResponse.data.subscriptions)
      } else {
        console.log('❌ No subscriptions data in response');
      }
      
      if (analyticsResponse.data) {
        console.log('✅ Setting analytics data');
        setAnalytics(analyticsResponse.data)
      }
      
    } catch (error) {
      console.error('❌ Error fetching data:', error)
      if (error.response) {
        console.error('Response error:', error.response.data);
        console.error('Response status:', error.response.status);
      }
    } finally {
      setLoading(false)
      setFilterLoading(false)
    }
  }

  const createNewSubscription = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newSubscriptionData.userEmail || !newSubscriptionData.planId) {
      // Show error message
      const errorDiv = document.createElement('div')
      errorDiv.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 9999;
        background: #f56565; color: white; padding: 16px 24px; border-radius: 8px;
        box-shadow: 0 4px 12px rgba(245, 101, 101, 0.3);
        font-size: 14px; font-weight: 500;
      `
      errorDiv.textContent = 'Please fill in all required fields'
      document.body.appendChild(errorDiv)
      
      setTimeout(() => {
        document.body.removeChild(errorDiv)
      }, 3000)
      return
    }
    
    try {
      setCreateLoading(true)
      const token = localStorage.getItem('token')
      
      if (!token) {
        alert('Please login first')
        return
      }
      
      const response = await axios.post(`${API_URL}/api/subscriptions`, {
        userEmail: newSubscriptionData.userEmail,
        planId: parseInt(newSubscriptionData.planId),
        billingCycle: newSubscriptionData.billingCycle
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      console.log('✅ Subscription created:', response.data)
      
      // Reset form
      setNewSubscriptionData({
        userEmail: '',
        planId: '',
        billingCycle: 'monthly'
      })
      
      // Close modal
      setShowNewSubscriptionModal(false)
      
      // Refresh data to show new subscription
      await fetchData()
      
      // Show success message
      const successMessage = `Subscription created successfully for ${response.data.subscription.user.email}!`
      
      // You can replace this with a proper toast notification
      const successDiv = document.createElement('div')
      successDiv.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 9999;
        background: linear-gradient(135deg, #319795 0%, #2d7d7d 100%);
        color: white; padding: 16px 24px; border-radius: 8px;
        box-shadow: 0 4px 12px rgba(49, 151, 149, 0.3);
        font-size: 14px; font-weight: 500;
      `
      successDiv.textContent = successMessage
      document.body.appendChild(successDiv)
      
      setTimeout(() => {
        document.body.removeChild(successDiv)
      }, 4000)
      
    } catch (error) {
      console.error('❌ Error creating subscription:', error)
      
      // Show error message
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error occurred'
      const errorDiv = document.createElement('div')
      errorDiv.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 9999;
        background: #f56565; color: white; padding: 16px 24px; border-radius: 8px;
        box-shadow: 0 4px 12px rgba(245, 101, 101, 0.3);
        font-size: 14px; font-weight: 500; max-width: 400px;
      `
      errorDiv.textContent = `Error: ${errorMessage}`
      document.body.appendChild(errorDiv)
      
      setTimeout(() => {
        if (document.body.contains(errorDiv)) {
          document.body.removeChild(errorDiv)
        }
      }, 5000)
    } finally {
      setCreateLoading(false)
    }
  }
  const getAvatarColor = (initials: string) => {
    const colors = ['#319795', '#3182ce', '#38a169', '#d69e2e', '#9f7aea', '#e53e3e']
    const index = initials.charCodeAt(0) % colors.length
    return colors[index]
  }

  console.log('🎯 Render Debug:');
  console.log('- Loading:', loading);
  console.log('- Subscriptions array:', subscriptions);
  console.log('- Subscriptions length:', subscriptions?.length);
  console.log('- Analytics:', analytics);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        fontSize: '16px',
        color: '#718096'
      }}>
        Loading subscriptions...
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <div>
            <h1 style={{ 
              fontSize: '28px', 
              fontWeight: '700', 
              color: '#1a202c', 
              marginBottom: '8px',
              letterSpacing: '-0.5px'
            }}>
              Subscription Management
            </h1>
            <p style={{ color: '#718096', fontSize: '16px' }}>
              Monitor and manage all recurring customer plans.
            </p>
          </div>
          <button 
            onClick={() => setShowNewSubscriptionModal(true)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #319795 0%, #2d7d7d 100%)',
              color: 'white',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(49, 151, 149, 0.3)',
              transition: 'all 0.2s'
            }}
          >
            + New Subscription
          </button>
        </div>
      </div>

   {/* Stats Cards */}
<StatGroup 
  items={[
    { 
      icon: '📊', 
      label: 'Total Subscriptions', 
      value: analytics.totalSubscriptions 
    },
    { 
      icon: '⚡', 
      label: 'Active Plans', 
      value: analytics.activePlans 
    },
    { 
      icon: '📉', 
      label: 'Canceled (MTD)', 
      value: analytics.canceledMTD 
    },
    { 
      icon: '📈', 
      label: 'Churn Rate', 
      value: analytics.churnRate, 
      suffix: '%' 
    },
  ]} 
/>

      {/* Controls */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            background: filter === 'Monthly' ? 'linear-gradient(135deg, #319795 0%, #2d7d7d 100%)' : '#f7fafc',
            color: filter === 'Monthly' ? 'white' : '#4a5568',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: filter === 'Monthly' ? '0 2px 8px rgba(49, 151, 149, 0.3)' : 'none'
          }}
            onClick={() => setFilter('Monthly')}
          >
            Monthly
          </button>
          <button 
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: filter === 'Yearly' ? 'linear-gradient(135deg, #319795 0%, #2d7d7d 100%)' : '#f7fafc',
              color: filter === 'Yearly' ? 'white' : '#4a5568',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: filter === 'Yearly' ? '0 2px 8px rgba(49, 151, 149, 0.3)' : 'none'
            }}
            onClick={() => setFilter('Yearly')}
          >
            Yearly
          </button>

          <select 
            style={{ 
              padding: '8px 12px', 
              borderRadius: '8px', 
              border: statusFilter ? '2px solid #319795' : '1px solid #e2e8f0',
              marginLeft: '16px',
              fontSize: '14px',
              background: statusFilter ? '#f0fdfa' : 'white',
              cursor: 'pointer',
              color: statusFilter ? '#319795' : '#4a5568',
              fontWeight: statusFilter ? '500' : 'normal'
            }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="past_due">Past Due</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {(statusFilter || dateRange.start !== '2025-01-01' || dateRange.end !== '2026-12-31') && (
            <button 
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                background: 'white',
                color: '#718096',
                fontSize: '12px',
                cursor: 'pointer',
                marginLeft: '8px'
              }}
              onClick={() => {
                setStatusFilter('')
                setDateRange({ start: '2025-01-01', end: '2026-12-31' })
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            style={{ 
              padding: '8px 12px', 
              borderRadius: '8px', 
              border: (dateRange.start !== '2025-01-01') ? '2px solid #319795' : '1px solid #e2e8f0',
              fontSize: '14px',
              background: (dateRange.start !== '2025-01-01') ? '#f0fdfa' : 'white',
              cursor: 'pointer',
              color: (dateRange.start !== '2025-01-01') ? '#319795' : '#4a5568'
            }}
          />
          <span style={{ color: '#718096', fontSize: '14px' }}>to</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            style={{ 
              padding: '8px 12px', 
              borderRadius: '8px', 
              border: (dateRange.end !== '2026-12-31') ? '2px solid #319795' : '1px solid #e2e8f0',
              fontSize: '14px',
              background: (dateRange.end !== '2026-12-31') ? '#f0fdfa' : 'white',
              cursor: 'pointer',
              color: (dateRange.end !== '2026-12-31') ? '#319795' : '#4a5568'
            }}
          />
        </div>
      </div>

      <div style={{ color: '#718096', fontSize: '14px', marginBottom: '16px' }}>
        {subscriptions.length > 0 ? (
          `Showing ${((currentPage - 1) * 10) + 1} to ${Math.min(currentPage * 10, analytics.totalSubscriptions || 0)} of ${analytics.totalSubscriptions || 0} subscriptions`
        ) : (
          'No subscriptions found'
        )}
      </div>
      {/* Subscriptions Table */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        position: 'relative'
      }}>
        {filterLoading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(255, 255, 255, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            fontSize: '14px',
            color: '#718096'
          }}>
            Applying filters...
          </div>
        )}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th style={{ 
                padding: '16px 20px', 
                textAlign: 'left', 
                fontSize: '12px', 
                fontWeight: '600', 
                color: '#718096',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                USER
              </th>
              <th style={{ 
                padding: '16px 20px', 
                textAlign: 'left', 
                fontSize: '12px', 
                fontWeight: '600', 
                color: '#718096',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                PLAN
              </th>
              <th style={{ 
                padding: '16px 20px', 
                textAlign: 'left', 
                fontSize: '12px', 
                fontWeight: '600', 
                color: '#718096',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                STATUS
              </th>
              <th style={{ 
                padding: '16px 20px', 
                textAlign: 'left', 
                fontSize: '12px', 
                fontWeight: '600', 
                color: '#718096',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                BILLING CYCLE
              </th>
              <th style={{ 
                padding: '16px 20px', 
                textAlign: 'left', 
                fontSize: '12px', 
                fontWeight: '600', 
                color: '#718096',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                NEXT PAYMENT
              </th>
            </tr>
          </thead>
          <tbody>
            {subscriptions && subscriptions.length > 0 ? (
              subscriptions.map((sub, index) => (
                <tr key={sub.id} style={{ 
                  borderBottom: index < subscriptions.length - 1 ? '1px solid #f1f5f9' : 'none',
                  transition: 'background-color 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: getAvatarColor(sub.user.initials),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}>
                        {sub.user.initials}
                      </div>
                      <div>
                        <div style={{ fontWeight: '500', color: '#1a202c', fontSize: '14px' }}>
                          {sub.user.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#718096' }}>
                          {sub.user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <div>
                      <div style={{ fontWeight: '500', color: '#1a202c', fontSize: '14px' }}>
                        {sub.plan.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#718096' }}>
                        {sub.plan.price}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      background: sub.status === 'active' ? '#d4edda' : 
                                 sub.status === 'past_due' ? '#fff3cd' : '#f8d7da',
                      color: sub.status === 'active' ? '#155724' : 
                             sub.status === 'past_due' ? '#856404' : '#721c24'
                    }}>
                      {sub.status === 'past_due' ? 'PAST DUE' : sub.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: '14px', color: '#4a5568' }}>
                    {sub.billingCycle}
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: '14px', color: '#4a5568' }}>
                    {sub.nextPayment}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <button style={{ 
                      background: 'none', 
                      border: 'none', 
                      cursor: 'pointer',
                      padding: '8px',
                      borderRadius: '4px',
                      color: '#718096',
                      fontSize: '16px',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      ⋯
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} style={{ 
                  padding: '60px 20px', 
                  textAlign: 'center',
                  color: '#718096'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    gap: '16px' 
                  }}>
                    <div style={{ fontSize: '48px' }}>📋</div>
                    <div>
                      <h3 style={{ 
                        fontSize: '16px', 
                        fontWeight: '600', 
                        color: '#1a202c', 
                        marginBottom: '8px' 
                      }}>
                        No subscriptions found
                      </h3>
                      <p style={{ fontSize: '14px', color: '#718096' }}>
                        {statusFilter || (dateRange.start !== '2025-01-01' || dateRange.end !== '2026-12-31') 
                          ? 'No subscriptions match your current filters. Try adjusting your search criteria.'
                          : 'No subscriptions available at the moment.'
                        }
                      </p>
                    </div>
                    {(statusFilter || dateRange.start !== '2025-01-01' || dateRange.end !== '2026-12-31') && (
                      <button 
                        onClick={() => {
                          setStatusFilter('');
                          setDateRange({ start: '2025-01-01', end: '2026-12-31' });
                        }}
                        style={{
                          padding: '8px 16px',
                          background: '#319795',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '24px',
        marginBottom: '32px'
      }}>
        <div style={{ color: '#718096', fontSize: '14px' }}>
          {subscriptions && subscriptions.length > 0 ? (
            `Showing ${((currentPage - 1) * 10) + 1} to ${Math.min(currentPage * 10, analytics.totalSubscriptions || 0)} of ${analytics.totalSubscriptions || 0} subscriptions`
          ) : (
            'No subscriptions found'
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            style={{
              padding: '8px 12px',
              border: '1px solid #e2e8f0',
              background: currentPage === 1 ? '#f7fafc' : 'white',
              borderRadius: '6px',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              color: currentPage === 1 ? '#cbd5e0' : '#718096'
            }}
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          >
            ‹
          </button>
          
          {/* Show page numbers */}
          {analytics.totalSubscriptions && Math.ceil(analytics.totalSubscriptions / 10) > 1 && 
            [...Array(Math.min(5, Math.ceil(analytics.totalSubscriptions / 10)))].map((_, index) => {
              const pageNum = index + 1;
              return (
                <button 
                  key={pageNum}
                  style={{
                    padding: '8px 12px',
                    border: `1px solid ${currentPage === pageNum ? '#319795' : '#e2e8f0'}`,
                    background: currentPage === pageNum ? '#319795' : 'white',
                    color: currentPage === pageNum ? 'white' : '#4a5568',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: currentPage === pageNum ? '500' : 'normal'
                  }}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })
          }
          
          <button 
            style={{
              padding: '8px 12px',
              border: '1px solid #e2e8f0',
              background: currentPage >= Math.ceil((analytics.totalSubscriptions || 0) / 10) ? '#f7fafc' : 'white',
              borderRadius: '6px',
              cursor: currentPage >= Math.ceil((analytics.totalSubscriptions || 0) / 10) ? 'not-allowed' : 'pointer',
              color: currentPage >= Math.ceil((analytics.totalSubscriptions || 0) / 10) ? '#cbd5e0' : '#4a5568'
            }}
            disabled={currentPage >= Math.ceil((analytics.totalSubscriptions || 0) / 10)}
            onClick={() => setCurrentPage(prev => prev + 1)}
          >
            ›
          </button>
        </div>
      </div>

      {/* Bottom Section with Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Revenue Growth Projection */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: '#1a202c', 
            marginBottom: '20px' 
          }}>
            Revenue Growth Projection
          </h3>
          <div style={{ 
            height: '240px', 
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', 
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-around',
            padding: '20px',
            position: 'relative'
          }}>
            {/* Mock Chart Bars */}
            {analytics.revenueGrowth && analytics.revenueGrowth.length > 0 ? 
              analytics.revenueGrowth.map((data, index) => {
                const maxRevenue = Math.max(...analytics.revenueGrowth.map(r => r.revenue));
                const height = maxRevenue > 0 ? (data.revenue / maxRevenue) * 160 : 20;
                
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
                      background: index === analytics.revenueGrowth.length - 1 ? 
                        'linear-gradient(135deg, #319795 0%, #2d7d7d 100%)' : 
                        'linear-gradient(135deg, #e2e8f0 0%, #cbd5e0 100%)',
                      borderRadius: '4px 4px 0 0',
                      transition: 'all 0.3s ease',
                      boxShadow: index === analytics.revenueGrowth.length - 1 ? 
                        '0 4px 12px rgba(49, 151, 149, 0.3)' : 'none'
                    }}></div>
                    <span style={{ 
                      fontSize: '12px', 
                      color: '#718096',
                      fontWeight: '500'
                    }}>
                      {data.month}
                    </span>
                  </div>
                )
              }) : 
              // Fallback if no data
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                width: '100%',
                height: '100%',
                color: '#718096',
                fontSize: '14px'
              }}>
                No revenue data available
              </div>
            }
          </div>
        </div>

        {/* Plan Distribution */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: '600', 
              color: '#1a202c', 
              marginBottom: '4px' 
            }}>
              Plan Distribution
            </h3>
            <p style={{ fontSize: '14px', color: '#718096' }}>
              User preference by plan type
            </p>
          </div>
          
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '14px', color: '#4a5568', fontWeight: '500' }}>BASIC</span>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#1a202c' }}>
                {analytics.planDistribution?.['Basic'] || 0}%
              </span>
            </div>
            <div style={{ 
              height: '8px', 
              background: '#f1f5f9', 
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{ 
                width: `${analytics.planDistribution?.['Basic'] || 0}%`, 
                height: '100%', 
                background: 'linear-gradient(90deg, #319795 0%, #2d7d7d 100%)',
                borderRadius: '4px'
              }}></div>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '14px', color: '#4a5568', fontWeight: '500' }}>PROFESSIONAL</span>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#1a202c' }}>
                {analytics.planDistribution?.['Professional'] || 0}%
              </span>
            </div>
            <div style={{ 
              height: '8px', 
              background: '#f1f5f9', 
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{ 
                width: `${analytics.planDistribution?.['Professional'] || 0}%`, 
                height: '100%', 
                background: 'linear-gradient(90deg, #3182ce 0%, #2c5aa0 100%)',
                borderRadius: '4px'
              }}></div>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '14px', color: '#4a5568', fontWeight: '500' }}>ENTERPRISE</span>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#1a202c' }}>
                {analytics.planDistribution?.['Enterprise'] || 0}%
              </span>
            </div>
            <div style={{ 
              height: '8px', 
              background: '#f1f5f9', 
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{ 
                width: `${analytics.planDistribution?.['Enterprise'] || 0}%`, 
                height: '100%', 
                background: 'linear-gradient(90deg, #38a169 0%, #2f855a 100%)',
                borderRadius: '4px'
              }}></div>
            </div>
          </div>

          <button style={{
            width: '100%',
            padding: '12px',
            background: 'linear-gradient(135deg, #319795 0%, #2d7d7d 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 2px 8px rgba(49, 151, 149, 0.2)'
          }}>
            Detailed Analytics
          </button>
        </div>
      </div>

      {/* New Subscription Modal */}
      {showNewSubscriptionModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '32px',
            width: '500px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1a202c', margin: 0 }}>
                Create New Subscription
              </h2>
              <button 
                onClick={() => setShowNewSubscriptionModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#718096',
                  padding: '4px'
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={createNewSubscription} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  User Email *
                </label>
                <input
                  type="email"
                  placeholder="user@example.com"
                  value={newSubscriptionData.userEmail}
                  onChange={(e) => setNewSubscriptionData(prev => ({ ...prev, userEmail: e.target.value }))}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Plan *
                </label>
                <select 
                  value={newSubscriptionData.planId}
                  onChange={(e) => setNewSubscriptionData(prev => ({ ...prev, planId: e.target.value }))}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    background: 'white'
                  }}
                >
                  <option value="">Select a plan</option>
                  <option value="1">Basic - $29/month</option>
                  <option value="2">Professional - $79/month</option>
                  <option value="3">Enterprise - $249/month</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Billing Cycle *
                </label>
                <select 
                  value={newSubscriptionData.billingCycle}
                  onChange={(e) => setNewSubscriptionData(prev => ({ ...prev, billingCycle: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    background: 'white'
                  }}
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewSubscriptionModal(false)
                    setNewSubscriptionData({
                      userEmail: '',
                      planId: '',
                      billingCycle: 'monthly'
                    })
                  }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    background: 'white',
                    color: '#374151',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: 'none',
                    borderRadius: '8px',
                    background: createLoading ? '#cbd5e0' : 'linear-gradient(135deg, #319795 0%, #2d7d7d 100%)',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: createLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {createLoading ? 'Creating...' : 'Create Subscription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}