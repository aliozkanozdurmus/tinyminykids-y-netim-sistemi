
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, UserRole } from '../types';
import { AuthContext } from '../contexts/AuthContext';
import { ThemeContext } from '../contexts/ThemeContext';
import { apiService } from '../services/apiService';
import Button from '../components/shared/Button';
import Input from '../components/shared/Input';
import Modal from '../components/shared/Modal';
import { ICONS, ROLE_DISPLAY_NAMES, DEFAULT_IMAGE_URL, DEFAULT_LOGO_URL } from '../constants';

const UserSelectionPage: React.FC = () => {
  const { role: roleParam } = useParams<{ role: string }>();
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  const themeContext = useContext(ThemeContext);

  const [users, setUsers] = useState<User[]>([]);
  const [passwordModalUser, setPasswordModalUser] = useState<User | null>(null); // User for whom modal is open
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const role = roleParam as UserRole | undefined;

  const fetchUsersForRole = useCallback(async () => {
    if (!role || !Object.values(UserRole).includes(role)) {
      setError('Geçersiz rol belirtildi.');
      setIsLoading(false);
      navigate('/login');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const fetchedUsers = await apiService.getUsers({ role, isActive: true });
      setUsers(fetchedUsers);
    } catch (err) {
      console.error(`Error fetching users for role ${role}:`, err);
      setError('Kullanıcılar yüklenirken bir hata oluştu.');
    }
    setIsLoading(false);
  }, [role, navigate]);

  useEffect(() => {
    fetchUsersForRole();
  }, [fetchUsersForRole]);

  useEffect(() => {
    // Navigate if session is established
    if (authContext?.session) {
      const roleToNavigate = authContext.session.role;
      switch (roleToNavigate) {
        case UserRole.ADMIN: navigate('/admin'); break;
        case UserRole.CASHIER: navigate('/cashier'); break;
        case UserRole.BARISTA: navigate('/cashier'); break;
        case UserRole.KITCHEN: navigate('/kitchen'); break;
        case UserRole.WAITER: navigate('/waiter'); break;
        default: navigate('/login'); // Should not happen if session is valid
      }
    }
  }, [authContext?.session, navigate]);

  if (!authContext || !themeContext) {
    return <div className="flex items-center justify-center min-h-screen">Context Yüklenemedi.</div>;
  }

  const { login, isLoading: authLoading } = authContext;
  const { appName, logoUrl, passwordProtectionActive } = themeContext;

  const handleUserSelect = async (user: User) => {
    setPassword(''); // Clear previous password input
    setError('');   // Clear previous errors

    if (!passwordProtectionActive || !user.hashedPassword) {
      // Direct login path: global protection off OR this user has no password
      const success = await login(user.id, "__SIFRE_AC_DISABLED_VIA_ADMIN_PANEL__");
      if (!success) {
        setError(passwordProtectionActive && !user.hashedPassword ? 'Giriş yapılamadı (kullanıcının şifresi yok). Lütfen sistem yöneticisi ile iletişime geçin.' : 'Giriş yapılamadı. Lütfen sistem yöneticisi ile iletişime geçin.');
      }
      // Navigation is handled by the useEffect watching authContext.session
    } else {
      // Password is required, set user for modal
      setPasswordModalUser(user);
    }
  };

  const handleModalClose = () => {
    setPasswordModalUser(null);
    setError('');
    setPassword('');
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalUser) return;
    setError('');
    const success = await login(passwordModalUser.id, password);
    if (success) {
      setPasswordModalUser(null); // Close modal on success, navigation useEffect will handle redirection
    } else {
      setError('Şifre hatalı. Lütfen tekrar deneyin.');
    }
  };
  
  const handleProfilePhotoError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    if (target.alt) { 
        target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(target.alt)}&background=random&color=fff&size=128`;
    } else {
        target.src = DEFAULT_IMAGE_URL; 
    }
    target.onerror = null; 
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] text-center p-4">
        <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-primary-DEFAULT mb-4"></div>
        <p className="text-lg text-gray-600 dark:text-gray-300">Kullanıcılar yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary-light via-primary-DEFAULT to-primary-dark p-4">
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-2xl bg-white dark:bg-gray-800 p-6 sm:p-10 rounded-xl shadow-2xl"
      >
        <button onClick={() => navigate('/login')} className="absolute top-4 left-4 text-gray-500 dark:text-gray-400 hover:text-primary-DEFAULT dark:hover:text-primary-light transition-colors">
          {ICONS.chevronDown("w-7 h-7 rotate-90")}
        </button>
        <div className="text-center mb-8">
          <img 
            src={logoUrl || DEFAULT_LOGO_URL} 
            alt={`${appName} Logo`} 
            className="h-16 mx-auto mb-3 w-auto" 
            onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_LOGO_URL; }}
          />
          <h1 className="text-2xl sm:text-3xl font-bold text-primary-DEFAULT dark:text-primary-light">
            Kullanıcı Seçimi: {role ? ROLE_DISPLAY_NAMES[role] : 'Bilinmeyen Rol'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">Lütfen hesabınızı seçin.</p>
          {error && !passwordModalUser && <p className="text-sm text-red-500 dark:text-red-400 mt-2">{error}</p>}
        </div>

        {users.length === 0 && !isLoading && (
            <div className="text-center py-6">
                <p className="text-gray-500 dark:text-gray-400">Bu rol için aktif kullanıcı bulunamadı.</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Yönetici panelinden kullanıcı ekleyebilirsiniz.</p>
            </div>
        )}

        <AnimatePresence>
          {users.length > 0 && (
            <motion.div 
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 max-h-[60vh] overflow-y-auto custom-scrollbar p-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ staggerChildren: 0.05 }}
            >
              {users.map((user) => (
                <motion.button
                  key={user.id}
                  onClick={() => handleUserSelect(user)}
                  className="p-3 bg-gray-50 dark:bg-gray-700/60 rounded-lg shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-DEFAULT focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800 flex flex-col items-center text-center transition-all duration-150 ease-in-out group"
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  whileHover={{ y: -3 }}
                >
                  <img
                    src={user.profilePhotoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=random&color=fff&size=96`}
                    alt={user.fullName}
                    onError={handleProfilePhotoError}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover mb-2 border-2 border-gray-200 dark:border-gray-600 group-hover:border-primary-light transition-colors"
                  />
                  <span className="font-semibold text-xs sm:text-sm text-gray-700 dark:text-gray-200 group-hover:text-primary-DEFAULT dark:group-hover:text-primary-light transition-colors truncate w-full" title={user.fullName}>
                    {user.fullName}
                  </span>
                  {user.title && <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate w-full" title={user.title}>{user.title}</span>}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {passwordModalUser && (
        <Modal
          isOpen={!!passwordModalUser}
          onClose={handleModalClose}
          title={`${passwordModalUser.fullName} Şifresi`}
          size="sm"
          titleIcon={ICONS.lock("w-5 h-5")}
        >
          <form onSubmit={handlePasswordSubmit} className="space-y-4 pt-2">
            <div className="flex flex-col items-center mb-3">
                 <img
                    src={passwordModalUser.profilePhotoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(passwordModalUser.fullName)}&background=random&color=fff&size=96`}
                    alt={passwordModalUser.fullName}
                    onError={handleProfilePhotoError}
                    className="w-20 h-20 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600"
                  />
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{passwordModalUser.title || ROLE_DISPLAY_NAMES[passwordModalUser.role]}</p>
            </div>
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

export default UserSelectionPage;
