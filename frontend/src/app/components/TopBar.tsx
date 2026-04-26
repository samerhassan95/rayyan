'use client'

import React from 'react'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useLanguage } from '../../i18n/LanguageContext'

// Icons
import translate from '../../assets/icons/translate.svg'
import notification from '../../assets/icons/notification.svg'
import search from '../../assets/icons/search-normal.svg'
import sun from '../../assets/icons/sun.svg'
import sunWhite from '../../assets/icons/sun-light.svg'
import night from '../../assets/icons/moon.svg'
import nightWhite from '../../assets/icons/night-white.svg'
import arrowDown from '../../assets/icons/arrow-down.svg'
import profile from '../../assets/icons/profile.svg'
import logout from '../../assets/sidebar-icons/logout.svg'

interface TopBarProps {
  user: any;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  handleLogout: () => void;
  
  // Notification States
  showNotifications: boolean;
  setShowNotifications: (v: boolean) => void;
  notifications: any[];
  loadingNotifications: boolean;
  markNotificationAsRead: (id: number) => void;

  // User Menu States
  showUserMenu: boolean;
  setShowUserMenu: (v: boolean) => void;

  // Search States
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (o: boolean) => void;
  searchResults: any[];
  showSearchResults: boolean;
  setShowSearchResults: (v: boolean) => void;
  handleSearchSubmit: () => void;
  navigateToSearchResult: (result: any) => void;
}

