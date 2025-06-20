
import React from 'react';
import { motion } from 'framer-motion';
import { Product } from '../../types';
import Button from '../shared/Button';
import { ICONS, DEFAULT_IMAGE_URL } from '../../constants';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  isInCart?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart, isInCart }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col transform hover:scale-105 transition-transform duration-200"
    >
      <img 
        src={product.imageUrl || DEFAULT_IMAGE_URL} 
        alt={product.name} 
        className="w-full h-40 object-cover" 
        onError={(e) => (e.currentTarget.src = DEFAULT_IMAGE_URL)}
      />
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{product.name}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{product.category}</p>
        <p className="text-xl font-bold text-primary-DEFAULT dark:text-primary-light mt-auto mb-3">
          {product.price.toFixed(2)} TL
        </p>
        <Button 
          onClick={() => onAddToCart(product)} 
          disabled={!product.isAvailable || isInCart}
          leftIcon={isInCart ? ICONS.checkCircle() : ICONS.add()}
          variant={isInCart ? 'ghost' : 'primary'}
          className="w-full mt-auto"
        >
          {isInCart ? 'Sepette' : (product.isAvailable ? 'Sepete Ekle' : 'Stokta Yok')}
        </Button>
      </div>
    </motion.div>
  );
};

export default ProductCard;
    