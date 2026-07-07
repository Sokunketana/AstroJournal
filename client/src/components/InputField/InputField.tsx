import React from 'react';
import type { InputFieldProps } from './InputField.types';

const InputField: React.FC<InputFieldProps> = ({ label, className = '', ...props }) => {
  return (
    <div>
      {label && <label className="block text-sm font-medium mb-1">{label}</label>}
      <input
        className={`w-full bg-[#1a1a1a] border border-[#333] rounded p-2 focus:border-purple-500 outline-none ${className}`}
        {...props}
      />
    </div>
  );
};

export default InputField;
