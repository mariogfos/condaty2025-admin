"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import useAxios from "@/mk/hooks/useAxios";
import styles from "./BankProviderTester.module.css";

/* ==========================================
   Bank Provider Tester - Developer Tools Aesthetic
   API Console for testing Banco Ganadero QR
   ========================================== */

type OperationType = "auth" | "generate" | "status" | "cancel" | "transactions";

interface Operation {
  id: string;
  type: OperationType;
  name: string;
  method: string;
  endpoint: string;
  requestData: Record<string, unknown>;
}

interface HistoryItem {
  id: string;
  operation: string;
  timestamp: Date;
  success: boolean;
  message: string;
  requestData?: Record<string, unknown>;
  /** `null` cuando la petición falló y no hubo sobre que guardar. */
  responseData?: Record<string, unknown> | null;
}

/**
 * Una cuenta bancaria que se puede probar contra el banco.
 *
 * ⚠️ No trae credenciales, ni siquiera enmascaradas: `has_credentials` dice si
 * están cargadas y `puede_cobrar` si además está todo lo demás. El probador no
 * es una pantalla de configuración.
 */
interface CuentaProbable {
  bank_account_id: number;
  client_id: string;
  client_name: string | null;
  alias: string | null;
  account_number: string | null;
  qr_dynamic_bank_id: number | null;
  has_credentials: boolean;
  puede_cobrar: boolean;
}

const DEFAULT_DATA: Record<OperationType, Record<string, unknown>> = {
  auth: {},
  generate: {
    amount: 100.0,
    gloss: "Prueba Condaty",
    expirationDate: "31122026",
    singleUse: true,
  },
  status: {
    qrId: "",
  },
  cancel: {
    qrId: "",
  },
  transactions: {
    startDate: "01012026",
    endDate: "31122026",
  },
};

const OPERATION_CONFIG: Record<
  OperationType,
  { name: string; method: string; endpoint: string }
> = {
  auth: {
    name: "Authentication",
    method: "POST",
    endpoint: "/bank-qr/authenticate",
  },
  generate: {
    name: "Generate QR",
    method: "POST",
    endpoint: "/bank-qr/generate",
  },
  status: { name: "Check Status", method: "POST", endpoint: "/bank-qr/status" },
  cancel: { name: "Cancel QR", method: "POST", endpoint: "/bank-qr/cancel" },
  transactions: {
    name: "Transactions",
    method: "POST",
    endpoint: "/bank-qr/transactions",
  },
};

/* Syntax highlighting for JSON */
const SyntaxHighlight: React.FC<{ json: Record<string, unknown> | string }> = ({
  json,
}) => {
  const content =
    typeof json === "string" ? json : JSON.stringify(json, null, 2);

  const highlightJSON = (text: string): React.ReactNode => {
    const lines = text.split("\n");

    return lines.map((line, lineIdx) => {
      // Simple JSON highlighting with regex
      const highlighted = line
        .replace(
          /"([^"]+)":/g,
          `<span class="${styles.syntaxKey}">"$1"</span>:`,
        )
        .replace(
          /: "([^"]*)"/g,
          `: <span class="${styles.syntaxString}">"$1"</span>`,
        )
        .replace(
          /: (\d+\.?\d*)/g,
          `: <span class="${styles.syntaxNumber}">$1</span>`,
        )
        .replace(
          /: (true|false)/g,
          `: <span class="${styles.syntaxBoolean}">$1</span>`,
        )
        .replace(/: (null)/g, `: <span class="${styles.syntaxNull}">$1</span>`)
        .replace(
          /([{}[\],])/g,
          `<span class="${styles.syntaxBracket}">$1</span>`,
        );

      return (
        <div
          key={lineIdx}
          dangerouslySetInnerHTML={{ __html: highlighted || "&nbsp;" }}
        />
      );
    });
  };

  return <div className={styles.syntaxHighlight}>{highlightJSON(content)}</div>;
};

/* Copy to clipboard button */
const CopyButton: React.FC<{ text: string; onCopied: () => void }> = ({
  text,
  onCopied,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onCopied();
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <button className={styles.actionButton} onClick={handleCopy}>
      {copied ? "✓ Copied" : "📋 Copy"}
    </button>
  );
};

/* Operation Tab Button */
const OperationTab: React.FC<{
  type: OperationType;
  isActive: boolean;
  onClick: () => void;
}> = ({ type, isActive, onClick }) => {
  const config = OPERATION_CONFIG[type];

  return (
    <motion.button
      className={`${styles.tab} ${isActive ? styles.tabActive : ""}`}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <span className={styles.tabIcon}>
        {type === "auth" && "🔐"}
        {type === "generate" && "📱"}
        {type === "status" && "🔍"}
        {type === "cancel" && "✖️"}
        {type === "transactions" && "📊"}
      </span>
      <span>{config.name}</span>
    </motion.button>
  );
};

