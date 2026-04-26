'use client'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLanguage } from '../../i18n/LanguageContext'

// Icons (تأكد من صحة المسارات)
import arrowIcon from '../../assets/icons/arrow-square-right.svg'
import logout from '../../assets/sidebar-icons/logout.svg'
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

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isMobile: boolean;
  handleLogout: () => void;
}

export default function Sidebar({ isOpen, setIsOpen, isMobile, handleLogout }: SidebarProps) {
  const { t } = useLanguage()
  const pathname = usePathname()

  const navItems = [
    { name: t('overview'), path: '/admin', icon: overviewIcon, activeIcon: overviewIconActive },
    { name: t('users').toUpperCase(), path: '/admin/users', icon: usersIcon, activeIcon: usersIconActive },
    { name: t('subscriptions'), path: '/admin/subscriptions', icon: subscriptionsIcon, activeIcon: subscriptionsIconActive },
    { name: t('transactions'), path: '/admin/transactions', icon: transactionsIcon, activeIcon: transactionsIconActive },
    { name: t('plans'), path: '/admin/plans', icon: plansIcon, activeIcon: plansIconActive },
    { name: t('settings'), path: '/admin/settings', icon: settingsIcon, activeIcon: settingsIconActive },
  ];

  return (
    <aside className={`admin-sidebar fixed lg:static top-0 bottom-0 z-[101] transition-all duration-300 ${isOpen ? 'open translate-x-0' : 'closed -translate-x-full lg:translate-x-0'}`}>
      <div className="flex items-center justify-between p-4 sidebar-header">
        <div className="logo">
          <h2 className="font-bold">{isOpen ? 'RAYYAN' : 'R'}</h2>
        </div>
        <button className="sidebar-toggle" onClick={() => setIsOpen(!isOpen)}>
          <Image src={arrowIcon} alt="toggle" width={20} height={20} className={`transition-transform ${isOpen ? 'rotate-180' : 'rotate-0'}`} />
        </button>
      </div>

      <div className="sidebar-section">
        {isOpen && <span className="section-title">{t('platform')}</span>}
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`nav-item ${isOpen ? 'w-[90%] rounded-full' : 'mx-auto rounded-[8px] w-[50%]'} ${isActive ? 'active' : ''}`}
                onClick={() => isMobile && setIsOpen(false)}
              >
                <Image src={isActive ? item.activeIcon : item.icon} alt={item.name} className="nav-icon-img" />
                {isOpen && <span className="nav-text">{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="sidebar-footer">
        <button onClick={handleLogout} className="logout-btn">
          <Image src={logout} alt="Logout" className="logout-icon" />
          {isOpen && <span className="mx-1">{t('logout')}</span>}
        </button>
      </div>
    </aside>
  )
}