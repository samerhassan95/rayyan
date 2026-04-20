'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import StatGroup from '../components/StateCard';
import { useLanguage } from '../../i18n/LanguageContext'


//icons import
import Image from 'next/image'
import userOctagon from '../../assets/icons/user-octagon.svg'
import crown from '../../assets/icons/crown.svg'
import chart from '../../assets/icons/chart-2.svg'
import wallet from '../../assets/icons/wallet-money.svg'


const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export default function AdminDashboard() {
  const { t, isRTL, language } = useLanguage()
  const [stats, setStats] = useState<any>(null)
  const [recentTransactions, setRecentTransactions] = useState<any[]>([])
  const [monthlyRevenue, setMonthlyRevenue] = useState<any[]>([])
  const [userAcquisition, setUserAcquisition] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [chartPeriod, setChartPeriod] = useState(language === 'ar' ? 'أخر 6 شهور' : 'Last 6 Months')
  const [showTransactionFilter, setShowTransactionFilter] = useState(false)
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([])
  const [isFilteringTransactions, setIsFilteringTransactions] = useState(false)
  const [transactionFilter, setTransactionFilter] = useState({
    status: 'all',
    dateRange: 'all',
    amount: 'all'
  })
  const router = useRouter()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        console.error('No token found')
        return
      }

      const headers = { Authorization: `Bearer ${token}` }
      console.log('Fetching dashboard data...')

      const response = await axios.get(`${API_URL}/api/admin/dashboard/stats`, { headers })
      console.log('Dashboard data fetched successfully:', response.data)

      setStats(response.data.stats)
      setRecentTransactions(response.data.recentTransactions || [])
      setMonthlyRevenue(response.data.monthlyRevenue || [])
      setUserAcquisition(response.data.userAcquisition || {})
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      console.error('Error details:', error.response?.data)

      // Only use fallback data if there's a real error
      if (error.response?.status === 401) {
        // Redirect to login if unauthorized
        router.push('/login')
        return
      }

      // Set fallback data if API fails
      setStats({
        totalUsers: 42892,
        totalRevenue: 1200000,
        activeSubscriptions: 18203,
        growthRate: 24.5
      })
      setRecentTransactions([
        {
          id: 'TXN-902341',
          username: 'Jane Doe',
          email: 'jane@example.com',
          amount: 1200.00,
          transaction_date: '2023-10-24',
          status: 'successful'
        },
        {
          id: 'TXN-902342',
          username: 'Marcus Smith',
          email: 'marcus@example.com',
          amount: 450.00,
          transaction_date: '2023-10-23',
          status: 'pending'
        }
      ])
      setMonthlyRevenue([
        { month: '2023-05', revenue: 95000, transactions: 120 },
        { month: '2023-06', revenue: 110000, transactions: 145 },
        { month: '2023-07', revenue: 125000, transactions: 160 },
        { month: '2023-08', revenue: 140000, transactions: 180 },
        { month: '2023-09', revenue: 155000, transactions: 200 },
        { month: '2023-10', revenue: 170000, transactions: 220 }
      ])
      setUserAcquisition({
        direct: 45,
        referral: 32,
        social: 18,
        other: 5
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChartPeriodChange = async (period: string) => {
    setChartPeriod(period)

    try {
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }

      // Map period to months
      let months = 6
      switch (period) {
        case 'Last 3 Months': months = 3; break
        case 'Last 6 Months': months = 6; break
        case 'Last 12 Months': months = 12; break
        case 'This Year':
          const currentMonth = new Date().getMonth() + 1
          months = currentMonth
          break
      }

      const response = await axios.get(`${API_URL}/api/admin/dashboard/stats?period=${months}`, { headers })
      setMonthlyRevenue(response.data.monthlyRevenue || [])
    } catch (error) {
      console.error('Failed to fetch chart data:', error)
      // Keep existing data on error
    }
  }

  const handleShowAllActivity = () => {
    router.push('/admin/transactions')
  }

  const handleViewFullReport = () => {
    // Navigate to analytics page instead of popup
    router.push('/admin/analytics/user-acquisition')
  }

  const applyTransactionFilter = async () => {
    setIsFilteringTransactions(true)
    try {
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }

      const params = new URLSearchParams()
      if (transactionFilter.status !== 'all') params.append('status', transactionFilter.status)
      if (transactionFilter.dateRange !== 'all') params.append('dateRange', transactionFilter.dateRange)
      if (transactionFilter.amount !== 'all') params.append('amount', transactionFilter.amount)
      params.append('limit', '10')

      const response = await axios.get(`${API_URL}/api/admin/transactions/filtered?${params}`, { headers })
      setFilteredTransactions(response.data)
      setShowTransactionFilter(false)

      // Show success message
      console.log(`Applied filters: ${response.data.length} transactions found`)
    } catch (error) {
      console.error('Failed to filter transactions:', error)
      // If API fails, filter locally as fallback
      let filtered = [...recentTransactions]

      if (transactionFilter.status !== 'all') {
        filtered = filtered.filter(t => t.status === transactionFilter.status)
      }

      if (transactionFilter.dateRange !== 'all') {
        const now = new Date()
        filtered = filtered.filter(t => {
          const transactionDate = new Date(t.transaction_date)
          switch (transactionFilter.dateRange) {
            case 'today':
              return transactionDate.toDateString() === now.toDateString()
            case 'week':
              const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
              return transactionDate >= weekAgo
            case 'month':
              const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
              return transactionDate >= monthAgo
            default:
              return true
          }
        })
      }

      if (transactionFilter.amount !== 'all') {
        filtered = filtered.filter(t => {
          const amount = parseFloat(t.amount)
          switch (transactionFilter.amount) {
            case 'low':
              return amount < 100
            case 'medium':
              return amount >= 100 && amount <= 1000
            case 'high':
              return amount > 1000
            default:
              return true
          }
        })
      }

      setFilteredTransactions(filtered)
      setShowTransactionFilter(false)
    } finally {
      setIsFilteringTransactions(false)
    }
  }

  const resetTransactionFilter = () => {
    setTransactionFilter({
      status: 'all',
      dateRange: 'all',
      amount: 'all'
    })
    setFilteredTransactions([])
    setShowTransactionFilter(false)
  }

  // Use filtered transactions if available, otherwise use recent transactions
  const displayTransactions = filteredTransactions.length > 0 ? filteredTransactions : recentTransactions

  if (loading) {
    return <div className="loading">{t('loading')}...</div>
  }

  return (
    <div className="space-y-4" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
      <div className='space-y-1.5'>
        <p className="text-2xl font-medium leading-[100%]">{t('overview')}</p>
        <p className="font-light leadidng-[100%] text-[#7d7d7d]">Real-time performance metrics and system health.</p>
      </div>

      
      {/* Stats Grid */}
      <StatGroup
        items={[
          {
            icon: userOctagon,
            label: t('total_users'),
            // ندمج الرقم مع النسبة في الـ value مباشرة
            value: `${stats?.totalUsers?.toLocaleString() || '0'} (${stats?.userGrowth || 0}%)`
          },
          {
            icon: wallet,
            label: t('revenue'),
            value: stats?.totalRevenue >= 1000000
              ? `$${(stats.totalRevenue / 1000000).toFixed(1)}M`
              : `$${(stats.totalRevenue / 1000).toFixed(0)}K`
          },
          {
            icon: crown,
            label: t('active_subs'),
            value: `${stats?.activeSubscriptions?.toLocaleString() || '0'} (+${stats?.subsGrowth || 0}%)`
          },
          {
            icon: chart,
            label: t('growth_rate'),
            value: `${stats?.growthRate || 0}%`
          },
        ]}
      />

      <div className='grid gap-4 lg:grid-cols-12'>
        {/* Performance Trend Chart */}
        <div className="content-card lg:col-span-8" style={{ marginBottom: '30px' }}>
          <div className="card-header">
            <div>
              <h3 className="text-xl font-semibold leading-[100%]">{t('performance_trend')}</h3>
              <p className="leading-[100%] text-[#00000099] text-base">{t('monthly_revenue_vs_growth')}</p>
            </div>
            <select
              value={chartPeriod}
              onChange={(e) => handleChartPeriodChange(e.target.value)}
              className="px-[8px] py-[12px] rounded-full border border-[#e2e8f0] cursor-pointer bg-[#EEEEEE] text-sm "
            >
              <option>{isRTL ? 'أخر 6 شهور' : 'Last 6 Months'}</option>
              <option>{isRTL ? 'أخر 12 شهر' : 'Last 12 Months'}</option>
              <option>{isRTL ? 'أخر 3 شهور' : 'Last 3 Months'}</option>
              <option>{isRTL ? 'هذا العام' : 'This Year'}</option>
            </select>
          </div>
          <div className="card-content">
            <div style={{
              height: '350px',
              background: '#f8fafc',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              padding: '20px 20px 10px 20px'
            }}>
              {monthlyRevenue.length > 0 ? (
                <>
                  {/* Chart Area */}
                  <div style={{
                    flex: 1,
                    position: 'relative',
                    marginBottom: '15px'
                  }}>
                    <svg
                      width="100%"
                      height="100%"
                      viewBox="0 0 800 250"
                      style={{ overflow: 'visible' }}
                      preserveAspectRatio="xMidYMid meet"
                    >
                      {/* Grid Lines */}
                      {[0, 1, 2, 3, 4].map(i => (
                        <line
                          key={i}
                          x1="50"
                          y1={30 + i * 40}
                          x2="750"
                          y2={30 + i * 40}
                          stroke="#e2e8f0"
                          strokeWidth="1"
                        />
                      ))}

                      {/* Revenue Line */}
                      <path
                        d={(() => {
                          const maxRevenue = Math.max(...monthlyRevenue.map(m => m.revenue));
                          const dataToShow = (() => {
                            switch (chartPeriod) {
                              case 'Last 3 Months': return monthlyRevenue.slice(-3);
                              case 'Last 6 Months': return monthlyRevenue.slice(-6);
                              case 'Last 12 Months': return monthlyRevenue.slice(-12);
                              case 'This Year': return monthlyRevenue;
                              default: return monthlyRevenue.slice(-6);
                            }
                          })();

                          const points = dataToShow.map((item, index) => {
                            const x = 50 + (index * (700 / Math.max(dataToShow.length - 1, 1)));
                            const y = 190 - ((item.revenue / maxRevenue) * 140);
                            return `${x},${y}`;
                          });

                          // Create smooth curve using quadratic bezier curves
                          if (points.length < 2) return '';

                          let path = `M ${points[0]}`;
                          for (let i = 1; i < points.length; i++) {
                            const [x1, y1] = points[i - 1].split(',').map(Number);
                            const [x2, y2] = points[i].split(',').map(Number);
                            const cpx = (x1 + x2) / 2;
                            const cpy = (y1 + y2) / 2;
                            path += ` Q ${cpx},${y1} ${x2},${y2}`;
                          }
                          return path;
                        })()}
                        fill="none"
                        stroke="url(#gradient)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        style={{
                          strokeDasharray: '1000',
                          strokeDashoffset: '1000',
                          animation: 'drawLine 2s ease-in-out forwards'
                        }}
                      />

                      {/* Gradient Definition */}
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#319795" />
                          <stop offset="100%" stopColor="#4fd1c7" />
                        </linearGradient>
                        <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="rgba(49, 151, 149, 0.3)" />
                          <stop offset="100%" stopColor="rgba(49, 151, 149, 0.05)" />
                        </linearGradient>
                      </defs>

                      {/* Area under curve */}
                      <path
                        d={(() => {
                          const maxRevenue = Math.max(...monthlyRevenue.map(m => m.revenue));
                          const dataToShow = (() => {
                            switch (chartPeriod) {
                              case 'Last 3 Months': return monthlyRevenue.slice(-3);
                              case 'Last 6 Months': return monthlyRevenue.slice(-6);
                              case 'Last 12 Months': return monthlyRevenue.slice(-12);
                              case 'This Year': return monthlyRevenue;
                              default: return monthlyRevenue.slice(-6);
                            }
                          })();

                          const points = dataToShow.map((item, index) => {
                            const x = 50 + (index * (700 / Math.max(dataToShow.length - 1, 1)));
                            const y = 190 - ((item.revenue / maxRevenue) * 140);
                            return `${x},${y}`;
                          });

                          if (points.length < 2) return '';

                          let path = `M 50,190 L ${points[0]}`;
                          for (let i = 1; i < points.length; i++) {
                            const [x1, y1] = points[i - 1].split(',').map(Number);
                            const [x2, y2] = points[i].split(',').map(Number);
                            const cpx = (x1 + x2) / 2;
                            const cpy = (y1 + y2) / 2;
                            path += ` Q ${cpx},${y1} ${x2},${y2}`;
                          }
                          path += ` L ${points[points.length - 1].split(',')[0]},190 Z`;
                          return path;
                        })()}
                        fill="url(#areaGradient)"
                      />

                      {/* Data Points */}
                      {(() => {
                        const maxRevenue = Math.max(...monthlyRevenue.map(m => m.revenue));
                        const dataToShow = (() => {
                          switch (chartPeriod) {
                            case 'Last 3 Months': return monthlyRevenue.slice(-3);
                            case 'Last 6 Months': return monthlyRevenue.slice(-6);
                            case 'Last 12 Months': return monthlyRevenue.slice(-12);
                            case 'This Year': return monthlyRevenue;
                            default: return monthlyRevenue.slice(-6);
                          }
                        })();

                        return dataToShow.map((item, index) => {
                          const x = 50 + (index * (700 / Math.max(dataToShow.length - 1, 1)));
                          const y = 190 - ((item.revenue / maxRevenue) * 140);

                          return (
                            <g key={index}>
                              <circle
                                cx={x}
                                cy={y}
                                r="6"
                                fill="#319795"
                                stroke="white"
                                strokeWidth="3"
                                style={{ cursor: 'pointer' }}
                              />
                              {/* Tooltip on hover */}
                              <circle
                                cx={x}
                                cy={y}
                                r="15"
                                fill="transparent"
                                style={{ cursor: 'pointer' }}
                                onMouseEnter={(e) => {
                                  const tooltip = document.getElementById(`tooltip-${index}`);
                                  if (tooltip) tooltip.style.display = 'block';
                                }}
                                onMouseLeave={(e) => {
                                  const tooltip = document.getElementById(`tooltip-${index}`);
                                  if (tooltip) tooltip.style.display = 'none';
                                }}
                              />
                              <g
                                id={`tooltip-${index}`}
                                style={{ display: 'none' }}
                              >
                                <rect
                                  x={x - 40}
                                  y={y - 35}
                                  width="80"
                                  height="25"
                                  fill="#1a202c"
                                  rx="4"
                                />
                                <text
                                  x={x}
                                  y={y - 18}
                                  textAnchor="middle"
                                  fill="white"
                                  fontSize="12"
                                  fontWeight="500"
                                >
                                  ${(item.revenue / 1000).toFixed(0)}K
                                </text>
                              </g>
                            </g>
                          );
                        });
                      })()}

                      {/* Y-axis labels */}
                      {[0, 1, 2, 3, 4].map(i => {
                        const maxRevenue = Math.max(...monthlyRevenue.map(m => m.revenue));
                        const value = (maxRevenue / 4) * (4 - i);
                        return (
                          <text
                            key={i}
                            x="40"
                            y={35 + i * 40}
                            textAnchor="end"
                            fontSize="12"
                            fill="#718096"
                          >
                            ${(value / 1000).toFixed(0)}K
                          </text>
                        );
                      })}
                    </svg>
                  </div>

                  {/* Month Labels */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    paddingLeft: '50px',
                    paddingRight: '50px',
                    marginTop: '5px',
                    marginBottom: '5px'
                  }}>
                    {(() => {
                      const dataToShow = (() => {
                        switch (chartPeriod) {
                          case 'Last 3 Months': return monthlyRevenue.slice(-3);
                          case 'Last 6 Months': return monthlyRevenue.slice(-6);
                          case 'Last 12 Months': return monthlyRevenue.slice(-12);
                          case 'This Year': return monthlyRevenue;
                          default: return monthlyRevenue.slice(-6);
                        }
                      })();

                      return dataToShow.map((item, index) => (
                        <div
                          key={index}
                          style={{
                            textAlign: 'center',
                            fontSize: '12px',
                            color: '#718096',
                            fontWeight: '500'
                          }}
                        >
                          {new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                        </div>
                      ));
                    })()}
                  </div>

                  {/* Chart Legend */}
                  <div style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    background: 'rgba(255, 255, 255, 0.9)',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#319795',
                    fontWeight: '500',
                    border: '1px solid #e2e8f0'
                  }}>
                    {t('performance_trend')} - {chartPeriod}
                  </div>
                </>
              ) : (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: '#718096'
                }}>
                  {t('loading')}...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* User Acquisition */}
        <div className="content-card lg:col-span-4">
          <div className="card-header">
            <div>
              <h3 className="card-title">{t('user_acquisition')}</h3>
              <p className="card-subtitle">{t('source_distribution')}</p>
            </div>
          </div>
          <div className="card-content">
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: '#4a5568' }}>DIRECT</span>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '14px', fontWeight: '600' }}>{userAcquisition?.direct || 45}%</span>
                  <div style={{ fontSize: '12px', color: '#718096' }}>
                    {userAcquisition?.directCount || 0} users
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
                  width: `${userAcquisition?.direct || 45}%`,
                  height: '100%',
                  background: '#319795',
                  transition: 'width 0.5s ease'
                }}></div>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: '#4a5568' }}>REFERRAL</span>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '14px', fontWeight: '600' }}>{userAcquisition?.referral || 32}%</span>
                  <div style={{ fontSize: '12px', color: '#718096' }}>
                    {userAcquisition?.referralCount || 0} users
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
                  width: `${userAcquisition?.referral || 32}%`,
                  height: '100%',
                  background: '#3182ce',
                  transition: 'width 0.5s ease'
                }}></div>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: '#4a5568' }}>SOCIAL</span>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '14px', fontWeight: '600' }}>{userAcquisition?.social || 18}%</span>
                  <div style={{ fontSize: '12px', color: '#718096' }}>
                    {userAcquisition?.socialCount || 0} users
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
                  width: `${userAcquisition?.social || 18}%`,
                  height: '100%',
                  background: '#38a169',
                  transition: 'width 0.5s ease'
                }}></div>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: '#4a5568' }}>OTHER</span>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '14px', fontWeight: '600' }}>{userAcquisition?.other || 5}%</span>
                  <div style={{ fontSize: '12px', color: '#718096' }}>
                    {userAcquisition?.otherCount || 0} users
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
                  width: `${userAcquisition?.other || 5}%`,
                  height: '100%',
                  background: '#d69e2e',
                  transition: 'width 0.5s ease'
                }}></div>
              </div>
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '16px' }}
              onClick={handleViewFullReport}
            >
              View Full Report
            </button>
          </div>
        </div>
      </div>
      {/* Recent Transactions */}
      <div className="content-card lg:col-span-8">
        <div className="card-header">
          <div>
            <h3 className="card-title">{t('recent_transactions')}</h3>
            <p className="card-subtitle">{t('reviewing_latest_10')}</p>
          </div>
          <div style={{ position: 'relative' }}>
            <button
              className="btn btn-secondary"
              onClick={() => setShowTransactionFilter(!showTransactionFilter)}
              style={{
                background: filteredTransactions.length > 0 ? '#319795' : undefined,
                color: filteredTransactions.length > 0 ? 'white' : undefined
              }}
            >
              {t('filter')} {filteredTransactions.length > 0 && `(${filteredTransactions.length})`}
            </button>

            {/* Filter Dropdown */}
            {showTransactionFilter && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '16px',
                minWidth: '250px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                zIndex: 1000
              }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600' }}>{t('filter_transactions')}</h4>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Status</label>
                  <select
                    value={transactionFilter.status}
                    onChange={(e) => setTransactionFilter(prev => ({ ...prev, status: e.target.value }))}
                    style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #e2e8f0' }}
                  >
                    <option value="all">All Status</option>
                    <option value="successful">Successful</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Date Range</label>
                  <select
                    value={transactionFilter.dateRange}
                    onChange={(e) => setTransactionFilter(prev => ({ ...prev, dateRange: e.target.value }))}
                    style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #e2e8f0' }}
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                  </select>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Amount</label>
                  <select
                    value={transactionFilter.amount}
                    onChange={(e) => setTransactionFilter(prev => ({ ...prev, amount: e.target.value }))}
                    style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #e2e8f0' }}
                  >
                    <option value="all">All Amounts</option>
                    <option value="low">Under $100</option>
                    <option value="medium">$100 - $1000</option>
                    <option value="high">Over $1000</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={resetTransactionFilter}
                    style={{ flex: 1, fontSize: '12px', padding: '6px' }}
                  >
                    Reset
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={applyTransactionFilter}
                    disabled={isFilteringTransactions}
                    style={{ flex: 1, fontSize: '12px', padding: '6px' }}
                  >
                    {isFilteringTransactions ? 'Filtering...' : 'Apply'}
                  </button>
                </div>

                {filteredTransactions.length > 0 && (
                  <div style={{
                    marginTop: '12px',
                    padding: '8px',
                    background: '#e6fffa',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: '#319795',
                    textAlign: 'center'
                  }}>
                    Showing {filteredTransactions.length} filtered results
                    <button
                      onClick={() => setFilteredTransactions([])}
                      style={{
                        marginLeft: '8px',
                        background: 'none',
                        border: 'none',
                        color: '#319795',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      {t('clear')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="card-content" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('transaction_id')}</th>
                <th>{t('client')}</th>
                <th>{t('date')}</th>
                <th>{t('amount')}</th>
                <th>{t('status')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {displayTransactions.length > 0 ? displayTransactions.map((transaction, index) => (
                <tr key={transaction.id || index}>
                  <td>#{transaction.id || `TXN-${902341 + index}`}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: '#319795',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {transaction.username?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div style={{ fontWeight: '500' }}>{transaction.username || 'Unknown User'}</div>
                        <div style={{ fontSize: '12px', color: '#718096' }}>{transaction.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{new Date(transaction.transaction_date || transaction.date).toLocaleDateString()}</td>
                  <td>${parseFloat(transaction.amount || 0).toFixed(2)}</td>
                  <td><span className={`status-badge ${transaction.status}`}>{transaction.status?.toUpperCase()}</span></td>
                  <td>
                    <button
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}
                      onClick={() => alert(`Transaction Details:\nID: ${transaction.id}\nAmount: $${transaction.amount}\nStatus: ${transaction.status}`)}
                    >
                      ⋯
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>
                    {t('no_transactions_found')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div style={{ padding: '16px 24px', borderTop: '1px solid #f7fafc', textAlign: 'center' }}>
            <button
              className="btn btn-secondary"
              onClick={handleShowAllActivity}
            >
              {t('view_all')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}