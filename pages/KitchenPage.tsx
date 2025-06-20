
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
      setOrders(pendingOrders.sort((a,b) => a.createdAt - b.createdAt)); // Oldest first for kitchen
    } catch (err) {
      console.error("Siparişler yüklenirken hata:", err);
      setError("Siparişler yüklenemedi. Lütfen tekrar deneyin.");
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000); // Auto-refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    setIsLoading(true);
    try {
      await apiService.updateOrderStatus(orderId, newStatus);
      fetchOrders(); // Re-fetch to update list
    } catch (err) {
      console.error("Sipariş durumu güncellenirken hata:", err);
      alert("Sipariş durumu güncellenemedi.");
    }
    setIsLoading(false);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center">
          {ICONS.kitchen("mr-3 w-8 h-8 text-primary-DEFAULT")} Mutfak Ekranı
        </h1>
        <Button onClick={fetchOrders} isLoading={isLoading} leftIcon={ICONS.refresh()}>
          Yenile
        </Button>
      </div>

      {error && <p className="text-red-500 text-center mb-4">{error}</p>}
      
      {isLoading && orders.length === 0 && (
        <div className="flex justify-center items-center h-64">
          <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-primary-DEFAULT"></div>
          <p className="ml-3 text-lg text-gray-600 dark:text-gray-300">Siparişler yükleniyor...</p>
        </div>
      )}

      {!isLoading && orders.length === 0 && !error && (
        <div className="text-center py-10">
          {ICONS.checkCircle("w-16 h-16 text-green-500 mx-auto mb-4")}
          <p className="text-xl text-gray-600 dark:text-gray-400">Bekleyen sipariş bulunmamaktadır.</p>
        </div>
      )}

      <AnimatePresence>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {orders.map((order) => (
            <OrderTicket key={order.id} order={order} onUpdateStatus={handleUpdateStatus} />
          ))}
        </div>
      </AnimatePresence>
    </div>
  );
};

export default KitchenPage;
    