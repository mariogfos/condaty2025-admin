
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { useAuth } from "@/mk/contexts/AuthProvider";
import useScreenSize from "@/mk/hooks/useScreenSize";

const RenderView = (props: {
  open: boolean;
  onClose: any;
  item: Record<string, any>;
  onConfirm?: Function;
  onEdit?: Function;
  extraData?: any;
}) => {
  const { user } = useAuth();
  const { isTablet } = useScreenSize();
  const edit = () => {
    props.onEdit && props.onEdit(props.item);
    props.onClose();
  };

  return (
    <DataModal
      open={props.open}
      onClose={props?.onClose}
      title={"Detalle de encuesta"}
      buttonText=""
      buttonCancel=""
      // fullScreen={isTablet}
      // eslint-disable-next-line react/no-children-prop
      fullScreen={true} children={undefined}    >
     
    </DataModal>
  );
};

export default RenderView;
