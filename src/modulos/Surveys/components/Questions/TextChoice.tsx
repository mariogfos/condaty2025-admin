import React from 'react';
import TextArea from '@/mk/components/forms/TextArea/TextArea';

interface TextChoiceProps {
  name: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  lines?: number;
}

const TextChoice: React.FC<TextChoiceProps> = ({
  name,
  value = '',
  onChange,
  placeholder = "Escribe tu respuesta...",
  disabled = false,
  readOnly = false,
  lines = 3,
}) => {
  return (
    <TextArea
      name={name}
      value={value}
      onChange={(e: any) => !readOnly && onChange(e.target.value)}
      placeholder={placeholder}
      lines={lines}
      disabled={disabled}
    />
  );
};

export default TextChoice;
