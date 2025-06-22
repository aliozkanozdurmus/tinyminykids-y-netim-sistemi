
import React from 'react';
import { motion } from 'framer-motion';
import { Order, OrderStatus } from '../../types';
import Button from '../shared/Button';
import { ICONS, getOrderStatusColor } from '../../constants';

interface OrderTicketProps {
  order: Order;
  onUpdateStatus: (orderId: string, newStatus: OrderStatus) => void;
}

const OrderTicket: React.FC<OrderTicketProps> = ({ order, onUpdateStatus }) => {
  const timeSinceOrder = Math.round((Date.now() - order.createdAt) / 60000); // in minutes

  let statusIcon;
  let statusTextClass = "text-gray-700 dark:text-gray-200";
  let borderColorClass = "border-gray-300 dark:border-gray-600";


  if (order.status === OrderStatus.PENDING) {
    statusIcon = ICONS.kitchen("w-5 h-5 text-amber-500 dark:text-amber-400");
    borderColorClass = "border-l-amber-500 dark:border-l-amber-400";
  } else if (order.status === OrderStatus.PREPARING) {
    statusIcon = <div className="w-5 h-5 animate-ping-slow rounded-full bg-blue-500 opacity-75"></div>;
    borderColorClass = "border-l-blue-500";
    statusTextClass = "text-blue-600 dark:text-blue-400 font-semibold";
  }


  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 flex flex-col border-l-4 ${borderColorClass}`}
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Masa: {order.tableNumber}</h3>
        <span className={`px-3 py-1 text-xs font-semibold text-white rounded-full shadow-sm ${getOrderStatusColor(order.status)}`}>
          {order.status}
        </span>
      </div>
      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-4">
        {statusIcon}
        <span className={`ml-1.5 ${statusTextClass}`}>
            Sipariş No: {order.id.substring(0, 6)} - {timeSinceOrder} dk önce
        </span>
      </div>
      
      <ul className="space-y-2.5 mb-5 flex-grow max-h-48 overflow-y-auto pr-2 custom-scrollbar">
        {order.items.map((item, index) => (
          <li key={`${item.productId}-${index}`} className="flex justify-between items-center text-gray-700 dark:text-gray-300 border-b border-dashed border-gray-200 dark:border-gray-700 pb-1.5 last:border-b-0">
            <span className="flex-1 mr-2">{item.productName}</span>
            <span className="font-semibold text-primary-DEFAULT dark:text-primary-light">x {item.quantity}</span>
          </li>
        ))}
      </ul>

      {order.notes && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-800/30 border-l-4 border-yellow-400 dark:border-yellow-500 rounded-md">
          <p className="text-sm text-yellow-700 dark:text-yellow-300"><span className="font-semibold">Not:</span> {order.notes}</p>
        </div>
      )}

      <div className="mt-auto">
        {order.status === OrderStatus.PENDING && (
          <Button 
            onClick={() => onUpdateStatus(order.id, OrderStatus.PREPARING)}
            variant="secondary"
            size="md"
            className="w-full"
            leftIcon={ICONS.refresh("w-4 h-4")}
          >
            Hazırlamaya Başla
          </Button>
        )}
        {order.status === OrderStatus.PREPARING && (
          <Button 
            onClick={() => onUpdateStatus(order.id, OrderStatus.READY)}
            variant="primary"
            size="md"
            className="w-full"
            leftIcon={ICONS.checkCircle("w-5 h-5")}
          >
            Hazırlandı Olarak İşaretle
          </Button>
        )}
      </div>
    </motion.div>
  );
};

export default OrderTicket;

// Add this to your global CSS or a style tag in index.html for custom scrollbar
/*
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1; // gray-300
  border-radius: 3px;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: #4b5563; // gray-600
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #9ca3af; // gray-400
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #6b7280; // gray-500
}
*/
