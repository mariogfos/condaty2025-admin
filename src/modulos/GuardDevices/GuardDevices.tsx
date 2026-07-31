"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Ban, Copy, KeyRound, Smartphone } from "lucide-react";
import NotAccess from "@/components/layout/NotAccess/NotAccess";
import Button from "@/mk/components/forms/Button/Button";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { getUrlImages } from "@/mk/utils/string";
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

const getGuardAvatarUrl = (item: any) => {
  if (item?.guard_url_avatar) return item.guard_url_avatar;
  if (!item?.guard_has_image || !item?.guard_id) return undefined;

  return getUrlImages(
    `/GUARD-${item.guard_id}.webp?d=${item.guard_updated_at || ""}`,
  );
};

const GuardDevices = () => {
  const { userCan } = useAuth();
  const crudRef = useRef<any>({});
  const [codeModalOpen, setCodeModalOpen] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<any>(null);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [deviceToRevoke, setDeviceToRevoke] = useState<any>(null);
  const [revoking, setRevoking] = useState(false);

  const generateAuthorizationCode = useCallback(async () => {
    setCodeModalOpen(true);
    setGeneratedCode(null);
    setGeneratingCode(true);

    try {
      const { execute, showToast } = crudRef.current;
      if (!execute) return;

      const { data, error }: any = await execute(
        "/guard-device-authorizations/generate",
        "POST",
        {},
        false,
        false,
      );

      if (data?.success && data?.data?.code) {
        setGeneratedCode(data.data);
        return;
      }

      showToast?.(
        data?.message ||
          error?.message ||
          "No se pudo generar el codigo de autorizacion.",
        "error",
      );
    } finally {
      setGeneratingCode(false);
    }
  }, []);

  const extraButtons = useMemo(
    () => [
      <Button key="authorize-device" onClick={generateAuthorizationCode}>
        <span className={styles.buttonContent}>
          <KeyRound size={16} />
          Autorizar dispositivo
        </span>
      </Button>,
    ],
    [generateAuthorizationCode],
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
      guard_name: {
        rules: [],
        api: "",
        label: "Guardia",
        order: 1,
        list: {
          width: "310px",
          onRender: ({ item }: any) => {
            const guardName = item?.guard_name || "Guardia";

            return (
              <div className={styles.guardCell}>
                <Avatar
                  src={getGuardAvatarUrl(item)}
                  name={guardName}
                  w={42}
                  h={42}
                />
                <div className={styles.guardInfo}>
                  <p className={styles.guardName}>{guardName}</p>
                  <p className={styles.guardCi}>CI: {item?.guard_ci || "-/-"}</p>
                </div>
              </div>
            );
          },
        },
      },
      device_name: {
        rules: [],
        api: "",
        label: "Dispositivo",
        order: 2,
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
        order: 3,
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
        order: 4,
        list: {
          width: "120px",
          onRender: ({ item }: any) => {
            const version = item?.app_version || item?.build_number;
            return <span>{version || "-/-"}</span>;
          },
        },
      },
      authorized_at: {
        rules: [],
        api: "",
        label: "Autorizado",
        order: 5,
        list: {
          width: "180px",
          onRender: ({ item }: any) => (
            <span>{formatDate(item?.authorized_at)}</span>
          ),
        },
      },
      last_seen_at: {
        rules: [],
        api: "",
        label: "Ultima actividad",
        order: 6,
        list: {
          width: "180px",
          onRender: ({ item }: any) => (
            <span>{formatDate(item?.last_seen_at)}</span>
          ),
        },
      },
      status: {
        rules: [],
        api: "",
        label: "Estado",
        order: 7,
        list: {
          width: "120px",
          onRender: ({ item }: any) => {
            const revoked = !!item?.revoked_at;
            return (
              <span
                className={`${styles.statusBadge} ${
                  revoked ? styles.statusRevoked : styles.statusActive
                }`}
              >
                {revoked ? "Revocado" : "Activo"}
              </span>
            );
          },
        },
      },
      actions: {
        rules: [],
        api: "",
        label: "Acciones",
        order: 8,
        list: {
          width: "150px",
          onRender: ({ item }: any) => {
            const revoked = !!item?.revoked_at;

            return (
              <Button
                variant="danger"
                small
                disabled={revoked}
                onClick={(event: any) => {
                  event?.stopPropagation?.();
                  if (!revoked) setDeviceToRevoke(item);
                }}
              >
                <span className={styles.actionButtonContent}>
                  <Ban size={14} />
                  Revocar
                </span>
              </Button>
            );
          },
        },
      },
    };
  }, []);

  const { List, showToast, execute, reLoad } = useCrud({
    paramsInitial,
    mod,
    fields,
    extraButtons,
  });

  crudRef.current = { execute, showToast, reLoad };

  const authorizationCode = String(generatedCode?.code || "");
  const ttlMinutes = generatedCode?.ttl_minutes || 10;

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

  const handleCloseCodeModal = useCallback(() => {
    setCodeModalOpen(false);
    setGeneratedCode(null);
  }, []);

  const handleConfirmRevoke = useCallback(async () => {
    if (!deviceToRevoke?.id) return;

    setRevoking(true);
    try {
      const { data, error }: any = await execute(
        `/guard-device-authorizations/${deviceToRevoke.id}/revoke`,
        "POST",
        {},
        false,
        false,
      );

      if (data?.success) {
        showToast("Autorizacion revocada.", "success");
        setDeviceToRevoke(null);
        await reLoad({ extraData: true }, false, false);
        return;
      }

      showToast(
        data?.message ||
          error?.message ||
          "No se pudo revocar la autorizacion.",
        "error",
      );
    } finally {
      setRevoking(false);
    }
  }, [deviceToRevoke?.id, execute, reLoad, showToast]);

  if (!userCan(mod.permiso, "R")) return <NotAccess />;

  return (
    <div className={styles.GuardDevices}>
      <h1 className={styles.title}>Dispositivos</h1>

      <List
        height="100%"
        emptyMsg="Aun no hay dispositivos autorizados."
        emptyLine2="Cuando un guardia autorice su celular, aparecera aqui."
        emptyIcon={<Smartphone size={80} color="var(--cWhiteV1)" />}
        actionsWidth="0px"
      />

      <DataModal
        open={codeModalOpen}
        onClose={handleCloseCodeModal}
        onSave={handleCopyCode}
        title="Autorizar dispositivo"
        buttonText="Copiar codigo"
        buttonCancel="Cerrar"
        disabled={!authorizationCode || generatingCode}
        maxWidth={520}
      >
        <div className={styles.codeBox}>
          <p className={styles.codeLabel}>
            {generatingCode ? "Generando codigo..." : "Codigo de un solo uso"}
          </p>
          <p className={styles.code}>{authorizationCode || "------"}</p>
          <Copy size={20} color="var(--cAccent)" />
        </div>
        <p className={styles.hint}>
          Este codigo vence en {ttlMinutes} minutos y solo puede autorizar un
          dispositivo una vez.
        </p>
        {generatedCode?.expires_at && (
          <p className={styles.expiration}>
            Expira: {formatDate(generatedCode.expires_at)}
          </p>
        )}
      </DataModal>

      <DataModal
        open={!!deviceToRevoke}
        onClose={() => setDeviceToRevoke(null)}
        onSave={handleConfirmRevoke}
        title="Revocar autorizacion"
        buttonText={revoking ? "Revocando..." : "Revocar"}
        buttonCancel="Cancelar"
        disabled={revoking}
        maxWidth={480}
      >
        <p className={styles.revokeText}>
          Se revocara la autorizacion de{" "}
          <strong>{deviceToRevoke?.guard_name || "este guardia"}</strong> en el
          dispositivo{" "}
          <strong>
            {deviceToRevoke?.device_name ||
              [deviceToRevoke?.brand, deviceToRevoke?.model]
                .filter(Boolean)
                .join(" ") ||
              "seleccionado"}
          </strong>
          .
        </p>
      </DataModal>
    </div>
  );
};

export default GuardDevices;
