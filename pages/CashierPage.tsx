import React, { useState, useEffect, useCallback, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product, OrderItem, OrderStatus, TableConfiguration, CurrencyCode } from '../types';
import { apiService } from '../services/apiService';
import ProductCard from '../components/cashier/ProductCard';
import Button from '../components/shared/Button';
import Input from '../components/shared/Input';
import Modal from '../components/shared/Modal';
import { ICONS, formatPrice, DEFAULT_TABLE_NAMES } from '../constants';
import { ThemeContext } from '../contexts/ThemeContext';

const CashierPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [tableNumber, setTableNumber] = useState(''); // This will store the selected table name (string)
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false); 
  const [isSubmitting, setIsSubmitting] = useState(false); 
  const [isOrderSuccessModalOpen, setIsOrderSuccessModalOpen] = useState(false);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);
  const [availableTables, setAvailableTables] = useState<string[]>(DEFAULT_TABLE_NAMES); // Now string array
  
  const [currentStep, setCurrentStep] = useState(1);
  const themeContext = useContext(ThemeContext);

  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedProducts, fetchedCategories, fetchedTableConfig] = await Promise.all([
        apiService.getProducts({ isAvailable: true }),
        apiService.getProductCategories(),
        apiService.getTableConfiguration()
      ]);
      setProducts(fetchedProducts.sort((a,b) => a.name.localeCompare(b.name)));
      setCategories(['all', ...fetchedCategories.sort()]);
      
      if (fetchedTableConfig && fetchedTableConfig.tableNames && fetchedTableConfig.tableNames.length > 0) {
        setAvailableTables(fetchedTableConfig.tableNames.sort((a, b) => a.localeCompare(b, undefined, {numeric: true, sensitivity: 'base'})));
      } else {
        const defaultConfig = await apiService.getDefaultTableConfiguration();
        setAvailableTables(defaultConfig.tableNames.sort((a, b) => a.localeCompare(b, undefined, {numeric: true, sensitivity: 'base'})));
      }
    } catch (error) {
        console.error("Error fetching initial data for cashier page:", error);
        const defaultConfig = await apiService.getDefaultTableConfiguration();
        setAvailableTables(defaultConfig.tableNames.sort((a, b) => a.localeCompare(b, undefined, {numeric: true, sensitivity: 'base'})));
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const updateQuantity = (productId: string, newQuantity: number) => {
    setCart((prevCart) => {
      const productInProductsList = products.find(p => p.id === productId); 
      if (!productInProductsList) return prevCart; 

      if (newQuantity <= 0) {
        return prevCart.filter((item) => item.productId !== productId);
      }
      
      const existingItemIndex = prevCart.findIndex(item => item.productId === productId);
      if (existingItemIndex > -1) {
        const updatedCart = [...prevCart];
        updatedCart[existingItemIndex] = { ...updatedCart[existingItemIndex], quantity: newQuantity };
        return updatedCart;
      } else {
        return [...prevCart, { 
          productId: productId, 
          productName: productInProductsList.name, 
          quantity: newQuantity, 
          priceAtOrder: productInProductsList.price 
        }];
      }
    });
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.priceAtOrder * item.quantity, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const currentCurrency = themeContext?.currency || 'TRY';

  const handleNextStep = () => {
    if (currentStep === 1 && cart.length === 0) {
      alert('Lütfen devam etmek için sepete ürün ekleyin.');
      return;
    }
    if (currentStep === 2 && !tableNumber) {
      alert('Lütfen devam etmek için bir masa seçin.');
      return;
    }
    setCurrentStep(prev => prev + 1);
  };

  const handlePreviousStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0 || !tableNumber) { 
      alert('Lütfen sepete ürün ekleyin ve masa seçin.');
      return;
    }
    setIsSubmitting(true);
    try {
      const newOrder = await apiService.addOrder({ items: cart, tableNumber, notes, status: OrderStatus.PENDING });
      setLastOrderId(newOrder.id);
      setIsOrderSuccessModalOpen(true);
      setCart([]);
      setTableNumber('');
      setNotes('');
      setCurrentStep(1); 
    } catch (error) {
      console.error('Sipariş verilirken hata:', error);
      alert('Sipariş verilirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
    setIsSubmitting(false);
  };
  
  const filteredProducts = products.filter(product => 
    (selectedCategory === 'all' || product.category === selectedCategory) &&
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const steps = [
    { name: "Ürünler", icon: ICONS.products("w-5 h-5") },
    { name: "Masa", icon: ICONS.table("w-5 h-5") },
    { name: "Onay", icon: ICONS.checkCircle("w-5 h-5") }
  ];

  const stepIndicator = (
    <div className="mb-4 flex items-center justify-center space-x-2 sm:space-x-4">
      {steps.map((step, index) => (
        <React.Fragment key={index}>
          <div className={`flex items-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-full transition-all duration-300 shadow-sm ${currentStep > index ? 'bg-primary-DEFAULT text-gray-800 dark:text-white' : (currentStep === index + 1 ? 'bg-primary-light text-primary-dark font-semibold animate-subtle-pulse' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400')}`}>
            {React.cloneElement(step.icon, {className: `w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 ${currentStep > index ? 'text-gray-800 dark:text-white' : (currentStep === index + 1 ? 'text-primary-dark' : 'text-gray-500 dark:text-gray-400')}`})}
            <span className="text-xs sm:text-sm">{step.name}</span>
          </div>
          {index < steps.length - 1 && (
            <div className={`h-0.5 w-6 sm:w-10 transition-colors duration-300 ${currentStep > index + 1 ? 'bg-primary-DEFAULT' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="flex flex-col flex-grow overflow-hidden px-1">
              <div className="mb-3 flex flex-col sm:flex-row gap-3 items-center px-2">
                <Input 
                  type="text"
                  placeholder="Ürün Ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  containerClassName="flex-grow sm:mb-0 w-full"
                  className="w-full !py-2.5"
                />
                <div className="relative w-full sm:w-auto sm:min-w-[200px]">
                  <select 
                    value={selectedCategory} 
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="appearance-none w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:border-gray-400 px-4 py-2.5 pr-8 rounded-lg shadow-sm leading-tight focus:outline-none focus:ring-2 focus:ring-primary-DEFAULT/40 focus:border-primary-DEFAULT text-gray-700 dark:text-gray-200"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat === 'all' ? 'Tüm Kategoriler' : cat}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                    {ICONS.chevronDown("w-5 h-5")}
                  </div>
                </div>
              </div>

              {isLoading && products.length === 0 && <p className="text-center text-gray-500 dark:text-gray-400 py-10">Ürünler yükleniyor...</p>}
              {!isLoading && filteredProducts.length === 0 && <p className="text-center text-gray-500 dark:text-gray-400 py-10">Bu kriterlere uygun ürün bulunamadı.</p>}
              
              <div className="flex-grow overflow-y-auto pr-2 pb-2 -mr-2 custom-scrollbar">
                <AnimatePresence>
                  <motion.div 
                    className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3"
                    layout
                  >
                    {filteredProducts.map((product) => (
                      <ProductCard 
                        key={product.id} 
                        product={product} 
                        quantityInCart={cart.find(item => item.productId === product.id)?.quantity || 0}
                        onUpdateQuantity={updateQuantity}
                      />
                    ))}
                  </motion.div>
                </AnimatePresence>
              </div>
            
            <div className="mt-auto border-t border-gray-200 dark:border-gray-700 p-3 sm:p-4 bg-gray-50 dark:bg-gray-800/70 sticky bottom-0">
                <div className="flex justify-between items-center mb-2 sm:mb-3">
                    <span className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300">
                        Toplam Ürün: <span className="font-bold text-primary-DEFAULT">{totalItems}</span>
                    </span>
                    <span className="text-sm sm:text-base font-bold text-gray-800 dark:text-white">
                        Tutar: {formatPrice(totalAmount, currentCurrency)}
                    </span>
                </div>
                <Button 
                  onClick={handleNextStep} 
                  disabled={cart.length === 0 || isLoading}
                  isLoading={isSubmitting && currentStep === 1}
                  className="w-full"
                  size="lg" 
                  rightIcon={ICONS.chevronDown("-rotate-90 w-5 h-5")}
                >
                  Masayı Seç
                </Button>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="p-4 sm:p-6 flex flex-col items-center justify-start flex-grow max-w-2xl mx-auto w-full">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-1">Masa Seçimi</h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-4 sm:mb-6">Lütfen sipariş için masa seçin.</p>
            
            <div className="bg-gray-50 dark:bg-gray-800 p-3 sm:p-4 rounded-xl shadow-lg mb-4 sm:mb-6 w-full text-center space-y-1">
              <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-200">
                Sepetinizde <span className="font-bold text-primary-DEFAULT">{totalItems}</span> ürün bulunmaktadır.
              </p>
              <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-200">
                Toplam Tutar: <span className="font-bold text-primary-DEFAULT">{formatPrice(totalAmount, currentCurrency)}</span>
              </p>
            </div>
            
            <h3 className="text-base sm:text-lg font-medium text-gray-700 dark:text-gray-300 mb-3 sm:mb-4">
                Seçili Masa: <span className={`font-bold px-2 py-0.5 rounded ${tableNumber ? 'bg-primary-DEFAULT text-gray-800 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>{tableNumber || "Seçilmedi"}</span>
            </h3>
            {isLoading && !availableTables.length ? (
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Masalar yükleniyor...</p>
            ) : availableTables.length > 0 ? (
                <div className="grid grid-cols-4 xs:grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2 sm:gap-2.5 max-h-52 sm:max-h-60 overflow-y-auto justify-center p-3 sm:p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700/30 w-full custom-scrollbar">
                    {availableTables.map(name => (
                        <Button
                            key={name}
                            onClick={() => setTableNumber(name)}
                            variant={tableNumber === name ? 'primary' : 'outline'}
                            size="md" 
                            className="!px-2 !py-2 sm:!px-3 sm:!py-2.5 aspect-square !text-sm sm:!text-base !font-semibold"
                        >
                            {name}
                        </Button>
                    ))}
                </div>
            ) : (
                 <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Tanımlı masa bulunamadı. Lütfen yönetici panelinden ayarlayın.</p>
            )}
            <div className="mt-6 sm:mt-8 flex justify-between w-full gap-3 sm:gap-4">
              <Button onClick={handlePreviousStep} variant="secondary" size="lg" className="flex-1" leftIcon={ICONS.chevronDown("rotate-90 w-5 h-5")}>
                Geri
              </Button>
              <Button onClick={handleNextStep} disabled={!tableNumber || isSubmitting} isLoading={isSubmitting && currentStep === 2} size="lg" className="flex-1" rightIcon={ICONS.chevronDown("-rotate-90 w-5 h-5")}>
                Onayla
              </Button>
            </div>
          </div>
        );
      case 3: 
        return (
          <div className="p-4 sm:p-6 flex flex-col items-center flex-grow max-w-2xl mx-auto w-full">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-1">Sipariş Onayı ve Notlar</h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-4 sm:mb-6">Sipariş detaylarını kontrol edin ve isterseniz not ekleyin.</p>
            
            <div className="w-full bg-white dark:bg-gray-800 shadow-xl rounded-xl p-4 sm:p-5 mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white mb-3 sm:mb-4 flex items-center">
                  {ICONS.cart("mr-2 w-5 h-5 text-primary-DEFAULT")} Sipariş Detayları
              </h3>
              {cart.length === 0 ? (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-4 text-sm">Sepet boş görünüyor.</p>
              ) : (
                <div className="space-y-2 sm:space-y-2.5 max-h-48 overflow-y-auto custom-scrollbar pr-2 -mr-2 mb-3">
                  {cart.map((item) => (
                    <motion.div 
                      key={item.productId} 
                      layout 
                      className="flex items-center justify-between p-2 sm:p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg shadow-sm"
                    >
                      <div className="flex-1 mr-2">
                        <p className="font-medium text-gray-700 dark:text-gray-200 text-xs sm:text-sm truncate" title={item.productName}>{item.productName}</p>
                        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Adet: {item.quantity} x {formatPrice(item.priceAtOrder, currentCurrency)}</p>
                      </div>
                      <p className="font-semibold text-gray-800 dark:text-white text-xs sm:text-sm">
                        {formatPrice(item.priceAtOrder * item.quantity, currentCurrency)}
                      </p>
                    </motion.div>
                  ))}
                </div>
              )}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3 sm:pt-4 space-y-1.5">
                <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-200 flex justify-between">
                    <span>Masa Numarası:</span> <span className="font-bold text-primary-DEFAULT">{tableNumber}</span>
                </p>
                <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-200 flex justify-between">
                    <span>Toplam Ürün:</span> <span className="font-bold text-primary-DEFAULT">{totalItems}</span>
                </p>
                <p className="text-sm sm:text-base text-gray-800 dark:text-white flex justify-between font-bold">
                    <span>GENEL TOPLAM:</span> <span className="text-primary-DEFAULT">{formatPrice(totalAmount, currentCurrency)}</span>
                </p>
              </div>
            </div>

            <div className="mb-4 sm:mb-6 w-full">
                <label htmlFor="notes" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Sipariş Notları (Opsiyonel)
                </label>
                <textarea
                    id="notes"
                    name="notes"
                    rows={3}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-DEFAULT/40 focus:border-primary-DEFAULT sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="Örn: Az şekerli, Soğansız, Ekstra peçete..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                />
            </div>
            <div className="mt-auto flex justify-between w-full gap-3 sm:gap-4">
                <Button onClick={handlePreviousStep} variant="secondary" size="lg" className="flex-1" leftIcon={ICONS.chevronDown("rotate-90 w-5 h-5")}>
                    Geri
                </Button>
                <Button onClick={handlePlaceOrder} isLoading={isSubmitting} size="lg" className="flex-1" leftIcon={ICONS.checkCircle("w-5 h-5")}>
                    Siparişi Gönder
                </Button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4.5rem)] sm:h-[calc(100vh-5rem)]"> 
        <div className="p-3 sm:p-4 pt-3 sm:pt-5"> 
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-2 sm:mb-3 text-center sm:text-left">Yeni Sipariş Oluştur</h1>
            {stepIndicator}
        </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="flex-grow flex flex-col overflow-hidden" 
        >
          {renderStepContent()}
        </motion.div>
      </AnimatePresence>

      <Modal 
        isOpen={isOrderSuccessModalOpen} 
        onClose={() => setIsOrderSuccessModalOpen(false)} 
        title="Sipariş Başarıyla Alındı!"
        titleIcon={ICONS.checkCircle("w-6 h-6 text-green-500")}
      >
        <div className="text-center py-4">
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-2">
            Siparişiniz mutfağa iletildi.
          </p>
          <p className="text-md text-gray-600 dark:text-gray-400">
            Sipariş No: <span className="font-semibold text-primary-DEFAULT">{lastOrderId?.substring(0,6).toUpperCase()}</span>
          </p>
          <Button onClick={() => setIsOrderSuccessModalOpen(false)} className="mt-8" size="lg">
            Harika!
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default CashierPage;