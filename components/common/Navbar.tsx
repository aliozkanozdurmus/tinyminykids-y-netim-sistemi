import React, { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext, UserRole } from '../../contexts/AuthContext';
import { ThemeContext } from '../../contexts/ThemeContext';
import { ICONS, ROLE_DISPLAY_NAMES } from '../../constants';
import Button from '../shared/Button';

const Navbar: React.FC = () => {
  const authContext = useContext(AuthContext);
  const themeContext = useContext(ThemeContext);
  const navigate = useNavigate();

  if (!authContext || !themeContext) return null;
  const { session, logout } = authContext;
  const { theme, toggleTheme } = themeContext;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinkClasses = ({ isActive }: {isActive: boolean}) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? 'bg-primary-DEFAULT text-white'
        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
    }`;

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <NavLink to="/" className="flex-shrink-0">
              <img src="https://stinvenireaz084550184237.blob.core.windows.net/invenirecomtr-website/logo-compressed.png" alt="TinyMinyKids Logo" className="h-10 w-auto" />
            </NavLink>
            <div className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4">
                {session?.role === UserRole.ADMIN && (
                  <>
                    <NavLink to="/admin/dashboard" className={navLinkClasses}>
                      {ICONS.dashboard("inline-block mr-1 w-4 h-4")} Kontrol Paneli
                    </NavLink>
                    <NavLink to="/admin/products" className={navLinkClasses}>
                      {ICONS.products("inline-block mr-1 w-4 h-4")} Ürünler
                    </NavLink>
                     <NavLink to="/admin/tables" className={navLinkClasses}>
                      {ICONS.table("inline-block mr-1 w-4 h-4")} Masa Yönetimi
                    </NavLink>
                    <NavLink to="/admin/roles" className={navLinkClasses}> 
                      {ICONS.roles("inline-block mr-1 w-4 h-4")} Rol Şifreleri
                    </NavLink>
                     <NavLink to="/admin/settings" className={navLinkClasses}>
                      {ICONS.settings("inline-block mr-1 w-4 h-4")} Ayarlar
                    </NavLink>
                  </>
                )}
                {(session?.role === UserRole.CASHIER || session?.role === UserRole.BARISTA) && (
                  <NavLink to="/cashier" className={navLinkClasses}>
                    {ICONS.cashier("inline-block mr-1 w-4 h-4")} Kasiyer
                  </NavLink>
                )}
                {/* Add specific link for Barista if needed:
                {session?.role === UserRole.BARISTA && (
                  <NavLink to="/barista" className={navLinkClasses}> // Example
                    {ICONS.barista("inline-block mr-1 w-4 h-4")} Barista
                  </NavLink>
                )}
                */}
                {session?.role === UserRole.KITCHEN && (
                  <NavLink to="/kitchen" className={navLinkClasses}>
                    {ICONS.kitchen("inline-block mr-1 w-4 h-4")} Mutfak
                  </NavLink>
                )}
                {session?.role === UserRole.WAITER && (
                  <NavLink to="/waiter" className={navLinkClasses}>
                    {ICONS.waiter("inline-block mr-1 w-4 h-4")} Garson
                  </NavLink>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center">
            <Button onClick={toggleTheme} variant="ghost" size="sm" className="mr-2 p-2">
                {theme === 'light' ? ICONS.moon('w-5 h-5') : ICONS.sun('w-5 h-5')}
            </Button>
            {session && (
              <div className="flex items-center">
                <span className="text-gray-700 dark:text-gray-300 text-sm mr-3">
                  Hoşgeldin, {session.displayName}
                </span>
                <Button onClick={handleLogout} variant="outline" size="sm" leftIcon={ICONS.logout()}>
                  Çıkış Yap
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