/* Execute Button */
const ExecuteButton: React.FC<{
  onClick: () => void;
  loading: boolean;
  isError?: boolean;
}> = ({ onClick, loading, isError }) => (
  <motion.button
    className={`${styles.executeButton} ${isError ? styles.executeButtonError : ""}`}
    onClick={onClick}
    disabled={loading}
    whileHover={{ scale: loading ? 1 : 1.02 }}
    whileTap={{ scale: loading ? 1 : 0.98 }}
  >
    {loading ? (
      <>
        <span
          className={styles.spinner}
          style={{ width: 20, height: 20, borderWidth: 2 }}
        />
        <span>Executing...</span>
      </>
    ) : (
      <>
        <span className={styles.buttonIcon}>▶</span>
        <span>Execute Request</span>
      </>
    )}
  </motion.button>
);

/* History Item */
const HistoryItemComponent: React.FC<{
  item: HistoryItem;
  onClick: () => void;
}> = ({ item, onClick }) => {
  const timeStr = item.timestamp.toLocaleTimeString("es-BO", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <motion.div
      className={styles.historyItem}
      onClick={onClick}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div
        className={`${styles.historyStatus} ${
          item.success ? styles.historyStatusSuccess : styles.historyStatusError
        }`}
      >
        {item.success ? "✓" : "✕"}
      </div>
      <div className={styles.historyInfo}>
        <div className={styles.historyOperation}>{item.operation}</div>
        <div className={styles.historyTime}>{timeStr}</div>
      </div>
      <div className={styles.historyMessage}>{item.message}</div>
    </motion.div>
  );
};

