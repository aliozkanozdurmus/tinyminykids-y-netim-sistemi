
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../components/shared/Button';
import { ICONS } from '../constants';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 text-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: 0.5,
          type: "spring",
          stiffness: 100,
        }}
      >
        {ICONS.xCircle("w-32 h-32 text-red-500 dark:text-red-400 mb-8")}
      </motion.div>
      
      <motion.h1 
        className="text-6xl font-extrabold text-gray-800 dark:text-white mb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        404
      </motion.h1>
      
      <motion.p 
        className="text-2xl font-semibold text-gray-600 dark:text-gray-300 mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        Sayfa Bulunamadı
      </motion.p>
      
      <motion.p 
        className="text-lg text-gray-500 dark:text-gray-400 mb-10 max-w-md"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        Aradığınız sayfa mevcut değil, taşınmış veya silinmiş olabilir. Lütfen adresi kontrol edin veya ana sayfaya dönün.
      </motion.p>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        <Link to="/">
          <Button size="lg" variant="primary">
            Ana Sayfaya Dön
          </Button>
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;
    