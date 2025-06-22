import React, { useContext } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext, UserRole } from '../../contexts/AuthContext';
import { ThemeContext } from '../../contexts/ThemeContext';
import { ICONS, ROLE_DISPLAY_NAMES, DEFAULT_LOGO_URL } from '../../constants';
import Button from '../shared/Button';

const Navbar: React.FC = () => {
  const authContext = useContext(AuthContext);
  const themeContext = useContext(ThemeContext);
  const navigate = useNavigate();
  const location = useLocation();

  if (!authContext || !themeContext) return null;
  const { session, logout } = authContext;
  const { theme, toggleTheme, appName, logoUrl } = themeContext;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinkClasses = (to: string) => {
    let isActive;
    if (to.startsWith('/admin#')) {
        isActive = location.pathname === '/admin' && location.hash === to.substring('/admin'.length);
    } else {
        isActive = location.pathname === to;
    }

    return `px-2.5 py-1.5 text-xs sm:px-3 sm:py-2 sm:text-sm rounded-md font-medium transition-all duration-150 ease-in-out group flex items-center ${
      isActive
        ? 'bg-primary-DEFAULT text-gray-800 dark:text-white shadow-sm'
        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
    }`;
  };

  const getActiveIconColorClass = (to: string) => {
    let isActive;
    if (to.startsWith('/admin#')) {
        isActive = location.pathname === '/admin' && location.hash === to.substring('/admin'.length);
    } else {
        isActive = location.pathname === to;
    }
    return isActive ? 'text-gray-800 dark:text-white' : 'text-gray-400 dark:text-gray-500 group-hover:text-primary-DEFAULT';
  };


  return (
    <nav className="bg-white dark:bg-gray-800 shadow-lg sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-start md:items-center justify-between h-auto min-h-16 py-2 md:py-0">
          <div className="flex items-center flex-wrap md:flex-nowrap">
            <NavLink to="/" className="flex-shrink-0 mr-4 self-center md:self-auto"> {/* Ensure logo aligns well */}
              <img 
                src={logoUrl || DEFAULT_LOGO_URL} 
                alt={`${appName} Logo`} 
                className="h-10 w-auto" 
                onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_LOGO_URL; }}
              />
            </NavLink>
            <div className="ml-0 mt-2 md:mt-0 md:ml-6 w-full md:w-auto"> 
              <div className="flex items-center space-x-2 sm:space-x-3 flex-wrap gap-y-2">
                {session?.role === UserRole.ADMIN && (
                  <>
                    <NavLink to="/admin#dashboard" className={navLinkClasses("/admin#dashboard")}>
                      {React.cloneElement(ICONS.dashboard("w-4 h-4"), { className: `mr-1.5 sm:mr-2 w-4 h-4 ${getActiveIconColorClass("/admin#dashboard")}` })} Kontrol Paneli
                    </NavLink>
                    <NavLink to="/admin#products" className={navLinkClasses("/admin#products")}>
                      {React.cloneElement(ICONS.products("w-4 h-4"), { className: `mr-1.5 sm:mr-2 w-4 h-4 ${getActiveIconColorClass("/admin#products")}` })} Ürünler
                    </NavLink>
                    <NavLink to="/admin#users" className={navLinkClasses("/admin#users")}>
                      {React.cloneElement(ICONS.usersManagement("w-4 h-4"), { className: `mr-1.5 sm:mr-2 w-4 h-4 ${getActiveIconColorClass("/admin#users")}` })} Kullanıcılar
                    </NavLink>
                     <NavLink to="/admin#tables" className={navLinkClasses("/admin#tables")}>
                      {React.cloneElement(ICONS.table("w-4 h-4"), { className: `mr-1.5 sm:mr-2 w-4 h-4 ${getActiveIconColorClass("/admin#tables")}` })} Masalar
                    </NavLink>
                    <NavLink to="/admin#roles" className={navLinkClasses("/admin#roles")}> 
                      {React.cloneElement(ICONS.roles("w-4 h-4"), { className: `mr-1.5 sm:mr-2 w-4 h-4 ${getActiveIconColorClass("/admin#roles")}` })} Şifreler
                    </NavLink>
                    <NavLink to="/admin#logs" className={navLinkClasses("/admin#logs")}> {/* YENİ LOG LİNKİ */}
                      {React.cloneElement(ICONS.logs("w-4 h-4"), { className: `mr-1.5 sm:mr-2 w-4 h-4 ${getActiveIconColorClass("/admin#logs")}` })} Log Kayıtları
                    </NavLink>
                     <NavLink to="/admin#settings" className={navLinkClasses("/admin#settings")}>
                      {React.cloneElement(ICONS.settings("w-4 h-4"), { className: `mr-1.5 sm:mr-2 w-4 h-4 ${getActiveIconColorClass("/admin#settings")}` })} Ayarlar
                    </NavLink>
                  </>
                )}
                {(session?.role === UserRole.CASHIER || session?.role === UserRole.BARISTA) && (
                  <NavLink to="/cashier" className={navLinkClasses("/cashier")}>
                    {React.cloneElement(ICONS.cashier("w-4 h-4"), { className: `mr-1.5 sm:mr-2 w-4 h-4 ${getActiveIconColorClass("/cashier")}` })} Kasiyer
                  </NavLink>
                )}
                {session?.role === UserRole.KITCHEN && (
                  <NavLink to="/kitchen" className={navLinkClasses("/kitchen")}>
                    {React.cloneElement(ICONS.kitchen("w-4 h-4"), { className: `mr-1.5 sm:mr-2 w-4 h-4 ${getActiveIconColorClass("/kitchen")}` })} Mutfak
                  </NavLink>
                )}
                {session?.role === UserRole.WAITER && (
                  <NavLink to="/waiter" className={navLinkClasses("/waiter")}>
                    {React.cloneElement(ICONS.waiter("w-4 h-4"), { className: `mr-1.5 sm:mr-2 w-4 h-4 ${getActiveIconColorClass("/waiter")}` })} Garson
                  </NavLink>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center self-center md:self-auto"> {/* Ensure right side aligns well */}
            <Button onClick={toggleTheme} variant="ghost" size="sm" className="mr-1 sm:mr-2 p-1.5 sm:p-2 !shadow-none" aria-label={theme === 'light' ? 'Koyu Moda Geç' : 'Açık Moda Geç'}>
                {theme === 'light' ? ICONS.moon('w-5 h-5') : ICONS.sun('w-5 h-5')}
            </Button>
            {session && (
              <div className="flex items-center">
                <span className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm mr-2 sm:mr-3 hidden sm:inline">
                  Hoş geldin, {session.fullName}
                </span>
                <Button onClick={handleLogout} variant="outline" size="sm" leftIcon={ICONS.logout("w-4 h-4")} className="!px-2 sm:!px-3 !py-1 sm:!py-1.5">
                  <span className="hidden sm:inline">Çıkış Yap</span>
                  <span className="sm:hidden">Çıkış</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;