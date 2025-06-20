

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
  const baseStyles = "font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all duration-150 ease-in-out inline-flex items-center justify-center";

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  // Updated variantStyles to use CSS variables for themeable colors
  // and ensure text contrast on hover for primary.
  const variantStyles = {
    primary: "bg-[var(--color-primary-DEFAULT)] text-white hover:text-gray-900 dark:hover:text-gray-900 hover:bg-gradient-to-br from-[var(--color-primary-light)] to-[var(--color-primary-dark)] focus:ring-[var(--color-primary-DEFAULT)]",
    secondary: "bg-secondary-DEFAULT text-gray-900 hover:bg-secondary-dark hover:text-white focus:ring-secondary-DEFAULT", // Uses fixed Tailwind colors, changed text-white to text-gray-900
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500", // Uses fixed Tailwind colors
    ghost: "bg-transparent text-[var(--color-primary-DEFAULT)] dark:text-[var(--color-primary-light)] hover:bg-[var(--color-primary-light)]/20 dark:hover:bg-[var(--color-primary-dark)]/30 focus:ring-[var(--color-primary-DEFAULT)]",
    outline: "bg-transparent border border-[var(--color-primary-DEFAULT)] dark:border-[var(--color-primary-light)] text-[var(--color-primary-DEFAULT)] dark:text-[var(--color-primary-light)] hover:bg-[var(--color-primary-light)]/10 dark:hover:bg-[var(--color-primary-dark)]/20 focus:ring-[var(--color-primary-DEFAULT)]",
  };
  
  const disabledStyles = "disabled:opacity-50 disabled:cursor-not-allowed";

  const { 
    onAnimationStart: _htmlOnAnimationStart,
    onDragStart: _htmlOnDragStart,
    onDrag: _htmlOnDrag,
    onDragEnd: _htmlOnDragEnd,
    ...motionSafeProps 
  } = otherProps;

  let spinnerColorClass = "text-white";
  if (variant === 'ghost' || variant === 'outline') {
    spinnerColorClass = "text-[var(--color-primary-DEFAULT)] dark:text-[var(--color-primary-light)]";
  } else if (variant === 'secondary') {
    spinnerColorClass = "text-gray-900"; // Spinner color for secondary button base state
    // If you want spinner to be white on hover for secondary:
    // This logic would need to be more complex, potentially passing hover state to svg or using CSS to target.
    // For simplicity, keeping spinner consistent with base text color.
  }


  return (
    <motion.button
      whileHover={{ scale: isLoading || disabled ? 1 : 1.05 }}
      whileTap={{ scale: isLoading || disabled ? 1 : 0.95 }}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${disabledStyles} ${className}`}
      disabled={isLoading || disabled}
      {...motionSafeProps}
    >
      {isLoading && (
        <svg className={`animate-spin -ml-1 mr-3 h-5 w-5 ${spinnerColorClass}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {leftIcon && !isLoading && <span className="mr-2">{leftIcon}</span>}
      {children}
      {rightIcon && !isLoading && <span className="ml-2">{rightIcon}</span>}
    </motion.button>
  );
};

export default Button;