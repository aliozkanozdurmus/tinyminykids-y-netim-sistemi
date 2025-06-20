
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

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 mb-4 border-l-4 border-primary-DEFAULT"
    >
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white">Masa: {order.tableNumber}</h3>
        <span className={`px-3 py-1 text-xs font-semibold text-white rounded-full ${getOrderStatusColor(order.status)}`}>
          {order.status}
        </span>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
        Sipariş No: {order.id.substring(0, 6)} - {timeSinceOrder} dk önce
      </p>
      
      <ul className="space-y-2 mb-4 max-h-48 overflow-y-auto pr-2">
        {order.items.map((item) => (
          <li key={item.productId} className="flex justify-between items-center text-gray-700 dark:text-gray-300 border-b border-dashed dark:border-gray-700 pb-1">
            <span>{item.productName}</span>
            <span className="font-semibold">x {item.quantity}</span>
          </li>
        ))}
      </ul>

      {order.notes && (
        <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/50 border-l-2 border-yellow-400 dark:border-yellow-600 rounded">
          <p className="text-sm text-yellow-700 dark:text-yellow-300"><span className="font-semibold">Not:</span> {order.notes}</p>
        </div>
      )}

      <div className="mt-4 flex space-x-2">
        {order.status === OrderStatus.PENDING && (
          <Button 
            onClick={() => onUpdateStatus(order.id, OrderStatus.PREPARING)}
            variant="secondary"
            size="sm"
            className="flex-1"
          >
            Hazırlamaya Başla
          </Button>
        )}
        {order.status === OrderStatus.PREPARING && (
          <Button 
            onClick={() => onUpdateStatus(order.id, OrderStatus.READY)}
            variant="primary"
            size="sm"
            className="flex-1"
            leftIcon={ICONS.checkCircle()}
          >
            Hazırlandı
          </Button>
        )}
      </div>
    </motion.div>
  );
};

export default OrderTicket;
    