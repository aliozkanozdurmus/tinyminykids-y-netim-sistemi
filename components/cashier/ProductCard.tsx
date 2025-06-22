import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import { Product } from '../../types';
import Button from '../shared/Button';
import { ICONS, formatPrice } from '../../constants';
import { ThemeContext } from '../../contexts/ThemeContext';

interface ProductCardProps {
  product: Product;
  quantityInCart: number;
  onUpdateQuantity: (productId: string, newQuantity: number) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, quantityInCart, onUpdateQuantity }) => {
  const isActuallyAvailable = product.isAvailable;
  const themeContext = useContext(ThemeContext);

  const displayPrice = themeContext 
    ? formatPrice(product.price, themeContext.currency) 
    : `${product.price.toFixed(2)} TL`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-xl"
    >
      {!isActuallyAvailable && (
        <div className="w-full py-1 bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
          <span className="text-red-600 dark:text-red-300 font-semibold text-xs px-2">Stokta Yok</span>
        </div>
      )}
      
      <div className="p-3 sm:p-4 flex flex-col flex-grow">
        <h3 className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-white mb-0.5 truncate" title={product.name}>{product.name}</h3>
        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mb-1 sm:mb-1.5 uppercase tracking-wide">{product.category}</p>
        
        <div className="mt-auto">
          <p className="text-sm sm:text-base font-bold text-primary-DEFAULT dark:text-primary-light mb-1.5 sm:mb-2">
            {displayPrice}
          </p>
          
          {isActuallyAvailable ? (
            quantityInCart > 0 ? (
              <div className="flex items-center justify-between w-full space-x-1 sm:space-x-1.5">
                <Button
                  onClick={() => onUpdateQuantity(product.id, quantityInCart - 1)}
                  variant="outline"
                  size="sm"
                  className="!p-1.5 sm:!p-2 aspect-square !rounded-md flex-shrink-0"
                  aria-label="Azalt"
                >
                  {ICONS.minus("w-3 h-3 sm:w-4 sm:h-4")}
                </Button>
                <span className="mx-1 sm:mx-1.5 text-xs sm:text-sm font-semibold text-gray-800 dark:text-white min-w-[16px] text-center">
                  {quantityInCart}
                </span>
                <Button
                  onClick={() => onUpdateQuantity(product.id, quantityInCart + 1)}
                  variant="outline"
                  size="sm"
                  className="!p-1.5 sm:!p-2 aspect-square !rounded-md flex-shrink-0"
                  aria-label="Artır"
                >
                  {ICONS.plus("w-3 h-3 sm:w-4 sm:h-4")}
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => onUpdateQuantity(product.id, 1)}
                leftIcon={ICONS.add("w-3 h-3 sm:w-4 sm:h-4")}
                variant={'primary'}
                className="w-full !text-[11px] sm:!text-xs !py-1.5 sm:!py-2"
                size="sm"
              >
                Sepete Ekle
              </Button>
            )
          ) : (
            <Button
              disabled={true}
              variant={'secondary'}
              className="w-full !text-[11px] sm:!text-xs !py-1.5 sm:!py-2 !bg-gray-300 dark:!bg-gray-600 !text-gray-500 dark:!text-gray-400 cursor-not-allowed"
              size="sm"
            >
              Stokta Yok
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;