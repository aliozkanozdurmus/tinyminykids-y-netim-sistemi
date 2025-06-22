

import React from 'react';
import { motion } from 'framer-motion';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  isLoading = false,
  className = '',
  disabled, 
  ...otherProps 
}) => {
  const baseStyles = "font-semibold rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 transition-all duration-200 ease-in-out inline-flex items-center justify-center shadow-sm hover:shadow-md";

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm", // Increased padding slightly for md
    lg: "px-7 py-3 text-base",  // Increased padding slightly for lg
  };

  const variantStyles = {
    primary: "bg-primary-DEFAULT text-gray-800 dark:text-white hover:bg-primary-dark focus-visible:ring-primary-DEFAULT",
    secondary: "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 focus-visible:ring-gray-400",
    danger: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500",
    ghost: "bg-transparent text-primary-DEFAULT dark:text-primary-light hover:bg-primary-DEFAULT/10 dark:hover:bg-primary-light/10 focus-visible:ring-primary-DEFAULT !shadow-none",
    outline: "bg-transparent border border-primary-DEFAULT text-primary-DEFAULT hover:bg-primary-DEFAULT/10 dark:border-primary-light dark:text-primary-light dark:hover:bg-primary-light/10 focus-visible:ring-primary-DEFAULT",
  };
  
  const disabledStyles = "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-sm disabled:shadow-sm";
  const trulyDisabled = isLoading || disabled;

  const { 
    onAnimationStart: _htmlOnAnimationStart,
    onDragStart: _htmlOnDragStart,
    onDrag: _htmlOnDrag,
    onDragEnd: _htmlOnDragEnd,
    ...motionSafeProps 
  } = otherProps;

  let spinnerColorClass = "";
  if (variant === 'primary') {
    spinnerColorClass = "text-gray-800 dark:text-white";
  } else if (variant === 'secondary') {
    spinnerColorClass = "text-gray-700 dark:text-gray-200";
  } else if (variant === 'ghost' || variant === 'outline') {
    spinnerColorClass = "text-primary-DEFAULT dark:text-primary-light";
  } else if (variant === 'danger') {
    spinnerColorClass = "text-white";
  }


  return (
    <motion.button
      whileHover={{ scale: trulyDisabled ? 1 : 1.03, y: trulyDisabled? 0 : -1 }}
      whileTap={{ scale: trulyDisabled ? 1 : 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${disabledStyles} ${className}`}
      disabled={trulyDisabled}
      {...motionSafeProps}
    >
      {isLoading && (
        <svg className={`animate-spin -ml-1 mr-3 h-5 w-5 ${spinnerColorClass}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {leftIcon && !isLoading && <span className="mr-2 flex-shrink-0">{leftIcon}</span>}
      <span className="truncate">{children}</span>
      {rightIcon && !isLoading && <span className="ml-2 flex-shrink-0">{rightIcon}</span>}
    </motion.button>
  );
};

export default Button;