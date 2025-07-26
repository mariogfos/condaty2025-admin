// src/components/DateRangeFilterModal/DateRangeFilterModal.tsx
import React, { useState, useEffect } from 'react';
import DataModal from '@/mk/components/ui/DataModal/DataModal';
import Input from '@/mk/components/forms/Input/Input';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (range: { startDate: string; endDate: string }) => void;
  labelStart?: string;
  labelEnd?: string;
  errorStart?: string;
  errorEnd?: string;
  initialStartDate?: string;
  initialEndDate?: string;
  buttonText?: string;
  buttonCancel?: string;
}

const DateRangeFilterModal: React.FC<Props> = ({
  open,
  onClose,
  onSave,
  labelStart = 'Fecha de inicio',
  labelEnd = 'Fecha de fin',
  errorStart,
  errorEnd,
  initialStartDate = '',
  initialEndDate = '',
  buttonText = 'Aplicar Filtro',
  buttonCancel = 'Cancelar',
}) => {
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [localError, setLocalError] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});

  useEffect(() => {
    setStartDate(initialStartDate);
    setEndDate(initialEndDate);
    setLocalError({});
  }, [initialStartDate, initialEndDate, open]);

  const handleSave = () => {
    let errors: { startDate?: string; endDate?: string } = {};
    if (!startDate) {
      errors.startDate = 'La fecha de inicio es obligatoria';
    }
    if (!endDate) {
      errors.endDate = 'La fecha de fin es obligatoria';
    }
    if (startDate && endDate && startDate > endDate) {
      errors.startDate = 'La fecha de inicio no puede ser mayor a la de fin';
      errors.endDate = 'La fecha de fin no puede ser menor a la de inicio';
    }
    setLocalError(errors);
    if (Object.keys(errors).length > 0) return;
    setLocalError({});
    onSave({ startDate, endDate });
  };

  return (
    <DataModal
      open={open}
      title="Seleccionar Rango de Fechas"
      onSave={handleSave}
      onClose={onClose}
      buttonText={buttonText}
      buttonCancel={buttonCancel}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Input
          type="date"
          label={labelStart}
          name="startDate"
          error={
            localError.startDate
              ? { startDate: localError.startDate }
              : errorStart
              ? { startDate: errorStart }
              : undefined
          }
          value={startDate}
          onChange={e => {
            setStartDate(e.target.value);
            if (
              localError.startDate &&
              e.target.value &&
              (!endDate || e.target.value <= endDate)
            ) {
              setLocalError(prev => ({ ...prev, startDate: undefined }));
            }
            if (localError.endDate && endDate && e.target.value <= endDate) {
              setLocalError(prev => ({ ...prev, endDate: undefined }));
            }
          }}
          required
        />
        <Input
          type="date"
          label={labelEnd}
          name="endDate"
          error={
            localError.endDate
              ? { endDate: localError.endDate }
              : errorEnd
              ? { endDate: errorEnd }
              : undefined
          }
          value={endDate}
          onChange={e => {
            setEndDate(e.target.value);
            if (
              localError.endDate &&
              e.target.value &&
              (!startDate || startDate <= e.target.value)
            ) {
              setLocalError(prev => ({ ...prev, endDate: undefined }));
            }
            if (
              localError.startDate &&
              startDate &&
              startDate <= e.target.value
            ) {
              setLocalError(prev => ({ ...prev, startDate: undefined }));
            }
          }}
          required
        />
      </div>
    </DataModal>
  );
};

export default DateRangeFilterModal;
