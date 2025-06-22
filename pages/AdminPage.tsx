import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import saveAs from 'file-saver'; 
import { Product, UserRole, Order, OrderStatus, ThemeSettings, TableConfiguration, CurrencyCode, User, LogEntry, LogActionType } from '../types';
import { apiService } from '../services/apiService';
import Button from '../components/shared/Button';
import Modal from '../components/shared/Modal';
import ProductForm from '../components/admin/ProductForm';
import UserForm from '../components/admin/UserForm';
import Input from '../components/shared/Input'; 
import { ICONS, AVAILABLE_ACCENT_COLORS, ROLE_DISPLAY_NAMES, DEFAULT_IMAGE_URL, DEFAULT_TABLE_NAMES, CURRENCIES, formatPrice, DEFAULT_LOGO_URL, APP_NAME as DEFAULT_APP_NAME, LogActionTypeStrings } from '../constants';
import { ThemeContext } from '../contexts/ThemeContext';
import { AuthContext } from '../contexts/AuthContext';
import TableManagement from '../components/admin/TableManagement';


// Section Wrapper for consistent styling
const AdminSection: React.FC<{title: string, icon?: React.ReactNode, children: React.ReactNode, actions?: React.ReactNode, className?: string}> = ({ title, icon, children, actions, className="" }) => (
  <div className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg ${className}`}>
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
      <div className="flex items-center">
        {icon && <span className="mr-3 text-primary-DEFAULT text-2xl">{icon}</span>}
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">{title}</h2>
      </div>
      {actions && <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto mt-3 sm:mt-0">{actions}</div>}
    </div>
    {children}
  </div>
);

// Feedback Message Component
const FeedbackDisplay: React.FC<{message: {type: 'success' | 'error', text: string} | null}> = ({message}) => {
  if (!message) return null;
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`p-3.5 mb-5 rounded-lg text-sm flex items-center shadow ${message.type === 'success' ? 'bg-green-50 dark:bg-green-700/30 text-green-700 dark:text-green-200 border border-green-200 dark:border-green-600' : 'bg-red-50 dark:bg-red-700/30 text-red-700 dark:text-red-200 border border-red-200 dark:border-red-600'}`}
    >
      {message.type === 'success' ? ICONS.checkCircle("w-5 h-5 mr-2") : ICONS.xCircle("w-5 h-5 mr-2")}
      {message.text}
    </motion.div>
  );
};


// Product Management Component
const ProductManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const themeContext = useContext(ThemeContext);

  const fetchProducts = useCallback(async () => {
    setIsDataLoading(true);
    setFeedbackMessage(null);
    const data = await apiService.getProducts();
    setProducts(data.sort((a,b) => a.name.localeCompare(b.name)));
    setIsDataLoading(false);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleFormSubmit = async (productData: Omit<Product, 'id'>) => {
    setIsFormSubmitting(true);
    setFeedbackMessage(null);
    try {
        const numericPrice = typeof productData.price === 'string' ? parseFloat(productData.price) : productData.price;
        if (isNaN(numericPrice)) {
            setFeedbackMessage({ type: 'error', text: 'Geçersiz fiyat formatı.'});
            setIsFormSubmitting(false);
            return;
        }
        const finalProductData = { ...productData, price: numericPrice };

        if (editingProduct) {
          await apiService.updateProduct(editingProduct.id, finalProductData);
          setFeedbackMessage({type: 'success', text: `"${finalProductData.name}" başarıyla güncellendi.`});
        } else {
          await apiService.addProduct(finalProductData);
          setFeedbackMessage({type: 'success', text: `"${finalProductData.name}" başarıyla eklendi.`});
        }
        await fetchProducts();
        setIsModalOpen(false);
        setEditingProduct(null);
    } catch (error) {
        console.error("Error submitting product form:", error);
        setFeedbackMessage({type: 'error', text: 'İşlem sırasında bir hata oluştu.'});
    }
    setIsFormSubmitting(false);
  };

  const handleDelete = async (productToDelete: Product) => {
    if (window.confirm(`"${productToDelete.name}" adlı ürünü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`)) {
      setIsDataLoading(true); 
      setFeedbackMessage(null);
      try {
        await apiService.deleteProduct(productToDelete.id);
        setFeedbackMessage({type: 'success', text: `"${productToDelete.name}" başarıyla silindi.`});
        await fetchProducts();
      } catch (error) {
        console.error("Error deleting product:", error);
        setFeedbackMessage({type: 'error', text: 'Ürün silinirken bir hata oluştu.'});
      }
      setIsDataLoading(false);
    }
  };

  const handleExportProducts = async () => {
    if (!themeContext) return;
    setIsDataLoading(true);
    setFeedbackMessage(null);
    try {
        const productsToExport = await apiService.getProducts();
        const priceHeader = `Fiyat (${themeContext.currency})`;
        const worksheetData = productsToExport.map(p => ({
            "Ürün Adı": p.name,
            [priceHeader]: p.price,
            "Kategori": p.category,
            "Görsel URL": p.imageUrl || '',
            "Açıklama": p.description || '',
            "Satışta mı?": p.isAvailable ? 'Evet' : 'Hayır' 
        }));

        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Ürünler");
        
        const cols = [ {wch: 30}, {wch: 15}, {wch: 25}, {wch: 40}, {wch: 50}, {wch: 15} ];
        worksheet['!cols'] = cols;

        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const dataBlob = new Blob([excelBuffer], {type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8"});
        saveAs(dataBlob, "urun-listesi.xlsx");
        setFeedbackMessage({type: 'success', text: 'Ürünler başarıyla Excel\'e aktarıldı.'});
        await apiService.addLogEntry(LogActionType.PRODUCTS_EXPORTED, `${productsToExport.length} ürün Excel'e aktarıldı.`);
    } catch (error) {
        console.error("Error exporting products:", error);
        setFeedbackMessage({type: 'error', text: 'Ürünler dışa aktarılırken bir hata oluştu.'});
    }
    setIsDataLoading(false);
  };

  const handleImportFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleImportProducts = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsDataLoading(true);
    setFeedbackMessage(null);
    let importedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    try {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);

                if (jsonData.length === 0) {
                    setFeedbackMessage({type: 'error', text: 'Excel dosyası boş veya beklenen formatta değil.'});
                    setIsDataLoading(false);
                    return;
                }
                const priceHeaderKey = Object.keys(jsonData[0]).find(key => key.toLowerCase().startsWith("fiyat"));


                for (const row of jsonData) {
                    const name = row["Ürün Adı"]?.toString().trim();
                    const priceStr = priceHeaderKey ? row[priceHeaderKey]?.toString().trim() : row["Fiyat (TL)"]?.toString().trim();
                    const category = row["Kategori"]?.toString().trim();

                    if (!name || !priceStr || !category) {
                        errors.push(`Satır atlandı: "Ürün Adı", "Fiyat" ve "Kategori" alanları zorunludur. Satır: ${JSON.stringify(row)}`);
                        errorCount++;
                        continue;
                    }
                    
                    const price = parseFloat(priceStr.replace(',', '.'));
                    if (isNaN(price) || price <= 0) {
                        errors.push(`Satır atlandı (${name}): Fiyat geçerli bir pozitif sayı olmalıdır. Değer: '${priceStr}'`);
                        errorCount++;
                        continue;
                    }

                    let isAvailable = true; 
                    const availableStr = row["Satışta mı?"]?.toString().toLowerCase().trim();
                    if (['false', 'hayır', 'no', '0'].includes(availableStr)) {
                        isAvailable = false;
                    }
                    
                    const productData: Omit<Product, 'id'> = {
                        name,
                        price,
                        category,
                        imageUrl: row["Görsel URL"]?.toString().trim() || undefined,
                        description: row["Açıklama"]?.toString().trim() || undefined,
                        isAvailable,
                    };

                    try {
                        await apiService.addProduct(productData); 
                        importedCount++;
                    } catch (addError) {
                        errors.push(`Ürün eklenemedi (${name}): ${addError instanceof Error ? addError.message : String(addError)}`);
                        errorCount++;
                    }
                }

                let summary = `${importedCount} ürün başarıyla içe aktarıldı.`;
                if (errorCount > 0) {
                    summary += ` ${errorCount} ürün/satır hatalıydı.`;
                    console.warn("Import errors:", errors);
                     setFeedbackMessage({type: 'error', text: `${summary} Detaylar için konsolu kontrol edin.`});
                } else {
                     setFeedbackMessage({type: 'success', text: summary});
                }
                await apiService.addLogEntry(LogActionType.PRODUCTS_IMPORTED, `Excel'den içe aktarma: ${importedCount} başarılı, ${errorCount} hatalı.`);
                await fetchProducts();

            } catch (parseError) {
                console.error("Error processing Excel file:", parseError);
                setFeedbackMessage({type: 'error', text: 'Excel dosyası işlenirken bir hata oluştu. Sütun başlıklarını kontrol edin.'});
                 await apiService.addLogEntry(LogActionType.PRODUCTS_IMPORTED, `Excel'den içe aktarma başarısız: Dosya işleme hatası.`);
            } finally {
                setIsDataLoading(false);
                if(fileInputRef.current) fileInputRef.current.value = ""; 
            }
        };
        reader.readAsArrayBuffer(file);
    } catch (error) {
        console.error("Error importing products:", error);
        setFeedbackMessage({type: 'error', text: 'Ürünler içe aktarılırken bir hata oluştu.'});
        await apiService.addLogEntry(LogActionType.PRODUCTS_IMPORTED, `Excel'den içe aktarma başarısız: Genel hata.`);
        setIsDataLoading(false);
        if(fileInputRef.current) fileInputRef.current.value = ""; 
    }
  };

  const productActions = (
    <>
      <Button onClick={() => { setEditingProduct(null); setIsModalOpen(true); setFeedbackMessage(null); }} leftIcon={ICONS.add("w-4 h-4")} size="md">
        Yeni Ürün
      </Button>
      <input type="file" ref={fileInputRef} onChange={handleImportProducts} accept=".xlsx, .xls" style={{ display: 'none' }} />
      <Button onClick={handleImportFileSelect} leftIcon={ICONS.upload("w-4 h-4")} variant="outline" size="md" isLoading={isDataLoading && !!fileInputRef.current?.files?.length}>
        Excel'den İçe Aktar
      </Button>
      <Button onClick={handleExportProducts} leftIcon={ICONS.download("w-4 h-4")} variant="outline" size="md" isLoading={isDataLoading && !fileInputRef.current?.files?.length}>
        Excel'e Aktar
      </Button>
    </>
  );

  return (
    <AdminSection title="Ürün Yönetimi" icon={ICONS.products()} actions={productActions}>
      <FeedbackDisplay message={feedbackMessage} />
      {isDataLoading && products.length === 0 ? (
        <div className="flex justify-center items-center py-10">
          <div className="w-8 h-8 border-2 border-dashed rounded-full animate-spin border-primary-DEFAULT"></div>
          <p className="ml-3 text-gray-500 dark:text-gray-400">Ürünler yükleniyor...</p>
        </div>
      ) : (
      <div className="overflow-x-auto shadow-md rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ad</th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Kategori</th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fiyat</th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Durum</th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">İşlemler</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {products.map((product) => (
              <motion.tr 
                key={product.id} 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                transition={{ duration: 0.2 }}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                            {product.imageUrl && product.imageUrl !== DEFAULT_IMAGE_URL ? (
                                <img className="h-10 w-10 rounded-full object-cover border border-gray-200 dark:border-gray-700" src={product.imageUrl} alt={product.name} onError={(e) => (e.currentTarget.src = DEFAULT_IMAGE_URL)} />
                            ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center border border-gray-200 dark:border-gray-600">
                                   {ICONS.products("w-5 h-5 text-gray-400 dark:text-gray-500")}
                                </div>
                            )}
                        </div>
                        <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{product.name}</div>
                        </div>
                    </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{product.category}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {themeContext ? formatPrice(product.price, themeContext.currency) : `${product.price.toFixed(2)} TL`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    product.isAvailable ? 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100'
                  }`}>
                    {product.isAvailable ? 'Satışta' : 'Satış Dışı'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => { setEditingProduct(product); setIsModalOpen(true); setFeedbackMessage(null); }} className="p-1.5" title="Düzenle">{ICONS.edit("w-4 h-4")}</Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(product)} className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1.5" title="Sil">{ICONS.delete("w-4 h-4")}</Button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
      {!isDataLoading && products.length === 0 && !feedbackMessage && (
        <p className="text-center py-8 text-gray-500 dark:text-gray-400">Henüz ürün eklenmemiş. "Yeni Ürün" butonu ile başlayın!</p>
      )}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingProduct(null); }} 
        title={editingProduct ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}
        titleIcon={editingProduct ? ICONS.edit("w-5 h-5") : ICONS.add("w-5 h-5")}
        size="2xl"
      >
        <ProductForm 
            onSubmit={handleFormSubmit} 
            initialData={editingProduct} 
            onCancel={() => { setIsModalOpen(false); setEditingProduct(null); }}
            isLoading={isFormSubmitting}
        />
      </Modal>
    </AdminSection>
  );
};


// User Management Component
const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userFeedbackMessage, setUserFeedbackMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  
  const fetchUsers = useCallback(async () => {
    setIsDataLoading(true);
    setUserFeedbackMessage(null);
    try {
        const data = await apiService.getUsers();
        setUsers(data.filter(u => u.role !== UserRole.ADMIN).sort((a,b) => a.fullName.localeCompare(b.fullName)));
    } catch (error) {
        console.error("Error fetching users:", error);
        setUserFeedbackMessage({type: 'error', text: 'Kullanıcılar yüklenirken bir hata oluştu.'});
    }
    setIsDataLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleUserFormSubmit = async (userData: Partial<User> & { password_plain?: string }) => {
    setIsFormSubmitting(true);
    setUserFeedbackMessage(null);
    try {
      if (editingUser) {
        const updatedUser = await apiService.updateUser(editingUser.id, userData); 
        if (updatedUser) {
          setUserFeedbackMessage({type: 'success', text: `"${updatedUser.fullName}" başarıyla güncellendi.`});
        } else {
            throw new Error("Kullanıcı güncellenemedi.");
        }
      } else {
        if (userData.role === UserRole.ADMIN) {
            throw new Error("Admin rolü bu arayüzden atanamaz.");
        }
        const newUser = await apiService.addUser(userData as Omit<User, 'id' | 'createdAt' | 'hashedPassword'> & { password_plain?: string }); 
        setUserFeedbackMessage({type: 'success', text: `"${newUser.fullName}" başarıyla eklendi.`});
      }
      await fetchUsers();
      setIsUserModalOpen(false);
      setEditingUser(null);
    } catch (error) {
      console.error("Error submitting user form:", error);
      setUserFeedbackMessage({type: 'error', text: `İşlem sırasında bir hata oluştu: ${error instanceof Error ? error.message : String(error)}`});
    }
    setIsFormSubmitting(false);
  };

  const handleDeleteUser = async (userToDelete: User) => {
    if (window.confirm(`"${userToDelete.fullName}" (${userToDelete.username}) adlı kullanıcıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`)) {
      setIsDataLoading(true);
      setUserFeedbackMessage(null);
      try {
        await apiService.deleteUser(userToDelete.id); 
        setUserFeedbackMessage({type: 'success', text: `"${userToDelete.fullName}" başarıyla silindi.`});
        await fetchUsers();
      } catch (error) {
        console.error("Error deleting user:", error);
        setUserFeedbackMessage({type: 'error', text: 'Kullanıcı silinirken bir hata oluştu.'});
      }
      setIsDataLoading(false);
    }
  };

  const userActions = (
    <Button onClick={() => { setEditingUser(null); setIsUserModalOpen(true); setUserFeedbackMessage(null); }} leftIcon={ICONS.add("w-4 h-4")} size="md">
      Yeni Kullanıcı
    </Button>
  );

  return (
    <AdminSection title="Kullanıcı Yönetimi" icon={ICONS.usersManagement()} actions={userActions}>
      <FeedbackDisplay message={userFeedbackMessage} />
      {isDataLoading && users.length === 0 ? (
        <div className="flex justify-center items-center py-10">
          <div className="w-8 h-8 border-2 border-dashed rounded-full animate-spin border-primary-DEFAULT"></div>
          <p className="ml-3 text-gray-500 dark:text-gray-400">Kullanıcılar yükleniyor...</p>
        </div>
      ) : (
      <div className="overflow-x-auto shadow-md rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ad Soyad</th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Kullanıcı Adı</th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Rol</th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ünvan</th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Durum</th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">İşlemler</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {users.map((user) => (
              <motion.tr 
                key={user.id} 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                transition={{ duration: 0.2 }}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                            <img className="h-10 w-10 rounded-full object-cover border border-gray-200 dark:border-gray-700" 
                                 src={user.profilePhotoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=random&color=fff`} 
                                 alt={user.fullName} 
                                 onError={(e) => (e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=random&color=fff`)} 
                            />
                        </div>
                        <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{user.fullName}</div>
                        </div>
                    </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{user.username}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{ROLE_DISPLAY_NAMES[user.role] || user.role}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{user.title || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.isActive ? 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100'
                  }`}>
                    {user.isActive ? 'Aktif' : 'Pasif'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => { setEditingUser(user); setIsUserModalOpen(true); setUserFeedbackMessage(null); }} className="p-1.5" title="Düzenle">{ICONS.edit("w-4 h-4")}</Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(user)} className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1.5" title="Sil">{ICONS.delete("w-4 h-4")}</Button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
      {!isDataLoading && users.length === 0 && !userFeedbackMessage && (
        <p className="text-center py-8 text-gray-500 dark:text-gray-400">Henüz kullanıcı eklenmemiş. "Yeni Kullanıcı" butonu ile başlayın!</p>
      )}
      <Modal 
        isOpen={isUserModalOpen} 
        onClose={() => { setIsUserModalOpen(false); setEditingUser(null); }} 
        title={editingUser ? 'Kullanıcıyı Düzenle' : 'Yeni Kullanıcı Ekle'}
        titleIcon={editingUser ? ICONS.edit("w-5 h-5") : ICONS.add("w-5 h-5")}
        size="2xl"
      >
        <UserForm 
            onSubmit={handleUserFormSubmit} 
            initialData={editingUser} 
            onCancel={() => { setIsUserModalOpen(false); setEditingUser(null); }}
            isLoading={isFormSubmitting}
        />
      </Modal>
    </AdminSection>
  );
};


// Role Password Management Component
const RolePasswordManagement: React.FC = () => {
  const themeContext = useContext(ThemeContext);
  
  if (!themeContext) return null;
  const { passwordProtectionActive } = themeContext;

  if (!passwordProtectionActive) {
    return (
      <AdminSection title="Rol Şifreleri Yönetimi" icon={ICONS.roles()}>
        <div className="p-4 border border-yellow-300 dark:border-yellow-700 rounded-lg bg-yellow-50 dark:bg-yellow-700/20">
          <h3 className="text-lg font-medium text-yellow-700 dark:text-yellow-300 flex items-center">{ICONS.key("w-5 h-5 mr-2")}Şifre Koruması Devre Dışı</h3>
          <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
            Uygulama genelinde şifre koruması şu anda kapalı. Kullanıcı bazlı şifreler "Kullanıcı Yönetimi" bölümünden ayarlanır.
          </p>
        </div>
      </AdminSection>
    );
  }
  
  return (
    <AdminSection title="Rol Şifreleri Yönetimi" icon={ICONS.roles()}>
        <div className="p-4 border border-blue-300 dark:border-blue-700 rounded-lg bg-blue-50 dark:bg-blue-700/20">
          <h3 className="text-lg font-medium text-blue-700 dark:text-blue-300 flex items-center">{ICONS.usersManagement("w-5 h-5 mr-2")}Kullanıcı Bazlı Şifreler</h3>
          <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
            Şifre koruması aktif olduğunda, her kullanıcının şifresi "Kullanıcı Yönetimi" bölümünden bireysel olarak ayarlanır.
            Bu bölümdeki eski rol bazlı şifre ayarı artık kullanılmamaktadır.
          </p>
        </div>
      </AdminSection>
  );
};

// LogRecords Component
const LogRecords: React.FC = () => {
  const [logDates, setLogDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [isLoadingDates, setIsLoadingDates] = useState(false);

  useEffect(() => {
    const fetchDates = async () => {
      setIsLoadingDates(true);
      try {
        const dates = await apiService.getAvailableLogDates();
        setLogDates(dates);
        if (dates.length > 0 && !selectedDate) {
          setSelectedDate(dates[0]);
        }
      } catch (error) {
        console.error("Error fetching log dates:", error);
      }
      setIsLoadingDates(false);
    };
    fetchDates();
  }, [selectedDate]);

  useEffect(() => {
    if (selectedDate) {
      const fetchLogs = async () => {
        setIsLoadingLogs(true);
        try {
          const fetchedLogs = await apiService.getLogsByDate(selectedDate);
          setLogs(fetchedLogs);
        } catch (error) {
          console.error(`Error fetching logs for date ${selectedDate}:`, error);
          setLogs([]);
        }
        setIsLoadingLogs(false);
      };
      fetchLogs();
    } else {
      setLogs([]);
    }
  }, [selectedDate]);

  return (
    <AdminSection title="Log Kayıtları" icon={ICONS.logs()}>
      <div className="mb-4">
        <label htmlFor="logDateSelect" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Tarih Seçin:
        </label>
        {isLoadingDates ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Log tarihleri yükleniyor...</p>
        ) : logDates.length > 0 ? (
          <div className="relative max-w-xs">
            <select
              id="logDateSelect"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="appearance-none w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:border-gray-400 px-4 py-2.5 pr-8 rounded-lg shadow-sm leading-tight focus:outline-none focus:ring-2 focus:ring-primary-DEFAULT/40 focus:border-primary-DEFAULT text-gray-700 dark:text-gray-200"
            >
              {logDates.map(date => (
                <option key={date} value={date}>{new Date(date).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
               {ICONS.chevronDown("w-5 h-5")}
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">Log kaydı bulunamadı.</p>
        )}
      </div>

      {isLoadingLogs ? (
        <div className="flex justify-center items-center py-10">
          <div className="w-8 h-8 border-2 border-dashed rounded-full animate-spin border-primary-DEFAULT"></div>
          <p className="ml-3 text-gray-500 dark:text-gray-400">Loglar yükleniyor...</p>
        </div>
      ) : logs.length > 0 ? (
        <div className="overflow-x-auto shadow-md rounded-lg border border-gray-200 dark:border-gray-700 max-h-[60vh] custom-scrollbar">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Zaman</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Kullanıcı</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Eylem</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Detaylar</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                    {new Date(log.timestamp).toLocaleString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-700 dark:text-gray-200">
                    {log.userFullName || 'Bilinmiyor'} ({log.userRole ? ROLE_DISPLAY_NAMES[log.userRole] : log.userId})
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600 dark:text-gray-300">
                    <span className="px-2 py-0.5 rounded-full bg-primary-DEFAULT/10 text-primary-dark dark:bg-primary-light/10 dark:text-primary-light font-medium">
                      {LogActionTypeStrings[log.action] || log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 max-w-md truncate" title={log.details}>{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : selectedDate && !isLoadingDates && (
        <p className="text-center py-8 text-gray-500 dark:text-gray-400">Seçilen tarih için log kaydı bulunamadı.</p>
      )}
    </AdminSection>
  );
};


// Settings Management Component
const SettingsManagement: React.FC = () => {
    const themeContext = useContext(ThemeContext);
    const authContext = useContext(AuthContext);
    const navigate = useNavigate();

    // Local state for App Name and Logo URL inputs
    const [localAppName, setLocalAppName] = useState<string>(themeContext?.appName || '');
    const [localLogoUrl, setLocalLogoUrl] = useState<string>(themeContext?.logoUrl || '');

    if (!themeContext || !authContext) return <p>Tema veya Oturum Yöneticisi yüklenemedi.</p>;
    
    const {
        theme, toggleTheme,
        accentColor, setAccentColor,
        currency, setCurrency,
        appName, setAppName,
        logoUrl, setLogoUrl,
        passwordProtectionActive, setPasswordProtectionActive
    } = themeContext;
    const { logout } = authContext; 


    const [geminiApiKey, setGeminiApiKey] = useState<string>('');
    const [isKeyLoading, setIsKeyLoading] = useState<boolean>(false);
    const [keyFetchAttempted, setKeyFetchAttempted] = useState<boolean>(false);
    
    const [generalFeedback, setGeneralFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [backupRestoreFeedback, setBackupRestoreFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const backupFileInputRef = useRef<HTMLInputElement>(null);



    const handleSaveAppName = () => {
        setAppName(localAppName.trim() || DEFAULT_APP_NAME); 
        setGeneralFeedback({type: 'success', text: "Uygulama adı başarıyla güncellendi."});
        setTimeout(() => setGeneralFeedback(null), 3000);
    };

    const handleSaveLogoUrl = () => {
        setLogoUrl(localLogoUrl.trim() || DEFAULT_LOGO_URL); 
        setGeneralFeedback({type: 'success', text: "Logo URL'si başarıyla güncellendi."});
        setTimeout(() => setGeneralFeedback(null), 3000);
    };

    const handleTogglePasswordProtection = () => {
        setPasswordProtectionActive(!passwordProtectionActive); 
        setGeneralFeedback({type: 'success', text: `Şifre Koruması ${!passwordProtectionActive ? 'Aktif Edildi' : 'Devre Dışı Bırakıldı'}.`});
        setTimeout(() => setGeneralFeedback(null), 3000);
    };



    const fetchApiKey = useCallback(async () => {
        setIsKeyLoading(true); setKeyFetchAttempted(false);
        try {
            const storedKey = await apiService.getGeminiApiKey();
            if (storedKey) { setGeminiApiKey(storedKey); }
        } catch (error) { console.error("Error fetching API key:", error); } 
        finally { setIsKeyLoading(false); setKeyFetchAttempted(true); }
    }, []);

    useEffect(() => { fetchApiKey(); }, [fetchApiKey]);

    const handleSaveApiKey = async () => {
        setIsKeyLoading(true); setGeneralFeedback(null);
        const keyToSave = geminiApiKey.trim();
        try {
            await apiService.updateGeminiApiKey(keyToSave); 
            setGeneralFeedback({ type: 'success', text: keyToSave ? 'Gemini API anahtarı başarıyla kaydedildi.' : 'Gemini API anahtarı kaldırıldı.' });
        } catch (error) {
            console.error("Failed to save API key:", error);
            setGeneralFeedback({ type: 'error', text: 'API anahtarı kaydedilirken bir hata oluştu.' });
        }
        setIsKeyLoading(false);
        setTimeout(() => setGeneralFeedback(null), 4000);
    };

    const handleBackupData = async () => {
        setBackupRestoreFeedback(null);
        setIsKeyLoading(true);
        try {
            const jsonData = await apiService.exportAllData(); 
            const blob = new Blob([jsonData], { type: 'application/json;charset=utf-8' });
            const now = new Date();
            const timestamp = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
            saveAs(blob, `cafe-backup-${timestamp}.json`);
            setBackupRestoreFeedback({ type: 'success', text: 'Tüm veriler başarıyla yedeklendi.' });
        } catch (error) {
            console.error('Veri yedekleme hatası:', error);
            setBackupRestoreFeedback({ type: 'error', text: `Yedekleme sırasında bir hata oluştu: ${error instanceof Error ? error.message : String(error)}` });
        }
        setIsKeyLoading(false);
        setTimeout(() => setBackupRestoreFeedback(null), 4000);
    };

    const handleRestoreData = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setBackupRestoreFeedback(null);
        if (!window.confirm("Mevcut tüm verileriniz seçilen yedek dosyasındaki verilerle değiştirilecektir. Bu işlem geri alınamaz ve işlem sonrası otomatik olarak çıkış yapacaksınız. Emin misiniz?")) {
            if (backupFileInputRef.current) backupFileInputRef.current.value = ""; 
            return;
        }

        setIsKeyLoading(true);
        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const jsonData = e.target?.result as string;
                    if (!jsonData) throw new Error("Dosya içeriği okunamadı.");
                    
                    await apiService.importAllData(jsonData); 
                    setBackupRestoreFeedback({ type: 'success', text: 'Veriler başarıyla geri yüklendi. Uygulama yeniden başlatılıyor...' });
                    
                    setTimeout(() => {
                        logout(); 
                        window.location.reload(); 
                    }, 2000);

                } catch (readError) {
                    console.error('Yedek dosyası okunurken hata:', readError);
                    setBackupRestoreFeedback({ type: 'error', text: `Yedek dosyası işlenirken hata: ${readError instanceof Error ? readError.message : String(readError)}` });
                    setIsKeyLoading(false);
                } finally {
                    if (backupFileInputRef.current) backupFileInputRef.current.value = "";
                }
            };
            reader.onerror = () => {
                setBackupRestoreFeedback({ type: 'error', text: 'Dosya okuma hatası.' });
                setIsKeyLoading(false);
                if (backupFileInputRef.current) backupFileInputRef.current.value = "";
            };
            reader.readAsText(file);
        } catch (error) {
            console.error('Geri yükleme işlemi sırasında beklenmedik hata:', error);
            setBackupRestoreFeedback({ type: 'error', text: `Geri yükleme sırasında beklenmedik bir hata oluştu.` });
            setIsKeyLoading(false);
            if (backupFileInputRef.current) backupFileInputRef.current.value = "";
        }
    };


    return (
        <AdminSection title="Genel Ayarlar" icon={ICONS.settings()}>
             <FeedbackDisplay message={generalFeedback} />
            <div className="space-y-8">

                {/* App Name Settings */}
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <h3 className="text-md font-semibold text-gray-700 dark:text-gray-200 flex items-center mb-1">
                        {ICONS.identification("w-5 h-5 mr-2")} Uygulama Adı
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Uygulamanın genelinde gösterilecek adı belirleyin.</p>
                    <div className="flex flex-col sm:flex-row items-stretch gap-3">
                        <Input
                            label="Uygulama Adı"
                            value={localAppName}
                            onChange={(e) => setLocalAppName(e.target.value)}
                            placeholder="Cafe&Restoran Adınız"
                            containerClassName="flex-grow mb-0 sm:mb-4"
                        />
                        <Button 
                            onClick={handleSaveAppName} 
                            className="w-full sm:w-auto self-end sm:self-auto sm:mt-[27px]"
                            size="md"
                        >
                            Adı Kaydet
                        </Button>
                    </div>
                </div>

                {/* Logo URL Settings */}
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <h3 className="text-md font-semibold text-gray-700 dark:text-gray-200 flex items-center mb-1">
                        {ICONS.image("w-5 h-5 mr-2")} Logo URL'si
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Uygulamada kullanılacak logonun URL'sini girin.</p>
                    <div className="flex flex-col sm:flex-row items-stretch gap-3">
                        <Input
                            label="Logo URL'si"
                            value={localLogoUrl}
                            onChange={(e) => setLocalLogoUrl(e.target.value)}
                            placeholder="https://example.com/logo.png"
                            containerClassName="flex-grow mb-0 sm:mb-4"
                        />
                        <Button 
                            onClick={handleSaveLogoUrl} 
                            className="w-full sm:w-auto self-end sm:self-auto sm:mt-[27px]"
                            size="md"
                        >
                            Logoyu Kaydet
                        </Button>
                    </div>
                    {localLogoUrl && (
                        <div className="mt-4">
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Logo Önizlemesi:</p>
                            <img 
                                src={localLogoUrl} 
                                alt="Logo Önizlemesi" 
                                className="h-12 w-auto max-w-xs bg-gray-100 dark:bg-gray-700 p-1 border border-gray-300 dark:border-gray-600 rounded"
                                onError={(e) => { 
                                    const target = e.target as HTMLImageElement;
                                    target.alt = "Logo yüklenemedi";
                                    target.src = DEFAULT_LOGO_URL; 
                                }}
                            />
                        </div>
                    )}
                </div>

                {/* Security Settings - Password Protection */}
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                        <div>
                            <h3 className="text-md font-semibold text-gray-700 dark:text-gray-200 flex items-center mb-1">
                                {ICONS.key("w-5 h-5 mr-2")} Şifre Koruması
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Uygulama genelinde şifre ile girişi zorunlu kılar. Kapalıysa, roller şifresiz giriş yapabilir.
                            </p>
                        </div>
                         <Button
                            onClick={handleTogglePasswordProtection}
                            variant={passwordProtectionActive ? 'primary' : 'secondary'}
                            leftIcon={ICONS.lock("w-4 h-4")}
                            className="mt-2 sm:mt-0 ml-0 sm:ml-auto w-full sm:w-auto"
                            size="md"
                            aria-label="Şifre Korumasını Değiştir"
                        >
                            {passwordProtectionActive ? 'Şifre Koruması: Etkin' : 'Şifre Koruması: Devre Dışı'}
                        </Button>
                    </div>
                </div>


                {/* Theme Settings */}
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                        <div>
                            <h3 className="text-md font-semibold text-gray-700 dark:text-gray-200 flex items-center mb-1">
                                {ICONS.colorPalette("w-5 h-5 mr-2")}Tema Modu
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Uygulama genelinde açık veya koyu modu ayarlayın.</p>
                        </div>
                        <Button onClick={toggleTheme} variant="outline" leftIcon={theme === 'light' ? ICONS.moon("w-4 h-4") : ICONS.sun("w-4 h-4")} size="md" className="mt-2 sm:mt-0 w-full sm:w-auto">
                            {theme === 'light' ? 'Koyu Moda Geç' : 'Açık Moda Geç'}
                        </Button>
                    </div>
                </div>

                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <h3 className="text-md font-semibold text-gray-700 dark:text-gray-200 mb-1">Vurgu Rengi</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Uygulamanın ana tema rengini seçin.</p>
                    <div className="flex flex-wrap gap-3">
                        {Object.entries(AVAILABLE_ACCENT_COLORS).map(([colorName, colorValues]) => (
                            <button
                                key={colorName}
                                onClick={() => setAccentColor(colorName)}
                                style={{ backgroundColor: colorValues.DEFAULT }}
                                className={`w-10 h-10 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800 transition-all duration-150 ${accentColor === colorName ? 'ring-2 ring-offset-1 ring-black dark:ring-white scale-110 shadow-md' : 'hover:scale-105'}`}
                                aria-label={`Vurgu rengini ${colorName} yap`}
                                title={colorName.charAt(0).toUpperCase() + colorName.slice(1)}
                            />
                        ))}
                    </div>
                </div>
                
                {/* Currency Settings */}
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <h3 className="text-md font-semibold text-gray-700 dark:text-gray-200 flex items-center mb-1">
                        {ICONS.currencyDollar("w-5 h-5 mr-2")} Para Birimi
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Uygulama genelinde gösterilecek para birimini seçin.</p>
                    <div className="relative max-w-xs">
                         <select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                            className="appearance-none w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:border-gray-400 px-4 py-2.5 pr-8 rounded-lg shadow-sm leading-tight focus:outline-none focus:ring-2 focus:ring-primary-DEFAULT/40 focus:border-primary-DEFAULT text-gray-700 dark:text-gray-200"
                            aria-label="Para birimi seçin"
                        >
                            {Object.entries(CURRENCIES).map(([code, { name, symbol }]) => (
                                <option key={code} value={code}>
                                    {symbol} - {name} ({code})
                                </option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                           {ICONS.chevronDown("w-5 h-5")}
                        </div>
                    </div>
                </div>

                 {/* Gemini API Key Section */}
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <h3 className="text-md font-semibold text-gray-700 dark:text-gray-200 mb-1 flex items-center">
                        {ICONS.sparkles("w-5 h-5 mr-2 text-primary-DEFAULT")} Google Gemini API Anahtarı
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                        Ürün açıklamaları gibi yapay zeka özelliklerini kullanmak için Gemini API anahtarınızı girin.
                        Anahtarınızı <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary-DEFAULT hover:underline font-medium">Google AI Studio</a>'dan alabilirsiniz.
                    </p>
                    <div className="flex flex-col sm:flex-row items-stretch gap-3">
                        <Input
                            label="Gemini API Anahtarı"
                            type="password" 
                            value={geminiApiKey}
                            onChange={(e) => setGeminiApiKey(e.target.value)}
                            placeholder="API Anahtarınızı buraya girin"
                            containerClassName="flex-grow mb-0 sm:mb-4"
                            leftIcon={ICONS.key("w-4 h-4")}
                            disabled={isKeyLoading && !keyFetchAttempted} 
                        />
                        <Button 
                            onClick={handleSaveApiKey} 
                            isLoading={isKeyLoading && keyFetchAttempted} 
                            className="w-full sm:w-auto self-end sm:self-auto sm:mt-[27px]"
                            disabled={(isKeyLoading && !keyFetchAttempted) || (!keyFetchAttempted && !geminiApiKey && !generalFeedback) }
                            size="md"
                        >
                            Anahtarı Kaydet
                        </Button>
                    </div>
                     {keyFetchAttempted && !geminiApiKey && !isKeyLoading && (
                        <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2 p-2 bg-yellow-50 dark:bg-yellow-700/30 rounded border border-yellow-200 dark:border-yellow-600">
                            API anahtarı ayarlanmamış. AI özellikleri çalışmayabilir. Anahtarı boş bırakıp kaydetmek, mevcut anahtarı kaldırır.
                        </p>
                    )}
                </div>

            </div>
        </AdminSection>
    );
};

// Admin Dashboard Component
const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState({ totalProducts: 0, pendingOrders: 0, totalRevenue: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const themeContext = useContext(ThemeContext);

    const fetchStats = useCallback(async () => {
        setIsLoading(true);
        const products = await apiService.getProducts();
        const pending = await apiService.getOrders({ status: OrderStatus.PENDING });
        const allOrders = await apiService.getOrders(); 
        
        const totalRevenue = allOrders
            .filter(o => o.status === OrderStatus.PAID || o.status === OrderStatus.SERVED)
            .reduce((sum, order) => sum + order.totalAmount, 0);

        setStats({
            totalProducts: products.length,
            pendingOrders: pending.length,
            totalRevenue: totalRevenue,
        });
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchStats();
         const intervalId = setInterval(fetchStats, 60000); 
        return () => clearInterval(intervalId);
    }, [fetchStats]);

    const formattedRevenue = themeContext 
      ? formatPrice(stats.totalRevenue, themeContext.currency) 
      : `${stats.totalRevenue.toFixed(2)} TL`;

    const statCards = [
        { title: "Toplam Ürün", value: stats.totalProducts, icon: ICONS.products("w-7 h-7 text-blue-500 dark:text-blue-400"), color: "blue" },
        { title: "Bekleyen Sipariş", value: stats.pendingOrders, icon: ICONS.kitchen("w-7 h-7 text-amber-500 dark:text-amber-400"), color: "amber" },
        { title: "Tahmini Gelir", value: formattedRevenue, icon: ICONS.cashier("w-7 h-7 text-green-500 dark:text-green-400"), color: "green" },
    ];

    if (isLoading && !stats.totalProducts) { 
        return (
          <AdminSection title="Kontrol Paneli" icon={ICONS.dashboard()}>
            <div className="flex justify-center items-center h-48">
              <div className="w-10 h-10 border-2 border-dashed rounded-full animate-spin border-primary-DEFAULT"></div>
              <p className="ml-3 text-gray-500 dark:text-gray-400">Veriler yükleniyor...</p>
            </div>
          </AdminSection>
        );
    }
    
    const dashboardActions = (
        <Button onClick={fetchStats} leftIcon={ICONS.refresh("w-4 h-4")} isLoading={isLoading} size="md">
            Verileri Yenile
        </Button>
    );

    return (
        <AdminSection title="Kontrol Paneli" icon={ICONS.dashboard()} actions={dashboardActions}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {statCards.map((card, index) => (
                    <motion.div 
                        key={card.title}
                        className={`bg-gray-50 dark:bg-gray-700/50 p-6 rounded-xl shadow-md border-l-4 border-${card.color}-500 dark:border-${card.color}-400 hover:shadow-lg transition-shadow`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{card.title}</p>
                                <p className="text-3xl font-bold text-gray-800 dark:text-white mt-1 truncate" title={card.value.toString()}>{card.value}</p>
                            </div>
                            <div className={`p-3 rounded-full bg-${card.color}-100 dark:bg-${card.color}-600/30`}>
                                {card.icon}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </AdminSection>
    );
};


const VALID_ADMIN_VIEWS = ['dashboard', 'products', 'users', 'tables', 'roles', 'logs', 'settings']; 

const AdminPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('dashboard');

  useEffect(() => {
    const hash = location.hash.replace(/^#/, '');
    const requestedView = hash || 'dashboard';

    if (VALID_ADMIN_VIEWS.includes(requestedView)) {
      setActiveView(requestedView);
    } else {
      setActiveView('dashboard');
      if (location.pathname === '/admin' && hash !== 'dashboard' && hash !== '') {
        navigate('/admin#dashboard', { replace: true });
      }
    }
  }, [location.hash, location.pathname, navigate]);

  return (
    <div className="space-y-6"> 
      <AnimatePresence mode="wait">
        <motion.div
          key={activeView}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
          {activeView === 'dashboard' && <AdminDashboard />}
          {activeView === 'products' && <ProductManagement />}
          {activeView === 'users' && <UserManagement />} 
          {activeView === 'tables' && <TableManagement />}
          {activeView === 'roles' && <RolePasswordManagement />}
          {activeView === 'logs' && <LogRecords />}
          {activeView === 'settings' && <SettingsManagement />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default AdminPage;