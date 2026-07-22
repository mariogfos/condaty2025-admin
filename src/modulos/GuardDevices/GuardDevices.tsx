"use client";

import { useCallback, useMemo, useState } from "react";
import { Copy, Smartphone } from "lucide-react";
import NotAccess from "@/components/layout/NotAccess/NotAccess";
import Button from "@/mk/components/forms/Button/Button";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import { useAuth } from "@/mk/contexts/AuthProvider";
import styles from "./GuardDevices.module.css";

const paramsInitial = {
  perPage: 20,
  page: 1,
  fullType: "L",
  searchBy: "",
  extraData: true,
};

const formatDate = (value?: string | null) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("es-BO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const GuardDevices = () => {
  const { userCan } = useAuth();
  const [codeModalOpen, setCodeModalOpen] = useState(false);

  const extraButtons = useMemo(
    () => [
      <Button key="authorize-device" onClick={() => setCodeModalOpen(true)}>
        <span className={styles.buttonContent}>
          <Smartphone size={16} />
          Autorizar dispositivo
        </span>
      </Button>,
    ],
    [],
  );

  const mod: ModCrudType = {
    modulo: "guard-device-authorizations",
    singular: "dispositivo",
    plural: "Dispositivos",
    filter: true,
    permiso: "guards",
    hideActions: {
      add: true,
      edit: true,
      del: true,
      view: true,
    },
  };

  const fields = useMemo(() => {
    return {
      id: { rules: [], api: "" },
      device_name: {
        rules: [],
        api: "",
        label: "Dispositivo",
        list: {
          width: "260px",
          onRender: ({ item }: any) => {
            const name = item?.device_name || "Dispositivo autorizado";
            const model = [item?.brand, item?.model].filter(Boolean).join(" ");

            return (
              <div className={styles.deviceCell}>
                <p className={styles.deviceName}>{name}</p>
                <p className={styles.deviceMeta}>{model || "-/-"}</p>
              </div>
            );
          },
        },
      },
      os: {
        rules: [],
        api: "",
        label: "Sistema",
        list: {
          width: "160px",
          onRender: ({ item }: any) => {
            const os = [item?.os, item?.os_version].filter(Boolean).join(" ");
            return <span>{os || "-/-"}</span>;
          },
        },
      },
      app_version: {
        rules: [],
        api: "",
        label: "App",
        list: {
          width: "120px",
          onRender: ({ item }: any) => {
            const version = item?.app_version || item?.build_number;
            return <span>{version || "-/-"}</span>;
          },
        },
      },
      last_seen_at: {
        rules: [],
        api: "",
        label: "Ultima actividad",
        list: {
          width: "180px",
          onRender: ({ item }: any) => <span>{formatDate(item?.last_seen_at)}</span>,
        },
      },
      authorized_at: {
        rules: [],
        api: "",
        label: "Autorizado",
        list: {
          width: "180px",
          onRender: ({ item }: any) => <span>{formatDate(item?.authorized_at)}</span>,
        },
      },
    };
  }, []);

  const { List, extraData, showToast } = useCrud({
    paramsInitial,
    mod,
    fields,
    extraButtons,
  });

  const authorizationCode = String(extraData?.authorization?.code || "");

  const handleCopyCode = useCallback(async () => {
    if (!authorizationCode) {
      showToast("El codigo aun no esta disponible.", "warning");
      return;
    }

    try {
      await navigator.clipboard.writeText(authorizationCode);
      showToast("Codigo copiado al portapapeles.", "success");
    } catch {
      showToast("No se pudo copiar el codigo.", "error");
    }
  }, [authorizationCode, showToast]);

  if (!userCan(mod.permiso, "R")) return <NotAccess />;

  return (
    <div className={styles.GuardDevices}>
      <h1 className={styles.title}>Dispositivos</h1>

      <List
        height="100%"
        emptyMsg="Aun no hay dispositivos autorizados."
        emptyLine2="Cuando un guardia autorice su celular, aparecera aqui."
        emptyIcon={<Smartphone size={80} color="var(--cWhiteV1)" />}
      />

      <DataModal
        open={codeModalOpen}
        onClose={() => setCodeModalOpen(false)}
        onSave={handleCopyCode}
        title="Autorizar dispositivo"
        buttonText="Copiar codigo"
        buttonCancel="Cerrar"
        maxWidth={520}
      >
        <div className={styles.codeBox}>
          <p className={styles.codeLabel}>Codigo del condominio</p>
          <p className={styles.code}>{authorizationCode || "------"}</p>
          <Copy size={20} color="var(--cAccent)" />
        </div>
        <p className={styles.hint}>
          Comparte este codigo solo con guardias que deben autorizar un
          dispositivo para usar la app.
        </p>
      </DataModal>
    </div>
  );
};

export default GuardDevices;
