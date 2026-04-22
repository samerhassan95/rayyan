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

  const columns: Column[] = [
    { key: 'customer', label: t('user_header'), type: 'user' },
    { key: 'contact', label: t('contact_header'), type: 'userEmail' },
    { key: 'plan', label: t('plan_header'), type: 'plan' },
    { key: 'status', label: t('status'), type: 'statusِActive' },
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
      {/* Header */}
      <div className="mb-8">
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
              {t('add_new')} {t('users').toLowerCase()}
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

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">{t('add_new')} {t('users').toLowerCase()}</h3>
              <button 
                onClick={() => setShowAddUserModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('username_label')} *
                </label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#319795]"
                  placeholder="Enter username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('email_label')} *
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#319795]"
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('password_label')} *
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#319795]"
                  placeholder="Enter password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('phone_label')}
                </label>
                <input
                  type="tel"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#319795]"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('job_title_label')}
                </label>
                <input
                  type="text"
                  value={newUser.job_title}
                  onChange={(e) => setNewUser({...newUser, job_title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#319795]"
                  placeholder="Software Engineer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('address')}
                </label>
                <input
                  type="text"
                  value={newUser.address}
                  onChange={(e) => setNewUser({...newUser, address: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#319795]"
                  placeholder="123 Main St, City, Country"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddUserModal(false)}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleAddUser}
                disabled={addUserLoading}
                className="flex-1 px-4 py-2 bg-[#319795] text-white rounded-lg hover:bg-[#2c7a7b] disabled:opacity-50"
              >
                {addUserLoading ? t('creating') : t('create_user')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Display */}
      {message && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`px-4 py-2 rounded-lg text-white ${
            message.includes('✅') ? 'bg-green-500' : 'bg-red-500'
          }`}>
            {message}
          </div>
        </div>
      )}
      
     
    </div>
  )
}