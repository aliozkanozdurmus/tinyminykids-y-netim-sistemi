
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Order, OrderStatus } from '../types';
import { apiService } from '../services/apiService';
import Button from '../components/shared/Button';
import { ICONS, getOrderStatusColor } from '../constants';

interface WaiterOrderCardProps {
  order: Order;
  onMarkAsServed: (orderId: string) => void;
}

const WaiterOrderCard: React.FC<WaiterOrderCardProps> = ({ order, onMarkAsServed }) => {
  const timeSinceReady = Math.round((Date.now() - order.updatedAt) / 60000); // Time since last update (marked as READY)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-5 border-l-4 border-green-500"
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">Masa: {order.tableNumber}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Sipariş No: {order.id.substring(0,6)}</p>
        </div>
        <span className={`px-3 py-1 text-xs font-semibold text-white rounded-full ${getOrderStatusColor(order.status)}`}>
          {order.status}
        </span>
      </div>
      <p className="text-sm text-green-600 dark:text-green-400 font-medium mb-3">
        {timeSinceReady} dk önce hazırlandı.
      </p>
      
      <ul className="space-y-1 mb-4 max-h-32 overflow-y-auto pr-1 text-sm">
        {order.items.map((item) => (
          <li key={item.productId} className="flex justify-between text-gray-700 dark:text-gray-300">
            <span>{item.productName}</span>
            <span className="font-medium">x {item.quantity}</span>
          </li>
        ))}
      </ul>
       {order.notes && (
        <div className="mb-3 p-2 text-xs bg-yellow-50 dark:bg-yellow-900/50 border-l-2 border-yellow-400 dark:border-yellow-600 rounded">
          <p className="text-yellow-700 dark:text-yellow-300"><span className="font-semibold">Not:</span> {order.notes}</p>
        </div>
      )}
      <Button 
        onClick={() => onMarkAsServed(order.id)}
        variant="primary"
        className="w-full"
        leftIcon={ICONS.checkCircle()}
      >
        Servis Edildi
      </Button>
    </motion.div>
  );
};


const WaiterPage: React.FC = () => {
  const [readyOrders, setReadyOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReadyOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const orders = await apiService.getOrders({ status: OrderStatus.READY });
      setReadyOrders(orders.sort((a,b) => a.updatedAt - b.updatedAt)); // Oldest ready first
    } catch (err) {
      console.error("Hazır siparişler yüklenirken hata:", err);
      setError("Hazır siparişler yüklenemedi. Lütfen tekrar deneyin.");
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchReadyOrders();
    const interval = setInterval(fetchReadyOrders, 20000); // Auto-refresh every 20 seconds
    return () => clearInterval(interval);
  }, [fetchReadyOrders]);

  const handleMarkAsServed = async (orderId: string) => {
    setIsLoading(true); // Can use a specific loading state for the card if preferred
    try {
      await apiService.updateOrderStatus(orderId, OrderStatus.SERVED);
      fetchReadyOrders(); // Re-fetch to update list
    } catch (err) {
      console.error("Sipariş servis edildi olarak işaretlenirken hata:", err);
      alert("Sipariş durumu güncellenemedi.");
    }
    setIsLoading(false);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center">
          {ICONS.waiter("mr-3 w-8 h-8 text-primary-DEFAULT")} Garson Ekranı - Hazır Siparişler
        </h1>
        <Button onClick={fetchReadyOrders} isLoading={isLoading} leftIcon={ICONS.refresh()}>
          Yenile
        </Button>
      </div>

      {error && <p className="text-red-500 text-center mb-4">{error}</p>}

      {isLoading && readyOrders.length === 0 && (
         <div className="flex justify-center items-center h-64">
          <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-primary-DEFAULT"></div>
          <p className="ml-3 text-lg text-gray-600 dark:text-gray-300">Hazır siparişler yükleniyor...</p>
        </div>
      )}

      {!isLoading && readyOrders.length === 0 && !error && (
        <div className="text-center py-10">
          {ICONS.checkCircle("w-16 h-16 text-green-500 mx-auto mb-4")}
          <p className="text-xl text-gray-600 dark:text-gray-400">Servis edilecek hazır sipariş bulunmamaktadır.</p>
        </div>
      )}

      <AnimatePresence>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {readyOrders.map((order) => (
            <WaiterOrderCard key={order.id} order={order} onMarkAsServed={handleMarkAsServed} />
          ))}
        </div>
      </AnimatePresence>
    </div>
  );
};

export default WaiterPage;
    