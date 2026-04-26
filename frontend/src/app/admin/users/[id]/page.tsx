'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import axios from 'axios'
import { useLanguage } from '../../../../i18n/LanguageContext'
import Image from 'next/image'
import edit from '../../../../assets/icons/edit.svg'
import suspend from '../../../../assets/icons/suspand.svg'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

// Modal Component
const Modal = ({ isOpen, onClose, title, children, type = 'info' }: {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  type?: 'info' | 'success' | 'warning' | 'error'
}) => {
  if (!isOpen) return null

  const getModalColors = () => {
    switch (type) {
      case 'success':
        return { border: '#10b981', background: '#ecfdf5', icon: '✅' }
      case 'warning':
        return { border: '#f59e0b', background: '#fffbeb', icon: '⚠️' }
      case 'error':
        return { border: '#ef4444', background: '#fef2f2', icon: '❌' }
      default:
        return { border: '#3b82f6', background: '#eff6ff', icon: 'ℹ️' }
    }
  }

  const colors = getModalColors()

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        background: 'white', borderRadius: '12px', padding: '24px',
        maxWidth: '500px', width: '90%', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        border: `2px solid ${colors.border}`
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px',
          padding: '16px', background: colors.background, borderRadius: '8px'
        }}>
          <span style={{ fontSize: '24px' }}>{colors.icon}</span>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1a202c' }}>
            {title}
          </h3>
        </div>
        <div style={{ marginBottom: '24px' }}>{children}</div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            background: '#e2e8f0', color: '#4a5568', border: 'none',
            padding: '10px 20px', borderRadius: '8px', cursor: 'pointer'
          }}>Close</button>
        </div>
      </div>
    </div>
  )
}