export default function TopBar({
  user,
  sidebarOpen,
  setSidebarOpen,
  darkMode,
  toggleDarkMode,
  handleLogout,
  showNotifications,
  setShowNotifications,
  notifications,
  loadingNotifications,
  markNotificationAsRead,
  showUserMenu,
  setShowUserMenu,
  searchQuery,
  setSearchQuery,
  isSearchOpen,
  setIsSearchOpen,
  searchResults,
  showSearchResults,
  setShowSearchResults,
  handleSearchSubmit,
  navigateToSearchResult
}: TopBarProps) {
  const { t, language, setLanguage, isRTL } = useLanguage()
  const pathname = usePathname()
  const router = useRouter()

  return (
    <header className="admin-header mt-2.5 rounded-[1rem] mb-4">
      {/* Left Side: Page Title & Welcome */}
      <div className="header-left">
        {!sidebarOpen && (
          <button 
            className="flex items-center justify-center w-8 h-8 mr-2 text-white bg-teal-500 rounded-md lg:hidden" 
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>
        )}
        <div className="space-y-1">
          <p className='font-light text-[#7d7d7d] text-sm'>
            {pathname === '/admin' ? t('overview') : pathname.split('/').pop()?.toUpperCase()}
          </p>
          <p className="text-lg md:text-2xl font-semibold leading-[100%]">
            {t('welcome_back')}, {user?.username || 'Admin'}
          </p>
        </div>
      </div>

      {/* Right Side: Actions */}
      <div className="flex items-center gap-3 header-right">
        
        {/* 1. Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="relative flex items-center justify-between w-20 h-10 p-1 transition-colors duration-300 bg-[#F8F8F880] rounded-full cursor-pointer border border-[#F8F8F8]"
        >
          <div className={`absolute w-8 h-8 bg-[#4d8680] rounded-full transition-transform duration-300 ease-in-out ${darkMode ? 'translate-x-10 rtl:-translate-x-10' : 'translate-x-0'}`} />
          <div className="relative z-10 flex items-center justify-between w-full h-full px-1.5">
            <Image src={darkMode ? sun : sunWhite} alt="Light" className="w-5 h-5" />
            <Image src={darkMode ? nightWhite : night} alt="Dark" className="w-5 h-5" />
          </div>
        </button>

        {/* 2. Language Switcher */}
        <button
          onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
          className="header-btn"
          title="Change Language"
        >
          <Image src={translate} alt="Translate" width={20} height={20} />
        </button>

        {/* 3. Search Bar */}
        <div className="relative">
          <div className={`relative flex items-center transition-all duration-500 ${isSearchOpen ? 'w-[280px]' : 'w-10'}`}>
            <input
              type="text"
              placeholder="Search (Ctrl+K)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit()}
              className={`px-4 py-2 border border-slate-200 rounded-full text-sm w-full focus:outline-none focus:border-[#4d8680] transition-all ${isSearchOpen ? 'opacity-100 pr-10' : 'opacity-0 pointer-events-none'}`}
            />
            <button 
              className={`absolute right-0 flex items-center justify-center rounded-full transition-all ${isSearchOpen ? 'bg-[#4d8680] w-8 h-8 mr-1' : 'bg-[#f7fafc] w-9 h-9'}`}
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Image src={search} alt="Search" className={`w-5 h-5 ${isSearchOpen ? 'brightness-0 invert' : ''}`} />
            </button>
          </div>

          {showSearchResults && isSearchOpen && (
            <div className="absolute top-full right-0 bg-white border border-slate-200 rounded-lg shadow-lg z-[1000] mt-2 w-[280px] max-h-[300px] overflow-y-auto">
              {searchResults.length > 0 ? (
                searchResults.map((result: any, index: number) => (
                  <div key={index} className="px-4 py-3 border-b cursor-pointer hover:bg-slate-50 border-slate-50" onClick={() => navigateToSearchResult(result)}>
                    <div className="text-sm font-medium text-slate-900">{result.title}</div>
                    <div className="text-xs text-slate-500">{result.subtitle}</div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-sm text-center text-slate-500">{t('no_results_found')}</div>
              )}
            </div>
          )}
        </div>

        {/* 4. Notifications */}
        <div className="relative">
          <button className="relative header-btn" onClick={() => setShowNotifications(!showNotifications)}>
            <Image src={notification} alt="Notifications" width={24} height={24} />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-5 h-5 text-[10px] flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute top-full right-0 bg-white border border-slate-200 rounded-lg min-w-[320px] shadow-xl z-[1000] mt-2">
              <div className="flex items-center justify-between p-4 font-semibold border-b">
                <span>{t('notifications')}</span>
                {loadingNotifications && <span className="text-xs text-teal-600 animate-pulse">Loading...</span>}
              </div>
              <div className="max-h-[350px] overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((n: any) => (
                    <div 
                      key={n.id} 
                      className={`p-4 border-b text-sm cursor-pointer transition-colors ${n.is_read ? 'bg-white hover:bg-slate-50' : 'bg-emerald-50 hover:bg-emerald-100'}`}
                      onClick={() => markNotificationAsRead(n.id)}
                    >
                      <div className={`mb-1 ${n.is_read ? 'font-normal' : 'font-bold'}`}>{n.message}</div>
                      <div className="text-[10px] text-slate-400">{new Date(n.created_at).toLocaleString()}</div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-sm text-center text-slate-400">No notifications yet</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 5. User Menu */}
        <div className="relative">
          <div 
            className="flex items-center gap-2 cursor-pointer group bg-[#f7fafc] p-1.5 px-3 rounded-full border border-transparent hover:border-slate-200 transition-all" 
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="flex items-center justify-center w-8 h-8 overflow-hidden bg-white border rounded-full">
              {user?.profile_image ? (
                <img 
                  src={user.profile_image.startsWith('http') ? user.profile_image : `${process.env.NEXT_PUBLIC_API_URL}${user.profile_image}`} 
                  className="object-cover w-full h-full" 
                  alt="avatar" 
                />
              ) : (
                <span className="text-sm font-bold text-teal-700">{user?.username?.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="hidden text-left md:block">
              <p className="text-xs font-bold leading-none text-slate-800">{user?.username || 'Admin'}</p>
              <p className="text-[10px] text-slate-500 leading-none mt-1">{user?.email || 'admin@rayyan.com'}</p>
            </div>
            <Image src={arrowDown} alt="arrow" width={12} className={`transition-transform duration-300 ${showUserMenu ? 'rotate-180' : ''}`} />
          </div>

          {showUserMenu && (
            <div className="absolute top-full right-0 mt-2 min-w-[200px] bg-white border border-slate-200 rounded-lg shadow-xl z-[1000] overflow-hidden">
              <div className="p-4 border-b bg-slate-50/50">
                <p className="text-sm font-bold truncate">{user?.username}</p>
                <p className="text-xs truncate text-slate-500">{user?.email}</p>
              </div>
              <div className="py-1">
                <button 
                  className="flex items-center w-full gap-2 px-4 py-2 text-sm text-left text-slate-600 hover:bg-slate-50"
                  onClick={() => { setShowUserMenu(false); router.push('/admin/profile'); }}
                >
                  <Image src={profile} alt="profile" width={16} /> {t('profile')}
                </button>
                <hr className="my-1 border-slate-100" />
                <button 
                  className="flex items-center w-full gap-2 px-4 py-2 text-sm font-medium text-left text-red-500 hover:bg-red-50"
                  onClick={() => { setShowUserMenu(false); handleLogout(); }}
                >
                  <Image src={logout} alt="logout" width={16} /> {t('logout')}
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  )
}