"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Ban, Copy, KeyRound, RotateCcw, ShieldAlert, Smartphone } from "lucide-react";
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

/**
 * Que ofrece la fila de un dispositivo.
 *
 * Un telefono revocado ofrecia un boton "Revocar" DESHABILITADO: ninguna
 * salida. Para devolverlo al turno habia que generar otro codigo y volver a
 * autorizarlo, y ahi el aparato perdia su historia.
 */
export const accionDelDispositivo = (
  item: { revoked_at?: string | null } | null | undefined,
): "revocar" | "reactivar" => (item?.revoked_at ? "reactivar" : "revocar");

const GuardDevices = () => {
  const { userCan } = useAuth();
  const crudRef = useRef<any>({});
  const [codeModalOpen, setCodeModalOpen] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<any>(null);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [deviceToRevoke, setDeviceToRevoke] = useState<any>(null);
  const [deviceToReactivate, setDeviceToReactivate] = useState<any>(null);
  const [reactivating, setReactivating] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [deviceDetail, setDeviceDetail] = useState<any>(null);
  const [loadingDeviceDetail, setLoadingDeviceDetail] = useState(false);

  const generateAuthorizationCode = useCallback(async () => {
    setCodeModalOpen(true);
    setGeneratedCode(null);
    setGeneratingCode(true);

    try {
      const { execute, showToast } = crudRef.current;
      if (!execute) return;

      const { data, error }: any = await execute(
        "/v3/guard-device-authorizations/generate",
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

  const handleOpenDeviceDetail = useCallback(async (device: any) => {
    if (!device?.id) return;

    setDeviceDetail({ ...device, loading: true });
    setLoadingDeviceDetail(true);

    try {
      const { execute, showToast } = crudRef.current;
      if (!execute) return;

      const { data, error }: any = await execute(
        `/v3/guard-device-authorizations/${device.id}`,
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
    modulo: "v3/guard-device-authorizations",
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
          width: "150px",
          onRender: ({ item }: any) => {
            if (accionDelDispositivo(item) === "reactivar") {
              return (
                <Button
                  variant="secondary"
                  small
                  onClick={(event: any) => {
                    event?.stopPropagation?.();
                    setDeviceToReactivate(item);
                  }}
                >
                  <span className={styles.actionButtonContent}>
                    <RotateCcw size={14} />
                    Reactivar
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
        `/v3/guard-device-authorizations/${deviceToRevoke.id}/revoke`,
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
        `/v3/guard-device-authorizations/${deviceToReactivate.id}/reactivate`,
        "POST",
        {},
        false,
        false,
      );

      if (data?.success) {
        showToast("Dispositivo reactivado.", "success");
        setDeviceToReactivate(null);
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
          Este dispositivo volvera a abrir la garita para{" "}
          <strong>todos los guardias activos del condominio</strong>, sin
          necesidad de un codigo nuevo:{" "}
          <strong>
            {deviceToReactivate?.device_name ||
              [deviceToReactivate?.brand, deviceToReactivate?.model]
                .filter(Boolean)
                .join(" ") ||
              "el seleccionado"}
          </strong>
          . Queda registrado en el historial de seguridad.
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
            <>
              <section className={styles.historySection}>
                <div className={styles.historyHeader}>
                  <h2>Autorizaciones</h2>
                  <p>Quien uso un codigo para habilitar este dispositivo.</p>
                </div>
                <div className={styles.historyTableWrap}>
                  <table className={styles.historyTable}>
                    <thead>
                      <tr>
                        <th>Guardia</th>
                        <th>CI</th>
                        <th>Emitido por</th>
                        <th>Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deviceDetail?.authorization_history?.length ? (
                        deviceDetail.authorization_history.map((item: any) => (
                          <tr key={`authorization-${item.id}`}>
                            <td>{item?.guard?.name || "Sin registro"}</td>
                            <td>{item?.guard?.ci || "-/-"}</td>
                            <td>{item?.generated_by?.name || "Sin registro"}</td>
                            <td>{formatDate(item?.used_at)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className={styles.emptyHistory}>
                            Sin autorizaciones vinculadas.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className={styles.historySection}>
                <div className={styles.historyHeader}>
                  <h2>
                    <ShieldAlert size={16} /> Seguridad
                  </h2>
                  <p>
                    Quien genero, autorizo, revoco o reactivo este dispositivo.
                    Es el unico historial que sobrevive a una reactivacion: al
                    reactivar, la fecha de revocacion se borra.
                  </p>
                </div>
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
                            {/* La etiqueta viene del API: el enum no se espeja
                                aca para no mantener dos listas de textos. */}
                            <td>{item?.event_label || "Evento"}</td>
                            <td>{item?.actor?.name || "Sin registro"}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className={styles.emptyHistory}>
                            Sin eventos de seguridad registrados.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className={styles.historySection}>
                <div className={styles.historyHeader}>
                  <h2>Actividad</h2>
                  <p>
                    {deviceDetail?.activity_tracking_note ||
                      "Ingresos de sesion y acciones realizadas desde este dispositivo."}
                  </p>
                </div>
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
              </section>
            </>
          )}
        </div>
      </DataModal>
    </div>
  );
};

export default GuardDevices;
