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
  return (
    <DataModal
      open={open}
      onClose={onClose}
      title="Anular Ingreso"
      buttonText="Anular"
      buttonCancel="Cancelar"
      onSave={() => onSave(item)}
      variant="mini"
    >
      <p
        style={{
          fontFamily: "Roboto, Arial, sans-serif",
          fontSize: "var(--font-size-sm)",
        }}
      >
        ¿Seguro que quieres anular este ingreso? Recuerda que si realizas esta
        acción perderás los cambios y no se reflejará en tu balance
      </p>
    </DataModal>
  );
};
