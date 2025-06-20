
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product, OrderItem, OrderStatus, TableConfiguration } from '../types';
import { apiService } from '../services/apiService';
import ProductCard from '../components/cashier/ProductCard';
import Button from '../components/shared/Button';
import Input from '../components/shared/Input';
import Modal from '../components/shared/Modal';
import { ICONS, DEFAULT_IMAGE_URL } from '../constants';

const CashierPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [tableNumber, setTableNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOrderSuccessModalOpen, setIsOrderSuccessModalOpen] = useState(false);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);
  const [tableConfiguration, setTableConfiguration] = useState<TableConfiguration | null>(null);
  const [availableTables, setAvailableTables] = useState<number[]>([]);

  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedProducts, fetchedCategories, fetchedTableConfig] = await Promise.all([
        apiService.getProducts({ isAvailable: true }),
        apiService.getProductCategories(),
        apiService.getTableConfiguration()
      ]);
      setProducts(fetchedProducts);
      setCategories(['all', ...fetchedCategories]);
      setTableConfiguration(fetchedTableConfig);
      if (fetchedTableConfig) {
        const tablesArray = Array.from(
          { length: fetchedTableConfig.maxTable - fetchedTableConfig.minTable + 1 },
          (_, i) => fetchedTableConfig.minTable + i
        );
        setAvailableTables(tablesArray);
      }
    } catch (error) {
        console.error("Error fetching initial data for cashier page:", error);
        // Fallback or display error message
        const defaultConfig = await apiService.getDefaultTableConfiguration();
        setTableConfiguration(defaultConfig);
         const tablesArray = Array.from(
          { length: defaultConfig.maxTable - defaultConfig.minTable + 1 },
          (_, i) => defaultConfig.minTable + i
        );
        setAvailableTables(tablesArray);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.productId === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { productId: product.id, productName: product.name, quantity: 1, priceAtOrder: product.price }];
    });
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    setCart((prevCart) => {
      if (newQuantity <= 0) {
        return prevCart.filter((item) => item.productId !== productId);
      }
      return prevCart.map((item) =>
        item.productId === productId ? { ...item, quantity: newQuantity } : item
      );
    });
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.priceAtOrder * item.quantity, 0);

  const handlePlaceOrder = async () => {
    if (cart.length === 0 || !tableNumber) {
      alert('Lütfen sepete ürün ekleyin ve masa numarası seçin.');
      return;
    }
    setIsLoading(true);
    try {
      const newOrder = await apiService.addOrder({ items: cart, tableNumber, notes, status: OrderStatus.PENDING });
      setLastOrderId(newOrder.id);
      setIsOrderSuccessModalOpen(true);
      setCart([]);
      setTableNumber('');
      setNotes('');
    } catch (error) {
      console.error('Sipariş verilirken hata:', error);
      alert('Sipariş verilirken bir hata oluştu.');
    }
    setIsLoading(false);
  };
  
  const filteredProducts = products.filter(product => 
    (selectedCategory === 'all' || product.category === selectedCategory) &&
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)]"> {/* Adjust height based on Navbar */}
      {/* Product Selection Area */}
      <div className="lg:w-3/5 p-4 overflow-y-auto">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Yeni Sipariş</h1>
        
        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center">
          <Input 
            type="text"
            placeholder="Ürün Ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            containerClassName="flex-grow sm:mb-0"
            className="w-full"
          />
          <div className="relative w-full sm:w-auto">
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="appearance-none w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:border-gray-400 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:ring-1 focus:ring-primary-DEFAULT text-gray-700 dark:text-gray-200"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat === 'all' ? 'Tüm Kategoriler' : cat}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
              {ICONS.chevronDown()}
            </div>
          </div>
        </div>

        {isLoading && products.length === 0 && <p className="text-center text-gray-500 dark:text-gray-400">Ürünler yükleniyor...</p>}
        {!isLoading && filteredProducts.length === 0 && <p className="text-center text-gray-500 dark:text-gray-400">Bu kriterlere uygun ürün bulunamadı.</p>}
        
        <AnimatePresence>
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-6"
            layout
          >
            {filteredProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onAddToCart={addToCart} 
                isInCart={cart.some(item => item.productId === product.id)}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Cart Area */}
      <div className="lg:w-2/5 p-6 bg-gray-50 dark:bg-gray-800 shadow-lg flex flex-col">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6 flex items-center">
            {ICONS.cart("mr-2 w-7 h-7 text-primary-DEFAULT")} Sipariş Özeti
        </h2>
        
        {/* Table Selection */}
        <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Masa Numarası: <span className="text-primary-DEFAULT font-semibold">{tableNumber || "Seçilmedi"}</span></h3>
            {availableTables.length > 0 ? (
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-1 pb-1 border dark:border-gray-700 p-2 rounded-md">
                    {availableTables.map(num => (
                        <Button
                            key={num}
                            onClick={() => setTableNumber(num.toString())}
                            variant={tableNumber === num.toString() ? 'primary' : 'outline'}
                            size="sm"
                            className="!px-3 !py-1.5 min-w-[40px] justify-center"
                        >
                            {num}
                        </Button>
                    ))}
                </div>
            ) : (
                 <p className="text-sm text-gray-500 dark:text-gray-400">Masa numaraları yükleniyor...</p>
            )}
        </div>


        {cart.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 flex-grow flex items-center justify-center">Sepetiniz boş.</p>
        ) : (
          <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-3 mb-4">
            {cart.map((item) => (
              <motion.div 
                key={item.productId} 
                layout 
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg shadow"
              >
                <div>
                  <p className="font-semibold text-gray-800 dark:text-white">{item.productName}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{item.priceAtOrder.toFixed(2)} TL</p>
                </div>
                <div className="flex items-center">
                  <Button variant="ghost" size="sm" onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="p-1">{ICONS.minus()}</Button>
                  <span className="mx-2 w-6 text-center font-semibold text-gray-700 dark:text-gray-200">{item.quantity}</span>
                  <Button variant="ghost" size="sm" onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="p-1">{ICONS.plus()}</Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
        
        <div className="mt-auto border-t dark:border-gray-700 pt-6">
          <div className="mb-4">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sipariş Notları (Opsiyonel)
            </label>
            <textarea
                id="notes"
                name="notes"
                rows={2}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-DEFAULT focus:border-primary-DEFAULT sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Örn: Az şekerli, Soğansız..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            Toplam: {totalAmount.toFixed(2)} TL
          </div>
          <Button 
            onClick={handlePlaceOrder} 
            disabled={cart.length === 0 || !tableNumber || isLoading}
            isLoading={isLoading}
            className="w-full"
            size="lg"
          >
            Siparişi Gönder
          </Button>
        </div>
      </div>

      <Modal isOpen={isOrderSuccessModalOpen} onClose={() => setIsOrderSuccessModalOpen(false)} title="Sipariş Başarılı!">
        <div className="text-center">
          {ICONS.checkCircle("w-16 h-16 text-green-500 mx-auto mb-4")}
          <p className="text-lg text-gray-700 dark:text-gray-300">
            Siparişiniz başarıyla alındı! <br/> Sipariş No: <span className="font-semibold">{lastOrderId?.substring(0,6)}</span>
          </p>
          <Button onClick={() => setIsOrderSuccessModalOpen(false)} className="mt-6">
            Kapat
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default CashierPage;