// Confirmation Modal
const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm'
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
}) => {
  if (!isOpen) return null;

  return (
    // Overlay
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">

      {/* Modal Container */}
      <div className="bg-white rounded-[12px] p-6 max-w-[400px] w-[90%] shadow-xl">

        {/* Title */}
        <h3 className="m-0 mb-4 text-[18px] font-semibold text-gray-900">
          {title}
        </h3>

        {/* Message */}
        <p className="m-0 mb-6 text-gray-600">
          {message}
        </p>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="bg-slate-200 text-gray-600 border-none px-5 py-2.5 rounded-lg cursor-pointer hover:bg-slate-300 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="bg-red-500 text-white border-none px-5 py-2.5 rounded-lg cursor-pointer hover:bg-red-600 transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// Usage Activity Chart Component
const UsageActivityChart = ({ period, userId }: { period: string, userId: string | string[] }) => {
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchUsageActivity()
  }, [period, userId])

  const fetchUsageActivity = async () => {
    if (!userId) return
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }
      const response = await axios.get(`${API_URL}/api/admin/users/${userId}/usage-activity?period=${period}`, { headers })
      setChartData(response.data.usageActivity || [])
    } catch (error) {
      console.error('Failed to fetch usage activity:', error)
      setChartData([])
    } finally {
      setLoading(false)
    }
  }

  // حالة التحميل
  if (loading) {
    return (
      <div className="h-[250px] flex items-center justify-center text-slate-500">
        Loading chart data...
      </div>
    )
  }

  // حالة عدم وجود بيانات
  if (!chartData || chartData.length === 0) {
    return (
      <div className="h-[250px] bg-slate-50 rounded-lg flex flex-col items-center justify-center text-slate-500 gap-2">
        <div className="text-2xl">📊</div>
        <div>No usage data available</div>
      </div>
    )
  }

  // الحسابات (بقيت كما هي لأنها منطق برمجـي وليست ستايل)
  const chartWidth = 800, chartHeight = 200
  const padding = { top: 20, right: 40, bottom: 40, left: 60 }
  const innerWidth = chartWidth - padding.left - padding.right
  const innerHeight = chartHeight - padding.top - padding.bottom

  const values = chartData.map(d => d.value)
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const valueRange = maxValue - minValue || 1

  const points = chartData.map((item, index) => ({
    x: padding.left + (index / (chartData.length - 1)) * innerWidth,
    y: padding.top + innerHeight - ((item.value - minValue) / valueRange) * innerHeight,
    value: item.value,
    date: item.date
  }))

  let pathData = `M ${points[0].x} ${points[0].y}`
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    const cpx = (prev.x + curr.x) / 2
    pathData += ` Q ${cpx} ${prev.y} ${curr.x} ${curr.y}`
  }

  const areaPath = pathData + ` L ${points[points.length - 1].x} ${chartHeight - padding.bottom} L ${padding.left} ${chartHeight - padding.bottom} Z`

  const xLabels = []
  const labelCount = 5
  for (let i = 0; i < labelCount; i++) {
    const dataIndex = Math.floor((i / (labelCount - 1)) * (chartData.length - 1))
    const item = chartData[dataIndex]
    const x = padding.left + (dataIndex / (chartData.length - 1)) * innerWidth
    const date = new Date(item.date)
    let label = period === 'Year' ? date.toLocaleDateString('en-US', { month: 'short' }) :
      period === 'Month' ? `${date.getDate().toString().padStart(2, '0')} ${date.toLocaleDateString('en-US', { month: 'short' })}` :
        date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    xLabels.push({ label, x })
  }

  const yLabels = []
  for (let i = 0; i <= 4; i++) {
    const value = minValue + (valueRange * i / 4)
    const y = padding.top + innerHeight - (i / 4) * innerHeight
    yLabels.push({ value: Math.round(value), y })
  }

  return (
    <div className="w-full overflow-x-auto">
      <svg width={chartWidth} height={chartHeight + 40} className="block mx-auto">
        <defs>
          <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#319795" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#319795" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* خطوط الشبكة */}
        {yLabels.map((label, index) => (
          <line
            key={`grid-${index}`}
            x1={padding.left}
            y1={label.y}
            x2={chartWidth - padding.right}
            y2={label.y}
            className="stroke-slate-100"
            strokeWidth="1"
          />
        ))}

        <path d={areaPath} fill="url(#chartGradient)" />

        <path
          d={pathData}
          fill="none"
          className="stroke-teal-600"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((point, index) => (
          <circle
            key={`point-${index}`}
            cx={point.x}
            cy={point.y}
            r="4"
            className="fill-teal-600 stroke-white"
            strokeWidth="2"
          >
            <title>{`${point.date}: ${point.value} units`}</title>
          </circle>
        ))}

        {/* نصوص المحاور */}
        {yLabels.map((label, index) => (
          <text
            key={`y-label-${index}`}
            x={padding.left - 10}
            y={label.y + 4}
            textAnchor="end"
            className="text-[12px] fill-slate-500"
          >
            {label.value}
          </text>
        ))}

        {xLabels.map((label, index) => (
          <text
            key={`x-label-${index}`}
            x={label.x}
            y={chartHeight - padding.bottom + 20}
            textAnchor="middle"
            className="text-[12px] fill-slate-500"
          >
            {label.label}
          </text>
        ))}
      </svg>

      {/* ملخص الرسم البياني */}
      <div className="flex justify-between items-center mt-4 px-4 py-3 bg-slate-50 rounded-lg text-[12px] text-slate-600">
        <div>
          <span className="font-bold">Period:</span> {period} | <span className="font-bold">Points:</span> {chartData.length}
        </div>
        <div>
          <span className="font-bold">Range:</span> {minValue} - {maxValue} | <span className="font-bold">Avg:</span> {Math.round(values.reduce((a, b) => a + b, 0) / values.length)}
        </div>
      </div>
    </div>
  )
}
export default function UserDetail() {
  const { t, isRTL } = useLanguage()
  const [userDetail, setUserDetail] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [editForm, setEditForm] = useState<any>({})
  const [chartPeriod, setChartPeriod] = useState('Month')
  const [supportTicketsFilter, setSupportTicketsFilter] = useState('all')

  // Modal states
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [modalMessage, setModalMessage] = useState('')
  const [confirmAction, setConfirmAction] = useState<() => void>(() => { })
  const [confirmTitle, setConfirmTitle] = useState('')
  const [confirmMessage, setConfirmMessage] = useState('')

  const router = useRouter()
  const params = useParams()
  const userId = params.id

  useEffect(() => {
    if (userId) {
      fetchUserDetail(Number(userId))
    }
  }, [userId])

  const fetchUserDetail = async (id: number) => {
    try {
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }
      const response = await axios.get(`${API_URL}/api/admin/users/${id}`, { headers })

      console.log('✅ User detail response:', response.data)

      setUserDetail(response.data)
      setEditForm({
        username: response.data.user.username,
        email: response.data.user.email,
        phone: response.data.user.phone || '',
        address: response.data.user.address || '',
        job_title: response.data.user.job_title || '',
        bio: response.data.user.bio || ''
      })
    } catch (error) {
      console.error('Failed to fetch user details:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }
      await axios.put(`${API_URL}/api/admin/users/${userId}`, editForm, { headers })
      setIsEditingProfile(false)
      fetchUserDetail(Number(userId))
      setModalMessage(t('profile_updated_success') || 'Profile updated successfully!')
      setShowSuccessModal(true)
    } catch (error) {
      console.error('Failed to update profile:', error)
      setModalMessage('Failed to update profile. Please try again.')
      setShowErrorModal(true)
    }
  }

  const suspendUser = async () => {
    const newStatus = userDetail.user.status === 'active' ? 'suspended' : 'active'
    const actionText = newStatus === 'suspended' ? 'suspend' : 'activate'

    setConfirmTitle(`${actionText.charAt(0).toUpperCase() + actionText.slice(1)} User`)
    setConfirmMessage(`Are you sure you want to ${actionText} ${userDetail.user.username}?`)
    setConfirmAction(() => async () => {
      try {
        const token = localStorage.getItem('token')
        const headers = { Authorization: `Bearer ${token}` }
        await axios.put(`${API_URL}/api/admin/users/${userId}/status`, { status: newStatus }, { headers })
        fetchUserDetail(Number(userId))
        setModalMessage(`User ${actionText}d successfully!`)
        setShowSuccessModal(true)
        setShowConfirmModal(false)
      } catch (error) {
        console.error('Failed to update user status:', error)
        setModalMessage(`Failed to ${actionText} user. Please try again.`)
        setShowErrorModal(true)
        setShowConfirmModal(false)
      }
    })
    setShowConfirmModal(true)
  }

  const toggleTwoFactor = async () => {
    const newStatus = !userDetail?.user?.two_factor_enabled
    const actionText = newStatus ? 'enable' : 'disable'

    setConfirmTitle(`${actionText.charAt(0).toUpperCase() + actionText.slice(1)} 2FA`)
    setConfirmMessage(`Are you sure you want to ${actionText} two-factor authentication?`)
    setConfirmAction(() => async () => {
      try {
        const token = localStorage.getItem('token')
        const headers = { Authorization: `Bearer ${token}` }
        await axios.put(`${API_URL}/api/admin/users/${userId}/two-factor`, { enabled: newStatus }, { headers })
        fetchUserDetail(Number(userId))
        setModalMessage(`Two-factor authentication ${actionText}d successfully!`)
        setShowSuccessModal(true)
        setShowConfirmModal(false)
      } catch (error) {
        console.error('Failed to toggle 2FA:', error)
        setModalMessage(`Failed to ${actionText} 2FA. Please try again.`)
        setShowErrorModal(true)
        setShowConfirmModal(false)
      }
    })
    setShowConfirmModal(true)
  }
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px', fontSize: '18px', color: '#718096' }}>
        {t('loading_user_details')}
      </div>
    )
  }

  // if (!userDetail) {
  //   return (
  //     <div  className= "flex flex-col items-center justify-center h-[400px ] text-[#718096] text-center" 
  //     >
  //       <div className='text-[64px] mb-[24px]'>❌</div>
  //       <h3 style={{ fontSize: '24px', fontWeight: '600', color: '#1a202c', marginBottom: '12px' }}>{t('user_not_found')}</h3>
  //       <button onClick={() => router.push('/admin/users')} style={{ background: '#319795', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer' }}>
  //         ← {t('back_to_users')}
  //       </button>
  //     </div>
  //   )
  // }

  return (
    <div className="" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
      {/* Header */}
      {/* <div style={{ marginBottom: '32px' }}>
        <button onClick={() => router.push('/admin/users')} style={{ background: 'none', border: '1px solid #e2e8f0', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', marginBottom: '16px' }}>
          {isRTL ? 'Back to Users ←' : '← Back to Users'}
        </button>
      </div> */}

      {/* User Profile Container */}
      <div className="flex justify-between p-8 mb-6 bg-white border rounded-xl border-slate-200">
        <div className="flex items-center gap-6 mb-8">

          {/* Avatar / Initial */}
          <div className="w-[128px] h-[128px] rounded-full bg-slate-900 flex items-center justify-center text-white text-[48px] font-semibold shrink-0">
            {userDetail.user.username?.charAt(0)?.toUpperCase()}
          </div>

          <div className="flex-1">
            {isEditingProfile ? (
              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    className="text-[28px] font-semibold text-slate-900 border-2 border-slate-200 rounded-lg px-2 py-1 bg-white mb-2 w-[300px] focus:border-teal-500 outline-none"
                  />
                  <input
                    type="text"
                    value={editForm.job_title}
                    onChange={(e) => setEditForm({ ...editForm, job_title: e.target.value })}
                    placeholder="Job Title"
                    className="text-slate-500 text-base border border-slate-200 rounded px-3 py-2 w-[300px] block focus:border-teal-500 outline-none"
                  />
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <span>📧</span>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="text-slate-600 border border-slate-200 rounded px-2 py-1 w-[200px] focus:border-teal-500 outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span>📍</span>
                    <input
                      type="text"
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      placeholder="Address"
                      className="text-slate-600 border border-slate-200 rounded px-2 py-1 w-[200px] focus:border-teal-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder="Phone Number"
                    className="text-slate-600 border border-slate-200 rounded p-2 w-[300px] focus:border-teal-500 outline-none"
                  />
                </div>

                <div>
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    placeholder="Bio"
                    rows={3}
                    className="text-slate-600 border border-slate-200 rounded p-2 w-[400px] resize-y block focus:border-teal-500 outline-none"
                  />
                </div>
              </div>
            ) : (
              /* View Mode */
              <div>
                <h1 className="text-[28px] font-semibold text-slate-900 m-0">
                  {userDetail.user.username}
                </h1>
                <p className="mb-4 text-base text-slate-500">
                  {userDetail.user.job_title || t('platform_user')}
                </p>

                <div className="flex items-center gap-6 mb-4 text-slate-600">
                  <span>📧 {userDetail.user.email}</span>
                  <span>📍 {userDetail.user.address || t('location_not_set')}</span>
                </div>

                {userDetail.user.phone && (
                  <div className="mb-2 text-slate-600">
                    <span>📞 {userDetail.user.phone}</span>
                  </div>
                )}

                {userDetail.user.bio && (
                  <div className="mb-4 italic text-slate-600">
                    "{userDetail.user.bio}"
                  </div>
                )}

                {/* Badges */}
                <div className="flex gap-3">
                  {userDetail.user.acquisition_source && (
                    <span className="bg-teal-50 text-teal-600 px-3 py-1 rounded-full text-[12px] font-medium">
                      {userDetail.user.acquisition_source}
                    </span>
                  )}
                  <span className="bg-teal-50 text-teal-600 px-3 py-1 rounded-full text-[12px] font-medium">
                    {userDetail.user.role}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-[12px] font-medium ${userDetail.user.status === 'active'
                    ? 'bg-teal-50 text-teal-600'
                    : 'bg-red-100 text-red-600'
                    }`}>
                    {userDetail.user.status}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
        <div>
          {/* Action Buttons */}
          <div className="flex self-start gap-3">
            {!isEditingProfile ? (
              <>
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="bg-linear flex items-center gap-2 text-white px-4 py-2.5 rounded-full font-medium hover:bg-slate-300 transition-colors cursor-pointer"
                >
                  <Image src={edit} alt="edit" width={14} height={14} />
                  {t('edit_profile')}
                </button>
                <button
                  onClick={suspendUser}
                  className="bg-[#f8f8f8] flex items-center gap-2 px-4 py-2.5 rounded-full font-medium hover:bg-slate-200 transition-colors cursor-pointer border border-gray-200"
                >
                  {userDetail.user.status === 'active' ? (
                    <>
                      <Image src={suspend} alt="suspend" width={16} height={16} />
                      <span className="">{t('suspend_user')}</span>
                    </>
                  ) : (
                    <>
                      <Image src={edit} alt="activate" width={16} height={16} />
                      <span className="text-green-600">{t('activate')}</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSaveProfile}
                  className="bg-teal-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-teal-700 transition-colors cursor-pointer"
                >
                  💾 {t('save')}
                </button>
                <button
                  onClick={() => setIsEditingProfile(false)}
                  className="bg-slate-200 text-slate-600 px-4 py-2.5 rounded-lg font-medium hover:bg-slate-300 transition-colors cursor-pointer"
                >
                  ❌ {t('cancel')}
                </button>
              </>
            )}
          </div>
        </div>
      </div>


      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 mb-8 sm:grid-cols-2 lg:grid-cols-4">

        {/* Total Payments */}
        <div className="p-5 text-center bg-white border shadow-sm rounded-xl border-slate-200">
          <div className="mb-1 text-2xl font-bold text-slate-900">
            ${userDetail?.statistics?.totalPayments || '0.00'}
          </div>
          <div className="text-[12px] color-slate-500 uppercase tracking-wider font-medium">
            {t('total_payments_label')}
          </div>
        </div>

        {/* Active Subscriptions */}
        <div className="p-5 text-center bg-white border shadow-sm rounded-xl border-slate-200">
          <div className="mb-1 text-2xl font-bold text-slate-900">
            {userDetail?.statistics?.activeSubscriptions || '0'}
          </div>
          <div className="text-[12px] color-slate-500 uppercase tracking-wider font-medium">
            {t('active_subscriptions_label')}
          </div>
        </div>

        {/* Total Spend */}
        <div className="p-5 text-center bg-white border shadow-sm rounded-xl border-slate-200">
          <div className="mb-1 text-2xl font-bold text-slate-900">
            ${userDetail?.statistics?.totalSpend || '0.00'}
          </div>
          <div className="text-[12px] color-slate-500 uppercase tracking-wider font-medium">
            {t('total_spend_label')}
          </div>
        </div>

        {/* Support Tickets */}
        <div className="p-5 text-center bg-white border shadow-sm rounded-xl border-slate-200">
          <div className="mb-1 text-2xl font-bold text-slate-900">
            {userDetail?.statistics?.openTickets || '0'} Open
          </div>
          <div className="text-[12px] color-slate-500 uppercase tracking-wider font-medium">
            {t('support_tickets')}
          </div>
        </div>

      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
        {/* Left Column */}
        <div className="space-y-8">
          {/* Usage Activity Chart Container */}
          <div className="p-6 bg-white border shadow-sm rounded-xl border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[18px] font-semibold text-slate-900 mb-1">{t('usage_activity')}</h3>
                <p className="text-sm text-slate-500">{t('usage_activity_desc')}</p>
              </div>
              <div className="flex gap-2">
                {['Week', 'Month', 'Year'].map(period => (
                  <button
                    key={period}
                    className={`text-[12px] px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer border-none ${chartPeriod === period
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    onClick={() => setChartPeriod(period)}
                  >
                    {t(period.toLowerCase())}
                  </button>
                ))}
              </div>
            </div>
            <UsageActivityChart period={chartPeriod} userId={userId} />
          </div>

          {/* Support Tickets Table Container */}
          <div className="p-6 bg-white border shadow-sm rounded-xl border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[18px] font-semibold text-slate-900">{t('support_tickets')}</h3>
              <div className="flex items-center gap-2">
                <select
                  value={supportTicketsFilter}
                  onChange={(e) => setSupportTicketsFilter(e.target.value)}
                  className="p-1 px-2 border border-slate-200 rounded text-[12px] bg-white outline-none focus:border-teal-500"
                >
                  <option value="all">{t('all_tickets')}</option>
                  <option value="open">{t('open')}</option>
                  <option value="pending">{t('pending')}</option>
                  <option value="resolved">{t('resolved')}</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-4 py-3 text-left text-[12px] font-semibold text-slate-500 uppercase tracking-wider">{t('ticket_id')}</th>
                    <th className="px-4 py-3 text-left text-[12px] font-semibold text-slate-500 uppercase tracking-wider">{t('subject')}</th>
                    <th className="px-4 py-3 text-left text-[12px] font-semibold text-slate-500 uppercase tracking-wider">{t('status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {userDetail?.supportTickets?.length > 0 ? (
                    userDetail.supportTickets
                      .filter((ticket: any) => supportTicketsFilter === 'all' || ticket.status === supportTicketsFilter)
                      .slice(0, 5)
                      .map((ticket: any) => (
                        <tr key={ticket.id} className="transition-colors hover:bg-slate-50/50">
                          <td className="p-4 font-medium text-slate-700">#{ticket.ticket_number}</td>
                          <td className="p-4 text-slate-600">{ticket.subject}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-[12px] font-medium ${ticket.status === 'open'
                              ? 'bg-red-100 text-red-800'
                              : ticket.status === 'pending'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-green-100 text-green-800'
                              }`}>
                              {ticket.status}
                            </span>
                          </td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="py-10 italic text-center text-slate-500">
                        {t('no_support_tickets')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column - Security Context */}
        <div className="space-y-8">
          <div className="p-6 bg-white border shadow-sm rounded-xl border-slate-200">
            <h3 className="text-[16px] font-semibold text-slate-900 mb-5">{t('security_context')}</h3>

            {/* 2FA Status */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-slate-600">🔐 {t('two_factor_status')}</span>
                <button
                  onClick={toggleTwoFactor}
                  className={`px-2 py-0.5 rounded text-[12px] font-bold border-none cursor-pointer transition-opacity hover:opacity-80 ${userDetail?.user?.two_factor_enabled
                    ? 'bg-teal-50 text-teal-600'
                    : 'bg-red-50 text-red-600'
                    }`}
                >
                  {userDetail?.user?.two_factor_enabled ? t('enabled') : t('disabled')}
                </button>
              </div>
            </div>

            {/* Encryption */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-slate-600">🔒 {t('data_encryption')}</span>
                <span className="bg-teal-50 text-teal-600 px-2 py-0.5 rounded text-[12px] font-bold">
                  AES-256
                </span>
              </div>
            </div>

            {/* Access Tier */}
            <div className="mb-6">
              <div className="mb-2">
                <span className="text-sm text-slate-600">{t('access_tier')}</span>
              </div>
              <div className="mb-2">
                <span className="text-[16px] font-semibold text-slate-900">Level 4</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="w-[80%] h-full bg-teal-600"></div>
              </div>
            </div>

            {/* Action Button */}
            <button
              className="bg-teal-600 text-white border-none py-2.5 px-4 rounded-lg cursor-pointer text-sm font-medium w-full hover:bg-teal-700 transition-colors"
              onClick={() => {
                setModalMessage('Permission management feature coming soon!')
                setShowSuccessModal(true)
              }}
            >
              + {t('add_permission')}
            </button>
          </div>
        </div>

        {/* Modals Section */}
        <Modal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} title="Success" type="success">
          <p className="m-0 text-slate-600">{modalMessage}</p>
        </Modal>

        <Modal isOpen={showErrorModal} onClose={() => setShowErrorModal(false)} title="Error" type="error">
          <p className="m-0 text-slate-600">{modalMessage}</p>
        </Modal>
      </div>


      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmAction}
        title={confirmTitle}
        message={confirmMessage}
        confirmText="Confirm"
      />
    </div>
  )
}