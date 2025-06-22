import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Order, OrderStatus } from '../types';
import { apiService } from '../services/apiService';
import Button from '../components/shared/Button';
import { ICONS, getOrderStatusColor } from '../constants';

interface WaiterOrderCardProps {
  order: Order;
  onMarkAsServed: (orderId: string) => void;
  isProcessing?: boolean; // To show loading on the specific card
}

const WaiterOrderCard: React.FC<WaiterOrderCardProps> = ({ order, onMarkAsServed, isProcessing }) => {
  const timeSinceReady = Math.round((Date.now() - order.updatedAt) / 60000); // Time since last update (marked as READY)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -20 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 flex flex-col border-l-4 border-green-500 dark:border-green-400"
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Masa: {order.tableNumber}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Sipariş No: {order.id.substring(0,6).toUpperCase()}</p>
        </div>
        <span className={`px-3 py-1 text-xs font-semibold text-white rounded-full shadow-sm ${getOrderStatusColor(order.status)}`}>
          {order.status}
        </span>
      </div>
      <p className="text-sm text-green-600 dark:text-green-400 font-medium mb-3 flex items-center">
        {ICONS.checkCircle("w-4 h-4 mr-1.5")}
        {timeSinceReady} dk önce hazırlandı.
      </p>
      
      <ul className="space-y-2 mb-4 flex-grow max-h-36 overflow-y-auto pr-1 text-sm custom-scrollbar">
        {order.items.map((item, index) => (
          <li key={`${item.productId}-${index}`} className="flex justify-between text-gray-700 dark:text-gray-300 border-b border-dashed border-gray-200 dark:border-gray-700 pb-1.5 last:border-b-0">
            <span className="flex-1 mr-2">{item.productName}</span>
            <span className="font-semibold text-primary-DEFAULT dark:text-primary-light">x {item.quantity}</span>
          </li>
        ))}
      </ul>
       {order.notes && (
        <div className="mb-4 p-3 text-xs bg-yellow-50 dark:bg-yellow-800/30 border-l-4 border-yellow-400 dark:border-yellow-500 rounded-md">
          <p className="text-yellow-700 dark:text-yellow-300"><span className="font-semibold">Not:</span> {order.notes}</p>
        </div>
      )}
      <Button 
        onClick={() => onMarkAsServed(order.id)}
        variant="primary"
        className="w-full mt-auto"
        leftIcon={ICONS.checkCircle("w-5 h-5")}
        isLoading={isProcessing}
        size="md"
      >
        Servis Edildi Olarak İşaretle
      </Button>
    </motion.div>
  );
};


const WaiterPage: React.FC = () => {
  const [readyOrders, setReadyOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false); // General loading for fetch
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null); // For specific card loading
  const [error, setError] = useState<string | null>(null);

  const fetchReadyOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const orders = await apiService.getOrders({ status: OrderStatus.READY });
      setReadyOrders(orders.sort((a,b) => a.updatedAt - b.updatedAt)); 
    } catch (err) {
      console.error("Hazır siparişler yüklenirken hata:", err);
      setError("Hazır siparişler yüklenemedi. Lütfen tekrar deneyin.");
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchReadyOrders();
    const interval = setInterval(fetchReadyOrders, 15000); // Refresh every 15 seconds
    return () => clearInterval(interval);
  }, [fetchReadyOrders]);

  const handleMarkAsServed = async (orderId: string) => {
    setProcessingOrderId(orderId);
    // Optimistic UI update: Remove the order from the list immediately
    setReadyOrders(prevOrders => prevOrders.filter(o => o.id !== orderId));
    try {
      await apiService.updateOrderStatus(orderId, OrderStatus.SERVED);
      // Successfully marked as served. The optimistic update already handled the UI.
    } catch (err) {
      console.error("Sipariş servis edildi olarak işaretlenirken hata:", err);
      alert("Sipariş durumu güncellenemedi. Lütfen listeyi yenileyin.");
      // Revert optimistic update by re-fetching if an error occurs
      fetchReadyOrders();
    }
    setProcessingOrderId(null);
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white flex items-center mb-3 sm:mb-0">
          {ICONS.waiter("mr-3 w-7 h-7 sm:w-8 sm:h-8 text-primary-DEFAULT")} Garson Servis Ekranı
        </h1>
        <Button 
            onClick={fetchReadyOrders} 
            isLoading={isLoading && !processingOrderId} // Show general loading if no specific card is processing
            leftIcon={ICONS.refresh("w-4 h-4")} 
            size="md"
        >
          Siparişleri Yenile
        </Button>
      </div>

      {error && <p className="text-red-500 dark:text-red-400 text-center mb-4 p-3 bg-red-100 dark:bg-red-700/30 rounded-lg">{error}</p>}

      {isLoading && readyOrders.length === 0 && (
        <div className="flex flex-col justify-center items-center h-64 text-center">
          <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-primary-DEFAULT"></div>
          <p className="ml-3 text-lg text-gray-600 dark:text-gray-300 mt-4">Hazır siparişler yükleniyor...</p>
        </div>
      )}

      {!isLoading && readyOrders.length === 0 && !error && (
        <div className="text-center py-10">
          {ICONS.checkCircle("w-20 h-20 text-green-500 dark:text-green-400 mx-auto mb-4 opacity-80")}
          <p className="text-xl text-gray-600 dark:text-gray-400">Harika! Servis edilecek hazır sipariş bulunmamaktadır.</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Yeni hazır siparişler burada görünecektir.</p>
        </div>
      )}

      <AnimatePresence>
        {readyOrders.length > 0 && (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ staggerChildren: 0.1 }}
          >
            {readyOrders.map((order) => (
              <WaiterOrderCard
                key={order.id}
                order={order}
                onMarkAsServed={handleMarkAsServed}
                isProcessing={processingOrderId === order.id}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WaiterPage;
