
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Order, OrderStatus } from '../types';
import { apiService } from '../services/apiService';
import OrderTicket from '../components/kitchen/OrderTicket';
import Button from '../components/shared/Button';
import { ICONS } from '../constants';

const KitchenPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const pendingOrders = await apiService.getOrders({ status: [OrderStatus.PENDING, OrderStatus.PREPARING] });
      setOrders(pendingOrders.sort((a,b) => a.createdAt - b.createdAt)); 
    } catch (err) {
      console.error("Siparişler yüklenirken hata:", err);
      setError("Siparişler yüklenemedi. Lütfen tekrar deneyin.");
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 15000); // Refresh every 15 seconds
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    // Optimistic UI update attempt
    const originalOrders = [...orders];
    setOrders(prevOrders => 
        prevOrders.map(o => o.id === orderId ? {...o, status: newStatus} : o)
                  .filter(o => newStatus === OrderStatus.READY ? o.id !== orderId : true) // Remove if marked ready
    );

    try {
      await apiService.updateOrderStatus(orderId, newStatus);
      // If server confirms, fetchOrders will ensure consistency, otherwise optimistic update is fine for now
      if (newStatus === OrderStatus.READY) {
          // No need to call fetchOrders immediately if we optimistically removed
      } else {
          fetchOrders(); // Re-fetch for PREPARING status to confirm
      }
    } catch (err) {
      console.error("Sipariş durumu güncellenirken hata:", err);
      alert("Sipariş durumu güncellenemedi. Lütfen listeyi yenileyin.");
      setOrders(originalOrders); // Revert optimistic update on error
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white flex items-center mb-3 sm:mb-0">
          {ICONS.kitchen("mr-3 w-7 h-7 sm:w-8 sm:h-8 text-primary-DEFAULT")} Mutfak Sipariş Ekranı
        </h1>
        <Button onClick={fetchOrders} isLoading={isLoading} leftIcon={ICONS.refresh("w-4 h-4")} size="md">
          Siparişleri Yenile
        </Button>
      </div>

      {error && <p className="text-red-500 dark:text-red-400 text-center mb-4 p-3 bg-red-100 dark:bg-red-700/30 rounded-lg">{error}</p>}
      
      {isLoading && orders.length === 0 && (
        <div className="flex flex-col justify-center items-center h-64 text-center">
          <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-primary-DEFAULT"></div>
          <p className="ml-3 text-lg text-gray-600 dark:text-gray-300 mt-4">Siparişler yükleniyor...</p>
        </div>
      )}

      {!isLoading && orders.length === 0 && !error && (
        <div className="text-center py-10">
          {ICONS.checkCircle("w-20 h-20 text-green-500 dark:text-green-400 mx-auto mb-4 opacity-80")}
          <p className="text-xl text-gray-600 dark:text-gray-400">Harika! Bekleyen sipariş bulunmamaktadır.</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Yeni siparişler burada görünecektir.</p>
        </div>
      )}

      <AnimatePresence>
        {orders.length > 0 && (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ staggerChildren: 0.1 }}
          >
            {orders.map((order) => (
              <OrderTicket key={order.id} order={order} onUpdateStatus={handleUpdateStatus} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default KitchenPage;