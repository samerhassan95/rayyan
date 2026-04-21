'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import StatGroup from '../components/StateCard';
import { useLanguage } from '../../i18n/LanguageContext'
import DataTable from '../components/GenericTable';

//icons import
import Image from 'next/image'
import userOctagon from '../../assets/icons/user-octagon.svg'
import crown from '../../assets/icons/crown.svg'
import chart from '../../assets/icons/chart-2.svg'
import wallet from '../../assets/icons/wallet-money.svg'


//filter icon
import filterIcon from '../../assets/icons/filter.svg'

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

  const FILTER_CONFIG = [
    {
      name: 'status',
      label: 'Status',
      options: [
        { value: 'all', label: 'All Status' },
        { value: 'successful', label: 'Successful' },
        { value: 'pending', label: 'Pending' },
        { value: 'failed', label: 'Failed' },
      ],
    },
    {
      name: 'dateRange',
      label: 'Date Range',
      options: [
        { value: 'all', label: 'All Time' },
        { value: 'today', label: 'Today' },
        { value: 'week', label: 'This Week' },
        { value: 'month', label: 'This Month' },
      ],
    },
    {
      name: 'amount',
      label: 'Amount',
      options: [
        { value: 'all', label: 'All Amounts' },
        { value: 'low', label: 'Under $100' },
        { value: 'medium', label: '$100 - $1000' },
        { value: 'high', label: 'Over $1000' },
      ],
    },
  ];

  const sources = [
    { label: 'DIRECT', key: 'direct', color: 'bg-[#58A19A]', defaultValue: 45 },
    { label: 'REFERRAL', key: 'referral', color: 'bg-[#50AED4]', defaultValue: 32 },
    { label: 'SOCIAL', key: 'social', color: 'bg-[#51D1B8]', defaultValue: 18 },
    { label: 'OTHER', key: 'other', color: 'bg-[#BBBBBB]', defaultValue: 5 },
  ];

 const TRANSACTION_COLUMNS: Column[] = [
  { 
    key: 'id', 
    label: t('transaction_id'), 
    type: 'text', 
    minWidthClass: 'min-w-[150px]' 
  },

  { 
    key: 'username', // نستخدم اسم المستخدم مباشرة
    label: t('client'), 
    type: 'user', 
    minWidthClass: 'min-w-[220px]' 
    // الـ DataTable هيدور تلقائياً على row.image و row.email
  },
  { 
    key: 'transaction_date', 
    label: t('date'), 
    type: 'date', 
    minWidthClass: 'min-w-[160px]' 
  },
  { 
    key: 'amount', 
    label: t('amount'), 
    type: 'amount', // غيرناها من currency لـ amount عشان تدعم العملة الديناميكية
    minWidthClass: 'min-w-[120px]' 
  },
  { 
    key: 'status', 
    label: t('status'), 
    type: 'progress', // غيرناها لـ status عشان تظهر الـ Dot الخضراء والحمراء
    minWidthClass: 'min-w-[130px]' 
  },
  { 
    key: 'actions', 
    label: t('actions'), 
    type: 'action', 
    widthClass: 'w-[80px]' 
  },
];

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
        },
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
        },
          {
          id: 'TXN-9023451',
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
      ]);
      
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
const displayTransactions = isFilteringTransactions || filteredTransactions.length > 0 
  ? filteredTransactions 
  : recentTransactions;
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
        <div className="content-card lg:col-span-8 mb-[30px]">
          <div className="flex items-center justify-between p-6">
            <div className='space-y-1.5'>
              <h3 className="text-xl font-medium leading-[100%]">{t('performance_trend')}</h3>
              <p className="leading-[100%] text-[#00000099] text-base font-light">{t('monthly_revenue_vs_growth')}</p>
            </div>
            <select
              value={chartPeriod}
              onChange={(e) => handleChartPeriodChange(e.target.value)}
              className="px-2 py-2 rounded-full border border-[#e2e8f0] cursor-pointer bg-[#EEEEEE] text-sm"
            >
              <option>{isRTL ? 'أخر 6 شهور' : 'Last 6 Months'}</option>
              <option>{isRTL ? 'أخر 12 شهر' : 'Last 12 Months'}</option>
              <option>{isRTL ? 'أخر 3 شهور' : 'Last 3 Months'}</option>
              <option>{isRTL ? 'هذا العام' : 'This Year'}</option>
            </select>
          </div>
          <div className="w-full p-6 rounded-xl">
            <div className="w-full bg-[#f8fafc] rounded-xl relative flex flex-col ">
              {monthlyRevenue.length > 0 ? (
                <div className="relative w-full aspect-video">
                  <svg
                    viewBox="0 0 800 450"
                    className="w-full h-full overflow-visible"
                    preserveAspectRatio="xMidYMid meet"
                  >
                    {(() => {
                      // إعدادات القياسات الديناميكية
                      const padding = { top: 40, right: 50, bottom: 60, left: 60 };
                      const chartWidth = 800 - padding.left - padding.right;
                      const chartHeight = 350 - padding.top - padding.bottom;

                      const maxRevenue = Math.max(...monthlyRevenue.map(m => m.revenue), 1000);

                      const dataToShow = (() => {
                        switch (chartPeriod) {
                          case 'Last 3 Months': return monthlyRevenue.slice(-3);
                          case 'Last 6 Months': return monthlyRevenue.slice(-6);
                          case 'Last 12 Months': return monthlyRevenue.slice(-12);
                          default: return monthlyRevenue.slice(-6);
                        }
                      })();

                      const points = dataToShow.map((item, index) => {
                        const x = padding.left + (index * (chartWidth / Math.max(dataToShow.length - 1, 1)));
                        const y = (padding.top + chartHeight) - ((item.revenue / maxRevenue) * chartHeight);
                        return { x, y, revenue: item.revenue, label: item.month };
                      });

                      // رسم الخط المنحني
                      let linePath = "";
                      if (points.length >= 2) {
                        linePath = `M ${points[0].x},${points[0].y}`;
                        for (let i = 1; i < points.length; i++) {
                          const p1 = points[i - 1];
                          const p2 = points[i];
                          const cpx = (p1.x + p2.x) / 2;
                          linePath += ` Q ${cpx},${p1.y} ${p2.x},${p2.y}`;
                        }
                      }

                      const areaPath = linePath ? `${linePath} L ${points[points.length - 1].x},${padding.top + chartHeight} L ${points[0].x},${padding.top + chartHeight} Z` : "";

                      return (
                        <g>
                          {/* 1. Grid Lines & Y-Axis Labels */}
                          {/* {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                            // const yPos = padding.top + (chartHeight * (1 - pct));
                            // return (
                            //   <g key={i}>
                            //     <line
                            //       x1={padding.left} y1={yPos}
                            //       x2={800 - padding.right} y2={yPos}
                            //       stroke="#e2e8f0" strokeWidth="1"
                            //     />
                            //     <text
                            //       x={padding.left - 10} y={yPos + 4}
                            //       textAnchor="end" fontSize="12" fill="#718096"
                            //     >
                            //       ${((maxRevenue * pct) / 1000).toFixed(0)}K
                            //     </text>
                            //   </g>
                            // );
                          })} */}

                          {/* 2. X-Axis Labels (الشهور) */}
                          {points.map((p, i) => (
                            <text
                              key={i}
                              x={p.x}
                              y={padding.top + chartHeight + 25}
                              textAnchor="middle"
                              fontSize="12"
                              fill="#718096"
                              fontWeight="500"
                            >
                              {new Date(p.label + '-01').toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                            </text>
                          ))}

                          {/* 3. The Chart Drawing */}
                          <path d={areaPath} fill="url(#areaGradient)" />
                          <path d={linePath} fill="none" stroke="url(#gradient)" strokeWidth="2" strokeLinecap="round" />

                          {/* 4. Interactive Points */}
                          {points.map((p, index) => (
                            <g key={index} className="group">
                              {/* <circle cx={p.x} cy={p.y} r="5" fill="#488981" stroke="white" strokeWidth="2" /> */}
                              {/* <circle
                                cx={p.x} cy={p.y} r="20" fill="transparent" className="cursor-pointer"
                                onMouseEnter={() => document.getElementById(`tooltip-${index}`).style.opacity = "1"}
                                onMouseLeave={() => document.getElementById(`tooltip-${index}`).style.opacity = "0"}
                              /> */}
                              {/* Tooltip */}
                              <g id={`tooltip-${index}`} style={{ opacity: 0, transition: 'opacity 0.2s' }} pointerEvents="none">
                                <rect x={p.x - 30} y={p.y - 35} width="60" height="25" fill="#1a202c" rx="4" />
                                <text x={p.x} y={p.y - 18} textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">
                                  ${(p.revenue / 1000).toFixed(1)}K
                                </text>
                              </g>
                            </g>
                          ))}
                        </g>
                      );
                    })()}

                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#319795" />
                        <stop offset="100%" stopColor="#4fd1c7" />
                      </linearGradient>
                      <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="rgba(49, 151, 149, 0.2)" />
                        <stop offset="100%" stopColor="transparent" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              ) : (
                <div className="flex items-center justify-center h-48 text-gray-400">Loading Chart...</div>
              )}
            </div>
          </div>
        </div>

        {/* User Acquisition */}
        <div className="py-1 content-card lg:col-span-4">
          <div className="card-header">
            <div className="space-y-1.5">
              <h3 className="text-xl font-medium leading-[100%]">{t('user_acquisition')}</h3>
              <p className="font-light leading-[100%] text-[#00000099]">{t('source_distribution')}</p>
            </div>
          </div>

          <div className="p-6 lg:space-y-7 2xl:space-y-12">
            {sources.map((source) => {
              const percentage = userAcquisition?.[source.key] || source.defaultValue;
              const count = userAcquisition?.[`${source.key}Count`] || 0;

              return (
                <div key={source.key} className="">
                  <div className="flex justify-between my-3">
                    <span className="text-sm text-[#4a5568]">{source.label}</span>
                    <div className="text-right">
                      <span className="text-sm font-semibold">{percentage}%</span>
                      {/* <div className="text-[12px] text-[#718096]">
                    {count} {t('users')}
                  </div> */}
                    </div>
                  </div>
                  <div className="h-[8px] bg-[#EEEEEE] rounded-full overflow-hidden">
                    <div
                      className={`h-full ${source.color} transition-[width] duration-500 ease-in-out rounded-full`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}

            <button
              className="w-full py-3 mt-4 rounded-full bg-primary text-white text-sm font-medium hover:bg-[#319795cc] transition-colors uppercase"
              onClick={handleViewFullReport}
            >
              {t('view_full_report')}
            </button>
          </div>
        </div>
      </div>


      {/* Recent Transactions */}
      <DataTable
        title={t('recent_transactions')}
        description={t('reviewing_latest_10')}
        columns={TRANSACTION_COLUMNS}
        data={displayTransactions}
        isRTL={isRTL}
        // --- قسم الفلتر بنفس الشكل القديم ---
        filterSection={
          <div className='relative'>
            <button
              className="bg-[#eeeeee] flex items-center gap-1 px-3 py-1.5 text-sm rounded-full border border-[#e2e8f0] text-[#21665F]"
              onClick={() => setShowTransactionFilter(!showTransactionFilter)}
              style={{
                background: filteredTransactions.length > 0 ? '#319795' : undefined,
                color: filteredTransactions.length > 0 ? 'white' : undefined
              }}
            >
              <Image src={filterIcon} alt="Filter Icon" width={14} height={14} />
              {t('filter')} {filteredTransactions.length > 0 && `(${filteredTransactions.length})`}
            </button>

            {showTransactionFilter && (
              <div className='absolute z-[1000] min-w-[280px]  right-0 bg-white border border-[#e2e8f0] rounded-xl px-4 py-2'>
                {/* <h4 className='pb-2 text-base font-medium border-b'>{t('filter_transactions')}</h4> */}

                {/* عمل Map لخيارات الفلتر */}
                {FILTER_CONFIG.map((filter) => (
                  <div key={filter.name} className="my-3">
                    <label className='block mb-1 text-xs font-semibold text-gray-600'>{filter.label}</label>
                    <select
                      value={transactionFilter[filter.name as keyof typeof transactionFilter]}
                      onChange={(e) => setTransactionFilter(prev => ({ ...prev, [filter.name]: e.target.value }))}
                      className='w-full px-2 py-2 text-sm border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#319795] focus:border-transparent'
                    >
                      {filter.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                ))}

                {/* أزرار التحكم (Reset & Apply) بنفس التصميم */}
                <div className='flex gap-2 mt-4'>
                  <button
                    className="flex-1 py-2 text-xs font-medium transition-colors border rounded-full hover:bg-gray-50"
                    onClick={resetTransactionFilter}
                  >
                    Reset
                  </button>
                  <button
                    className="flex-1 py-2 text-xs font-medium text-white bg-[#319795] rounded-full disabled:opacity-50"
                    onClick={applyTransactionFilter}
                    disabled={isFilteringTransactions}
                  >
                    {isFilteringTransactions ? 'Filtering...' : 'Apply'}
                  </button>
                </div>
              </div>
            )}
          </div>
        }
        // --- قسم الفوتر (زر View All) ---
        footerSection={
          <div className="text-center">
            <button className="btn btn-secondary" onClick={handleShowAllActivity}>
              {t('view_all_Activity')}
            </button>
          </div>
        }
      />
    </div>
  )
}