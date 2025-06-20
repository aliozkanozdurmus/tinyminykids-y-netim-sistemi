

import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { Routes, Route, NavLink, Outlet, useLocation, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import saveAs from 'file-saver'; // Changed from "import { saveAs } from 'file-saver';"
import { Product, UserRole, Order, OrderStatus, ThemeSettings, TableConfiguration } from '../types';
import { apiService } from '../services/apiService';
import Button from '../components/shared/Button';
import Modal from '../components/shared/Modal';
import ProductForm from '../components/admin/ProductForm';
import Input from '../components/shared/Input'; // For password form
import { ICONS, AVAILABLE_ACCENT_COLORS, ROLE_DISPLAY_NAMES, DEFAULT_IMAGE_URL } from '../constants';
import { AuthContext } from '../contexts/AuthContext';
import { ThemeContext } from '../contexts/ThemeContext';
import TableManagement from '../components/admin/TableManagement';


// Product Management Component
const ProductManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setFeedbackMessage(null);
    const data = await apiService.getProducts();
    setProducts(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleFormSubmit = async (productData: Omit<Product, 'id'>) => {
    setIsLoading(true);
    setFeedbackMessage(null);
    try {
        if (editingProduct) {
          await apiService.updateProduct(editingProduct.id, productData);
          setFeedbackMessage({type: 'success', text: 'Ürün başarıyla güncellendi.'});
        } else {
          await apiService.addProduct(productData);
          setFeedbackMessage({type: 'success', text: 'Ürün başarıyla eklendi.'});
        }
        await fetchProducts();
        setIsModalOpen(false);
        setEditingProduct(null);
    } catch (error) {
        console.error("Error submitting product form:", error);
        setFeedbackMessage({type: 'error', text: 'İşlem sırasında bir hata oluştu.'});
    }
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bu ürünü silmek istediğinizden emin misiniz?')) {
      setIsLoading(true);
      setFeedbackMessage(null);
      try {
        await apiService.deleteProduct(id);
        setFeedbackMessage({type: 'success', text: 'Ürün başarıyla silindi.'});
        await fetchProducts();
      } catch (error) {
        console.error("Error deleting product:", error);
        setFeedbackMessage({type: 'error', text: 'Ürün silinirken bir hata oluştu.'});
      }
      setIsLoading(false);
    }
  };

  const handleExportProducts = async () => {
    setIsLoading(true);
    setFeedbackMessage(null);
    try {
        const productsToExport = await apiService.getProducts();
        const worksheetData = productsToExport.map(p => ({
            // id: p.id, // ID alanı kaldırıldı
            name: p.name,
            price: p.price,
            category: p.category,
            imageUrl: p.imageUrl || '',
            description: p.description || '',
            isAvailable: p.isAvailable ? 'Evet' : 'Hayır' 
        }));

        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Ürünler");
        
        // Column widths (optional, for better readability) - ID sütunu kaldırıldığı için güncellendi
        const cols = [
            // {wch: 20}, // id kaldırıldı
            {wch: 30}, // name
            {wch: 10}, // price
            {wch: 20}, // category
            {wch: 40}, // imageUrl
            {wch: 40}, // description
            {wch: 15}  // isAvailable
        ];
        worksheet['!cols'] = cols;

        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const dataBlob = new Blob([excelBuffer], {type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8"});
        saveAs(dataBlob, "urun-listesi.xlsx");
        setFeedbackMessage({type: 'success', text: 'Ürünler başarıyla Excel\'e aktarıldı.'});
    } catch (error) {
        console.error("Error exporting products:", error);
        setFeedbackMessage({type: 'error', text: 'Ürünler dışa aktarılırken bir hata oluştu.'});
    }
    setIsLoading(false);
  };

  const handleImportFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleImportProducts = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
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
                    setFeedbackMessage({type: 'error', text: 'Excel dosyası boş veya geçersiz formatta.'});
                    setIsLoading(false);
                    return;
                }

                for (const row of jsonData) {
                    const name = row.name?.toString().trim();
                    const priceStr = row.price?.toString().trim();
                    const category = row.category?.toString().trim();

                    if (!name || !priceStr || !category) {
                        errors.push(`Satır atlandı: Ad, Fiyat ve Kategori alanları zorunludur. Satır: ${JSON.stringify(row)}`);
                        errorCount++;
                        continue;
                    }
                    
                    const price = parseFloat(priceStr);
                    if (isNaN(price) || price <= 0) {
                        errors.push(`Satır atlandı (${name}): Fiyat geçerli bir pozitif sayı olmalıdır. Değer: '${priceStr}'`);
                        errorCount++;
                        continue;
                    }

                    let isAvailable = true; // Default to true
                    if (row.isAvailable !== undefined && row.isAvailable !== null) {
                        const availableStr = row.isAvailable.toString().toLowerCase().trim();
                        if (['false', 'hayır', 'no', '0'].includes(availableStr)) {
                            isAvailable = false;
                        } else if (['true', 'evet', 'yes', '1'].includes(availableStr)) {
                            isAvailable = true;
                        } 
                        // If unrecognized, it remains true by default or could be handled as an error
                    }
                    
                    const productData: Omit<Product, 'id'> = {
                        name,
                        price,
                        category,
                        imageUrl: row.imageUrl?.toString().trim() || undefined,
                        description: row.description?.toString().trim() || undefined,
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
                     // For brevity, only show first few errors or a generic message.
                    alert(`İçe Aktarma Raporu:\n${summary}\n\nİlk Hatalar:\n${errors.slice(0,5).join("\n")}\n\n(Detaylar için konsolu kontrol edin)`);
                }
                setFeedbackMessage({type: errorCount > 0 && importedCount === 0 ? 'error' : 'success', text: summary});
                await fetchProducts();

            } catch (parseError) {
                console.error("Error processing Excel file:", parseError);
                setFeedbackMessage({type: 'error', text: 'Excel dosyası işlenirken bir hata oluştu.'});
            } finally {
                setIsLoading(false);
                if(fileInputRef.current) fileInputRef.current.value = ""; // Reset file input
            }
        };
        reader.readAsArrayBuffer(file);
    } catch (error) {
        console.error("Error importing products:", error);
        setFeedbackMessage({type: 'error', text: 'Ürünler içe aktarılırken bir hata oluştu.'});
        setIsLoading(false);
        if(fileInputRef.current) fileInputRef.current.value = ""; // Reset file input
    }
  };


  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">Ürün Yönetimi</h2>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button onClick={() => { setEditingProduct(null); setIsModalOpen(true); setFeedbackMessage(null); }} leftIcon={ICONS.add()} className="w-full sm:w-auto">
            Yeni Ürün
          </Button>
          <input type="file" ref={fileInputRef} onChange={handleImportProducts} accept=".xlsx, .xls" style={{ display: 'none' }} />
          <Button onClick={handleImportFileSelect} leftIcon={ICONS.upload()} variant="outline" className="w-full sm:w-auto" isLoading={isLoading && fileInputRef.current?.files?.length > 0}>
            Excel'den İçe Aktar
          </Button>
          <Button onClick={handleExportProducts} leftIcon={ICONS.download()} variant="outline" className="w-full sm:w-auto" isLoading={isLoading && !(fileInputRef.current?.files?.length > 0)}>
            Excel'e Aktar
          </Button>
        </div>
      </div>

      {feedbackMessage && (
        <div className={`p-3 mb-4 rounded-md text-sm ${feedbackMessage.type === 'success' ? 'bg-green-100 dark:bg-green-700 text-green-700 dark:text-green-100' : 'bg-red-100 dark:bg-red-700 text-red-700 dark:text-red-100'}`}>
          {feedbackMessage.text}
        </div>
      )}

      {isLoading && products.length === 0 && !feedbackMessage ? <p>Yükleniyor...</p> : (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ad</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Kategori</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fiyat</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Durum</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">İşlemler</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {products.map((product, index) => (
              <motion.tr key={product.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.05 }}>
                <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                            <img className="h-10 w-10 rounded-full object-cover" src={product.imageUrl || DEFAULT_IMAGE_URL} alt={product.name} />
                        </div>
                        <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{product.name}</div>
                        </div>
                    </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{product.category}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{product.price.toFixed(2)} TL</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    product.isAvailable ? 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100'
                  }`}>
                    {product.isAvailable ? 'Mevcut' : 'Mevcut Değil'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => { setEditingProduct(product); setIsModalOpen(true); setFeedbackMessage(null); }}>{ICONS.edit()}</Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">{ICONS.delete()}</Button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
      {!isLoading && products.length === 0 && !feedbackMessage && (
        <p className="text-center py-4 text-gray-500 dark:text-gray-400">Henüz ürün eklenmemiş.</p>
      )}
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingProduct(null); }} title={editingProduct ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}>
        <ProductForm 
            onSubmit={handleFormSubmit} 
            initialData={editingProduct} 
            onCancel={() => { setIsModalOpen(false); setEditingProduct(null); }}
            isLoading={isLoading}
        />
      </Modal>
    </div>
  );
};

// Role Password Management Component
const RolePasswordManagement: React.FC = () => {
  const rolesToManage: UserRole[] = [UserRole.CASHIER, UserRole.BARISTA, UserRole.KITCHEN, UserRole.WAITER];
  const [isPasswordProtectionActive, setIsPasswordProtectionActive] = useState(true);

  const initialPasswordsState = rolesToManage.reduce((acc, role) => {
    acc[role] = '';
    return acc;
  }, {} as Record<UserRole, string>);
  const [passwords, setPasswords] = useState<Record<UserRole, string>>(initialPasswordsState);

  const initialIsLoadingState = rolesToManage.reduce((acc, role) => {
    acc[role] = false;
    return acc;
  }, {} as Record<UserRole, boolean>);
  const [isLoading, setIsLoading] = useState<Record<UserRole, boolean>>(initialIsLoadingState);
  
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    // Check password protection status on component mount
    setIsPasswordProtectionActive(apiService.isPasswordAuthActive());
  }, []);

  const handlePasswordChange = (role: UserRole, value: string) => {
    setPasswords(prev => ({ ...prev, [role]: value }));
  };

  const handleSavePassword = async (role: UserRole) => {
    if (!passwords[role] || passwords[role].length < 4) {
      alert("Şifre en az 4 karakter olmalıdır.");
      return;
    }
    setIsLoading(prev => ({ ...prev, [role]: true }));
    setMessage(null);
    try {
      const success = await apiService.updateRolePassword(role, passwords[role]);
      if (success) {
        setMessage(`${ROLE_DISPLAY_NAMES[role]} şifresi başarıyla güncellendi.`);
        setPasswords(prev => ({ ...prev, [role]: '' })); // Clear input after save
      } else {
        setMessage(`${ROLE_DISPLAY_NAMES[role]} şifresi güncellenirken bir hata oluştu. (Şifre koruması kapalı olabilir)`);
      }
    } catch (error) {
      console.error(`Error updating password for ${role}:`, error);
      setMessage(`Bir hata oluştu: ${error instanceof Error ? error.message : String(error)}`);
    }
    setIsLoading(prev => ({ ...prev, [role]: false }));
    setTimeout(() => setMessage(null), 3000);
  };

  if (!isPasswordProtectionActive) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">Rol Şifreleri Yönetimi</h2>
        <div className="p-4 border dark:border-gray-700 rounded-lg bg-yellow-50 dark:bg-yellow-900/50">
          <h3 className="text-lg font-medium text-yellow-700 dark:text-yellow-300">Şifre Koruması Devre Dışı</h3>
          <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
            Uygulama genelinde şifre koruması şu anda kapalı (<code>SIFRE_AC</code> ortam değişkeni '0' veya ayarlanmamış). 
            Bu nedenle, rol şifreleri yönetimi kullanılamaz durumdadır ve kullanıcılar şifresiz giriş yapabilir.
          </p>
          <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
            Şifre yönetimini aktif etmek için <code>SIFRE_AC</code> ortam değişkenini '1' olarak ayarlayın ve uygulamayı yeniden başlatın.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">Rol Şifreleri Yönetimi</h2>
      {message && (
        <div className={`p-3 mb-4 rounded-md text-sm ${message.includes('başarıyla') ? 'bg-green-100 dark:bg-green-700 text-green-700 dark:text-green-100' : 'bg-red-100 dark:bg-red-700 text-red-700 dark:text-red-100'}`}>
          {message}
        </div>
      )}
      <div className="space-y-6">
        <div className="p-4 border dark:border-gray-700 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Yönetici (Admin) Şifresi</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Yönetici şifresi, güvenlik nedeniyle bu panelden değiştirilemez. 
            <code>ADMIN_PASSWORD</code> isimli ortam değişkeni (environment variable) üzerinden ayarlanmalıdır.
            Uygulamanın çalıştığı sunucu veya ortam yapılandırmasından bu değişkeni güncelleyebilirsiniz.
          </p>
           {typeof process !== 'undefined' && process.env && !process.env.ADMIN_PASSWORD && (
             <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/50 rounded">
                Uyarı: <code>ADMIN_PASSWORD</code> ortam değişkeni ayarlanmamış. Yönetici girişi şu anda geliştirici varsayılan şifresi veya ana anahtar ile mümkün olabilir.
             </p>
           )}
        </div>

        {rolesToManage.map(role => (
          <div key={role} className="p-4 border dark:border-gray-700 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">{ROLE_DISPLAY_NAMES[role]} Şifresi</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Yeni bir şifre belirleyin. (Minimum 4 karakter)</p>
            <div className="flex flex-col sm:flex-row items-end gap-3">
              <Input
                label={`Yeni ${ROLE_DISPLAY_NAMES[role]} Şifresi`}
                name={`${role}_password`}
                type="password"
                value={passwords[role]}
                onChange={(e) => handlePasswordChange(role, e.target.value)}
                placeholder="Yeni şifre girin"
                containerClassName="flex-grow mb-0"
                leftIcon={ICONS.key()}
              />
              <Button 
                onClick={() => handleSavePassword(role)} 
                isLoading={isLoading[role]}
                className="w-full sm:w-auto"
              >
                Kaydet
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


// Settings Component
const SettingsManagement: React.FC = () => {
    const themeContext = useContext(ThemeContext);
    if (!themeContext) return <p>Tema yüklenemedi.</p>;
    const { theme, toggleTheme, accentColor, setAccentColor } = themeContext;

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">Arayüz Ayarları</h2>
            
            <div className="space-y-6">
                <div className="flex items-center justify-between p-4 border dark:border-gray-700 rounded-lg">
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Tema</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Uygulama genelinde açık veya koyu modu ayarlayın.</p>
                    </div>
                    <Button onClick={toggleTheme} variant="outline" leftIcon={theme === 'light' ? ICONS.moon() : ICONS.sun()}>
                        {theme === 'light' ? 'Koyu Moda Geç' : 'Açık Moda Geç'}
                    </Button>
                </div>
                <div className="p-4 border dark:border-gray-700 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Vurgu Rengi</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Uygulamanın ana rengini seçin.</p>
                    <div className="flex flex-wrap gap-3">
                        {Object.entries(AVAILABLE_ACCENT_COLORS).map(([colorName, colorValues]) => (
                            <button
                                key={colorName}
                                onClick={() => setAccentColor(colorName)}
                                style={{ backgroundColor: colorValues.DEFAULT }}
                                className={`w-10 h-10 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${accentColor === colorName ? 'ring-2 ring-offset-1 ring-black dark:ring-white' : ''}`}
                                aria-label={`Set accent color to ${colorName}`}
                                title={colorName.charAt(0).toUpperCase() + colorName.slice(1)}
                            />
                        ))}
                    </div>
                </div>
                <div className="p-4 border dark:border-gray-700 rounded-lg opacity-50">
                     <h3 className="text-lg font-medium text-gray-900 dark:text-white">Diğer Ayarlar (Yakında)</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Yazı tipi boyutu, bildirim tercihleri vb.</p>
                </div>
            </div>
        </div>
    );
};

// Admin Dashboard Component
const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState({ totalProducts: 0, pendingOrders: 0, totalRevenue: 0 });
    const [isLoading, setIsLoading] = useState(true);

    const fetchStats = useCallback(async () => {
        setIsLoading(true);
        const products = await apiService.getProducts();
        const orders = await apiService.getOrders({ status: OrderStatus.PENDING });
        const allOrders = await apiService.getOrders(); 
        
        const totalRevenue = allOrders
            .filter(o => o.status === OrderStatus.PAID || o.status === OrderStatus.SERVED)
            .reduce((sum, order) => sum + order.totalAmount, 0);

        setStats({
            totalProducts: products.length,
            pendingOrders: orders.length,
            totalRevenue: totalRevenue,
        });
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const statCards = [
        { title: "Toplam Ürün", value: stats.totalProducts, icon: ICONS.products("w-8 h-8 text-blue-500"), color: "blue" },
        { title: "Bekleyen Sipariş", value: stats.pendingOrders, icon: ICONS.kitchen("w-8 h-8 text-yellow-500"), color: "yellow" },
        { title: "Tahmini Gelir (Ödenen/Servis Edilen)", value: `${stats.totalRevenue.toFixed(2)} TL`, icon: ICONS.cashier("w-8 h-8 text-purple-500"), color: "purple" },
    ];

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-primary-DEFAULT"></div></div>;
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">Kontrol Paneli</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {statCards.map((card, index) => (
                    <motion.div 
                        key={card.title}
                        className={`bg-gray-50 dark:bg-gray-700 p-6 rounded-lg shadow-lg border-l-4 border-${card.color}-500`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">{card.title}</p>
                                <p className="text-3xl font-bold text-gray-800 dark:text-white">{card.value}</p>
                            </div>
                            {card.icon}
                        </div>
                    </motion.div>
                ))}
            </div>
            <div className="mt-8">
                <Button onClick={fetchStats} leftIcon={ICONS.refresh()} isLoading={isLoading}>
                    İstatistikleri Yenile
                </Button>
            </div>
        </div>
    );
};

// Component for unmatched admin routes
const AdminRouteNotFound: React.FC = () => {
    const location = useLocation();
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
            {ICONS.xCircle("w-16 h-16 text-red-500 mx-auto mb-4")}
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Admin Bölümü Bulunamadı</h2>
            <p className="text-gray-600 dark:text-gray-400">
                <code>{location.pathname}</code> için bir içerik bulunamadı.
            </p>
            <NavLink to="dashboard" className="mt-4 inline-block">
                 <Button variant="outline">Kontrol Paneline Git</Button>
            </NavLink>
        </div>
    );
};


const AdminPage: React.FC = () => {
  const location = useLocation();
  const TABS = [
    { name: 'Kontrol Paneli', path: 'dashboard', icon: ICONS.dashboard },
    { name: 'Ürün Yönetimi', path: 'products', icon: ICONS.products },
    { name: 'Masa Yönetimi', path: 'tables', icon: ICONS.table },
    { name: 'Rol Şifreleri', path: 'roles', icon: ICONS.roles },
    { name: 'Ayarlar', path: 'settings', icon: ICONS.settings },
  ];

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">Admin Paneli</h1>
      <div className="mb-8 border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
          {TABS.map((tab) => (
            <NavLink
              key={tab.name}
              to={tab.path}
              className={({ isActive }) =>
                `group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap
                ${
                  isActive
                    ? 'border-primary-DEFAULT text-primary-DEFAULT dark:border-primary-light dark:text-primary-light'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
                }`
              }
            >
              {tab.icon(`w-5 h-5 mr-2 ${location.pathname.includes(tab.path) ? 'text-primary-DEFAULT dark:text-primary-light' : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-300'}`)}
              <span>{tab.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>
      
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          <Routes>
            {/* Redirect /admin/ to /admin/dashboard */}
            <Route index element={<Navigate to="dashboard" replace />} /> 
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="products" element={<ProductManagement />} />
            <Route path="tables" element={<TableManagement />} />
            <Route path="roles" element={<RolePasswordManagement />} /> 
            <Route path="settings" element={<SettingsManagement />} />
            <Route path="*" element={<AdminRouteNotFound />} /> 
          </Routes>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default AdminPage;
// Check if this file ends with a blank line
// If not, add one
