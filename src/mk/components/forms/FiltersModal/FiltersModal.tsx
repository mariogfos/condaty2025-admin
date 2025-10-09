import React from 'react';
import DataModal from '../../ui/DataModal/DataModal';
import FilterTags from '@/components/FilterTags/FilterTags';

interface FilterConfig {
    title: string;
    data: any[]; 
    filters: any; 
    setFilters: React.Dispatch<React.SetStateAction<any>>; 
    type: string;
    msgEmpty?: string; 
  }
  

const FiltersModal = ({
  open,
  onClose,
  onSave,
  title = "Filtros",
  buttonCancel = "",
  buttonText = "Aplicar filtros",
  buttonExtra,
  filtersList,
} :any) => {
  return (
    <DataModal
      open={open}
      onClose={onClose}
      onSave={onSave}
      title={title}
      buttonCancel={buttonCancel}
      buttonText={buttonText}
      buttonExtra={buttonExtra}
    >
      {filtersList.map((filter:FilterConfig, index:number) => (
        <FilterTags
          key={index}
          title={filter.title}
          data={filter.data}
          filters={filter.filters}
          setFilters={filter.setFilters}
          type={filter.type}
          msgEmpty={filter.msgEmpty} 
        />
      ))}
    </DataModal>
  );
};

export default FiltersModal;
