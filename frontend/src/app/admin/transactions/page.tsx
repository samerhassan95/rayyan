'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { useLanguage } from '../../../i18n/LanguageContext'
import StatGroup from '../../components/StateCard'
import DataTable, { Column } from '../../components/GenericTable'
import Image from 'next/image'
import filterIcon from '../../../assets/icons/filter.svg'
import plus from '../../../assets/icons/plus.svg'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export default function AdminTransactions() {
  const { t, isRTL, language } = useLanguage()
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

      const analyticsResponse = await axios.get(`${API_URL}/api/transactions/analytics`, {
        headers,
        params: {
          period: filter.toLowerCase(),
          startDate: dateRange.start,
          endDate: dateRange.end
        }
      })

      setTransactions(transactionsResponse.data.transactions || [])
      setAnalytics(analyticsResponse.data || {})
    } catch (error: any) {
      console.error('❌ Error fetching data:', error)
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
    setDateRange({ start: '2025-01-01', end: '2026-12-31' })
    setCurrentPage(1)
  }

  const exportReport = async () => {
    try {
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }

      await axios.get(`${API_URL}/api/transactions/export`, {
        headers,
        params: {
          format: 'csv',
          status: statusFilter,
          paymentMethod: paymentTypeFilter,
          startDate: dateRange.start,
          endDate: dateRange.end
        }
      })

      const successDiv = document.createElement('div')
      successDiv.className = "fixed top-5 right-5 z-[9999] bg-gradient-to-br from-teal-600 to-teal-800 text-white px-6 py-4 rounded-lg shadow-lg text-sm font-medium"
      successDiv.textContent = t('export_initiated')
      document.body.appendChild(successDiv)
      setTimeout(() => document.body.removeChild(successDiv), 4000)

    } catch (error) {
      const errorDiv = document.createElement('div')
      errorDiv.className = "fixed top-5 right-5 z-[9999] bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg text-sm font-medium"
      errorDiv.textContent = t('export_failed')
      document.body.appendChild(errorDiv)
      setTimeout(() => document.body.removeChild(errorDiv), 4000)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-gray-500">{t('loading')}...</div>
  }

  const columns = [
    {
      key: 'user',
      label: t('user_header'),
      type: 'userEmail',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 text-sm font-bold text-white bg-teal-600 rounded-full">
            {row.user.initials}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900">{row.user.name}</span>
            <span className="text-xs text-gray-400">{row.user.email}</span>
          </div>
        </div>
      )
    },
    {
      key: 'amount',
      label: t('amount_header'),
      type: 'amount',
      // الـ Component بتاعك بيعمل parseFloat لوحده، بس نتأكد من العملة
      render: (value) => <span className="font-semibold text-gray-900">${value.toFixed(2)}</span>
    },
    {
      key: 'date',
      label: t('date'),
      type: 'date'
    },
    {
      key: 'paymentMethod',
      label: t('payment_method_header'),
      type: 'text',
      render: (value) => (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>💳</span> {value}
        </div>
      )
    },
    {
      key: 'status',
      label: t('status'),
      type: 'badge',
      render: (value) => {
        const statusStyles = {
          successful: 'bg-green-100 text-green-700',
          pending: 'bg-yellow-100 text-yellow-700',
          failed: 'bg-red-100 text-red-700',
        };
        return (
          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusStyles[value]}`}>
            {t(value)}
          </span>
        );
      }
    },
    { key: 'actions', label: 'Actions', type: 'actions' }

  ];


  return (
    <div className={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="mb-2 text-2xl font-semibold text-gray-900">
          {t('transactions_title')}
        </h1>
        <p className="text-gray-500">
          {t('transactions_desc')}
        </p>
      </div>

      {/* Stats Cards */}
      <StatGroup
        gridCols="xl:grid-cols-3"
        items={[
          {
            label: t('revenue'),
            value: analytics.totalRevenue?.toLocaleString() || '0',
            suffix: "$", // أو يمكنك وضع الـ $ داخل الـ value مباشرة
            icon: <span className="text-2xl">📈</span>
          },
          {
            label: t('monthly_volume'),
            value: analytics.monthlyVolume?.toLocaleString() || '0',
            suffix: "$",
            icon: <span className="text-2xl">📊</span>
          },
          {
            label: t('failed_transactions'),
            value: analytics.failedTransactions || 0,
            suffix: "%",
            icon: <span className="text-2xl">⚠️</span>
          }
        ]} />

      {/* Revenue Trends Chart */}
      <div className="p-6 mb-8 bg-white border border-gray-100 shadow-sm rounded-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">{t('revenue_trends')}</h3>
          <div className="flex gap-3">
            {['Daily', 'Weekly', 'Monthly'].map((p) => (
              <button
                key={p}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${filter === p ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                onClick={() => setFilter(p)}
              >
                {t(p.toLowerCase())}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-[340px]">
          {analytics.revenueData && analytics.revenueData.length > 0 ? (
            <div>
              <div className="h-[300px] bg-gradient-to-b from-slate-50 to-slate-100 rounded-lg flex items-end justify-around p-5 relative">
                {analytics.revenueData.map((data: any, index: number) => {
                  const maxRevenue = Math.max(...analytics.revenueData.map((r: any) => r.amount));
                  const height = maxRevenue > 0 ? (data.amount / maxRevenue) * 200 : 20;
                  const isLast = index === analytics.revenueData.length - 1;

                  return (
                    <div key={index} className="flex flex-col items-center gap-2">
                      <div
                        className={`w-10 rounded-t-md transition-all duration-300 relative group ${isLast ? 'bg-gradient-to-t from-teal-700 to-teal-500 shadow-teal-200 shadow-lg' : 'bg-gradient-to-t from-gray-300 to-gray-200'}`}
                        style={{ height: `${height}px` }}
                      >
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-bold text-gray-600">
                          ${Math.round(data.amount / 1000)}k
                        </div>
                      </div>
                      <span className="text-xs font-medium text-gray-500">{data.date}</span>
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-between mt-4 text-xs text-gray-400">
                <span>{t('period')}: {t(filter.toLowerCase())}</span>
                <span>{t('total')}: ${analytics.revenueData.reduce((sum: number, item: any) => sum + item.amount, 0).toLocaleString()}</span>
              </div>
            </div>
          ) : (
            <div className="h-[300px] bg-slate-50 rounded-lg flex flex-col items-center justify-center gap-3 text-gray-400">
              <div className="text-5xl">📈</div>
              <div>{t('no_revenue_data')}</div>
              <div className="text-xs">{t('adjust_filters')}</div>
            </div>
          )}
        </div>
      </div>

      <DataTable
        title={t('transactions_title')}
        description={t('transactions_description')}
        columns={columns}
        data={transactions} // الداتا اللي جاية من الـ State بتاعتك
        rowsPerPage={5}
        onEdit={(row) => console.log(row)}
        onDelete={(row) => console.log(row)}


        filterSection={(
          <div className="flex flex-wrap items-center gap-3">
            {/* جزء التاريخ */}
            {/* <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="px-3 py-2 text-sm border border-gray-200 rounded-md outline-none focus:ring-2 focus:ring-teal-500"
              />
              <span className="text-sm text-gray-400">{t('to')}</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="px-3 py-2 text-sm border border-gray-200 rounded-md outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div> */}

            {/* اختيارات النوع والحالة */}
            {/* <select
              className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-md outline-none focus:ring-2 focus:ring-teal-500"
              value={paymentTypeFilter}
              onChange={(e) => setPaymentTypeFilter(e.target.value)}
            >
              <option value="">{t('all_payment_types')}</option>
              <option value="credit_card">{t('credit_card')}</option>
              <option value="bank_transfer">{t('bank_transfer')}</option>
            </select> */}

            <div className="flex gap-2">
              {/* <button onClick={clearFilters} className="px-4 py-2 text-sm border rounded-md">{t('clear_filters')}</button> */}

              <button
                className="bg-[#eeeeee] flex items-center gap-1 px-3 py-1.5 text-sm rounded-full border border-[#e2e8f0] text-[#21665F]"

              >
                <Image src={filterIcon} alt="Filter Icon" width={14} height={14} />
                {t('filter')}
              </button>
              <button onClick={exportReport} className="px-4 py-2 text-sm text-white bg-teal-600 rounded-full">{t('export_report')}</button>
            </div>
          </div>
        )}
      />
    </div>
  )
}