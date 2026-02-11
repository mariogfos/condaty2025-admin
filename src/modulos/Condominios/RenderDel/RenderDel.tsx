"use client";
import { memo, useState, useCallback } from "react";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { useAuth } from "@/mk/contexts/AuthProvider";

interface RenderDelProps {
  open: boolean;
  onClose: () => void;
  item?: any;
  onSave: (params: any) => void;
  execute: (url: string, method: string, params: any) => Promise<any>;
  reLoad: () => void;
  extraData?: any;
}

const RenderDel = memo(
  ({ open, onClose, item, onSave, execute, reLoad }: RenderDelProps) => {
    const { showToast } = useAuth();

    const handleSave = useCallback(async () => {
      try {
        const { data: response } = await execute(`/delete-client`, "POST", {
          client_id: item?.id,
        });

        if (response?.success) {
          onClose();
          reLoad();
          showToast("Condominio eliminado con éxito", "success");
        } else {
          showToast(
            response?.message || "Error al eliminar el condominio",
            "error",
          );
        }
      } catch (error) {
        console.error("Error deleting condominium:", error);
        showToast("Error al eliminar el condominio", "error");
      }
    }, [item?.id, execute, onClose, reLoad, showToast]);

    const onCloseModal = useCallback(() => {
      onClose();
    }, [onClose]);

    if (!open) return null;

    return (
      <DataModal
        id="CondominiumDelModal"
        title="Eliminar condominio"
        open={open}
        onClose={onCloseModal}
        buttonText="Eliminar"
        buttonCancel="Cancelar"
        maxWidth={600}
        onSave={handleSave}
        // className={styles.delModalContent}
        variant="mini"
      >
        <p>¿Seguro de eliminar el condominio?</p>
      </DataModal>
    );
  },
);

RenderDel.displayName = "RenderDel";
export default RenderDel;
