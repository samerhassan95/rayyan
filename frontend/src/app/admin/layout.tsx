'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import './admin.css'
import Image from 'next/image'
//===
//sidebar icons
import overviewIcon from '../../assets/sidebar-icons/overview.svg'
import usersIcon from '../../assets/sidebar-icons/users.svg'
import subscriptionsIcon from '../../assets/sidebar-icons/subscriptions.svg'
import transactionsIcon from '../../assets/sidebar-icons/transactions.svg'
import plansIcon from '../../assets/sidebar-icons/plans.svg'
import settingsIcon from '../../assets/sidebar-icons/settings.svg'

import overviewIconActive from '../../assets/sidebar-icons/overview-active.svg'
import usersIconActive from '../../assets/sidebar-icons/users-active.svg'
import subscriptionsIconActive from '../../assets/sidebar-icons/subscriptions-active.svg'
import transactionsIconActive from '../../assets/sidebar-icons/transactions-active.svg'
import plansIconActive from '../../assets/sidebar-icons/plans-active.svg'
import settingsIconActive from '../../assets/sidebar-icons/settings-active.svg'

//========================
import arrow from '../../assets/icons/arrow-square-right.svg'
//header icons
import notification from '../../assets/icons/notification.svg'
import search from '../../assets/icons/search-normal.svg'
import logout from '../../assets/sidebar-icons/logout.svg'
import night from '../../assets/icons/night.svg'



