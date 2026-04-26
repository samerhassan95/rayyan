'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '../../i18n/LanguageContext'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'
import './admin.css'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isRTL } = useLanguage()
  const router = useRouter()
  
  // States
  const [user, setUser] = useState<any>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  
  // UI States
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  // Auth & Theme Logic
  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/login')
    } else {
      setUser(JSON.parse(userData))
    }

    const savedDarkMode = localStorage.getItem('darkMode') === 'true'
    setDarkMode(savedDarkMode)
    document.body.classList.toggle('dark-mode', savedDarkMode)

    const handleResize = () => {
      const mobile = window.innerWidth <= 768
      setIsMobile(mobile)
      setSidebarOpen(!mobile)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [router])

  const handleLogout = () => {
    localStorage.clear()
    router.push('/login')
  }

  const toggleDarkMode = () => {
    const newMode = !darkMode
    setDarkMode(newMode)
    localStorage.setItem('darkMode', String(newMode))
    document.body.classList.toggle('dark-mode', newMode)
  }

  return (
    <div className={`flex gap-4 m-3 ${sidebarOpen ? 'sidebar-expanded' : 'sidebar-collapsed'}`} style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
      
      <Sidebar 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen} 
        isMobile={isMobile} 
        handleLogout={handleLogout} 
      />

      <main className={`admin-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <TopBar 
          user={user}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          handleLogout={handleLogout}
          showNotifications={showNotifications}
          setShowNotifications={setShowNotifications}
          showUserMenu={showUserMenu}
          setShowUserMenu={setShowUserMenu}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isSearchOpen={isSearchOpen}
          setIsSearchOpen={setIsSearchOpen}
          handleSearch={(q) => setSearchQuery(q)}
          searchResults={[]} // Pass your logic
          showSearchResults={false}
          notifications={[]} // Pass your logic
        />

        <div className="admin-content bg-[#f8f8f8] rounded-2xl p-4 min-h-screen">
          {children}
        </div>
      </main>

      {/* Background overlay for mobile */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100]" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  )
}