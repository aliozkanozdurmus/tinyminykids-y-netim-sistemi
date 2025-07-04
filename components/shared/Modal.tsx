
import React from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { ICONS } from '../../constants';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'; // Added 2xl
  footer?: React.ReactNode;
  titleIcon?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md', footer, titleIcon }) => {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  const backdropVariants: Variants = {
    visible: { opacity: 1 },
    hidden: { opacity: 0 },
  };

  const modalVariants: Variants = {
    hidden: { y: "-30px", opacity: 0, scale: 0.95 },
    visible: { 
      y: "0", 
      opacity: 1, 
      scale: 1,
      transition: { type: "spring" as const, stiffness: 300, damping: 25, mass: 0.8 } 
    },
    exit: { y: "30px", opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
  };


  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 dark:bg-black dark:bg-opacity-75"
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={backdropVariants}
          onClick={onClose} 
        >
          <motion.div
            className={`bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden w-full ${sizeClasses[size]} flex flex-col max-h-[90vh]`}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()} 
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                {titleIcon && <span className="mr-2 text-primary-DEFAULT">{titleIcon}</span>}
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Close modal"
              >
                {ICONS.xCircle('w-6 h-6')}
              </button>
            </div>
            <div className="p-5 md:p-6 flex-grow overflow-y-auto">
              {children}
            </div>
            {footer && (
              <div className="px-5 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-600 flex justify-end space-x-3">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Modal;