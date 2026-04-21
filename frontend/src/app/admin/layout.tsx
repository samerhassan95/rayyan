'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import './admin.css'
import Image from 'next/image'
import { useLanguage } from '../../i18n/LanguageContext'
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
import arrowIcon from '../../assets/icons/arrow-square-right.svg'
import arrowDown from '../../assets/icons/arrow-down.svg'
import translate from '../../assets/icons/translate.svg'

//header icons
import notification from '../../assets/icons/notification.svg'
import search from '../../assets/icons/search-normal.svg'
import logout from '../../assets/sidebar-icons/logout.svg'
import night from '../../assets/icons/moon.svg'
import nightWhite from '../../assets/icons/night-white.svg'
import sun from '../../assets/icons/sun.svg'
import sunWhite from '../../assets/icons/sun-light.svg'
import profile from '../../assets/icons/profile.svg'

import Link from 'next/link'
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { t, isRTL, language, setLanguage } = useLanguage()
  const [user, setUser] = useState<any>(null);
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
  // const [isExpanded, setIsExpanded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter()
  const pathname = usePathname()

  const toggleSearch = () => {
    if (!isOpen) {
      setIsOpen(true);
    } else if (searchQuery === '') {
      // لو الفيلد مفتوح وفاضي وضغطت تاني يقفل
      setIsOpen(false);
      setShowSearchResults(false);
    } else {
      // لو فيه نص، الزرار يشتغل كبحث عادي
      handleSearchSubmit();
    }
  };

  //sidebar items
  const navItems = [
    { name: t('overview'), path: '/admin', icon: overviewIcon, activeIcon: overviewIconActive },
    { name: t('users').toUpperCase(), path: '/admin/users', icon: usersIcon, activeIcon: usersIconActive },
    { name: t('subscriptions'), path: '/admin/subscriptions', icon: subscriptionsIcon, activeIcon: subscriptionsIconActive },
    { name: t('transactions'), path: '/admin/transactions', icon: transactionsIcon, activeIcon: transactionsIconActive },
    { name: t('plans'), path: '/admin/plans', icon: plansIcon, activeIcon: plansIconActive },
    { name: t('settings'), path: '/admin/settings', icon: settingsIcon, activeIcon: settingsIconActive },
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
    <div
      className={`admin-layout ${sidebarOpen ? 'sidebar-expanded' : 'sidebar-collapsed'}`}
      style={{ direction: isRTL ? 'rtl' : 'ltr' }}
    >


      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-[99] lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`admin-sidebar fixed lg:static top-0 bottom-0 z-[101] transition-all duration-300 ease-in-out ${sidebarOpen ? 'open translate-x-0' : 'closed -translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center justify-between p-4 sidebar-header">
          <div className="logo">
            <h2>{sidebarOpen ? 'RAYYAN' : 'R'}</h2>
          </div>

          <button
            className="flex items-center justify-center p-1 bg-transparent border-none cursor-pointer sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Image
              src={arrowIcon}
              alt="toggle sidebar"
              width={20}
              height={20}
              className={`block w-4 h-4 transition-transform duration-300 ease-in-out ${sidebarOpen ? 'rotate-180' : 'rotate-0'}`}
            />
          </button>
        </div>

        {/* Sidebar Content */}
        <div className="sidebar-section">
          {sidebarOpen && <span className="section-title">{t('platform')}</span>}
          <nav className="sidebar-nav ">
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`nav-item ${sidebarOpen ? 'w-[90%] rounded-full' : 'mx-auto rounded-[8px] w-[50%]'} ${isActive ? 'active' : ''}`}
                  data-tooltip={!sidebarOpen ? item.name : ''}
                  onClick={() => {
                    if (window.innerWidth < 1024) setSidebarOpen(false);
                  }}
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
          <button onClick={handleLogout} className="logout-btn" title={!sidebarOpen ? t('logout') : ''}>
            <Image src={logout} alt="Logout" className=" logout-icon" />
            {sidebarOpen && <span className="mx-1 logout-text">{t('logout')}</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`admin-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {/* Header */}
        <header className="admin-header mt-2.5 rounded-[1rem] mb-4">
          <div className="header-left">
            {/* زرار المنيو: يظهر فقط في الشاشة الصغيرة (lg:hidden) وعندما يكون السايدبار مغلقاً */}
            {!sidebarOpen && (
              <button
                className="z-[100] bg-teal-500 text-white rounded-md w-8 h-8 flex items-center justify-center lg:hidden mr-2"
                onClick={() => setSidebarOpen(true)}
              >
                ☰
              </button>
            )}
            <div>
              <p className='font-light text-[#7d7d7d]'>{pathname === '/admin' ? t('overview') : pathname.split('/').pop()?.toUpperCase()}</p>
              <p className="text-lg md:text-2xl font-semibold leading-[100%]">{t('welcome_back')}, {user?.username || 'Admin'}</p>
            </div>
          </div>

          <div className="header-right">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="relative flex items-center justify-between w-20 h-10 p-1 transition-colors duration-300 bg-[#F8F8F880] rounded-full cursor-pointer border border-[#F8F8F8]"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              <div
                className={`absolute w-8 h-8 bg-[#4d8680] rounded-full transition-transform duration-300 ease-in-out ${darkMode ? 'translate-x-10 rtl:-translate-x-10' : 'rtl:translate-x-0 translate-x-0'}`}
              />

              <div className="relative z-10 flex items-center justify-between w-full h-full px-1.5">
                <div className="flex items-center justify-center">
                  <Image src={darkMode ? sun : sunWhite} alt="Light Mode" className="block w-5 h-5 " />
                </div>
                <div className="flex items-center justify-center">
                  <Image src={darkMode ? nightWhite : night} alt="Dark Mode" className="block w-5 h-5" />
                </div>
              </div>
            </button>

            {/* Language Switcher */}
            <button
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className="header-btn"
              title={language === 'ar' ? 'Switch to English' : 'التبديل للعربية'}
            >
              <Image src={translate} alt="Translate" width={20} height={20} className="inline-block" />
            </button>

            {/* Search */}
            <div className="relative">
              <div className="flex items-center justify-end overflow-hidden">
                <div className={`relative flex items-center transition-all duration-500 ease-in-out ${isOpen ? 'w-[280px] opacity-100' : 'w-10 opacity-100'}`}>
                  <input
                    type="text"
                    placeholder="Search here... (Ctrl+K)"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (e.target.value.length >= 2) {
                        handleSearch(e.target.value);
                      } else {
                        setShowSearchResults(false);
                      }
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit()}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setSearchQuery('');
                        setShowSearchResults(false);
                        setIsOpen(false);
                      }
                    }}
                    className={`px-4 py-2 border border-slate-200 rounded-full text-sm w-full focus:outline-none focus:ring-teal-500/20 focus:border-[#4d8680] placeholder:text-sm placeholder:text-[#a9a9a9] placeholder:font-light transition-all duration-500 ${isOpen ? 'pr-12 opacity-100' : 'opacity-0 pointer-events-none'}`}
                  />

                  <button
                    title="Search"
                    className={`absolute flex items-center justify-center rounded-full transition-all duration-300 ${isOpen ? 'bg-[#4d8680] right-1 w-8 h-8' : 'bg-[#f7fafc] hover:bg-slate-50 w-9 h-9 right-0'}`}
                    onClick={toggleSearch}
                  >
                    <Image
                      src={search}
                      alt="Search"
                      className={`w-5 h-5 transition-all ${isOpen ? 'brightness-0 invert' : ''}`}
                    />
                  </button>
                </div>
              </div>

              {showSearchResults && isOpen && (
                <div className="absolute top-full right-4 left-auto bg-white border border-slate-200 rounded-lg shadow-lg z-[1000] mt-2 w-[280px] max-h-[300px] overflow-y-auto">
                  {searchResults.length > 0 ? (
                    <>
                      <div className="px-4 py-3 text-sm font-semibold border-b border-slate-50">
                        {t('search_results')}
                      </div>
                      {searchResults.map((result: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 px-4 py-3 transition-colors border-b cursor-pointer border-slate-50 hover:bg-slate-50"
                          onClick={() => navigateToSearchResult(result)}
                        >
                          <div className="flex-1">
                            <div className="text-sm font-medium text-slate-900">{result.title}</div>
                            <div className="text-xs text-slate-500">{result.subtitle}</div>
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="p-4 text-sm text-center text-slate-500">
                      {t('no_results_found')} "{searchQuery}"
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                className="relative header-btn"
                onClick={() => setShowNotifications(!showNotifications)}
                title="Notifications"
              >
                <Image src={notification} alt="Notifications" width={24} height={24} />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-5 h-5 text-[10px] flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute top-full right-0 bg-white border border-slate-200 rounded-lg min-w-[350px] shadow-md z-[1000] mt-2">
                  <div className="p-4 border-b border-slate-50">
                    <div className="flex items-center justify-between">
                      <h4 className="m-0 text-base font-semibold text-slate-900">{t('notifications')}</h4>
                      {loadingNotifications && <div className="text-xs text-slate-500 animate-pulse">{t('loading')}...</div>}
                    </div>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto">
                    {loadingNotifications ? (
                      <div className="p-5 text-center text-slate-500">Loading notifications...</div>
                    ) : notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-3 px-4 border-b border-slate-50 cursor-pointer transition-colors duration-200 ${notification.is_read ? 'bg-transparent hover:bg-slate-50' : 'bg-emerald-50 hover:bg-emerald-100'}`}
                          onClick={() => markNotificationAsRead(notification.id)}
                        >
                          <div className="flex items-start gap-3">
                            <span className={`text-lg ${notification.type === 'error' ? 'text-red-600' : notification.type === 'success' ? 'text-green-600' : 'text-blue-600'}`}>
                              {notification.type === 'error' ? '⚠️' : notification.type === 'success' ? '✅' : 'ℹ️'}
                            </span>
                            <div className="flex-1">
                              <div className={`text-sm mb-1 ${notification.is_read ? 'font-normal' : 'font-semibold text-slate-800'}`}>
                                {notification.message}
                              </div>
                              <div className="text-xs text-slate-500">{new Date(notification.created_at).toLocaleString()}</div>
                            </div>
                            {!notification.is_read && <div className="w-2 h-2 rounded-full bg-teal-600 mt-1.5" />}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-5 text-center text-slate-500">No notifications</div>
                    )}
                  </div>
                  <div className="p-3 px-4 text-center border-t border-slate-50">
                    <button className="text-sm font-medium text-teal-600 bg-transparent border-none cursor-pointer hover:underline" onClick={() => setShowNotifications(false)}>
                      {t('view_all_notifications')}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="relative">
              <div className="flex items-center gap-2 cursor-pointer group bg-[#f7fafc] p-1.5 px-2 rounded-full" onClick={() => setShowUserMenu(!showUserMenu)}>
                <div className="flex items-center justify-center w-7 h-7 overflow-hidden text-sm font-medium border rounded-full bg-[#f7fafc]">
                  {user?.profile_image ? (
                    <img src={user.profile_image.startsWith('http') ? user.profile_image : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${user.profile_image}`} alt={user?.username || 'User'} className="object-cover w-full h-full" />
                  ) : (
                    <span className='text-black'>{user?.username?.charAt(0)?.toUpperCase() || 'A'}</span>
                  )}
                </div>
                <div>
                  <span className="text-xs font-medium transition-colors text-slate-700 group-hover:text-slate-900 leading-[100%]">{user?.username || 'Admin'}</span>
                  <p className="text-[8px] font-light text-[#656769] leading-[100%]">{user?.email || 'admin@example.com'}</p>
                </div>
                <span className={`text-[10px] text-slate-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`}>
                  <Image src={arrowDown} alt='chevron down' width={12} height={12} />
                </span>
              </div>

              {showUserMenu && (
                <div className="absolute top-full right-0 mt-2 min-w-[200px] bg-white border border-slate-200 rounded-lg shadow-xl z-[1000] overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                  <div className="p-4 border-b border-slate-50 bg-slate-50/30">
                    <div className="font-semibold truncate text-slate-800">{user?.username}</div>
                    <div className="text-xs truncate text-slate-500">{user?.email}</div>
                  </div>
                  <div className="py-1">
                    <button className="w-full px-4 py-2.5 text-left text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2 transition-colors" onClick={() => { setShowUserMenu(false); router.push('/admin/profile'); }}>
                      <Image src={profile} alt='profile' width={16} height={16} /> {t('profile')}
                    </button>
                    <hr className="my-1 border-slate-100" />
                    <button className="w-full px-4 py-2.5 text-left text-sm text-red-500 hover:bg-red-50 flex items-center gap-2 transition-colors font-medium" onClick={() => { setShowUserMenu(false); handleLogout(); }}>
                      <Image src={logout} alt='logout' width={16} height={16} /> {t('logout')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="admin-content bg-[#f8f8f8]">
          {children}
        </div>  
         </main>

      {/* Click outside to close dropdowns */}
      {(showNotifications || showUserMenu || showSearchResults) && (
        <div className="fixed inset-0 z-[500]"
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