/* Main Component */
const BankProviderTester: React.FC = () => {
  const [activeOperation, setActiveOperation] = useState<OperationType>("auth");
  const [requestData, setRequestData] = useState<Record<string, unknown>>(
    DEFAULT_DATA.auth,
  );
  const [responseData, setResponseData] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCopyNotification, setShowCopyNotification] = useState(false);
  const [cuentas, setCuentas] = useState<CuentaProbable[]>([]);
  const [cuentaElegida, setCuentaElegida] = useState<number | null>(null);
  const [configLoading, setConfigLoading] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  const { execute } = useAxios();

  // Update request data when switching tabs
  useEffect(() => {
    setRequestData(DEFAULT_DATA[activeOperation]);
    setResponseData(null);
    setError(null);
  }, [activeOperation]);

  // Load from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem("bankTester_lastData");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed[activeOperation]) {
          setRequestData(parsed[activeOperation]);
        }
      } catch (e) {
        // ignore
      }
    }
  }, []);

  // Save to localStorage on data change
  const handleDataChange = useCallback(
    (newData: Record<string, unknown>) => {
      setRequestData(newData);
      const saved = JSON.parse(
        localStorage.getItem("bankTester_lastData") || "{}",
      );
      saved[activeOperation] = newData;
      localStorage.setItem("bankTester_lastData", JSON.stringify(saved));
    },
    [activeOperation],
  );

  // Fetch QR config on mount
  const fetchConfig = useCallback(async () => {
    setConfigLoading(true);
    setConfigError(null);
    try {
      const result = await execute("/v3/bank-qr/config", "GET");
      if (result.error) {
        setConfigError(
          result.error.data?.message ||
            "No se pudieron cargar las cuentas que cobran por QR.",
        );
      } else {
        // El sobre trae el contenido en `data`, no en la raíz.
        const lista: CuentaProbable[] = result.data?.data?.accounts ?? [];
        setCuentas(lista);

        // Se preselecciona la primera que PUEDE cobrar: probar contra una que
        // le falta configuración da un error del backend, no del banco, y
        // manda a buscar el problema al lugar equivocado.
        setCuentaElegida(
          (prev) =>
            prev ?? lista.find((c) => c.puede_cobrar)?.bank_account_id ?? null,
        );
      }
    } catch (err: any) {
      setConfigError(err?.message || "Unknown error loading config");
    } finally {
      setConfigLoading(false);
    }
  }, [execute]);

  useEffect(() => {
    fetchConfig();
  }, []);

  const addToHistory = (
    operation: string,
    success: boolean,
    message: string,
    request?: Record<string, unknown>,
    // `execute` devuelve el sobre, que puede venir en `null` si la petición
    // falló. Antes era `Record<string, unknown> | undefined` y no lo contemplaba.
    response?: Record<string, unknown> | null,
  ) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      operation,
      timestamp: new Date(),
      success,
      message,
      requestData: request,
      responseData: response,
    };
    setHistory((prev) => [newItem, ...prev].slice(0, 50));
  };

  const handleExecute = async () => {
    setIsLoading(true);
    setError(null);
    setResponseData(null);

    const config = OPERATION_CONFIG[activeOperation];

    // 🔴 Sin cuenta no hay contra qué probar: las credenciales son de ELLA.
    if (cuentaElegida === null) {
      setError("Elegí primero la cuenta bancaria contra la que querés probar.");
      setIsLoading(false);
      return;
    }

    try {
      // ⚠️ Acá NO se arma ninguna cabecera con el token del banco. Ese token
      // vive del lado del servidor: el navegador manda su sesión de Condaty y
      // el backend resuelve el resto con las credenciales de la cuenta.
      const result = await execute(config.endpoint, "POST", {
        ...requestData,
        bank_account_id: cuentaElegida,
      });

      if (result.error) {
        const errorResult = result.error.data || {};
        setError(errorResult.message || "Request failed");
        setResponseData(errorResult);
        addToHistory(
          config.name,
          false,
          errorResult.message || "Request failed",
          requestData,
          errorResult,
        );
      } else {
        setResponseData(result.data);

        // ⚠️ Nada de guardar tokens: el sobre ya no trae ninguno.
        if (activeOperation === "auth") {
          addToHistory(
            config.name,
            true,
            "El proveedor aceptó las credenciales de la cuenta",
            requestData,
            result.data,
          );
        } else if (activeOperation === "generate" && result.data?.data?.qr_id) {
          // El código recién emitido se precarga para consultarlo y anularlo.
          DEFAULT_DATA.status.qrId = result.data.data.qr_id;
          DEFAULT_DATA.cancel.qrId = result.data.data.qr_id;
          addToHistory(
            config.name,
            true,
            `Código emitido: ${result.data.data.qr_id}`,
            requestData,
            result.data,
          );
        } else {
          addToHistory(config.name, true, "Success", requestData, result.data);
        }
      }
    } catch (err: any) {
      const errorMessage = err?.message || "Unknown error occurred";
      setError(errorMessage);
      addToHistory(config.name, false, errorMessage, requestData, {
        error: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadFromHistory = (item: HistoryItem) => {
    if (item.requestData) {
      setRequestData(item.requestData);
    }
    if (item.responseData) {
      setResponseData(item.responseData);
    }
    // Find the operation type from the history item
    const opType = (Object.keys(OPERATION_CONFIG) as OperationType[]).find(
      (key) => OPERATION_CONFIG[key].name === item.operation,
    );
    if (opType) {
      setActiveOperation(opType);
    }
  };

  const handleCopyResponse = () => {
    setShowCopyNotification(true);
    setTimeout(() => setShowCopyNotification(false), 2000);
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <motion.div
        className={styles.header}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className={styles.headerIcon}>
          <span style={{ fontSize: "1.25rem" }}>🔧</span>
        </div>
        <div>
          <h1 className={styles.title}>Bank Provider Tester</h1>
          <p className={styles.subtitle}>Banco Ganadero QR API Console</p>
        </div>
      </motion.div>

      {/* QR Configuration Status */}
      <motion.div
        className={styles.configContainer}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className={styles.configHeader}>
          <div className={styles.configTitle}>
            <span className={styles.configTitleIcon}>⚙️</span>
            Cuenta a probar
          </div>
          <button
            className={styles.reloadButton}
            onClick={fetchConfig}
            disabled={configLoading}
          >
            <span className={styles.reloadIcon}>🔄</span>
            Recargar
          </button>
        </div>

        <div className={styles.configContent}>
          {configLoading ? (
            <div className={styles.configLoading}>
              <div
                className={styles.spinner}
                style={{ width: 20, height: 20, borderWidth: 2 }}
              />
              <span>Cargando configuración...</span>
            </div>
          ) : configError ? (
            <div className={styles.configError}>
              <span className={styles.errorIcon}>⚠️</span>
              {configError}
            </div>
          ) : cuentas.length > 0 ? (
            <div className={styles.configGrid}>
              <div className={styles.configRow}>
                <div className={styles.configField} style={{ flex: 1 }}>
                  <span className={styles.configFieldLabel}>
                    Cuenta a probar:
                  </span>
                  <select
                    className={styles.configFieldValue}
                    value={cuentaElegida ?? ""}
                    onChange={(e) =>
                      setCuentaElegida(
                        e.target.value === "" ? null : Number(e.target.value),
                      )
                    }
                  >
                    <option value="">— elegí una cuenta —</option>
                    {cuentas.map((cuenta) => (
                      <option
                        key={cuenta.bank_account_id}
                        value={cuenta.bank_account_id}
                      >
                        {cuenta.client_name ?? cuenta.client_id} ·{" "}
                        {cuenta.alias ?? cuenta.account_number} ·{" "}
                        {cuenta.puede_cobrar
                          ? "lista"
                          : "le falta configuración"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ⚠️ Se avisa ANTES de probar. Contra una cuenta a medio
                  configurar el error lo devuelve el backend, no el banco, y
                  manda a buscar el problema al lugar equivocado. */}
              {cuentaElegida !== null &&
              !cuentas.find((c) => c.bank_account_id === cuentaElegida)
                ?.puede_cobrar ? (
                <div className={styles.configRow}>
                  <span className={styles.notConfigured}>
                    A esta cuenta le falta el banco, la referencia o las
                    credenciales: el proveedor no la va a aceptar.
                  </span>
                </div>
              ) : null}

              {/* 🔴 Ninguna credencial se muestra, ni siquiera enmascarada.
                  El probador dice si están cargadas; para verlas o cambiarlas
                  está el formulario de la cuenta. */}
              <div className={styles.configRow}>
                <span className={styles.configFieldLabel}>
                  Las credenciales las resuelve el servidor con la cuenta
                  elegida. Ninguna viaja al navegador.
                </span>
              </div>
            </div>
          ) : (
            <div className={styles.configEmpty}>
              Ninguna cuenta tiene un proveedor de QR configurado.
            </div>
          )}
        </div>
      </motion.div>

      {/* ⚠️ Acá se mostraba el token del banco, con su botón de copiar.
          Ese token autoriza a emitir y anular códigos de cobro: quien lo
          tuviera podía operar la cuenta del condominio por fuera de Condaty.
          Ya no sale del servidor, así que no hay nada que mostrar. */}

      {/* Tab Navigation */}
      <motion.div
        className={styles.tabsContainer}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {(Object.keys(OPERATION_CONFIG) as OperationType[]).map((type) => (
          <OperationTab
            key={type}
            type={type}
            isActive={activeOperation === type}
            onClick={() => setActiveOperation(type)}
          />
        ))}
      </motion.div>

      {/* Content Grid: Request + Response */}
      <motion.div
        className={styles.contentGrid}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        {/* Request Panel */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <div className={styles.panelTitle}>
              <span className={styles.panelTitleIcon}>📝</span>
              Request Data (Editable)
            </div>
          </div>
          <div className={styles.panelBody}>
            <textarea
              className={styles.jsonEditor}
              value={JSON.stringify(requestData, null, 2)}
              onChange={(e) => {
                try {
                  handleDataChange(JSON.parse(e.target.value));
                } catch {
                  // Invalid JSON, ignore
                }
              }}
              spellCheck={false}
            />
          </div>
        </div>

        {/* Response Panel */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <div className={styles.panelTitle}>
              <span className={styles.panelTitleIcon}>📋</span>
              Response
            </div>
            <div className={styles.panelActions}>
              {responseData && (
                <CopyButton
                  text={JSON.stringify(responseData, null, 2)}
                  onCopied={handleCopyResponse}
                />
              )}
            </div>
          </div>
          <div className={styles.panelBody}>
            {isLoading ? (
              <div className={styles.loadingContainer}>
                <div className={styles.spinner} />
                <span className={styles.loadingText}>Executing request...</span>
              </div>
            ) : error ? (
              <div className={styles.jsonOutput}>
                <SyntaxHighlight json={{ error: true, message: error }} />
              </div>
            ) : responseData ? (
              <div className={styles.jsonOutput}>
                <SyntaxHighlight json={responseData} />
              </div>
            ) : (
              <div className={styles.historyEmpty}>
                Execute a request to see the response
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Execute Button */}
      <ExecuteButton onClick={handleExecute} loading={isLoading} />

      {/* Operation History */}
      <motion.div
        className={styles.historyContainer}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <div className={styles.historyHeader}>
          <span className={styles.historyIcon}>📋</span>
          <span className={styles.historyTitle}>Operation History</span>
        </div>
        <div className={styles.historyList}>
          {history.length === 0 ? (
            <div className={styles.historyEmpty}>
              No operations yet. Execute a request to start.
            </div>
          ) : (
            history.map((item) => (
              <HistoryItemComponent
                key={item.id}
                item={item}
                onClick={() => loadFromHistory(item)}
              />
            ))
          )}
        </div>
      </motion.div>

      {/* Copy Notification */}
      <AnimatePresence>
        {showCopyNotification && (
          <motion.div
            className={styles.copyNotification}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            Copied to clipboard!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BankProviderTester;
