
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthContext, UserRole } from '../contexts/AuthContext';
import Input from '../components/shared/Input';
import Button from '../components/shared/Button';
import Modal from '../components/shared/Modal';
import { ICONS, APP_NAME, ROLE_DISPLAY_NAMES } from '../constants';
import { apiService } from '../services/apiService'; // Import apiService

const LoginPage: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isPasswordProtectionActive, setIsPasswordProtectionActive] = useState(true); // Default to true, will be updated
  
  const authContext = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    // Check password protection status on component mount
    setIsPasswordProtectionActive(apiService.isPasswordAuthActive());
  }, []);


  useEffect(() => {
    if (authContext?.session) {
      switch (authContext.session.role) {
        case UserRole.ADMIN: navigate('/admin'); break;
        case UserRole.CASHIER: navigate('/cashier'); break;
        case UserRole.KITCHEN: navigate('/kitchen'); break;
        case UserRole.WAITER: navigate('/waiter'); break;
        case UserRole.BARISTA: navigate('/cashier'); break; // Or /barista if separate page
        default: navigate('/');
      }
    }
  }, [authContext, navigate]);

  if (!authContext) {
    return <div>Auth context not available.</div>;
  }
  const { login, isLoading } = authContext;

  const handleRoleSelect = async (role: UserRole) => {
    setSelectedRole(role);
    setPassword(''); // Clear password field regardless
    setError('');

    if (!isPasswordProtectionActive) { // SIFRE_AC=0 or not set
      const success = await login(role, "__SIFRE_AC_DISABLED__"); // Pass a special value or empty string
      if (success && authContext.session) {
        // Navigation is handled by useEffect above
      } else {
        setError('Giriş yapılamadı. Lütfen sistem yöneticisi ile iletişime geçin.');
      }
    } else { // SIFRE_AC=1, password protection is active
      setIsPasswordModalOpen(true);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    setError('');
    const success = await login(selectedRole, password);
    if (success && authContext.session) {
      setIsPasswordModalOpen(false);
      // Navigation is handled by useEffect above or App.tsx routing
    } else {
      setError('Şifre hatalı. Lütfen tekrar deneyin.');
    }
  };

  const loginRoles = [
    { role: UserRole.ADMIN, label: ROLE_DISPLAY_NAMES[UserRole.ADMIN], icon: ICONS.user },
    { role: UserRole.CASHIER, label: ROLE_DISPLAY_NAMES[UserRole.CASHIER], icon: ICONS.cashier },
    { role: UserRole.BARISTA, label: ROLE_DISPLAY_NAMES[UserRole.BARISTA], icon: ICONS.barista },
    { role: UserRole.WAITER, label: ROLE_DISPLAY_NAMES[UserRole.WAITER], icon: ICONS.waiter },
    { role: UserRole.KITCHEN, label: ROLE_DISPLAY_NAMES[UserRole.KITCHEN], icon: ICONS.kitchen },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-light via-primary-DEFAULT to-primary-dark p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl"
      >
        <div className="text-center mb-8">
          <img src="https://stinvenireaz084550184237.blob.core.windows.net/invenirecomtr-website/logo-compressed.png" alt="TinyMinyKids Logo" className="h-20 mx-auto mb-4 w-auto" />
          <h1 className="text-3xl font-bold text-primary-DEFAULT dark:text-primary-light">{APP_NAME}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Lütfen rolünüzü seçerek giriş yapın.
            {!isPasswordProtectionActive && (
              <span className="block text-sm text-yellow-600 dark:text-yellow-400 mt-1">(Şifre koruması kapalı)</span>
            )}
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {loginRoles.map(({ role, label, icon }) => (
            <motion.div key={role} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => handleRoleSelect(role)}
                variant="outline"
                size="lg"
                className="w-full py-4 flex flex-col items-center justify-center !text-lg h-32 sm:h-36"
              >
                <div className="mb-2">{icon("w-8 h-8 text-primary-DEFAULT dark:text-primary-light")}</div>
                <span>{label}</span>
              </Button>
            </motion.div>
          ))}
        </div>
        
      </motion.div>

      {selectedRole && isPasswordModalOpen && isPasswordProtectionActive && (
        <Modal
          isOpen={isPasswordModalOpen}
          onClose={() => setIsPasswordModalOpen(false)}
          title={`${ROLE_DISPLAY_NAMES[selectedRole]} Şifresi`}
          size="sm"
        >
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
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
            <Button type="submit" isLoading={isLoading} className="w-full" size="lg">
              Giriş Yap
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default LoginPage;
