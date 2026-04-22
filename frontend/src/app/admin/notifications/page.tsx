'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { useLanguage } from '../../../i18n/LanguageContext'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export default function NotificationsPage() {
  const { t, isRTL } = useLanguage()
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')
  const router = useRouter()

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }

      const response = await axios.get(`${API_URL}/api/admin/notifications`, { headers })
      setNotifications(response.data)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: number) => {
    try {
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }

      await axios.put(`${API_URL}/api/admin/notifications/${notificationId}/read`, {}, { headers })
      
      // Update local state
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      )
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }

      // Mark all unread notifications as read
      const unreadNotifications = notifications.filter(n => !n.is_read)
      await Promise.all(
        unreadNotifications.map(n =>
          axios.put(`${API_URL}/api/admin/notifications/${n.id}/read`, {}, { headers })
        )
      )

      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'error': return '⚠️'
      case 'success': return '✅'
      case 'warning': return '⚡'
      case 'info': return 'ℹ️'
      default: return 'ℹ️'
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'error': return 'text-red-600'
      case 'success': return 'text-green-600'
      case 'warning': return 'text-yellow-600'
      case 'info': return 'text-blue-600'
      default: return 'text-blue-600'
    }
  }

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.is_read
    if (filter === 'read') return n.is_read
    return true
  })

  const unreadCount = notifications.filter(n => !n.is_read).length

  if (loading) {
    return <div className="loading">{t('loading')}...</div>
  }

  return (
    <div style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <button 
          onClick={() => router.back()}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: '#319795', 
            cursor: 'pointer',
            marginBottom: '16px',
            fontSize: '14px'
          }}
        >
          {isRTL ? t('back_to_dashboard') + ' ←' : '← ' + t('back_to_dashboard')}
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#1a202c', marginBottom: '8px' }}>
              {t('notifications_title')}
            </h1>
            <p style={{ color: '#718096' }}>
              {unreadCount > 0 ? `${unreadCount} ${t('unread')}` : t('no_notifications')}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              style={{
                padding: '8px 16px',
                background: '#319795',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              {t('mark_all_as_read')}
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '24px',
        borderBottom: '1px solid #e2e8f0',
        paddingBottom: '8px'
      }}>
        <button
          onClick={() => setFilter('all')}
          style={{
            padding: '8px 16px',
            background: filter === 'all' ? '#319795' : 'transparent',
            color: filter === 'all' ? 'white' : '#718096',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          {t('all_notifications')} ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          style={{
            padding: '8px 16px',
            background: filter === 'unread' ? '#319795' : 'transparent',
            color: filter === 'unread' ? 'white' : '#718096',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          {t('unread_notifications')} ({unreadCount})
        </button>
        <button
          onClick={() => setFilter('read')}
          style={{
            padding: '8px 16px',
            background: filter === 'read' ? '#319795' : 'transparent',
            color: filter === 'read' ? 'white' : '#718096',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          {t('read_notifications')} ({notifications.length - unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              style={{
                background: notification.is_read ? 'white' : '#f0fdfa',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: notification.is_read ? 'none' : '0 1px 3px rgba(49, 151, 149, 0.1)'
              }}
              onClick={() => !notification.is_read && markAsRead(notification.id)}
            >
              <div style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
                <span style={{ fontSize: '24px' }} className={getNotificationColor(notification.type)}>
                  {getNotificationIcon(notification.type)}
                </span>
                <div style={{ flex: 1 }}>
                  {notification.title && (
                    <div style={{ 
                      fontSize: '16px', 
                      fontWeight: notification.is_read ? '500' : '600',
                      color: '#1a202c',
                      marginBottom: '4px'
                    }}>
                      {notification.title}
                    </div>
                  )}
                  <div style={{ 
                    fontSize: '14px', 
                    color: '#4a5568',
                    marginBottom: '8px'
                  }}>
                    {notification.message}
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#718096',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'center'
                  }}>
                    <span>
                      {new Date(notification.created_at).toLocaleString(isRTL ? 'ar-EG' : 'en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    <span style={{ 
                      padding: '2px 8px',
                      background: notification.type === 'error' ? '#fee2e2' :
                                 notification.type === 'success' ? '#d1fae5' :
                                 notification.type === 'warning' ? '#fef3c7' : '#dbeafe',
                      color: notification.type === 'error' ? '#991b1b' :
                             notification.type === 'success' ? '#065f46' :
                             notification.type === 'warning' ? '#92400e' : '#1e40af',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '500',
                      textTransform: 'uppercase'
                    }}>
                      {t(`notification_${notification.type}`)}
                    </span>
                  </div>
                </div>
                {!notification.is_read && (
                  <div style={{
                    width: '8px',
                    height: '8px',
                    background: '#319795',
                    borderRadius: '50%',
                    marginTop: '4px'
                  }} />
                )}
              </div>
            </div>
          ))
        ) : (
          <div style={{
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '48px',
            textAlign: 'center',
            color: '#718096'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔔</div>
            <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>
              {t('no_notifications')}
            </div>
            <div style={{ fontSize: '14px' }}>
              {filter === 'unread' ? 'All notifications have been read' : 
               filter === 'read' ? 'No read notifications yet' :
               'You\'re all caught up!'}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
