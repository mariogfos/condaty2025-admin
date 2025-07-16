import DataModal from "@/mk/components/ui/DataModal/DataModal";

export const RenderAnularModal = ({
  open,
  onClose,
  item,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  item: any;
  onSave: (item: any) => void;
}) => {
  // 'item' es el ingreso que se va a anular
  // 'onConfirm' es la función que realmente ejecutará la anulación (será la función onSave de useCrud con action="del")

  return (
    <DataModal
      open={open}
      onClose={onClose}
      title="Anular Egreso" // Título personalizado
      buttonText="Sí, Anular" // Texto del botón de confirmación personalizado
      buttonCancel="Cancelar"
      onSave={() => onSave(item)} // Llama a onConfirm cuando se guarda/confirma
      variant="mini"
    >
      <p>
        ¿Seguro que quieres anular este egreso? Recuerda que si realizas esta
        acción perderás los cambios y no se reflejara en tu balance.
      </p>
    </DataModal>
  );
};
