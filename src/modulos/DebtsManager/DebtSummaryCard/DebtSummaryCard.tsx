'use client';
import React from 'react';
import UnifiedCard from '../UnifiedCard/UnifiedCard';

interface DebtSummaryCardProps {
  title: string;
  amount: string;
  count: string;
  isActive?: boolean;
  onClick?: () => void; // Nueva prop para manejar clicks
}

const DebtSummaryCard: React.FC<DebtSummaryCardProps> = ({
  title,
  amount,
  count,
  isActive = false,
  onClick, // Nueva prop
}) => {
  return (
    <UnifiedCard
      variant="summary"
      title={title}
      amount={amount}
      count={count}
      isActive={isActive}
      onClick={onClick} // Pasar la prop onClick al UnifiedCard
    />
  );
};

export default DebtSummaryCard;
