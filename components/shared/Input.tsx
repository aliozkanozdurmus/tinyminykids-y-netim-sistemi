
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  containerClassName?: string;
}

const Input: React.FC<InputProps> = ({ label, name, error, leftIcon, className = '', containerClassName = '', ...props }) => {
  const baseInputClasses = "block w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-DEFAULT/40 focus:border-primary-DEFAULT sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-150 ease-in-out";
  const errorInputClasses = "border-red-500 dark:border-red-400 focus:ring-red-500/40 focus:border-red-500";
  const iconPadding = leftIcon ? "pl-10" : "";

  return (
    <div className={`mb-4 ${containerClassName}`}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative rounded-lg shadow-sm">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
            {leftIcon}
          </div>
        )}
        <input
          id={name}
          name={name}
          className={`${baseInputClasses} ${error ? errorInputClasses : ''} ${iconPadding} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-red-600 dark:text-red-500">{error}</p>}
    </div>
  );
};

export default Input;