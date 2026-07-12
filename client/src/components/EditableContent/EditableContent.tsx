import React from 'react';

export interface EditableContentProps {
  isEditing: boolean;
  value: string;
  onValueChange: (value: string) => void;
  displayContent: string;
  textareaClassName?: string;
  displayClassName?: string;
  containerClassName?: string;
  children?: React.ReactNode;
}

const EditableContent: React.FC<EditableContentProps> = ({
  isEditing,
  value,
  onValueChange,
  displayContent,
  textareaClassName = '',
  displayClassName = '',
  containerClassName = '',
  children
}) => {
  if (isEditing) {
    return (
      <div className={containerClassName}>
        <textarea
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          className={`w-full bg-white/5 border border-white/10 text-white font-light italic focus:outline-none focus:border-purple-500 transition-colors resize-none ${textareaClassName}`}
          autoFocus
        />
        {children}
      </div>
    );
  }

  return (
    <p className={`text-white font-light italic ${displayClassName}`}>
      "{displayContent}"
    </p>
  );
};

export default EditableContent;
