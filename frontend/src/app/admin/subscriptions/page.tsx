'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import StatGroup from '../../components/StateCard';
import { useLanguage } from '../../../i18n/LanguageContext'

import percent1 from "../../../assets/icons/percent-1.svg"
import percent2 from "../../../assets/icons/percent-2.svg"
import percent3 from "../../../assets/icons/percent-3.svg"
import percent4 from "../../../assets/icons/percent-4.svg"


const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export default function AdminSubscriptions() {
  const { t, isRTL, language } = useLanguage()
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
      errorDiv.textContent = t('fill_required_fields')
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
      <div className='flex items-center justify-center h-[400px] text-base text-[#718096]'>
        {t('loading')}...
      </div>
    )
  }

  return (
    <div style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="text-[28px] font-bold text-[#1a202c] mb-2 tracking-[-0.5px]">
              {t('subscription_management')}
            </h1>
            <p className="text-[#718096] text-base">
              {t('subscription_management_desc')}
            </p>
          </div>

          <button
            onClick={() => setShowNewSubscriptionModal(true)}
            className="px-4 py-2 rounded-lg border-none bg-gradient-to-br from-[#319795] to-[#2d7d7d] text-white text-sm font-medium cursor-pointer flex items-center gap-2 shadow-[0_4px_12px_rgba(49,151,149,0.3)] transition-all duration-200 active:scale-95"
          >
            + {t('new_subscription')}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <StatGroup
        items={[
          {
            icon: percent1,
            label: t('total_subscriptions'),
            value: analytics.totalSubscriptions
          },
          {
            icon: percent2,
            label: t('active_plans'),
            value: analytics.activePlans
          },
          {
            icon: percent3,
            label: t('canceled_mtd'),
            value: analytics.canceledMTD
          },
          {
            icon: percent4,
            label: t('churn_rate'),
            value: analytics.churnRate,
            suffix: '%'
          },
        ]}
      />

      <div>
        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <button
              className={`px-4 py-2 rounded-lg border-none text-sm font-medium cursor-pointer transition-all duration-200 ${filter === 'Monthly'
                  ? 'bg-gradient-to-br from-[#319795] to-[#2d7d7d] text-white shadow-[0_2px_8px_rgba(49,151,149,0.3)]'
                  : 'bg-[#f7fafc] text-[#4a5568]'
                }`}
              onClick={() => setFilter('Monthly')}
            >
              {t('monthly')}
            </button>
            <button
              className={`px-4 py-2 rounded-lg border-none text-sm font-medium cursor-pointer transition-all duration-200 ${filter === 'Yearly'
                  ? 'bg-gradient-to-br from-[#319795] to-[#2d7d7d] text-white shadow-[0_2px_8px_rgba(49,151,149,0.3)]'
                  : 'bg-[#f7fafc] text-[#4a5568]'
                }`}
              onClick={() => setFilter('Yearly')}
            >
              {t('yearly')}
            </button>

            <select
              className={`px-3 py-2 rounded-lg ml-4 text-sm cursor-pointer outline-none ${statusFilter
                  ? 'border-2 border-[#319795] bg-[#f0fdfa] text-[#319795] font-medium'
                  : 'border border-[#e2e8f0] bg-white text-[#4a5568] font-normal'
                }`}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">{t('all_statuses')}</option>
              <option value="active">{t('active')}</option>
              <option value="past_due">{t('past_due')}</option>
              <option value="cancelled">{t('cancelled')}</option>
            </select>

            {(statusFilter || dateRange.start !== '2025-01-01' || dateRange.end !== '2026-12-31') && (
              <button
                className="px-3 py-1.5 rounded-md border border-[#e2e8f0] bg-white text-[#718096] text-xs cursor-pointer ml-2 hover:bg-gray-50"
                onClick={() => {
                  setStatusFilter('')
                  setDateRange({ start: '2025-01-01', end: '2026-12-31' })
                }}
              >
                {t('clear_filters')}
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className={`px-3 py-2 rounded-lg text-sm cursor-pointer outline-none ${dateRange.start !== '2025-01-01'
                  ? 'border-2 border-[#319795] bg-[#f0fdfa] text-[#319795]'
                  : 'border border-[#e2e8f0] bg-white text-[#4a5568]'
                }`}
            />
            <span className="text-[#718096] text-sm">{t('to')}</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className={`px-3 py-2 rounded-lg text-sm cursor-pointer outline-none ${dateRange.end !== '2026-12-31'
                  ? 'border-2 border-[#319795] bg-[#f0fdfa] text-[#319795]'
                  : 'border border-[#e2e8f0] bg-white text-[#4a5568]'
                }`}
            />
          </div>
        </div>

        <div className="text-[#718096] text-sm mb-4">
          {subscriptions.length > 0 ? (
            `${t('showing')} ${((currentPage - 1) * 10) + 1} ${t('to')} ${Math.min(currentPage * 10, analytics.totalSubscriptions || 0)} ${t('of')} ${analytics.totalSubscriptions || 0} ${t('subscriptions')}`
          ) : (
            t('no_subscriptions_found')
          )}
        </div>

        {/* Subscriptions Table */}
        <div className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden shadow-sm relative">
          {filterLoading && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 text-sm text-[#718096]">
              {t('applying_filters')}
            </div>
          )}
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#f8fafc]">
                {['user_header', 'plan_header', 'status', 'billing_cycle', 'next_payment'].map((header) => (
                  <th key={header} className="px-5 py-4 text-left text-[12px] font-semibold text-[#718096] uppercase tracking-wider">
                    {t(header)}
                  </th>
                ))}
                <th className="px-5 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {subscriptions && subscriptions.length > 0 ? (
                subscriptions.map((sub, index) => (
                  <tr
                    key={sub.id}
                    className={`transition-colors duration-200 cursor-pointer hover:bg-[#f8fafc] ${index < subscriptions.length - 1 ? 'border-bottom border-[#f1f5f9]' : ''
                      }`}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex items-center justify-center w-10 h-10 text-sm font-semibold text-white rounded-full"
                          style={{ background: getAvatarColor(sub.user.initials) }}
                        >
                          {sub.user.initials}
                        </div>
                        <div>
                          <div className="font-medium text-[#1a202c] text-sm">{sub.user.name}</div>
                          <div className="text-[12px] text-[#718096]">{sub.user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div>
                        <div className="font-medium text-[#1a202c] text-sm">{sub.plan.name}</div>
                        <div className="text-[12px] text-[#718096]">{sub.plan.price}</div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-3 py-1 rounded-full text-[12px] font-semibold uppercase tracking-wider ${sub.status === 'active' ? 'bg-[#d4edda] text-[#155724]' :
                          sub.status === 'past_due' ? 'bg-[#fff3cd] text-[#856404]' : 'bg-[#f8d7da] text-[#721c24]'
                        }`}>
                        {sub.status === 'past_due' ? t('past_due').toUpperCase() : t(sub.status).toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-[#4a5568]">{sub.billingCycle}</td>
                    <td className="px-5 py-4 text-sm text-[#4a5568]">{sub.nextPayment}</td>
                    <td className="px-5 py-4">
                      <button className="bg-transparent border-none cursor-pointer p-2 rounded hover:bg-[#f1f5f9] text-[#718096] text-base transition-colors">
                        ⋯
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-[60px] text-center text-[#718096]">
                    <div className="flex flex-col items-center gap-4">
                      <div className="text-[48px]">📋</div>
                      <div>
                        <h3 className="text-base font-semibold text-[#1a202c] mb-2">{t('no_subscriptions_found')}</h3>
                        <p className="text-sm text-[#718096]">
                          {statusFilter || (dateRange.start !== '2025-01-01' || dateRange.end !== '2026-12-31')
                            ? t('no_subscriptions_filter')
                            : t('no_subscriptions_available')}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6 mb-8">
          <div className="text-[#718096] text-sm">
            {/* Re-using same logic as above for consistency */}
          </div>
          <div className="flex gap-2">
            <button
              className={`px-3 py-2 border border-[#e2e8f0] rounded-md transition-colors ${currentPage === 1 ? 'bg-[#f7fafc] cursor-not-allowed text-[#cbd5e0]' : 'bg-white cursor-pointer text-[#718096]'
                }`}
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            >
              ‹
            </button>

            {analytics.totalSubscriptions && Math.ceil(analytics.totalSubscriptions / 10) > 1 &&
              [...Array(Math.min(5, Math.ceil(analytics.totalSubscriptions / 10)))].map((_, index) => {
                const pageNum = index + 1;
                return (
                  <button
                    key={pageNum}
                    className={`px-3 py-2 border rounded-md cursor-pointer transition-colors ${currentPage === pageNum
                        ? 'border-[#319795] bg-[#319795] text-white font-medium'
                        : 'border-[#e2e8f0] bg-white text-[#4a5568] font-normal'
                      }`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })
            }

            <button
              className={`px-3 py-2 border border-[#e2e8f0] rounded-md transition-colors ${currentPage >= Math.ceil((analytics.totalSubscriptions || 0) / 10)
                  ? 'bg-[#f7fafc] cursor-not-allowed text-[#cbd5e0]'
                  : 'bg-white cursor-pointer text-[#4a5568]'
                }`}
              disabled={currentPage >= Math.ceil((analytics.totalSubscriptions || 0) / 10)}
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              ›
            </button>
          </div>
        </div>

        {/* Bottom Section with Charts */}
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6">
          {/* Revenue Growth Projection */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-[#1a202c] mb-5">{t('revenue_growth_projection')}</h3>
            <div className="h-[240px] bg-gradient-to-br from-[#f8fafc] to-[#e2e8f0] rounded-lg flex items-end justify-around p-5 relative">
              {analytics.revenueGrowth && analytics.revenueGrowth.length > 0 ?
                analytics.revenueGrowth.map((data, index) => {
                  const maxRevenue = Math.max(...analytics.revenueGrowth.map(r => r.revenue));
                  const height = maxRevenue > 0 ? (data.revenue / maxRevenue) * 160 : 20;
                  const isLast = index === analytics.revenueGrowth.length - 1;

                  return (
                    <div key={index} className="flex flex-col items-center gap-2">
                      <div
                        className={`w-10 rounded-t-sm transition-all duration-300 ${isLast
                            ? 'bg-gradient-to-b from-[#319795] to-[#2d7d7d] shadow-[0_4px_12px_rgba(49,151,149,0.3)]'
                            : 'bg-gradient-to-b from-[#e2e8f0] to-[#cbd5e0]'
                          }`}
                        style={{ height: `${height}px` }}
                      ></div>
                      <span className="text-[12px] text-[#718096] font-medium">{data.month}</span>
                    </div>
                  )
                }) : (
                  <div className="flex items-center justify-center w-full h-full text-[#718096] text-sm">
                    {t('no_revenue_data')}
                  </div>
                )
              }
            </div>
          </div>

          {/* Plan Distribution */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 shadow-sm">
            <div className="mb-5">
              <h3 className="text-lg font-semibold text-[#1a202c] mb-1">{t('plan_distribution')}</h3>
              <p className="text-sm text-[#718096]">{t('user_preference_by_plan')}</p>
            </div>

            {[
              { name: 'Basic', color: 'from-[#319795] to-[#2d7d7d]' },
              { name: 'Professional', color: 'from-[#3182ce] to-[#2c5aa0]' },
              { name: 'Enterprise', color: 'from-[#38a169] to-[#2f855a]' }
            ].map((plan) => (
              <div key={plan.name} className="mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-[#4a5568] font-medium">{t(plan.name.toLowerCase())}</span>
                  <span className="text-sm font-semibold text-[#1a202c]">
                    {analytics.planDistribution?.[plan.name] || 0}%
                  </span>
                </div>
                <div className="h-2 bg-[#f1f5f9] rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${plan.color} rounded-full`}
                    style={{ width: `${analytics.planDistribution?.[plan.name] || 0}%` }}
                  ></div>
                </div>
              </div>
            ))}

            <button className="w-full py-3 bg-gradient-to-br from-[#319795] to-[#2d7d7d] text-white border-none rounded-lg text-sm font-medium cursor-pointer transition-all shadow-[0_2px_8px_rgba(49,151,149,0.2)] hover:opacity-90 active:scale-[0.98]">
              {t('detailed_analytics')}
            </button>
          </div>
        </div>

        {/* New Subscription Modal */}
        {showNewSubscriptionModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4">
            <div className="bg-white rounded-xl p-8 w-[500px] max-w-full max-h-[90vh] overflow-auto shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#1a202c] m-0">{t('create_new_subscription')}</h2>
                <button
                  onClick={() => setShowNewSubscriptionModal(false)}
                  className="bg-transparent border-none text-2xl cursor-pointer text-[#718096] p-1 hover:text-black"
                >
                  ×
                </button>
              </div>

              <form onSubmit={createNewSubscription} className="flex flex-col gap-5">
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-2">{t('user_email')} *</label>
                  <input
                    type="email"
                    placeholder="user@example.com"
                    className="w-full p-3 border border-[#e2e8f0] rounded-lg text-sm outline-none focus:border-[#319795] transition-colors"
                    value={newSubscriptionData.userEmail}
                    onChange={(e) => setNewSubscriptionData(prev => ({ ...prev, userEmail: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-2">{t('plan_header')} *</label>
                  <select
                    className="w-full p-3 border border-[#e2e8f0] rounded-lg text-sm outline-none bg-white focus:border-[#319795]"
                    value={newSubscriptionData.planId}
                    onChange={(e) => setNewSubscriptionData(prev => ({ ...prev, planId: e.target.value }))}
                    required
                  >
                    <option value="">{t('select_plan')}</option>
                    <option value="1">Basic - $29/month</option>
                    <option value="2">Professional - $79/month</option>
                    <option value="3">Enterprise - $249/month</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-2">{t('billing_cycle')} *</label>
                  <select
                    className="w-full p-3 border border-[#e2e8f0] rounded-lg text-sm outline-none bg-white focus:border-[#319795]"
                    value={newSubscriptionData.billingCycle}
                    onChange={(e) => setNewSubscriptionData(prev => ({ ...prev, billingCycle: e.target.value }))}
                  >
                    <option value="monthly">{t('monthly')}</option>
                    <option value="yearly">{t('yearly')}</option>
                  </select>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowNewSubscriptionModal(false)}
                    className="flex-1 p-3 border border-[#e2e8f0] rounded-lg bg-white text-[#374151] text-sm font-medium cursor-pointer hover:bg-gray-50"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className={`flex-1 p-3 border-none rounded-lg text-white text-sm font-medium cursor-pointer transition-all ${createLoading ? 'bg-[#cbd5e0] cursor-not-allowed' : 'bg-gradient-to-br from-[#319795] to-[#2d7d7d] hover:opacity-90'
                      }`}
                  >
                    {createLoading ? t('creating') + '...' : t('create_subscription')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}