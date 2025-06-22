import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../../types';
import Input from '../shared/Input';
import Button from '../shared/Button';
import { ICONS, ROLE_DISPLAY_NAMES, DEFAULT_IMAGE_URL } from '../../constants';

interface UserFormProps {
  onSubmit: (userData: Partial<User> & { password_plain?: string }) => Promise<void>;
  initialData?: User | null;
  onCancel: () => void;
  isLoading?: boolean;
}

// Admin rolü hariç diğer roller
const assignableRoles = Object.values(UserRole).filter(role => role !== UserRole.ADMIN);

const UserForm: React.FC<UserFormProps> = ({ onSubmit, initialData, onCancel, isLoading }) => {
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [title, setTitle] = useState('');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.CASHIER); // Default role
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [showPasswordFields, setShowPasswordFields] = useState(!initialData); // Show by default on create

  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (initialData) {
      setUsername(initialData.username);
      setFullName(initialData.fullName);
      setTitle(initialData.title || '');
      setProfilePhotoUrl(initialData.profilePhotoUrl || '');
      setRole(initialData.role);
      setIsActive(initialData.isActive);
      setShowPasswordFields(false); // Hide password fields by default on edit
    } else {
      // Reset form for new user
      setUsername('');
      setFullName('');
      setTitle('');
      setProfilePhotoUrl('');
      setRole(UserRole.CASHIER);
      setPassword('');
      setConfirmPassword('');
      setIsActive(true);
      setShowPasswordFields(true);
    }
    setUsernameError('');
    setPasswordError('');
  }, [initialData]);

  const validateUsername = () => {
    if (!username.trim()) {
      setUsernameError('Kullanıcı adı zorunludur.');
      return false;
    }
    if (username.trim().length < 3) {
      setUsernameError('Kullanıcı adı en az 3 karakter olmalıdır.');
      return false;
    }
    setUsernameError('');
    return true;
  };

  const validatePassword = () => {
    if (!showPasswordFields) return true; // Don't validate if not changing/setting

    if (!password) {
      setPasswordError('Şifre zorunludur.');
      return false;
    }
    if (password.length < 4) {
      setPasswordError('Şifre en az 4 karakter olmalıdır.');
      return false;
    }
    if (password !== confirmPassword) {
      setPasswordError('Şifreler eşleşmiyor.');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isUsernameValid = validateUsername();
    const isPasswordValid = validatePassword();

    if (!isUsernameValid || !isPasswordValid || !fullName.trim()) {
        alert("Lütfen tüm zorunlu alanları doğru bir şekilde doldurun.");
      return;
    }

    const userData: Partial<User> & { password_plain?: string } = {
      username: username.trim(),
      fullName: fullName.trim(),
      title: title.trim() || undefined,
      profilePhotoUrl: profilePhotoUrl.trim() || undefined,
      role,
      isActive,
    };

    if (showPasswordFields && password) {
      userData.password_plain = password;
    }
    
    // If it's an update, pass the ID along with other data
    if (initialData?.id) {
        userData.id = initialData.id;
    }

    onSubmit(userData);
  };
  
  const handleProfilePhotoError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    (e.target as HTMLImageElement).src = DEFAULT_IMAGE_URL;
    (e.target as HTMLImageElement).alt = "Profil fotoğrafı yüklenemedi";
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
        <Input
          label="Kullanıcı Adı"
          name="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onBlur={validateUsername}
          placeholder="Örn: aysekasa01"
          required
          disabled={!!initialData} // Username cannot be changed after creation
          error={usernameError}
          leftIcon={ICONS.user("w-4 h-4")}
        />
        <Input
          label="Ad Soyad"
          name="fullName"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Örn: Ayşe Kasa"
          required
          leftIcon={ICONS.identification("w-4 h-4")}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
        <Input
          label="Ünvan (Opsiyonel)"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Örn: Vardiya Amiri"
        />
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Rol
          </label>
          <div className="relative">
            <select
              id="role"
              name="role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              required
              className="appearance-none w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:border-gray-400 px-4 py-2.5 pr-8 rounded-lg shadow-sm leading-tight focus:outline-none focus:ring-2 focus:ring-primary-DEFAULT/40 focus:border-primary-DEFAULT text-gray-700 dark:text-gray-200"
            >
              {assignableRoles.map(r => (
                <option key={r} value={r}>{ROLE_DISPLAY_NAMES[r] || r}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                {ICONS.chevronDown("w-5 h-5")}
            </div>
          </div>
        </div>
      </div>
      
      <Input
        label="Profil Fotoğrafı URL (Opsiyonel)"
        name="profilePhotoUrl"
        value={profilePhotoUrl}
        onChange={(e) => setProfilePhotoUrl(e.target.value)}
        placeholder="https://example.com/photo.jpg"
        leftIcon={ICONS.image("w-4 h-4")}
      />
      {profilePhotoUrl && (
        <div className="mt-2 pl-2">
            <img 
                src={profilePhotoUrl} 
                alt="Profil Önizlemesi" 
                className="h-16 w-16 rounded-full object-cover border border-gray-300 dark:border-gray-600"
                onError={handleProfilePhotoError}
            />
        </div>
      )}

      {initialData && (
        <div className="flex items-center mt-4">
          <input
            id="changePassword"
            name="changePassword"
            type="checkbox"
            checked={showPasswordFields}
            onChange={(e) => {
                setShowPasswordFields(e.target.checked);
                if (!e.target.checked) {
                    setPassword('');
                    setConfirmPassword('');
                    setPasswordError('');
                }
            }}
            className="h-4 w-4 text-primary-DEFAULT border-gray-300 dark:border-gray-600 rounded focus:ring-primary-DEFAULT"
          />
          <label htmlFor="changePassword" className="ml-2 block text-sm text-gray-800 dark:text-gray-200">
            Şifreyi Değiştir
          </label>
        </div>
      )}

      {showPasswordFields && (
        <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
                {initialData ? "Yeni şifreyi girin." : "Kullanıcı için bir şifre belirleyin."} (Minimum 4 karakter)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                <Input
                    label="Şifre"
                    name="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={validatePassword}
                    placeholder="Şifre"
                    required={showPasswordFields} 
                    error={passwordError && (password || confirmPassword) ? passwordError : ''} 
                    leftIcon={ICONS.lock("w-4 h-4")}
                />
                <Input
                    label="Şifre Tekrarı"
                    name="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onBlur={validatePassword}
                    placeholder="Şifreyi tekrar girin"
                    required={showPasswordFields}
                    error={passwordError && confirmPassword && password !== confirmPassword ? passwordError : ''}
                    leftIcon={ICONS.lock("w-4 h-4")}
                />
            </div>
        </div>
      )}
      

      <div className="flex items-center pt-2">
        <input
          id="isActive"
          name="isActive"
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="h-4 w-4 text-primary-DEFAULT border-gray-300 dark:border-gray-600 rounded focus:ring-primary-DEFAULT focus:ring-offset-white dark:focus:ring-offset-gray-800"
        />
        <label htmlFor="isActive" className="ml-2 block text-sm text-gray-800 dark:text-gray-200">
          Kullanıcı Aktif
        </label>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button type="button" variant="secondary" onClick={onCancel} size="md">İptal</Button>
        <Button type="submit" isLoading={isLoading} size="md">
          {initialData ? 'Kullanıcıyı Güncelle' : 'Kullanıcı Ekle'}
        </Button>
      </div>
    </form>
  );
};

export default UserForm;