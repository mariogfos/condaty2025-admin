import React from 'react';
import { formatBs } from '@/mk/utils/numbers';

interface FormatBsAlignProps {
  value: number | string;
  alignRight?: boolean;
  className?: string;
}

const FormatBsAlign: React.FC<FormatBsAlignProps> = ({
  value,
  alignRight = false,
  className,
}) => {
  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: alignRight ? 'flex-end' : 'flex-start',
        alignItems: 'center',
      }}
      className={className}
    >
      {formatBs(value)}
    </div>
  );
};

export default FormatBsAlign;
