'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { useLanguage } from '../../../i18n/LanguageContext'
import Image from 'next/image'
import StatGroup from '../../components/StateCard';
import DataTable, { Column } from '../../components/GenericTable'
// @ts-ignore
import { Splide as SplideType, SplideSlide as SplideSlideType } from '@splidejs/react-splide';
import '@splidejs/react-splide/css';
import '@splidejs/react-splide/css/skyblue';
//ICONS

import edit from "../../../assets/icons/edit-black.svg"
import trash from "../../../assets/icons/trash.svg"
import trashWhite from "../../../assets/icons/trash-white.svg"
import editWhite from "../../../assets/icons/edit.svg"
import tick from "../../../assets/icons/tick.svg"
import x from "../../../assets/icons/x.svg"
import plus from "../../../assets/icons/plus.svg"


const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export default function AdminPlans() {
  const { t, isRTL, language } = useLanguage()
  const [billingPeriod, setBillingPeriod] = useState('Monthly');
  const [plans, setPlans] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<any>({})
  const [discountCodes, setDiscountCodes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreatePlan, setShowCreatePlan] = useState(false)
  const [showEditPlan, setShowEditPlan] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [editingPlan, setEditingPlan] = useState<any>(null)
  const [planToDelete, setPlanToDelete] = useState<number | null>(null)
  const [showCreateCode, setShowCreateCode] = useState(false)
  const [discountName, setDiscountName] = useState('');
  const [newDiscountCode, setNewDiscountCode] = useState('');
  const [discountType, setDiscountType] = useState('percentage'); // القيمة الافتراضية

  // مصفوفة البيانات (مثال)
  const [newPlan, setNewPlan] = useState({
    name: '',
    tier: '',
    monthlyPrice: '',
    yearlyPrice: '',
    description: '',
    features: ['']
  })
  const [newCode, setNewCode] = useState({
    code: '',
    discount: '',
    type: 'percentage',
    maxUsage: '',
    expiresAt: ''
  })
  const [message, setMessage] = useState('')

//splide

const Splide = SplideType as any;
const SplideSlide = SplideSlideType as any;


const splideOptions = {
  type: 'loop',
  focus: 'center',
  start: plans.findIndex(p => p.recommended) || 0,
  perPage: 3, // يظهر 3 في الشاشات الكبيرة
  gap: '2rem',
  arrows: false,
  pagination: true,
  trimSpace: false,
  // لا تستخدم fixedWidth هنا إذا أردت توزيعاً تلقائياً
  breakpoints: {
    1280: {
      perPage: 3,
      gap: '1.5rem',
    },
    1024: {
      perPage: 2, // يظهر 2 في التابلت
      gap: '1rem',
      padding: '2rem', // لإظهار لمحة من الكروت الجانبية
    },
    768: {
      perPage: 1, // يظهر 1 في الموبايل
      gap: '1rem',
      padding: '15%', // يخلي الكارت اللي في النص واضح واللي جنبه باين منه جزء
    },
  },
};

  useEffect(() => {
    fetchData()
  }, [])


  //state card
  const statsData = [
    {
      label: t('total_monthly_revenue'),
      value: analytics.totalMonthlyRevenue?.toLocaleString(),
      suffix: "$",
      // يمكنك إضافة أيقونة هنا إذا أردتِ
      icon: <span className="text-xl">💰</span>
    },
    {
      label: t('active_subscriptions_label'),
      value: analytics.activeSubscriptions?.toLocaleString(),
      icon: <span className="text-xl">👥</span>
    },
    {
      label: t('churn_rate'),
      value: analytics.churnRate,
      suffix: "%",
      icon: <span className="text-xl">📉</span>
    }
  ];

  const columns = [
    { key: 'name', label: 'اسم الخصم', type: 'text' },
    { key: 'code', label: 'كود الخصم', type: 'badge' },
    { key: 'type', label: 'نوع الخصم', type: 'text' }, // نسبة مئوية أو مبلغ ثابت
    { key: 'usageCount', label: 'مرات الاستخدام', type: 'text' },
    { key: 'status', label: 'الحالة', type: 'statusActive' },
    { key: 'actions', label: 'الإجراءات', type: 'actions' }
  ];

  const fetchData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }

      // Fetch plans
      const plansResponse = await axios.get(`${API_URL}/api/plans`, { headers })

      // Fetch analytics
      const analyticsResponse = await axios.get(`${API_URL}/api/plans/analytics`, { headers })

      // Fetch discount codes
      const codesResponse = await axios.get(`${API_URL}/api/plans/discount-codes`, { headers })

      setPlans(plansResponse.data)
      setAnalytics(analyticsResponse.data)
      setDiscountCodes(codesResponse.data)
    } catch (error) {
      console.error('Error fetching data:', error)
      // Show empty state instead of fallback data
      setPlans([])
      setAnalytics({
        totalMonthlyRevenue: 0,
        activeSubscriptions: 0,
        professionalTierPercentage: 0,
        churnRate: 0
      })
      setDiscountCodes([])
    } finally {
      setLoading(false)
    }
  }

  const createPlan = async () => {
    try {
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }

      await axios.post(`${API_URL}/api/plans`, {
        ...newPlan,
        monthlyPrice: parseFloat(newPlan.monthlyPrice),
        yearlyPrice: parseFloat(newPlan.yearlyPrice),
        features: newPlan.features.filter(f => f.trim() !== '')
      }, { headers })

      setMessage('✅ Plan created successfully!')
      setShowCreatePlan(false)
      setNewPlan({ name: '', tier: '', monthlyPrice: '', yearlyPrice: '', description: '', features: [''] })
      fetchData()
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('❌ Failed to create plan')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const updatePlan = async (planId: number, updates: any) => {
    try {
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }

      await axios.put(`${API_URL}/api/plans/${planId}`, updates, { headers })
      setMessage('✅ Plan updated successfully!')
      fetchData()
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('❌ Failed to update plan')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const deletePlan = async () => {
    if (!planToDelete) return

    try {
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }

      await axios.delete(`${API_URL}/api/plans/${planToDelete}`, { headers })
      setMessage('✅ Plan deleted successfully!')
      setShowDeleteConfirm(false)
      setPlanToDelete(null)
      fetchData()
      setTimeout(() => setMessage(''), 3000)
    } catch (error: any) {
      setMessage(`❌ ${error.response?.data?.error || 'Failed to delete plan'}`)
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const handleEditClick = (plan: any) => {
    setEditingPlan({ ...plan })
    setShowEditPlan(true)
  }

  // Handlers for discount codes table actions
  const handleEdit = (row: any) => {
    // Populate the "create/edit code" modal with the selected row and open it for editing
    setNewCode({
      code: row.code || '',
      discount: String(row.discount ?? ''),
      type: row.type || 'percentage',
      maxUsage: String(row.maxUsage ?? ''),
      expiresAt: row.expiresAt ? row.expiresAt.split('T')[0] : ''
    })
    setShowCreateCode(true)
  }

  const handleDelete = async (row: any) => {
    try {
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }
      await axios.delete(`${API_URL}/api/plans/discount-codes/${row.id}`, { headers })
      setMessage('✅ Discount code deleted')
      fetchData()
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('❌ Failed to delete discount code')
      setTimeout(() => setMessage(''), 3000)
    }
  }
  const handleCreateCode = () => {
    if (!discountName || !newDiscountCode) {
      alert("برجاء ملء البيانات الأساسية");
      return;
    }

    const newEntry = {
      id: Date.now(), // توليد ID مؤقت
      name: discountName,
      code: newDiscountCode,
      type: discountType,
      usageCount: 0,
      status: 'active',
    };

    setDiscountCodes([newEntry, ...discountCodes]); // إضافة الكود الجديد في البداية

    // تصفير الحقول بعد الإضافة بنجاح
    setDiscountName('');
    setNewDiscountCode('');
  };

  // const handleView = (row: any) => {
  //   // Simple preview action - show a brief message; replace with a modal if needed
  //   setMessage(`${t('code')}: ${row.code}`)
  //   setTimeout(() => setMessage(''), 3000)
  // }

  const saveEditedPlan = async () => {
    if (!editingPlan) return
    try {
      await updatePlan(editingPlan.id, {
        name: editingPlan.name,
        tier: editingPlan.tier,
        monthlyPrice: parseFloat(editingPlan.monthlyPrice),
        yearlyPrice: parseFloat(editingPlan.yearlyPrice),
        description: editingPlan.description,
        features: editingPlan.features
      })
      setShowEditPlan(false)
      setEditingPlan(null)
    } catch (error) {
      // Message handled by updatePlan
    }
  }

  const createDiscountCode = async () => {
    try {
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }

      await axios.post(`${API_URL}/api/plans/discount-codes`, {
        ...newCode,
        discount: parseFloat(newCode.discount),
        maxUsage: parseInt(newCode.maxUsage)
      }, { headers })

      setMessage('✅ Discount code created successfully!')
      setShowCreateCode(false)
      setNewCode({ code: '', discount: '', type: 'percentage', maxUsage: '', expiresAt: '' })
      fetchData()
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('❌ Failed to create discount code')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const addFeature = () => {
    setNewPlan(prev => ({ ...prev, features: [...prev.features, ''] }))
  }

  const updateFeature = (index: number, value: string) => {
    setNewPlan(prev => ({
      ...prev,
      features: prev.features.map((f, i) => i === index ? value : f)
    }))
  }

  const removeFeature = (index: number) => {
    setNewPlan(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }))
  }

  if (loading) {
    return <div className="loading">Loading plans...</div>
  }

  return (
    <div className={`p-6 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex justify-between mb-6">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 ">
            {t('pricing_plans_title')}
          </h1>
          <p className="text-gray-500">
            {t('pricing_plans_desc')}
          </p>
        </div>

        <div className="flex items-center gap-3">

          {/* Billing Period Toggle */}
          <div className="flex justify-center ">
            <div className="flex p-1.5 bg-[#F3F3F3] rounded-full">
              <button
                className={`px-4 py-1 rounded-full transition-all ${billingPeriod === 'Monthly'
                  ? 'bg-white text-[#21665F] font-medium' // إضافة ظل خفيف للتمييز
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
                onClick={() => setBillingPeriod('Monthly')}
              >
                {t('monthly')}
              </button>

              {/* زر السنوي */}
              <button
                className={`px-6 py-2 rounded-lg transition-all ${billingPeriod === 'Yearly'
                  ? 'bg-white text-[#21665F] font-medium shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
                onClick={() => setBillingPeriod('Yearly')}
              >
                {t('yearly')}
              </button>
            </div>
          </div>

          <button
            className="flex justify-center gap-2 p-2.5 px-4 mx-auto text-base text-white transition-colors rounded-full item-center bg-linear"
            onClick={() => setShowCreatePlan(true)}
          >
            <Image
              src={plus}
              alt="Add"
              width={12}
              height={12}
            />

            Add New Tier
          </button>
        </div>
      </div>


      {/* Message */}
      {
        message && (
          <div className={`mb-6 px-4 py-3 rounded-lg border ${message.includes('✅')
            ? 'bg-green-50 text-green-800 border-green-200'
            : 'bg-red-50 text-red-800 border-red-200'
            }`}>
            {message}
          </div>
        )
      }

      {/* ============================== Pricing Cards =========================*/}
   <div className="w-full max-w-[1440px] mx-auto mb-10 px-4">
      <Splide options={splideOptions} aria-label="Plans Slider">
        {plans.map((plan: any) => (
          <SplideSlide key={plan.id} className="px-2 py-12"> 
            <div
              className={`relative p-8 rounded-[1.5rem] transition-all duration-300 h-full flex flex-col shadow-sm ${
                plan.recommended
                  ? 'text-white scale-105 z-10 bg-gradient-to-br from-[#488981] to-[#51d1b8]'
                  : 'bg-white text-gray-900 border border-gray-100 hover:shadow-md'
              }`}
            >
              {/* Recommended Badge */}
              {!!plan.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-extrabold tracking-widest py-1.5 px-5 rounded-full text-white scale-105 z-10 bg-gradient-to-br from-[#488981] to-[#51d1b8] z-20">
                  RECOMMENDED
                </div>
              )}

              {/* Header: Tier & Actions */}
              <div className="flex items-start justify-between mb-6">
                <div className={`text-[11px] font-bold uppercase tracking-[0.2em] ${plan.recommended ? 'text-white/80' : 'text-gray-400'}`}>
                  {plan.tier}
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => handleEditClick(plan)} className="transition-transform hover:scale-110 active:scale-95">
                    <Image src={plan.recommended ? editWhite : edit} alt="Edit" width={18} height={18} />
                  </button>
                  <button 
                    onClick={() => { setPlanToDelete(plan.id); setShowDeleteConfirm(true); }} 
                    className="transition-transform hover:scale-110 active:scale-95"
                  >
                    <Image src={plan.recommended ? trashWhite : trash} alt="Delete" width={18} height={18} />
                  </button>
                </div>
              </div>

              {/* Name & Pricing */}
              <div className="mb-8">
                <h3 className="mb-2 text-3xl font-bold">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-black">
                    ${(billingPeriod === 'Monthly' || billingPeriod === t('monthly')) ? plan.monthlyPrice : plan.yearlyPrice}
                  </span>
                  <span className={`text-sm font-medium ${plan.recommended ? 'text-white/70' : 'text-gray-400'}`}>
                    /{(billingPeriod === 'Monthly' || billingPeriod === t('monthly')) ? t('mo') : t('yr')}
                  </span>
                </div>
                <p className={`mt-4 text-[14px] leading-relaxed line-clamp-2 ${plan.recommended ? 'text-white/90' : 'text-gray-500'}`}>
                  {plan.description}
                </p>
              </div>

              {/* Features List */}
              <ul className="flex-grow mb-10 space-y-4">
                {plan.features.map((feature: string, index: number) => {
                  const isUnavailable = feature.includes('Not included') || feature.includes('mapping');
                  return (
                    <li key={index} className={`flex items-center gap-3 text-[14px] ${isUnavailable ? 'opacity-40' : 'opacity-100'}`}>
                      <span className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full ${plan.recommended ? 'bg-white/20' : 'bg-teal-50'}`}>
                         <Image 
                           src={isUnavailable ? x : tick} 
                           alt="icon" 
                           width={12} 
                           height={12} 
                           className={plan.recommended && !isUnavailable ? 'brightness-0 invert' : ''} 
                         />
                      </span>
                      <span className={isUnavailable ? 'line-through' : 'font-medium'}>{feature}</span>
                    </li>
                  );
                })}
              </ul>

              {/* Action Button */}
              <button
                className={`w-full py-4 px-6 rounded-xl font-bold text-[15px] transition-all duration-300 ${
                  plan.recommended
                    ? 'bg-gradient-to-br from-[#488981] to-[#51d1b8] hover:bg-gray-50 active:scale-[0.98]'
                    : 'bg-white text-gray-900 border-2 border-gray-100 hover:border-[#4FB8A3] hover:text-[#4FB8A3] active:scale-[0.98]'
                }`}
                onClick={() => updatePlan(plan.id, { recommended: !plan.recommended })}
              >
                {plan.recommended ? "Upgrade to Pro" : `Configure ${plan.name}`}
              </button>
            </div>
          </SplideSlide>
        ))}
      </Splide>

      {/* تنسيق بسيط للـ Pagination لجعلها تظهر بشكل أرشق */}
      <style jsx global>{`
        .splide__pagination {
          bottom: -1rem !important;
        }
        .splide__pagination__page {
          background: #ccc !important;
          width: 8px !important;
          height: 8px !important;
        }
        .splide__pagination__page.is-active {
          background: #488981 !important;
          width: 24px !important;
          height: 8px !important;
          border-radius: 4px !important;
          // transform: scale(1.4) !important;
          margin: 0 10px !important;
          
        }
      `}</style>
    </div>

      {/* Additional Options */}
      <div className="mb-10 ">

        {/* Global Discount Codes */}
        <DataTable
          title="Global Discount Codes"
          description="Manage active coupons and referral percentage rules."
          filterSection={
            <div className="flex items-center gap-2 rounded-full bg-linear">
              {/* حقل الكود */}
              <button className="flex items-center gap-2 px-4 py-2 text-gray-900 rounded-full bg-linear" onClick={() => setShowCreateCode(true)}

              >
                <Image src={plus} alt="Add" width={12} height={12} />
                <span className='text-white'>{t('manage_codes')}</span>
              </button>
            </div>
          }
          columns={[
            { key: 'name', label: 'Code Name ', type: 'text' },
            { key: 'code', label: 'Discount Code', type: 'text' },
            { key: 'discount', label: 'Discount value', type: 'text' },
            { key: 'usageCount', label: 'Usage Count', type: 'text' },
            { key: 'active', label: 'Status', type: 'status' },
            { key: 'actions', label: 'Actions', type: 'actions' }
          ]}
          data={discountCodes.map(item => ({
            ...item,
            typeLabel: item.type === 'percentage' ? 'نسبة مئوية' : 'مبلغ ثابت',
            badgeBg: item.status === 'active' ? '#E6F4F1' : '#FEE2E2', // ألوان اختيارية للـ badge
            badgeColor: item.status === 'active' ? '#4FB8A3' : '#EF4444'
          }))}
          onEdit={(row) => handleEdit(row)}
          onDelete={(row) => handleDelete(row)}
          rowsPerPage={5}

        />
      </div>

      {/* Revenue Stats */}
      <StatGroup
        items={statsData}
        gridCols="lg:grid-cols-3"
      />

      {/* Modals Overlay (Universal Tailwind Styles) */}
      {
        (showEditPlan || showDeleteConfirm || showCreatePlan || showCreateCode) && (
          <div className="fixed inset-0 z-[1000]  flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-2xl overflow-hidden duration-200 bg-white shadow-2xl rounded-3xl animate-in fade-in zoom-in">

              {/* Edit Plan Modal Content */}
              {showEditPlan && editingPlan && (
                <div className="p-8">
                  <h3 className="mb-1 text-xl font-bold">{t('edit_plan')}</h3>
                  <p className="mb-6 text-sm text-gray-500">{t('edit_plan_desc')}</p>

                  <div className="space-y-4">

                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('plan_name')}</label>
                      <input
                        type="text"
                        className="w-full p-3 mt-1 border border-gray-200 outline-none bg-gray-50 rounded-xl focus:ring-2 focus:ring-blue-500"
                        value={editingPlan.name}
                        onChange={(e) => setEditingPlan(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('monthly_price')} ($)</label>
                        <input
                          type="number"
                          className="w-full p-3 mt-1 border border-gray-200 outline-none bg-gray-50 rounded-xl"
                          value={editingPlan.monthlyPrice}
                          onChange={(e) => setEditingPlan(prev => ({ ...prev, monthlyPrice: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('yearly_price')} ($)</label>
                        <input
                          type="number"
                          className="w-full p-3 mt-1 border border-gray-200 outline-none bg-gray-50 rounded-xl"
                          value={editingPlan.yearlyPrice}
                          onChange={(e) => setEditingPlan(prev => ({ ...prev, yearlyPrice: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 mt-8">
                      <button className="flex-1 py-3 font-bold text-gray-500 transition-colors hover:bg-gray-100 rounded-xl" onClick={() => setShowEditPlan(false)}>{t('cancel')}</button>
                      <button className="flex-1 py-3 font-bold text-white transition-colors bg-[#488981] rounded-xl" onClick={saveEditedPlan}>{t('save_changes')}</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Delete Confirmation Modal Content */}
              {showDeleteConfirm && (
                <div className="p-8 text-center">
                  <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 text-3xl text-red-500 rounded-full bg-red-50">⚠️</div>
                  <h3 className="mb-2 text-xl font-bold">{t('delete_plan_confirm_title')}</h3>
                  <p className="mb-8 text-sm leading-relaxed text-gray-500">{t('delete_plan_confirm_desc')}</p>
                  <div className="flex gap-3">
                    <button className="flex-1 py-3 font-bold text-gray-500 transition-colors hover:bg-gray-50 rounded-xl" onClick={() => setShowDeleteConfirm(false)}>{t('keep_plan')}</button>
                    <button className="flex-1 py-3 font-bold text-white transition-colors bg-red-600 shadow-lg rounded-xl shadow-red-200 hover:bg-red-700" onClick={deletePlan}>{t('yes_delete')}</button>
                  </div>
                </div>
              )}
            </div>
          </div>


        )
      }

      <>
        {/* Create Plan Modal */}
        {showCreatePlan && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl p-8 w-full max-w-[550px] max-h-[90vh] overflow-y-auto shadow-2xl">
              <h3 className="mb-6 text-2xl font-semibold text-slate-900">{t('create_new_plan')}</h3>

              <div className="space-y-4">
                {/* Plan Name */}
                <div className="flex flex-col gap-1">
                  <label className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider">{t('plan_name')}</label>
                  <input
                    type="text"
                    value={newPlan.name}
                    onChange={(e) => setNewPlan(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Premium"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                {/* Tier */}
                <div className="flex flex-col gap-1">
                  <label className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider">{t('tier')}</label>
                  <input
                    type="text"
                    value={newPlan.tier}
                    onChange={(e) => setNewPlan(prev => ({ ...prev, tier: e.target.value }))}
                    placeholder="e.g., PROFESSIONAL"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                {/* Prices Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider">{t('monthly_price')} ($)</label>
                    <input
                      type="number"
                      value={newPlan.monthlyPrice}
                      onChange={(e) => setNewPlan(prev => ({ ...prev, monthlyPrice: e.target.value }))}
                      placeholder="29"
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider">{t('yearly_price')} ($)</label>
                    <input
                      type="number"
                      value={newPlan.yearlyPrice}
                      onChange={(e) => setNewPlan(prev => ({ ...prev, yearlyPrice: e.target.value }))}
                      placeholder="290"
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="flex flex-col gap-1">
                  <label className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider">{t('description')}</label>
                  <textarea
                    value={newPlan.description}
                    onChange={(e) => setNewPlan(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Perfect for..."
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                  />
                </div>

                {/* Features Section */}
                <div className="flex flex-col gap-2">
                  <label className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider">{t('features')}</label>
                  {newPlan.features.map((feature, index) => (
                    <div key={index} className="flex gap-2 mb-1">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => updateFeature(index, e.target.value)}
                        placeholder="Feature description"
                        className="flex-1 px-4 py-2 transition-all border rounded-lg border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => removeFeature(index)}
                        className="px-4 py-2 font-bold text-red-600 transition-colors bg-red-100 rounded-lg hover:bg-red-200"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addFeature}
                    className="w-full py-2.5 border-2 border-dashed border-teal-500 bg-teal-50 text-teal-700 rounded-lg font-medium hover:bg-teal-100 transition-colors mt-2"
                  >
                    + {t('add_feature')}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-8">
                <button
                  className="flex-1 px-6 py-3 font-medium transition-colors rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
                  onClick={() => setShowCreatePlan(false)}
                >
                  {t('cancel')}
                </button>
                <button
                  className="flex-1 py-2.5 bg-[#488981] text-white rounded-lg  transition-colors font-medium"
                  onClick={createPlan}
                >
                  {t('create_plan_btn')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Discount Code Modal */}
        {showCreateCode && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-xl p-6 bg-white shadow-2xl rounded-xl">
              <h3 className="mb-5 text-xl font-bold text-slate-800">{t('create_discount_code')}</h3>

              <div className="space-y-4">
                <div className="flex flex-col gap-1">

                  <label className="text-sm font-medium text-slate-600">{t('code_name')}</label>
                  <input
                    type="text"
                    value={newCode.discountName}
                    onChange={(e) => setNewCode(prev => ({ ...prev, discountName: e.target.value.toUpperCase() }))}
                    placeholder="WELCOME20"
                    className="w-full px-4 py-2 border rounded-lg outline-none border-slate-200 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex flex-col gap-1">

                  <label className="text-sm font-medium text-slate-600">{t('code')}</label>
                  <input
                    type="text"
                    value={newCode.code}
                    onChange={(e) => setNewCode(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    placeholder="WELCOME20"
                    className="w-full px-4 py-2 border rounded-lg outline-none border-slate-200 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-slate-600">{t('discount')}</label>
                    <input
                      type="number"
                      value={newCode.discount}
                      onChange={(e) => setNewCode(prev => ({ ...prev, discount: e.target.value }))}
                      placeholder="20"
                      className="w-full px-4 py-2 border rounded-lg outline-none border-slate-200 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-slate-600">{t('type')}</label>
                    <select
                      value={newCode.type}
                      onChange={(e) => setNewCode(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full px-4 py-2 bg-white border rounded-lg outline-none border-slate-200 focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="percentage">{t('percentage')}</option>
                      <option value="fixed">{t('fixed_amount')}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-slate-600">{t('max_usage')}</label>
                    <input
                      type="number"
                      value={newCode.maxUsage}
                      onChange={(e) => setNewCode(prev => ({ ...prev, maxUsage: e.target.value }))}
                      placeholder="100"
                      className="w-full px-4 py-2 border rounded-lg outline-none border-slate-200 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-slate-600">{t('expires_at')}</label>
                    <input
                      type="date"
                      value={newCode.expiresAt}
                      onChange={(e) => setNewCode(prev => ({ ...prev, expiresAt: e.target.value }))}
                      className="w-full px-4 py-2 border rounded-lg outline-none border-slate-200 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                  onClick={() => setShowCreateCode(false)}
                >
                  {t('cancel')}
                </button>
                <button
                  className="flex-1 py-2.5 bg-[#488981] text-white rounded-lg  transition-colors font-medium"
                  onClick={createDiscountCode}
                >
                  {t('create_code')}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    </div >


  );
}