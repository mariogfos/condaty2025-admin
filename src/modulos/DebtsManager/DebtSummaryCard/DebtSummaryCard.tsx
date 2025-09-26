'use client';
import React from 'react';
import UnifiedCard from '../UnifiedCard/UnifiedCard';

interface DebtSummaryCardProps {
  title: string;
  amount: string;
  count: string;
  isActive?: boolean;
  onClick?: () => void;
}

const DebtSummaryCard: React.FC<DebtSummaryCardProps> = ({
  title,
  amount,
  count,
  isActive = false,
  onClick
}) => {
  return (
    <UnifiedCard
      variant="summary"
      title={title}
      amount={amount}
      count={count}


    />
  );
};

export default DebtSummaryCard;
