import DataModal from "@/mk/components/ui/DataModal/DataModal";

export const RenderAnularModal = ({ open, onClose, item, onSave }: { open: boolean, onClose: () => void, item: any, onSave: (item: any) => void }) => {
  
    return (
      <DataModal
        open={open}
        onClose={onClose}
        title="Anular Ingreso" 
        buttonText="Sí, Anular" 
        buttonCancel="Cancelar"
        onSave={() => onSave(item)} 
      >
        <p>¿Estás seguro de que deseas anular este ingreso?</p>
        {item?.voucher && <p>Comprobante Nro: {item.voucher}</p>}
        {item?.amount && <p>Monto: Bs. {item.amount}</p>}
        <p style={{ marginTop: '10px', fontWeight: 'bold' }}>Esta acción no se puede deshacer.</p>
      </DataModal>
    );
  };