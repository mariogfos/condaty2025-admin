import { CSSProperties } from "react";

export interface IUploadFileProps {
  name: string;
  value?: string | string[]; // URL or array of URLs
  onChange: (e: { target: { name: string; value: string | string[] } }) => void;
  accept?: string[]; // e.g. ['jpg', 'png', 'pdf']
  maxFiles?: number;
  maxSize?: number; // in MB
  prefix?: string;
  global?: boolean;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  style?: CSSProperties;
  label?: string;
  error?: string;
  placeholder?: string;
  showPreview?: boolean;
}
