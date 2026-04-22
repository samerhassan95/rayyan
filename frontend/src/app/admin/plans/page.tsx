'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { useLanguage } from '../../../i18n/LanguageContext'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export default function AdminPlans() {
  const { t, isRTL, language } = useLanguage()
  const [billingPeriod, setBillingPeriod] = useState(language === 'ar' ? t('yearly') : 'Yearly')
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

  useEffect(() => {
    fetchData()
  }, [])

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
    <div style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#1a202c', marginBottom: '8px' }}>
          {t('pricing_plans_title')}
        </h1>
        <p style={{ color: '#718096' }}>
          {t('pricing_plans_desc')}
        </p>
      </div>

      {/* Message */}
      {message && (
        <div style={{ 
          marginBottom: '24px',
          padding: '12px 16px',
          borderRadius: '8px',
          backgroundColor: message.includes('✅') ? '#f0fff4' : '#fed7d7',
          color: message.includes('✅') ? '#22543d' : '#742a2a',
          border: `1px solid ${message.includes('✅') ? '#c6f6d5' : '#feb2b2'}`
        }}>
          {message}
        </div>
      )}

      {/* Billing Period Toggle */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center',
        marginBottom: '40px'
      }}>
        <div style={{ 
          display: 'flex',
          background: '#f7fafc',
          borderRadius: '8px',
          padding: '4px'
        }}>
          <button 
            className={`btn ${billingPeriod === 'Monthly' || billingPeriod === t('monthly') ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setBillingPeriod(language === 'ar' ? t('monthly') : 'Monthly')}
            style={{ margin: 0, borderRadius: '6px' }}
          >
            {t('monthly')}
          </button>
          <button 
            className={`btn ${billingPeriod === 'Yearly' || billingPeriod === t('yearly') ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setBillingPeriod(language === 'ar' ? t('yearly') : 'Yearly')}
            style={{ margin: 0, borderRadius: '6px' }}
          >
            {t('yearly')}
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '24px',
        marginBottom: '40px'
      }}>
        {plans.map((plan) => (
          <div 
            key={plan.id}
            className="content-card" 
            style={{ 
              position: 'relative',
              background: plan.recommended ? '#319795' : 'white',
              color: plan.recommended ? 'white' : 'inherit'
            }}
          >
            {plan.recommended && (
              <div style={{
                position: 'absolute',
                top: '-12px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#2c7a7b',
                color: 'white',
                padding: '4px 16px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                {t('recommended')}
              </div>
            )}
            <div className="card-header" style={{ 
              textAlign: 'center', 
              borderBottom: 'none',
              borderColor: plan.recommended ? 'rgba(255,255,255,0.2)' : undefined
            }}>
              <div style={{ 
                fontSize: '12px', 
                color: plan.recommended ? 'rgba(255,255,255,0.8)' : '#718096', 
                textTransform: 'uppercase', 
                letterSpacing: '0.5px', 
                marginBottom: '8px' 
              }}>
                {plan.tier}
              </div>
              <h3 style={{ 
                fontSize: '24px', 
                fontWeight: '600', 
                color: plan.recommended ? 'white' : '#1a202c', 
                marginBottom: '16px' 
              }}>
                {plan.name}
              </h3>
              <div style={{ marginBottom: '16px' }}>
                <span style={{ 
                  fontSize: '48px', 
                  fontWeight: '700', 
                  color: plan.recommended ? 'white' : '#1a202c' 
                }}>
                  ${(billingPeriod === 'Monthly' || billingPeriod === t('monthly')) ? plan.monthlyPrice : plan.yearlyPrice}
                </span>
                <span style={{ 
                  fontSize: '16px', 
                  color: plan.recommended ? 'rgba(255,255,255,0.8)' : '#718096' 
                }}>
                  /{(billingPeriod === 'Monthly' || billingPeriod === t('monthly')) ? t('mo') : t('yr')}
                </span>
              </div>
              <p style={{ 
                color: plan.recommended ? 'rgba(255,255,255,0.8)' : '#718096', 
                fontSize: '14px', 
                marginBottom: '24px' 
              }}>
                {plan.description}
              </p>
            </div>
            <div className="card-content">
              <ul style={{ listStyle: 'none', padding: 0, marginBottom: '24px' }}>
                {plan.features.map((feature: string, index: number) => (
                  <li key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ 
                      color: plan.recommended ? '#68d391' : '#38a169', 
                      marginRight: '8px' 
                    }}>✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <button 
                className={plan.recommended ? '' : 'btn btn-secondary'}
                onClick={() => updatePlan(plan.id, { recommended: !plan.recommended })}
                style={plan.recommended ? {
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500'
                } : { width: '100%' }}
              >
                {plan.recommended ? t('remove_recommendation') : t('make_recommended')}
              </button>
            </div>
            <div style={{ 
              position: 'absolute',
              top: '16px',
              right: '16px',
              display: 'flex',
              gap: '8px'
            }}>
              <button 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer', 
                  color: plan.recommended ? 'rgba(255,255,255,0.8)' : '#718096',
                  fontSize: '18px'
                }}
                onClick={() => handleEditClick(plan)}
              >
                ✏️
              </button>
              <button 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer', 
                  color: plan.recommended ? 'rgba(255,255,255,0.8)' : '#e53e3e',
                  fontSize: '18px'
                }}
                onClick={() => {
                  setPlanToDelete(plan.id)
                  setShowDeleteConfirm(true)
                }}
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Additional Options */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '40px' }}>
        {/* Create New Tier */}
        <div className="content-card">
          <div className="card-header">
            <h3 className="card-title">{t('create_new_tier')}</h3>
            <p className="card-subtitle">{t('create_new_tier_desc')}</p>
          </div>
          <div className="card-content" style={{ textAlign: 'center' }}>
            <button 
              className="btn btn-primary" 
              onClick={() => setShowCreatePlan(true)}
              style={{ 
                width: '60px', 
                height: '60px', 
                borderRadius: '50%',
                fontSize: '24px',
                marginBottom: '16px'
              }}
            >
              +
            </button>
            <p style={{ color: '#718096', fontSize: '14px' }}>
              {t('configure_pricing_features')}
            </p>
          </div>
        </div>

        {/* Global Discount Codes */}
        <div className="content-card">
          <div className="card-header">
            <div>
              <h3 className="card-title">{t('global_discount_codes')}</h3>
              <p className="card-subtitle">{t('global_discount_codes_desc')}</p>
            </div>
            <button 
              className="btn btn-secondary"
              onClick={() => setShowCreateCode(true)}
            >
              {t('manage_codes')}
            </button>
          </div>
          <div className="card-content">
            {discountCodes.slice(0, 3).map(code => (
              <div key={code.id} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '8px 0',
                borderBottom: '1px solid #f7fafc'
              }}>
                <div>
                  <div style={{ fontWeight: '500' }}>{code.code}</div>
                  <div style={{ fontSize: '12px', color: '#718096' }}>
                    {code.discount}% off • {code.usageCount}/{code.maxUsage} used
                  </div>
                </div>
                <span style={{ 
                  background: code.active ? '#f0fff4' : '#fed7d7',
                  color: code.active ? '#38a169' : '#e53e3e',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}>
                  {code.active ? t('active') : t('inactive')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div style={{ fontSize: '12px', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
            {t('total_monthly_revenue')}
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#1a202c', marginBottom: '8px' }}>
            ${analytics.totalMonthlyRevenue?.toLocaleString() || '0'}
          </div>
          <div style={{ fontSize: '12px', color: '#38a169' }}>
            📈 +{analytics.revenueGrowth || 0}% from last month
          </div>
        </div>

        <div className="stat-card">
          <div style={{ fontSize: '12px', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
            {t('active_subscriptions_label')}
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#1a202c', marginBottom: '8px' }}>
            {analytics.activeSubscriptions?.toLocaleString() || '0'}
          </div>
          <div style={{ fontSize: '12px', color: '#718096' }}>
            {t('professional_tier_is')} {analytics.professionalTierPercentage || 0}% {t('of_users')}
          </div>
        </div>

        <div className="stat-card">
          <div style={{ fontSize: '12px', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
            {t('churn_rate')}
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#1a202c', marginBottom: '8px' }}>
            {analytics.churnRate || 0}%
          </div>
          <div style={{ fontSize: '12px', color: analytics.churnRate < analytics.industryAverageChurn ? '#38a169' : '#e53e3e' }}>
            {analytics.churnRate < analytics.industryAverageChurn ? '✓' : '⚠️'} {analytics.churnRate < analytics.industryAverageChurn ? 'Lower than' : 'Higher than'} industry average
          </div>
        </div>
      </div>

      {/* Edit Plan Modal */}
      {showEditPlan && editingPlan && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div className="modal-content" style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            width: '550px',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <h3 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>{t('edit_plan')}</h3>
            <p style={{ color: '#718096', marginBottom: '24px' }}>{t('edit_plan_desc')}</p>
            
            <div className="form-group">
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#4a5568', textTransform: 'uppercase' }}>{t('plan_name')}</label>
              <input
                type="text"
                value={editingPlan.name}
                onChange={(e) => setEditingPlan((prev: any) => ({ ...prev, name: e.target.value }))}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '4px' }}
              />
            </div>

            <div className="form-group">
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#4a5568', textTransform: 'uppercase' }}>{t('tier')}</label>
              <input
                type="text"
                value={editingPlan.tier}
                onChange={(e) => setEditingPlan((prev: any) => ({ ...prev, tier: e.target.value }))}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '4px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#4a5568', textTransform: 'uppercase' }}>{t('monthly_price')} ($)</label>
                <input
                  type="number"
                  value={editingPlan.monthlyPrice}
                  onChange={(e) => setEditingPlan((prev: any) => ({ ...prev, monthlyPrice: e.target.value }))}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '4px' }}
                />
              </div>
              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#4a5568', textTransform: 'uppercase' }}>{t('yearly_price')} ($)</label>
                <input
                  type="number"
                  value={editingPlan.yearlyPrice}
                  onChange={(e) => setEditingPlan((prev: any) => ({ ...prev, yearlyPrice: e.target.value }))}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '4px' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#4a5568', textTransform: 'uppercase' }}>{t('description')}</label>
              <textarea
                value={editingPlan.description}
                onChange={(e) => setEditingPlan((prev: any) => ({ ...prev, description: e.target.value }))}
                rows={3}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '4px' }}
              />
            </div>

            <div className="form-group">
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#4a5568', textTransform: 'uppercase' }}>{t('features')}</label>
              {(editingPlan.features || []).map((feature: string, index: number) => (
                <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="text"
                    value={feature}
                    onChange={(e) => {
                      const newFeatures = [...editingPlan.features]
                      newFeatures[index] = e.target.value
                      setEditingPlan((prev: any) => ({ ...prev, features: newFeatures }))
                    }}
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newFeatures = editingPlan.features.filter((_: any, i: number) => i !== index)
                      setEditingPlan((prev: any) => ({ ...prev, features: newFeatures }))
                    }}
                    style={{ background: '#fed7d7', color: '#e53e3e', border: 'none', borderRadius: '8px', padding: '10px 14px', cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setEditingPlan((prev: any) => ({ ...prev, features: [...(prev.features || []), ''] }))}
                style={{ 
                  background: '#e6fffa', 
                  color: '#319795', 
                  border: '1px dashed #319795', 
                  borderRadius: '8px', 
                  padding: '10px', 
                  width: '100%',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                + {t('add_feature')}
              </button>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowEditPlan(false)}
                style={{ flex: 1, padding: '12px', borderRadius: '8px' }}
              >
                {t('cancel')}
              </button>
              <button
                className="btn btn-primary"
                onClick={saveEditedPlan}
                style={{ flex: 1, padding: '12px', borderRadius: '8px' }}
              >
                {t('save_changes')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          backdropFilter: 'blur(4px)'
        }}>
          <div className="modal-content" style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            width: '400px',
            textAlign: 'center',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ 
              width: '64px', 
              height: '64px', 
              background: '#fff5f5', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: '32px'
            }}>
              ⚠️
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px' }}>{t('delete_plan_confirm_title')}</h3>
            <p style={{ color: '#718096', marginBottom: '32px', lineHeight: '1.5' }}>
              {t('delete_plan_confirm_desc')}
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setPlanToDelete(null)
                }}
                style={{ flex: 1, padding: '12px', borderRadius: '8px' }}
              >
                {t('keep_plan')}
              </button>
              <button
                className="btn btn-danger"
                onClick={deletePlan}
                style={{ 
                  flex: 1, 
                  padding: '12px', 
                  borderRadius: '8px',
                  background: '#e53e3e',
                  color: 'white',
                  border: 'none',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {t('yes_delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Plan Modal */}
      {showCreatePlan && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            width: '550px',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '24px' }}>{t('create_new_plan')}</h3>
            
            <div className="form-group">
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#4a5568', textTransform: 'uppercase' }}>{t('plan_name')}</label>
              <input
                type="text"
                value={newPlan.name}
                onChange={(e) => setNewPlan(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Premium"
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '4px' }}
              />
            </div>

            <div className="form-group">
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#4a5568', textTransform: 'uppercase' }}>{t('tier')}</label>
              <input
                type="text"
                value={newPlan.tier}
                onChange={(e) => setNewPlan(prev => ({ ...prev, tier: e.target.value }))}
                placeholder="e.g., PROFESSIONAL"
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '4px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#4a5568', textTransform: 'uppercase' }}>{t('monthly_price')} ($)</label>
                <input
                  type="number"
                  value={newPlan.monthlyPrice}
                  onChange={(e) => setNewPlan(prev => ({ ...prev, monthlyPrice: e.target.value }))}
                  placeholder="29"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '4px' }}
                />
              </div>
              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#4a5568', textTransform: 'uppercase' }}>{t('yearly_price')} ($)</label>
                <input
                  type="number"
                  value={newPlan.yearlyPrice}
                  onChange={(e) => setNewPlan(prev => ({ ...prev, yearlyPrice: e.target.value }))}
                  placeholder="290"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '4px' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#4a5568', textTransform: 'uppercase' }}>{t('description')}</label>
              <textarea
                value={newPlan.description}
                onChange={(e) => setNewPlan(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Perfect for..."
                rows={3}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '4px' }}
              />
            </div>

            <div className="form-group">
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#4a5568', textTransform: 'uppercase' }}>{t('features')}</label>
              {newPlan.features.map((feature, index) => (
                <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="text"
                    value={feature}
                    onChange={(e) => updateFeature(index, e.target.value)}
                    placeholder="Feature description"
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  />
                  <button
                    type="button"
                    onClick={() => removeFeature(index)}
                    style={{ background: '#fed7d7', color: '#e53e3e', border: 'none', borderRadius: '4px', padding: '10px 14px', cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addFeature}
                style={{ 
                  background: '#e6fffa', 
                  color: '#319795', 
                  border: '1px dashed #319795', 
                  borderRadius: '8px', 
                  padding: '10px', 
                  width: '100%',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                + {t('add_feature')}
              </button>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowCreatePlan(false)}
                style={{ flex: 1, padding: '12px', borderRadius: '8px' }}
              >
                {t('cancel')}
              </button>
              <button
                className="btn btn-primary"
                onClick={createPlan}
                style={{ flex: 1, padding: '12px', borderRadius: '8px' }}
              >
                {t('create_plan_btn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Discount Code Modal */}
      {showCreateCode && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '400px'
          }}>
            <h3 style={{ marginBottom: '20px' }}>{t('create_discount_code')}</h3>
            
            <div className="form-group">
              <label>{t('code')}</label>
              <input
                type="text"
                value={newCode.code}
                onChange={(e) => setNewCode(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                placeholder="WELCOME20"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label>{t('discount')}</label>
                <input
                  type="number"
                  value={newCode.discount}
                  onChange={(e) => setNewCode(prev => ({ ...prev, discount: e.target.value }))}
                  placeholder="20"
                />
              </div>
              <div className="form-group">
                <label>{t('type')}</label>
                <select
                  value={newCode.type}
                  onChange={(e) => setNewCode(prev => ({ ...prev, type: e.target.value }))}
                >
                  <option value="percentage">{t('percentage')}</option>
                  <option value="fixed">{t('fixed_amount')}</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label>{t('max_usage')}</label>
                <input
                  type="number"
                  value={newCode.maxUsage}
                  onChange={(e) => setNewCode(prev => ({ ...prev, maxUsage: e.target.value }))}
                  placeholder="100"
                />
              </div>
              <div className="form-group">
                <label>{t('expires_at')}</label>
                <input
                  type="date"
                  value={newCode.expiresAt}
                  onChange={(e) => setNewCode(prev => ({ ...prev, expiresAt: e.target.value }))}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowCreateCode(false)}
                style={{ flex: 1 }}
              >
                {t('cancel')}
              </button>
              <button
                className="btn btn-primary"
                onClick={createDiscountCode}
                style={{ flex: 1 }}
              >
                {t('create_code')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}