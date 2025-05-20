import DataModal from "@/mk/components/ui/DataModal/DataModal";

export const RenderAnularModal = ({ open, onClose, item, onSave }: { open: boolean, onClose: () => void, item: any, onSave: (item: any) => void }) => {
    // 'item' es el ingreso que se va a anular
    // 'onConfirm' es la función que realmente ejecutará la anulación (será la función onSave de useCrud con action="del")
  
    return (
      <DataModal
        open={open}
        onClose={onClose}
        title="Anular Ingreso" // Título personalizado
        buttonText="Sí, Anular" // Texto del botón de confirmación personalizado
        buttonCancel="Cancelar"
        onSave={() => onSave(item)} // Llama a onConfirm cuando se guarda/confirma
      >
        <p>¿Estás seguro de que deseas anular este ingreso?</p>
        {item?.voucher && <p>Comprobante Nro: {item.voucher}</p>}
        {item?.amount && <p>Monto: Bs. {item.amount}</p>}
        <p style={{ marginTop: '10px', fontWeight: 'bold' }}>Esta acción no se puede deshacer.</p>
      </DataModal>
    );
  };