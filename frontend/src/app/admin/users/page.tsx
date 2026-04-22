'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { useLanguage } from '../../../i18n/LanguageContext'
import Image from 'next/image'


import userOctagon from '../../../assets/icons/user-octagon.svg'
import crown from '../../../assets/icons/crown.svg'
import chart from '../../../assets/icons/chart-2.svg'
import wallet from '../../../assets/icons/wallet-money.svg'
import plus from '../../../assets/icons/plus.svg'
import insights from '../../../assets/icons/system-insight.svg'
import networking from '../../../assets/icons/network.svg';
import arrowLeft from '../../../assets/icons/arrow-left.svg'

//components
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
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [addUserLoading, setAddUserLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    phone: '',
    job_title: '',
    address: ''
  })
  const router = useRouter()

  const FormField = ({ label, value, onChange, placeholder, type = "text", required = false }) => (
    <div>
      <label className="block mb-1 font-medium uppercase text-[#586064] leading-[16.5px] tracking-[1.1px] text-xs">
        {label} {required && "*"}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#319795] transition-all placeholder:text-xs placeholder:tracking-[1px] placeholder:font-light"
        placeholder={placeholder}
      />
    </div>
  );

  const columns: Column[] = [
    { key: 'customer', label: t('user_header'), type: 'user' },
    { key: 'contact', label: t('contact_header'), type: 'userEmail' },
    { key: 'plan', label: t('plan_header'), type: 'badge' },
    { key: 'status', label: t('status'), type: 'statusActive' },
    { key: 'lastActive', label: t('last_active'), type: 'lastActive' },
    { key: 'actions', label: t('actions_header'), type: 'action' },
  ];

  // Remove hardcoded mock data - use only API data


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

      // Transform the data to match frontend expectations
      const transformedUsers = (response.data.users || []).map(user => ({
        id: user.id,
        customer: user.username || 'Unknown User',
        contact: user.email || 'No email provided',
        email: user.phone || 'No phone', // Using phone as secondary contact
        plan: user.plan_name || 'Free Plan',
        status: user.status === 'active' ? 'active' : 'inactive',
        lastActive: user.last_login ?
          new Date(user.last_login).toLocaleDateString() :
          'Never logged in',
        // Additional fields for actions
        originalData: user
      }))

      setUsers(transformedUsers)
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

  const handleAddUser = async () => {
    if (!newUser.username || !newUser.email || !newUser.password) {
      setMessage('❌ Please fill in all required fields')
      setTimeout(() => setMessage(''), 3000)
      return
    }

    setAddUserLoading(true)
    try {
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }

      await axios.post(`${API_URL}/api/admin/users`, newUser, { headers })

      setMessage('✅ User created successfully!')
      setShowAddUserModal(false)
      setNewUser({
        username: '',
        email: '',
        password: '',
        phone: '',
        job_title: '',
        address: ''
      })
      fetchUsers() // Refresh the users list
      setTimeout(() => setMessage(''), 3000)
    } catch (error: any) {
      setMessage(`❌ ${error.response?.data?.error || 'Failed to create user'}`)
      setTimeout(() => setMessage(''), 3000)
    } finally {
      setAddUserLoading(false)
    }
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
      <div className="">
        <div className="flex items-center justify-between mb-4">
          <div className='space-y-1'>
            <h1 className="m-0 mb-2 text-2xl font-medium text-gray-900 leading-[100%]">
              {t('users')}
            </h1>
            <p className="m-0 text-base text-[#7d7d7d] font-light leding-[100%]">
              {t('users_management_desc')}
            </p>
          </div>
          <div >
            <button
              className="flex items-center gap-2 px-5 py-2.5 text-base font-medium rounded-full bg-gradient-to-r from-[#488981] to-[#51D1B8] text-white hover:opacity-90 transition-opacity"
              onClick={() => setShowAddUserModal(true)}
            >
              <Image src={plus} alt="plus" width={10} height={10} />
              {t('add_customer').toLowerCase()}
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
              label: t('total_users'),
              value: `${statistics?.totalUsers?.toLocaleString() || '0'}`
            },
            {
              icon: crown,
              label: t('active_subs'),
              value: `${statistics?.activeSubscriptions?.toLocaleString() || '0'}`
            },
            {
              icon: wallet,
              label: t('new_this_month'),
              value: `${statistics?.newThisMonth?.toLocaleString() || '0'}`
            },
            {
              icon: chart,
              label: t('seat_utilization'),
              value: `${statistics?.seatUtilization || 0}%`
            },
          ]}
        />


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
          title={t('all_users_title')}
          description={t('reviewing_latest_10')}
          columns={columns}
          data={users} // Use the users state from API instead of hardcoded data
          onRowClick={(user) => handleUserClick(user.id)} // Make rows clickable
          filterSection={
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
              <span className="text-lg">≡</span> {t('filter')}
            </button>
          }
          footerSection={
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>{t('showing')} 1 {t('to')} {users.length} {t('of')} {pagination?.total || users.length} {t('results')}</span>
              <div className="flex gap-2">
                <button className="px-3 py-1 border rounded hover:bg-gray-50" disabled={currentPage <= 1}>{'<'}</button>
                <button className="px-3 py-1 text-white bg-[#488981] rounded">{currentPage}</button>
                {pagination?.totalPages > currentPage && (
                  <button className="px-3 py-1 border rounded hover:bg-gray-50">{currentPage + 1}</button>
                )}
                <button className="px-3 py-1 border rounded hover:bg-gray-50" disabled={currentPage >= (pagination?.totalPages || 1)}>{'>'}</button>
              </div>
            </div>
          }
        />

        <div className='grid gap-6 mt-6 md:grid-cols-2'>
          <div className="bg-white p-7 rounded-xl">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-[#545F731A] flex-shrink-0">
                <Image src={insights} alt="insights" width={24} height={24} />
              </div>
              <div className='space-y-1'>
                <p className='text-[#475266] text-sm leading-[20px] font-medium'>System Insights</p>
                <p className="text-[#475266CC] leading-[19.5px] text-sm">Customer activity has increased by 14% this week. We recommend reviewing the
                  churn risk on 4 Enterprise accounts that have been inactive for more than 5 days.
                </p>
                <div className="pt-2">
                  <button className='flex items-center gap-2 text-sm font-medium text-[#475266] '>
                    View Risk Report
                    <Image src={arrowLeft} alt="insights" width={12} height={12} />
                  </button>
                </div>

              </div>
            </div>
          </div>
          <div className="space-y-4 bg-linear p-7 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-transparent rounded-xl">
                <Image src={networking} alt="insights" width={24} height={24} />
              </div>
              <div className='bg-[#FFFFFF3D] rounded-full px-3 py-1.5 text-white font-medium leading-[15px] text-[10px] backdrop-blur-[4px] uppercase'>LIVE FEED</div>
            </div>
            <div className='space-y-2'>
              <p className='text-[#FFFFFFB2] uppercase tracking-[1.1px] text-sm leading-[16.5px]'>
                NETWORK HEALTH
              </p>
              <p className='text-3xl font-medium text-white leading-[28px]'>
                99.98%
              </p>
              <div className='h-1.5 bg-[#FFFFFF3D] w-full rounded-full overflow-hidden'>
                <div
                  className='h-full bg-white rounded-full w-[99.98%]'
                ></div>
              </div>
            </div>
          </div>
        </div>


        {/* ========================================================================================= Add User Modal */}
        {showAddUserModal && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-2xl p-6 mx-4 bg-white shadow-2xl rounded-xl">

              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl text-[#2B3437] font-medium leading-[28px] tracking-[-0.5px]">
                    {t('add_new_customer')}
                  </h3>
                  <p className="text-[#586064] text-sm font-light">
                    {t('add_customer_description')}
                  </p>
                </div>
                <button
                  onClick={() => setShowAddUserModal(false)}
                  className="text-[#586064] hover:bg-gray-100 p-2 rounded-full transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Form Fields Grid */}
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  label={t('username_label')}
                  required
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  placeholder="Enter username"
                />
                <FormField
                  label={t('email_label')}
                  required
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="user@example.com"
                />
                <FormField
                  label={t('password_label')}
                  required
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="••••••••"
                />
                <FormField
                  label={t('phone_label')}
                  type="tel"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                />

                <FormField
                  label={t('job_title_label')}
                  value={newUser.job_title}
                  onChange={(e) => setNewUser({ ...newUser, job_title: e.target.value })}
                  placeholder="Software Engineer"
                />
                <FormField
                  label={t('address')}
                  value={newUser.address}
                  onChange={(e) => setNewUser({ ...newUser, address: e.target.value })}
                  placeholder="123 Main St, City, Country"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setShowAddUserModal(false)}
                  className="flex-1 px- py-2.5 text-gray-600 border border-gray-300 rounded-full hover:bg-gray-50  transition-all"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleAddUser}
                  disabled={addUserLoading}
                  className="flex-1 px- py-2.5 bg-[#488981] text-white rounded-full hover:bg-[#2c7a7b] disabled:opacity-50  transition-all"
                >
                  {addUserLoading ? t('creating') : t('add_customer')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Message Display */}
        {message && (
          <div className="fixed z-50 top-4 right-4">
            <div className={`px-4 py-2 rounded-lg text-white ${message.includes('✅') ? 'bg-green-500' : 'bg-red-500'
              }`}>
              {message}
            </div>
          </div>
        )}


      </div>
    </div>
  )
}