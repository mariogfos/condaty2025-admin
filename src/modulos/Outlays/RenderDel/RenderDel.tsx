import DataModal from "@/mk/components/ui/DataModal/DataModal";

export const RenderAnularModal = ({ open, onClose, item, onSave }: { open: boolean, onClose: () => void, item: any, onSave: (item: any) => void }) => {
    // 'item' es el ingreso que se va a anular
    // 'onConfirm' es la función que realmente ejecutará la anulación (será la función onSave de useCrud con action="del")

    return (
      <DataModal
        open={open}
        onClose={onClose}
        title="Anular egreso" // Título personalizado
        buttonText="Anular" // Texto del botón de confirmación personalizado
        buttonCancel="Cancelar"
        onSave={() => onSave(item)} // Llama a onConfirm cuando se guarda/confirma
      >
        <p
          style={{
            fontFamily: 'Roboto, Arial, sans-serif',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          ¿Seguro que quieres anular este egreso? Recuerda que si realizas esta
          acción perderás los cambios y no se reflejará en tu balance
        </p>
      </DataModal>
    );
  };
