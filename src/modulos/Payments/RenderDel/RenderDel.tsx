import DataModal from "@/mk/components/ui/DataModal/DataModal";
import Button from "@/mk/components/forms/Button/Button";

export const RenderAnularModal = ({ open, onClose, item, onSave }: { open: boolean, onClose: () => void, item: any, onSave: (item: any) => void }) => {
  return (
    <DataModal
      open={open}
      onClose={onClose}
      title="Anular Ingreso"
      buttonText="Anular"
      buttonCancel="Cancelar"
    
    >
      <p style={{ fontFamily: 'Roboto, Arial, sans-serif', fontSize: 'var(--font-size-sm)' }}>
        ¿Seguro que quieres anular este ingreso?, recuerda que si realizas esta acción perderás los cambios y no se reflejará en tu balance
      </p>
    </DataModal>
  );
};