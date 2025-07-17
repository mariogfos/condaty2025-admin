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
  // 'item' es el ingreso que se va a anular //Esto?? comentario obvio
  // 'onConfirm' es la función que realmente ejecutará la anulación (será la función onSave de useCrud con action="del") //Esto?? comentario obvio ChatGpt trabajando horas extras
  //Esto?? por que se creo un componente nuevo si el useCrud tiene la funcion de borrar y se puede personalizar el mensaje???
  return (
    <DataModal
      open={open}
      onClose={onClose}
      title="Anular Egreso" // Título personalizado //Esto?? comentario obvio
      buttonText="Anular" // Texto del botón de confirmación personalizado//Esto??
      buttonCancel="Cancelar"
      onSave={() => onSave(item)} // Llama a onConfirm cuando se guarda/confirma//Esto??
      variant="mini"
    >
      <p>
        ¿Seguro que quieres anular este egreso? Recuerda que si realizas esta
        acción perderás los cambios y no se reflejara en tu balance.
      </p>
    </DataModal>
  );
};
