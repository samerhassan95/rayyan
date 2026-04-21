'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { useLanguage } from '../../../i18n/LanguageContext'

import userOctagon from '../../../assets/icons/user-octagon.svg'
import crown from '../../../assets/icons/crown.svg'
import chart from '../../../assets/icons/chart-2.svg'
import wallet from '../../../assets/icons/wallet-money.svg'


import StatGroup from '../../components/StateCard'
import DataTable, { Column } from '../../components/GenericTable'
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export default function AdminUsers() {
  const { t, isRTL } = useLanguage()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statistics, setStatistics] = useState<any>(null)
  const [pagination, setPagination] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const router = useRouter()

  const columns: Column[] = [
    { key: 'customer', label: 'Customer', type: 'user' },
    { key: 'contact', label: 'Contact Details', type: 'userEmail' }, // استخدمنا userEmail عشان فيها سطرين
    { key: 'plan', label: 'Plan', type: 'plan' },
    { key: 'status', label: 'Status', type: 'statusِActive' },
    { key: 'lastActive', label: 'Last Active', type: 'lastActive' },
    { key: 'actions', label: 'Actions', type: 'action' },
  ];

const data = [
    {
      id: 1,
      customer: 'Jane Doe',
      contact: 'alex.t@vanguard.com', // القيمة الأساسية (الاسم في الكود الأصلي)
      email: '+1 (555) 012-3456',    // القيمة الفرعية
      plan: 'Enterprise',
      status: 'Active',
      lastActive: '2 hours ago',
    },
    // كرري البيانات حسب الحاجة...
  ];


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
    event.stopPropagation()

    try {
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }

      await axios.put(`${API_URL}/api/admin/users/${userId}/status`, { status }, { headers })
      fetchUsers()
    } catch (error) {
      console.error('Failed to update user status:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        {t('loading')}...
      </div>
    )
  }

  return (
    <div className={`mx-auto ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className='space-y-1'>
            <h1 className="m-0 mb-2 text-2xl font-medium text-gray-900 leading-[100%]">
              Customers
            </h1>
            <p className="m-0 text-base text-[#7d7d7d] font-light leding-[100%]">
              Manage, analyze, and support your global customer base from a single ledger.            </p>
          </div>
          <div >
            <button className="flex items-center gap-2 px-5 py-2.5 text-base font-medium rounded-full bg-gradient-to-r from-[#488981] to-[#51D1B8] text-white">
              add user
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        {/* <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder={t('search_users_placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-3 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button
            onClick={() => fetchUsers()}
            className="px-5 py-3 text-sm font-medium text-white transition-colors bg-teal-600 border-none rounded-lg cursor-pointer hover:bg-teal-700"
          >
            🔍 {t('search')}
          </button>
        </div> */}

        {/* Stats Grid */}
        <StatGroup
          items={[
            {
              icon: userOctagon,
              label: t('total_customers'),
              // ندمج الرقم مع النسبة في الـ value مباشرة
              value: `12,842`
            },
            {
              icon: crown,
              label: t('active_subs'),
              value: "12,842"
            },
            {
              icon: wallet,
              label: t('new_this_month'),
              value: "12,842"
            },
            {
              icon: chart,
              label: t('churn_rate'),
              value: `2.4%`
            },
          ]}
        />

      </div>

      {/* Statistics Cards */}
      {/* <div className="grid grid-cols-1 gap-5 mb-8 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: t('seat_utilization'), value: `${statistics?.seatUtilization || 0}%` },
          { label: t('two_factor_enabled_label'), value: statistics?.twoFactorEnabled || 0 },
          { label: t('recent_activity'), value: `${statistics?.avgActivation || 0}%` },
          { label: t('new_this_month'), value: statistics?.recentInvites || 0 }
        ].map((stat, idx) => (
          <div key={idx} className="p-6 bg-white border border-gray-200 rounded-xl">
            <div className="text-[28px] font-bold text-gray-900 mb-2">
              {stat.value}
            </div>
            <div className="text-sm tracking-wider text-gray-500 uppercase">
              {stat.label}
            </div>
          </div>
        ))}
      </div> */}

      {/* Users Table */}
<DataTable
        title="All Customers"
        description="Reviewing the latest 10 activities"
        columns={columns}
        data={Array(4).fill(data[0])} // مثال لتكرار الصف 4 مرات كما في الصورة
        filterSection={
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            <span className="text-lg">≡</span> Filter
          </button>
        }
        footerSection={
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Showing 1 to 4 of 240 results</span>
            <div className="flex gap-2">
               <button className="px-3 py-1 border rounded hover:bg-gray-50">{'<'}</button>
               <button className="px-3 py-1 text-white bg-[#488981] rounded">1</button>
               <button className="px-3 py-1 border rounded hover:bg-gray-50">2</button>
               <button className="px-3 py-1 border rounded hover:bg-gray-50">3</button>
               <button className="px-3 py-1 border rounded hover:bg-gray-50">{'>'}</button>
            </div>
          </div>
        }
      />
      
     
    </div>
  )
}