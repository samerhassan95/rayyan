'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import StatGroup from '../../components/StateCard';
import { useLanguage } from '../../../i18n/LanguageContext'
import Image from 'next/image';
import percent1 from "../../../assets/icons/percent-1.svg"
import percent2 from "../../../assets/icons/percent-2.svg"
import percent3 from "../../../assets/icons/percent-3.svg"
import percent4 from "../../../assets/icons/percent-4.svg"

import filterIcon from "../../../assets/icons/filter.svg"
import plus from '../../../assets/icons/plus.svg'

import DataTable, { Column } from '../../components/GenericTable'

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
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([])
  const [isFilteringTransactions, setIsFilteringTransactions] = useState(false)
  const [transactionFilter, setTransactionFilter] = useState({
    status: 'all',
    dateRange: 'all',
    amount: 'all'
  })

  const columns = [
    {
      key: 'user',
      label: t('user_header'),
      render: (value, row) => {
        // نضمن إننا بنبعت نص للـ Component
        const name = row.user?.name || row.name || 'Unknown';
        return (
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 text-white rounded-full bg-gradient-to-br from-[#488981] to-[#51D1B8]">
              {name.charAt(0)}
            </div>
            <span className="text-sm font-medium">{name}</span>
          </div>
        );
      }
    },
    {
      key: 'plan',
      label: t('plan_header'),
      type: 'plan',
      render: (value, row) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{row.plan.name}</div>
          <div className="text-xs text-gray-500">{row.plan.price}</div>
        </div>
      )
    },
    {
      key: 'status',
      label: t('status'),
      type: 'statusActive', // بيعالج اللون الأخضر والأحمر تلقائياً بناءً على كلمة active
    },
    {
      key: 'billingCycle',
      label: t('billing_cycle'),
      type: 'text'
    },
    {
      key: 'nextPayment',
      label: t('next_payment'),
      type: 'text'
    },
    {
      key: 'actions',
      label: t('actions'),
      type: 'actions'
    }
  ];



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
      <div className="mb-6">
        <div className="flex items-start justify-between ">
          <div>
            <h1 className="text-[28px] font-bold text-[#1a202c]  tracking-[-0.5px]">
              {t('subscription_management')}
            </h1>
            <p className="text-[#718096] text-base">
              {t('subscription_management_desc')}
            </p>
          </div>

          <button
            onClick={() => setShowNewSubscriptionModal(true)}
            className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-white transition-all duration-200 rounded-full cursor-pointer bg-linear active:scale-95"
          >
            <Image src={plus} alt="plus" width={10} height={10} />
            {t('new_subscription')}
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

      <div className="space-y-8">
        <DataTable
          title={t('all_subscriptions')} // أو "All Customers"
          description={t('reviewing_latest_activities')}
          columns={columns}
          data={subscriptions} // المصفوفة اللي جاية من الـ API أو الـ State
          rowsPerPage={10}
          onEdit={(row) => console.log('Edit', row)}
          onDelete={(row) => console.log('Delete', row)}
          filterSection={
            <div className="flex flex-wrap items-center gap-4">
              {/* Monthly / Yearly Toggle */}
              <div className="flex p-1 bg-gray-100 rounded-lg">
                <button
                  onClick={() => setFilter('Monthly')}
                  className={`px-4 py-1 text-sm rounded-md transition-all ${filter === 'Monthly' ? 'bg-white shadow-sm text-primary font-bold' : 'text-gray-500'
                    }`}
                >
                  {t('monthly')}
                </button>
                <button
                  onClick={() => setFilter('Yearly')}
                  className={`px-4 py-1 text-sm rounded-md transition-all ${filter === 'Yearly' ? 'bg-white shadow-sm text-primary font-bold' : 'text-gray-500'
                    }`}
                >
                  {t('yearly')}
                </button>
              </div>

              <button
                className="bg-[#eeeeee] flex items-center gap-1 px-3 py-1.5 text-sm rounded-full border border-[#e2e8f0] text-[#21665F]"
                style={{
                  background: filteredTransactions.length > 0 ? '#319795' : undefined,
                  color: filteredTransactions.length > 0 ? 'white' : undefined
                }}
              >
                <Image src={filterIcon} alt="Filter Icon" width={14} height={14} />
                {t('filter')} {filteredTransactions.length > 0 && `(${filteredTransactions.length})`}
              </button>

              {/* Status Filter */}
              {/* <select
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-primary"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">{t('all_statuses')}</option>
                <option value="active">{t('active')}</option>
                <option value="past_due">{t('past_due')}</option>
                <option value="cancelled">{t('cancelled')}</option>
              </select> */}

              {/* Date Range */}
              {/* <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="px-2 py-1 text-xs border rounded-md"
                />
                <span className="text-gray-400">to</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="px-2 py-1 text-xs border rounded-md"
                />
              </div> */}

              {/* Clear Button */}
              {(statusFilter || dateRange.start !== '2025-01-01') && (
                <button
                  onClick={() => {
                    setStatusFilter('');
                    setDateRange({ start: '2025-01-01', end: '2026-12-31' });
                  }}
                  className="text-xs text-red-500 hover:underline"
                >
                  {t('clear_filters')}
                </button>
              )}
            </div>
          }
        />



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
          <div className="bg-[#3E7F77] rounded-xl p-6 shadow-sm">
            <div className="mb-5">
              <h3 className="mb-1 text-lg font-medium text-[#F4FFFC] leading-[28px]">{t('plan_distribution')}</h3>
              <p className="text-sm text-[#F4FFFC] font-light leading-[20px]">{t('user_preference_by_plan')}</p>
            </div>

            {[
              { name: 'Basic', color: 'from-[#fff] to-[#fff]' },
              { name: 'Professional', color: 'from-[#fff] to-[#fff]' },
              { name: 'Enterprise', color: 'from-[#fff] to-[#fff]' }
            ].map((plan) => (
              <div key={plan.name} className="mb-6 uppercase">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-white">{t(plan.name.toLowerCase())}</span>
                  <span className="text-sm font-medium text-[#F4FFFC]">
                    {analytics.planDistribution?.[plan.name] || 0}%
                  </span>
                </div>
                <div className="h-2 bg-[#F4FFFC1A] rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${plan.color} rounded-full`}
                    style={{ width: `${analytics.planDistribution?.[plan.name] || 0}%` }}
                  ></div>
                </div>
              </div>
            ))}

            <button className="w-full py-3.5 bg-[#F4FFFC1A]  border  text-white border-none rounded-lg text-sm font-medium cursor-pointer transition-all hover:opacity-90 active:scale-[0.98]">
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