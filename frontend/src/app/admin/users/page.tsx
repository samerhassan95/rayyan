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
      <div className="overflow-hidden bg-white border border-gray-200 rounded-xl">
        <div className="p-6 border-b border-gray-200">
          <h2 className="m-0 text-xl font-semibold text-gray-900">
            {t('all_users_title')}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50">
                {['user_header', 'contact_header', 'role_status_header', 'security_header', 'joined_header', 'actions_header'].map((header) => (
                  <th key={header} className="px-6 py-4 text-xs font-semibold tracking-wider text-gray-500 uppercase text-start">
                    {t(header)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  onClick={() => handleUserClick(user.id)}
                  className="transition-colors border-b cursor-pointer border-slate-50 hover:bg-slate-50"
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-12 h-12 text-base font-bold text-white bg-gray-900 rounded-full">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-base font-semibold text-gray-900">
                          {user.username}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.job_title || t('platform_user')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div>
                      <div className="mb-1 text-sm text-gray-700">
                        {user.email}
                      </div>
                      <div className="text-gray-500 text-[13px]">
                        {user.phone || t('no_phone')}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-2">
                      <span className={`px-2 py-1 rounded-xl text-[12px] font-medium capitalize w-fit ${user.role === 'admin' ? 'bg-red-100 text-red-600' : 'bg-teal-50 text-teal-600'
                        }`}>
                        {user.role}
                      </span>
                      <span className={`px-2 py-1 rounded-xl text-[12px] font-medium capitalize w-fit ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                        {t(user.status)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-2 py-1 rounded-xl text-[12px] font-medium w-fit ${user.two_factor_enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                      {user.two_factor_enabled ? '🔐 2FA' : '🔓 ' + t('no_2fa')}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    {user.status === 'active' ? (
                      <button
                        onClick={(e) => updateUserStatus(user.id, 'suspended', e)}
                        className="bg-red-100 text-red-600 border-none px-3 py-1.5 rounded-md text-xs cursor-pointer font-medium hover:bg-red-200 transition-colors"
                      >
                        {t('suspend')}
                      </button>
                    ) : (
                      <button
                        onClick={(e) => updateUserStatus(user.id, 'active', e)}
                        className="bg-green-100 text-green-800 border-none px-3 py-1.5 rounded-md text-xs cursor-pointer font-medium hover:bg-green-200 transition-colors"
                      >
                        {t('activate')}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-5 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            {t('showing')} {((currentPage - 1) * 15) + 1} {t('to')} {Math.min(currentPage * 15, pagination?.total || 0)} {t('of')} {pagination?.total || 0} {t('users')}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 border-none rounded-md text-sm font-medium transition-colors ${currentPage === 1 ? 'bg-slate-50 text-slate-300 cursor-not-allowed' : 'bg-teal-600 text-white cursor-pointer hover:bg-teal-700'
                }`}
            >
              {t('previous')}
            </button>
            <span className="flex items-center px-4 py-2 text-sm text-gray-700">
              {t('page_count')} {currentPage} {t('of')} {pagination?.pages || 1}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(pagination?.pages || 1, currentPage + 1))}
              disabled={currentPage === (pagination?.pages || 1)}
              className={`px-4 py-2 border-none rounded-md text-sm font-medium transition-colors ${currentPage === (pagination?.pages || 1) ? 'bg-slate-50 text-slate-300 cursor-not-allowed' : 'bg-teal-600 text-white cursor-pointer hover:bg-teal-700'
                }`}
            >
              {t('next')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}