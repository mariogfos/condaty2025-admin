"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Ban, Copy, KeyRound, RotateCcw, Smartphone } from "lucide-react";
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

const SECURITY_EVENT_LABELS: Record<string, string> = {
  code_generated: "Código generado",
  authorized_with_code: "Dispositivo autorizado con código",
  revoked: "Dispositivo revocado",
  reactivated: "Dispositivo reactivado",
};

type HistoryTab = "activity" | "security";

const formatSecurityActor = (actor?: {
  name?: string | null;
  type?: string | null;
}) => {
  if (!actor?.name) return "Sin responsable historico";

  const typeLabel = actor.type === "administrator" ? "Administrador" : "Guardia";
  return `${actor.name} (${typeLabel})`;
};

const GuardDevices = () => {
  const { userCan } = useAuth();
  const canGenerateDeviceCodes = userCan("guards", "C");
  const canManageDevices = userCan("guards", "U");
  const crudRef = useRef<any>({});
  const [codeModalOpen, setCodeModalOpen] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<any>(null);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [deviceToRevoke, setDeviceToRevoke] = useState<any>(null);
  const [revoking, setRevoking] = useState(false);
  const [deviceToReactivate, setDeviceToReactivate] = useState<any>(null);
  const [reactivating, setReactivating] = useState(false);
  const [deviceDetail, setDeviceDetail] = useState<any>(null);
  const [loadingDeviceDetail, setLoadingDeviceDetail] = useState(false);
  const [historyTab, setHistoryTab] = useState<HistoryTab>("activity");

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
    () =>
      canGenerateDeviceCodes
        ? [
            <Button key="authorize-device" onClick={generateAuthorizationCode}>
              <span className={styles.buttonContent}>
                <KeyRound size={16} />
                Autorizar dispositivo
              </span>
            </Button>,
          ]
        : [],
    [canGenerateDeviceCodes, generateAuthorizationCode],
  );

  const handleOpenDeviceDetail = useCallback(async (device: any) => {
    if (!device?.id) return;

    setHistoryTab("activity");
    setDeviceDetail({ ...device, loading: true });
    setLoadingDeviceDetail(true);

    try {
      const { execute, showToast } = crudRef.current;
      if (!execute) return;

      const { data, error }: any = await execute(
        `/guard-device-authorizations/${device.id}`,
        "GET",
        {},
        false,
        false,
      );

      if (data?.success && data?.data) {
        setDeviceDetail(data.data);
        return;
      }

      setDeviceDetail(device);
      showToast?.(
        data?.message || error?.message || "No se pudo cargar el detalle.",
        "error",
      );
    } finally {
      setLoadingDeviceDetail(false);
    }
  }, []);

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
        order: 1,
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
        order: 2,
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
        order: 3,
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
        order: 4,
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
        order: 5,
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
        order: 6,
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
        order: 7,
        list: {
          width: "185px",
          onRender: ({ item }: any) => {
            if (!canManageDevices) return null;

            const revoked = !!item?.revoked_at;

            if (revoked) {
              return (
                <Button
                  variant="secondary"
                  small
                  className={styles.reactivateButton}
                  onClick={(event: any) => {
                    event?.stopPropagation?.();
                    setDeviceToReactivate(item);
                  }}
                >
                  <span className={styles.actionButtonContent}>
                    <RotateCcw size={14} />
                    Reactivar dispositivo
                  </span>
                </Button>
              );
            }

            return (
              <Button
                variant="danger"
                small
                onClick={(event: any) => {
                  event?.stopPropagation?.();
                  setDeviceToRevoke(item);
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
  }, [canManageDevices]);

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

  const handleConfirmReactivate = useCallback(async () => {
    if (!deviceToReactivate?.id) return;

    setReactivating(true);
    try {
      const { data, error }: any = await execute(
        `/guard-device-authorizations/${deviceToReactivate.id}/reactivate`,
        "POST",
        {},
        false,
        false,
      );

      if (data?.success) {
        showToast("Dispositivo reactivado.", "success");
        setDeviceToReactivate(null);
        setDeviceDetail((current: any) =>
          current?.id === deviceToReactivate.id
            ? { ...current, ...data.data }
            : current,
        );
        await reLoad({ extraData: true }, false, false);
        return;
      }

      showToast(
        data?.message ||
          error?.message ||
          "No se pudo reactivar el dispositivo.",
        "error",
      );
    } finally {
      setReactivating(false);
    }
  }, [deviceToReactivate?.id, execute, reLoad, showToast]);

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
        onRowClick={handleOpenDeviceDetail}
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
          Se revocara este dispositivo para <strong>todos los guardias activos
          del condominio</strong>. Para volver a usarlo se necesitara un nuevo
          codigo de autorizacion en el dispositivo{" "}
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

      <DataModal
        open={!!deviceToReactivate}
        onClose={() => setDeviceToReactivate(null)}
        onSave={handleConfirmReactivate}
        title="Reactivar dispositivo"
        buttonText={reactivating ? "Reactivando..." : "Reactivar"}
        buttonCancel="Cancelar"
        disabled={reactivating}
        maxWidth={480}
      >
        <p className={styles.revokeText}>
          Se reactivara este dispositivo para <strong>todos los guardias activos
          del condominio</strong>. No necesitara un nuevo codigo de autorizacion
          en el dispositivo{" "}
          <strong>
            {deviceToReactivate?.device_name ||
              [deviceToReactivate?.brand, deviceToReactivate?.model]
                .filter(Boolean)
                .join(" ") ||
              "seleccionado"}
          </strong>
          . Esta accion quedara registrada en el historial de seguridad.
        </p>
      </DataModal>

      <DataModal
        open={!!deviceDetail}
        onClose={() => setDeviceDetail(null)}
        title="Detalle del dispositivo"
        buttonText=""
        buttonCancel="Cerrar"
        minWidth={860}
        maxWidth={1040}
      >
        <div className={styles.detailContent}>
          <section className={styles.detailSummary}>
            <div>
              <p className={styles.detailDeviceName}>
                {deviceDetail?.device_name || "Dispositivo autorizado"}
              </p>
              <p className={styles.detailDeviceMeta}>
                {[deviceDetail?.brand, deviceDetail?.model]
                  .filter(Boolean)
                  .join(" ") || "Sin modelo informado"}
              </p>
            </div>
            <span
              className={`${styles.statusBadge} ${
                deviceDetail?.revoked_at
                  ? styles.statusRevoked
                  : styles.statusActive
              }`}
            >
              {deviceDetail?.revoked_at ? "Revocado" : "Activo"}
            </span>
          </section>

          <section className={styles.detailFacts}>
            <div>
              <span>Sistema</span>
              <strong>
                {[deviceDetail?.os, deviceDetail?.os_version]
                  .filter(Boolean)
                  .join(" ") || "-/-"}
              </strong>
            </div>
            <div>
              <span>Aplicacion</span>
              <strong>
                {deviceDetail?.app_version || deviceDetail?.build_number || "-/-"}
              </strong>
            </div>
            <div>
              <span>Autorizado</span>
              <strong>{formatDate(deviceDetail?.authorized_at)}</strong>
            </div>
            <div>
              <span>Ultima actividad</span>
              <strong>{formatDate(deviceDetail?.last_seen_at)}</strong>
            </div>
          </section>

          {loadingDeviceDetail ? (
            <p className={styles.detailLoading}>Cargando historial...</p>
          ) : (
            <section className={styles.historySection}>
              <div className={styles.historyHeader}>
                <h2>Historial</h2>
                <p>
                  Separa la operación cotidiana de los cambios de seguridad del
                  dispositivo.
                </p>
              </div>
              <div className={styles.historyTabs} role="tablist" aria-label="Historial del dispositivo">
                <button
                  type="button"
                  role="tab"
                  aria-selected={historyTab === "activity"}
                  className={`${styles.historyTab} ${
                    historyTab === "activity" ? styles.historyTabActive : ""
                  }`}
                  onClick={() => setHistoryTab("activity")}
                >
                  Actividad de guardias
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={historyTab === "security"}
                  className={`${styles.historyTab} ${
                    historyTab === "security" ? styles.historyTabActive : ""
                  }`}
                  onClick={() => setHistoryTab("security")}
                >
                  Seguridad del dispositivo
                </button>
              </div>

              {historyTab === "security" ? (
                <div className={styles.historyTableWrap}>
                  <table className={styles.historyTable}>
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Evento</th>
                        <th>Responsable</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deviceDetail?.security_history?.length ? (
                        deviceDetail.security_history.map((item: any) => (
                          <tr key={`security-${item.id}`}>
                            <td>{formatDate(item?.occurred_at)}</td>
                            <td>
                              {SECURITY_EVENT_LABELS[item?.event_type] ||
                                "Evento de seguridad"}
                            </td>
                            <td>{formatSecurityActor(item?.actor)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className={styles.emptyHistory}>
                            Aun no hay eventos de seguridad registrados.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className={styles.historyTableWrap}>
                  <table className={styles.historyTable}>
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Guardia</th>
                        <th>Accion</th>
                        <th>App</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deviceDetail?.activity_history?.length ? (
                        deviceDetail.activity_history.map((item: any) => (
                          <tr key={`activity-${item.id}`}>
                            <td>{formatDate(item?.date_at)}</td>
                            <td>{item?.guard?.name || "Sin registro"}</td>
                            <td>{item?.action || "Actividad"}</td>
                            <td>{item?.app_version || "-/-"}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className={styles.emptyHistory}>
                            Aun no hay actividad exacta registrada para este dispositivo.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </div>
      </DataModal>
    </div>
  );
};

export default GuardDevices;