import Link from 'next/link'
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('user');
      try {
        return userData ? JSON.parse(userData) : null;
      } catch { return null; }
    }
    return null;
  });
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  const [isMobile, setIsMobile] = useState(false);


  const router = useRouter()
  const pathname = usePathname()

  //sidebar items
  const navItems = [
    { name: 'Overview', path: '/admin', icon: overviewIcon, activeIcon: overviewIconActive },
    { name: 'USERS', path: '/admin/users', icon: usersIcon, activeIcon: usersIconActive },
    { name: 'Subscriptions', path: '/admin/subscriptions', icon: subscriptionsIcon, activeIcon: subscriptionsIconActive },
    { name: 'Transactions', path: '/admin/transactions', icon: transactionsIcon, activeIcon: transactionsIconActive },
    { name: 'Plans', path: '/admin/plans', icon: plansIcon, activeIcon: plansIconActive },
    { name: 'Settings', path: '/admin/settings', icon: settingsIcon, activeIcon: settingsIconActive },
  ];


  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')

    console.log('🔍 Admin Layout Debug:');
    console.log('- Token exists:', !!token);
    console.log('- User data exists:', !!userData);

    if (!token || !userData) {
      console.log('❌ No token or user data - redirecting to login');
      router.push('/login')
      return
    }

    try {
      const parsedUser = JSON.parse(userData)
      console.log('👤 User data:', parsedUser);
      console.log('🛡️ User role:', parsedUser.role);

      if (parsedUser.role !== 'admin') {
        console.log('❌ User is not admin - redirecting to login');
        router.push('/login')
        return
      }

      console.log('✅ Admin user authenticated successfully');
      setUser(parsedUser)
    } catch (error) {
      console.error('❌ Error parsing user data:', error);
      router.push('/login')
      return
    }

    // Load dark mode preference
    const savedDarkMode = localStorage.getItem('darkMode') === 'true'
    setDarkMode(savedDarkMode)
    document.body.classList.toggle('dark-mode', savedDarkMode)

    // Load notifications
    fetchNotifications()

    // Auto-refresh notifications every 30 seconds
    const notificationInterval = setInterval(fetchNotifications, 30000)

    // Add keyboard shortcut for search (Ctrl+K)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault()
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      clearInterval(notificationInterval)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [router])

  useEffect(() => {
    const checkResizing = () => {
      const width = window.innerWidth;
      const mobileStatus = width <= 768; // يمكنك تعديل هذا الرقم حسب حاجتك
      setIsMobile(mobileStatus);

      // إذا كانت شاشة صغيرة (موبايل)، اجعل السايدبار مقفول ديفولت
      if (mobileStatus) {
        setSidebarOpen(false);
      } else {
        // اختياري: لو شاشة كبيرة خليه مفتوح ديفولت
        setSidebarOpen(true);
      }
    };

    checkResizing(); // تشغيل عند أول تحميل
    window.addEventListener('resize', checkResizing);
    return () => window.removeEventListener('resize', checkResizing);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setNotifications(data)
      } else {
        // Fallback to mock data
        setNotifications([
          { id: 1, message: 'New user registration: john@example.com', created_at: new Date(), type: 'info', is_read: false },
          { id: 2, message: 'Payment failed for subscription #1234', created_at: new Date(Date.now() - 300000), type: 'error', is_read: false },
          { id: 3, message: 'Monthly report is ready', created_at: new Date(Date.now() - 3600000), type: 'success', is_read: true }
        ])
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
      // Fallback to mock data
      setNotifications([
        { id: 1, message: 'New user registration: john@example.com', created_at: new Date(), type: 'info', is_read: false },
        { id: 2, message: 'Payment failed for subscription #1234', created_at: new Date(Date.now() - 300000), type: 'error', is_read: false },
        { id: 3, message: 'Monthly report is ready', created_at: new Date(Date.now() - 3600000), type: 'success', is_read: true }
      ])
    } finally {
      setLoadingNotifications(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)
    localStorage.setItem('darkMode', newDarkMode.toString())
    document.body.classList.toggle('dark-mode', newDarkMode)
  }

  const handleSearch = (query: string) => {
    if (!query || query.length < 1) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }

    const navigationLinks = [
      { name: 'Overview', type: 'page', path: '/admin', description: 'Main dashboard analytics and stats' },
      { name: 'Performance Trend', type: 'section', path: '/admin#performance', description: 'Revenue and subscription charts' },
      { name: 'User Acquisition', type: 'section', path: '/admin#acquisition', description: 'Traffic sources and referrals' },
      { name: 'Users Management', type: 'page', path: '/admin/users', description: 'View and manage platform users' },
      { name: 'Subscriptions', type: 'page', path: '/admin/subscriptions', description: 'Manage active plans and billing' },
      { name: 'Transactions', type: 'page', path: '/admin/transactions', description: 'View all payment activities' },
      { name: 'Plans & Pricing', type: 'page', path: '/admin/plans', description: 'Configure subscription packages' },
      { name: 'Settings', type: 'page', path: '/admin/settings', description: 'System and profile configurations' },
      { name: 'Profile Settings', type: 'section', path: '/admin/settings#profile', description: 'Update administrator profile' },
      { name: 'Security', type: 'section', path: '/admin/settings#security', description: 'Password and access controls' },
      { name: 'Notification Settings', type: 'section', path: '/admin/settings#notifications', description: 'Manage system alerts' },
    ];

    const results = navigationLinks.filter(item => 
      item.name.toLowerCase().includes(query.toLowerCase()) || 
      item.description.toLowerCase().includes(query.toLowerCase())
    ).map(item => ({
      ...item,
      title: item.name,
      subtitle: item.description,
      icon: item.type === 'page' ? '📄' : '📍'
    }));

    setSearchResults(results as any)
    setShowSearchResults(true)
  }

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      handleSearch(searchQuery)
    }
  }

  const navigateToSearchResult = (result: any) => {
    setShowSearchResults(false)
    setSearchQuery('')
    router.push(result.path)
  }

  const markNotificationAsRead = async (notificationId: number) => {
    try {
      const token = localStorage.getItem('token')
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      })

      // Update local state
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      )
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  // if (!user) {
  //   return (
  //     <div style={{
  //       display: 'flex',
  //       justifyContent: 'center',
  //       alignItems: 'center',
  //       height: '400px',
  //       fontSize: '16px',
  //       color: '#718096'
  //     }}>
  //       Checking authentication...
  //     </div>
  //   )
  // }

  return (
    <div className={`admin-layout ${sidebarOpen ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>

      {/* زرار يظهر فقط في الموبايل والسايدبار مقفول */}
      {isMobile && !sidebarOpen && (
        <button
          className="fixed top-4 left-4 z-[100] bg-teal-500 text-white rounded-md w-8 h-8 flex items-center justify-center lg:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          ☰
        </button>
      )}

      {/* السايدبار */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="flex items-center justify-between p-4 sidebar-header">
          <div className="logo">
            <h2>{sidebarOpen ? 'RAYYAN' : 'R'}</h2>
          </div>

          {/* زرار الإغلاق يظهر دائماً في الموبايل أو في الديسكتوب لو السايدبار مفتوح */}
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Sidebar */}


        <div className="sidebar-section">
          {sidebarOpen && <span className="section-title">Platform</span>}
          <nav className="sidebar-nav">
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`nav-item ${sidebarOpen ? 'w-[90%] rounded-full' : 'mx-auto rounded-[8px] w-[50%]'} ${isActive ? 'active' : ''}`}
                  // نضع النص في data-tooltip فقط لما يكون السايدبار مقفول
                  data-tooltip={!sidebarOpen ? item.name : ''}
                >
                  <Image
                    src={isActive ? item.activeIcon : item.icon}
                    alt={item.name}
                    className="nav-icon-img"
                  />
                  {sidebarOpen && <span className="nav-text">{item.name}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn" title={!sidebarOpen ? 'Logout' : ''}>
            <Image src={logout} alt="Logout" className=" logout-icon" />
            {sidebarOpen && <span className="mx-1 logout-text">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`admin-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {/* Header */}
        <header className="admin-header mt-2.5 rounded-[1rem] mb-4">
          <div className="header-left">

            <div>
              <p className='font-light text-[#7d7d7d]'>Overview</p>
              <p className="text-lg md:text-2xl font-semibold leading-[100%]">Welcome back, {user.username}</p>
            </div>
          </div>

          <div className="header-right">
            {/* Dark Mode Toggle */}
            <button
              className="header-btn"
              onClick={toggleDarkMode}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>

            {/* Search */}
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Search users, transactions... (Ctrl+K)"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    if (e.target.value.length >= 2) {
                      handleSearch(e.target.value)
                    } else {
                      setShowSearchResults(false)
                    }
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit()}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setSearchQuery('')
                      setShowSearchResults(false)
                    }
                  }}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    width: '250px'
                  }}
                />
                <button
                  className="header-btn"
                  onClick={handleSearchSubmit}
                  title="Search"
                >
                  <Image src={search} alt="Search" className="search-icon" />
                </button>
              </div>

              {/* Search Results Dropdown */}
              {showSearchResults && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  zIndex: 1000,
                  marginTop: '8px',
                  maxHeight: '300px',
                  overflowY: 'auto'
                }}>
                  {searchResults.length > 0 ? (
                    <>
                      <div style={{ padding: '12px 16px', borderBottom: '1px solid #f7fafc', fontWeight: '600', fontSize: '14px' }}>
                        Search Results
                      </div>
                      {searchResults.map((result: any, index) => (
                        <div
                          key={index}
                          style={{
                            padding: '12px 16px',
                            borderBottom: '1px solid #f7fafc',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                          }}
                          onClick={() => navigateToSearchResult(result)}
                        >
                          <span style={{ fontSize: '16px' }}>
                            {result.icon}
                          </span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '500', fontSize: '14px' }}>
                              {result.title}
                            </div>
                            <div style={{ fontSize: '12px', color: '#718096' }}>
                              {result.subtitle}
                            </div>
                          </div>
                          <div style={{ fontSize: '11px', color: '#319795', textTransform: 'uppercase', fontWeight: '800' }}>
                            {result.type}
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div style={{ padding: '16px', textAlign: 'center', color: '#718096' }}>
                      No results found for "{searchQuery}"
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Notifications */}
            <div style={{ position: 'relative' }}>
              <button
                className="header-btn"
                onClick={() => setShowNotifications(!showNotifications)}
                title="Notifications"
                style={{ position: 'relative' }}
              >
                <Image src={notification} alt="Notifications" width={24} height={24} />
                {notifications.length > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    background: '#e53e3e',
                    color: 'white',
                    borderRadius: '50%',
                    width: '16px',
                    height: '16px',
                    fontSize: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {notifications.length}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  minWidth: '350px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  zIndex: 1000,
                  marginTop: '8px'
                }}>
                  <div style={{ padding: '16px', borderBottom: '1px solid #f7fafc' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Notifications</h4>
                      {loadingNotifications && (
                        <div style={{ fontSize: '12px', color: '#718096' }}>Refreshing...</div>
                      )}
                    </div>
                  </div>
                  <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {loadingNotifications ? (
                      <div style={{ padding: '20px', textAlign: 'center', color: '#718096' }}>
                        Loading notifications...
                      </div>
                    ) : notifications.length > 0 ? (
                      notifications.map(notification => (
                        <div
                          key={notification.id}
                          style={{
                            padding: '12px 16px',
                            borderBottom: '1px solid #f7fafc',
                            cursor: 'pointer',
                            backgroundColor: notification.is_read ? 'transparent' : '#f0fff4'
                          }}
                          onClick={() => markNotificationAsRead(notification.id)}
                        >
                          <div style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '12px'
                          }}>
                            <span style={{
                              fontSize: '18px',
                              color: notification.type === 'error' ? '#e53e3e' :
                                notification.type === 'success' ? '#38a169' : '#3182ce'
                            }}>
                              {notification.type === 'error' ? '⚠️' :
                                notification.type === 'success' ? '✅' : 'ℹ️'}
                            </span>
                            <div style={{ flex: 1 }}>
                              <div style={{
                                fontSize: '14px',
                                marginBottom: '4px',
                                fontWeight: notification.is_read ? 'normal' : '500'
                              }}>
                                {notification.message}
                              </div>
                              <div style={{ fontSize: '12px', color: '#718096' }}>
                                {new Date(notification.created_at).toLocaleString()}
                              </div>
                            </div>
                            {!notification.is_read && (
                              <div style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: '#319795'
                              }} />
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '20px', textAlign: 'center', color: '#718096' }}>
                        No notifications
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '12px 16px', textAlign: 'center', borderTop: '1px solid #f7fafc' }}>
                    <button
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#319795',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                      onClick={() => {
                        setShowNotifications(false)
                        // In a real app, navigate to notifications page
                      }}
                    >
                      View All Notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div style={{ position: 'relative' }}>
              <div
                className="user-menu"
                onClick={() => setShowUserMenu(!showUserMenu)}
                style={{ cursor: 'pointer' }}
              >
                <img
                  src="/api/placeholder/32/32"
                  alt={user.username}
                  className="user-avatar"
                />
                <span className="user-name">{user.username}</span>
                <span className="user-dropdown">▼</span>
              </div>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  minWidth: '200px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  zIndex: 1000,
                  marginTop: '8px'
                }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #f7fafc' }}>
                    <div style={{ fontWeight: '600' }}>{user.username}</div>
                    <div style={{ fontSize: '12px', color: '#718096' }}>{user.email}</div>
                  </div>
                  <div>
                    <button
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: 'none',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                      onClick={() => {
                        setShowUserMenu(false)
                        router.push('/admin/settings')
                      }}
                    >
                      ⚙️ Settings
                    </button>
                    <button
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: 'none',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                      onClick={() => {
                        setShowUserMenu(false)
                        router.push('/admin/profile')
                      }}
                    >
                      👤 Profile
                    </button>
                    <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #f7fafc' }} />
                    <button
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: 'none',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#e53e3e'
                      }}
                      onClick={() => {
                        setShowUserMenu(false)
                        handleLogout()
                      }}
                    >
                      🚪 Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="admin-content bg-[#f8f8f8]">
          {children}
        </div>
      </main>

      {/* Click outside to close dropdowns */}
      {(showNotifications || showUserMenu || showSearchResults) && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
          onClick={() => {
            setShowNotifications(false)
            setShowUserMenu(false)
            setShowSearchResults(false)
          }}
        />
      )}

      {isMobile && sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>
      )}
    </div>
  )
}