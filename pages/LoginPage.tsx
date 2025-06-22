
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthContext, UserRole } from '../contexts/AuthContext';
import { ThemeContext } from '../contexts/ThemeContext';
import Input from '../components/shared/Input';
import Button from '../components/shared/Button';
import Modal from '../components/shared/Modal';
import { ICONS, ROLE_DISPLAY_NAMES, DEFAULT_LOGO_URL } from '../constants';

const LoginPage: React.FC = () => {
  const [selectedRoleForPassword, setSelectedRoleForPassword] = useState<UserRole | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  
  const authContext = useContext(AuthContext);
  const themeContext = useContext(ThemeContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (authContext?.session) {
      // Navigate to default page based on role if already logged in
      switch (authContext.session.role) {
        case UserRole.ADMIN: navigate('/admin'); break;
        case UserRole.CASHIER: navigate('/cashier'); break;
        case UserRole.KITCHEN: navigate('/kitchen'); break;
        case UserRole.WAITER: navigate('/waiter'); break;
        case UserRole.BARISTA: navigate('/cashier'); break; 
        default: navigate('/'); 
      }
    }
  }, [authContext?.session, navigate]);

  if (!authContext || !themeContext) {
    return <div className="flex items-center justify-center min-h-screen">Context not available.</div>;
  }
  const { login, isLoading: authLoading } = authContext;
  const { appName, logoUrl, passwordProtectionActive } = themeContext;

  const handleRoleSelect = async (role: UserRole) => {
    setSelectedRoleForPassword(role); // Store for password modal if needed
    setPassword('');
    setError('');

    if (role !== UserRole.ADMIN) {
        // For non-admin roles, navigate to user selection page
        const rolePath = role.toString().toLowerCase();
        navigate(`/select-user/${rolePath}`);
        return;
    }
    
    // Admin role logic
    if (!passwordProtectionActive) { 
      const success = await login(UserRole.ADMIN, "__SIFRE_AC_DISABLED_VIA_ADMIN_PANEL__"); 
      if (!success) {
        setError('Yönetici girişi yapılamadı. Lütfen sistem yöneticisi ile iletişime geçin.');
      }
    } else {
      setIsPasswordModalOpen(true);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoleForPassword) return; // Should only be admin at this point
    setError('');
    const success = await login(selectedRoleForPassword, password); // selectedRoleForPassword should be 'admin'
    if (success) {
      setIsPasswordModalOpen(false);
    } else {
      setError('Şifre hatalı. Lütfen tekrar deneyin.');
    }
  };

  const loginRoles = [
    { role: UserRole.ADMIN, label: ROLE_DISPLAY_NAMES[UserRole.ADMIN], icon: ICONS.user("w-10 h-10") },
    { role: UserRole.CASHIER, label: ROLE_DISPLAY_NAMES[UserRole.CASHIER], icon: ICONS.cashier("w-10 h-10") },
    { role: UserRole.BARISTA, label: ROLE_DISPLAY_NAMES[UserRole.BARISTA], icon: ICONS.barista("w-10 h-10") },
    { role: UserRole.WAITER, label: ROLE_DISPLAY_NAMES[UserRole.WAITER], icon: ICONS.waiter("w-10 h-10") },
    { role: UserRole.KITCHEN, label: ROLE_DISPLAY_NAMES[UserRole.KITCHEN], icon: ICONS.kitchen("w-10 h-10") },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-light via-primary-DEFAULT to-primary-dark p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-xl bg-white dark:bg-gray-800 p-6 sm:p-10 rounded-xl shadow-2xl"
      >
        <div className="text-center mb-8">
          <img 
            src={logoUrl || DEFAULT_LOGO_URL} 
            alt={`${appName} Logo`} 
            className="h-16 sm:h-20 mx-auto mb-4 w-auto" 
            onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_LOGO_URL; }}
          />
          <h1 className="text-3xl sm:text-4xl font-bold text-primary-DEFAULT dark:text-primary-light">{appName}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm sm:text-base">
            Lütfen rolünüzü seçerek devam edin.
            {!passwordProtectionActive && ( 
              <span className="block text-xs text-yellow-600 dark:text-yellow-400 mt-1">(Şifre koruması yönetici panelinden kapatıldı)</span>
            )}
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {loginRoles.map(({ role, label, icon }) => (
            <motion.div 
              key={role} 
              whileHover={{ scale: 1.03, y: -2 }} 
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
            >
              <button
                onClick={() => handleRoleSelect(role)}
                className="w-full h-36 sm:h-40 p-4 bg-gray-50 dark:bg-gray-700/60 rounded-lg shadow-md hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-DEFAULT focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800 flex flex-col items-center justify-center text-center transition-all duration-200 ease-in-out group"
              >
                <div className="mb-2 text-primary-DEFAULT dark:text-primary-light group-hover:scale-110 transition-transform duration-200">
                  {React.cloneElement(icon, { className: "w-10 h-10 sm:w-12 sm:h-12"})}
                </div>
                <span className="font-semibold text-gray-700 dark:text-gray-200 text-sm sm:text-base group-hover:text-primary-DEFAULT dark:group-hover:text-primary-light transition-colors">{label}</span>
              </button>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <a
            href={`mailto:ali.ozdurmus1@gmail.com?subject=Destek Talebi - ${appName}`}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-DEFAULT dark:hover:text-primary-light hover:underline flex items-center justify-center"
          >
            {ICONS.mail("w-4 h-4 mr-1.5")} Destek
          </a>
        </div>
        
      </motion.div>

      {selectedRoleForPassword === UserRole.ADMIN && isPasswordModalOpen && passwordProtectionActive && (
        <Modal
          isOpen={isPasswordModalOpen}
          onClose={() => setIsPasswordModalOpen(false)}
          title={`${ROLE_DISPLAY_NAMES[UserRole.ADMIN]} Şifresi`}
          size="sm"
          titleIcon={ICONS.lock("w-5 h-5")}
        >
          <form onSubmit={handlePasswordSubmit} className="space-y-4 pt-2">
            <Input
              label="Şifre"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={ICONS.lock()}
              placeholder="Şifrenizi girin"
              required
              autoFocus
            />
            {error && <p className="text-sm text-red-500 dark:text-red-400 text-center -mt-2">{error}</p>}
            <Button type="submit" isLoading={authLoading} className="w-full mt-2" size="lg">
              Giriş Yap
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default LoginPage;
