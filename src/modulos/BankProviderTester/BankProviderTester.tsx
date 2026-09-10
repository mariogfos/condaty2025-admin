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
  responseData?: Record<string, unknown>;
}

interface QrConfig {
  bank_account_id: number;
  client_id: string | null;
  qr_dynamic_enabled: boolean;
  has_credentials: boolean;
  qr_dynamic_username_masked: string | null;
  account_reference: string | null;
  bank_code: string | null;
  bank_name: string | null;
  bank_is_active: boolean | null;
  environment: string | null;
  environment_label: string | null;
  base_url: string | null;
}

interface BankAccountOption {
  id: number;
  description?: string;
  alias?: string;
  account_number?: string;
  qr_dynamic_enabled?: boolean | number;
}

const DEFAULT_DATA: Record<OperationType, Record<string, unknown>> = {
  // Credentials are no longer sent from the browser: the API resolves them
  // from the selected bank account, exactly as the real debt flow does.
  auth: {},
  generate: {
    amount: 100.0,
    currency: "BOB",
    gloss: "Pago de servicios",
    expiration_date: "31/12/2026",
    single_use: true,
    payment_type: "T",
    reference: "INV-001",
  },
  status: {
    qr_id: "",
  },
  cancel: {
    qr_id: "",
  },
  transactions: {
    start_date: "01/01/2026",
    end_date: "31/12/2026",
  },
};

const OPERATION_CONFIG: Record<
  OperationType,
  { name: string; method: string; endpoint: string }
> = {
  auth: {
    name: "Authentication",
    method: "POST",
    endpoint: "qr-dynamic/tester/authenticate",
  },
  generate: {
    name: "Generate QR",
    method: "POST",
    endpoint: "qr-dynamic/tester/generate",
  },
  status: { name: "Check Status", method: "POST", endpoint: "qr-dynamic/tester/status" },
  cancel: { name: "Cancel QR", method: "POST", endpoint: "qr-dynamic/tester/cancel" },
  transactions: {
    name: "Transactions",
    method: "POST",
    endpoint: "qr-dynamic/tester/transactions",
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
  const [accounts, setAccounts] = useState<BankAccountOption[]>([]);
  const [bankAccountId, setBankAccountId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCopyNotification, setShowCopyNotification] = useState(false);
  const [qrConfig, setQrConfig] = useState<QrConfig | null>(null);
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
    if (!bankAccountId) {
      setQrConfig(null);
      setConfigError(null);
      return;
    }
    setConfigLoading(true);
    setConfigError(null);
    try {
      const result = await execute("qr-dynamic/tester/config", "GET", {
        bank_account_id: bankAccountId,
      });
      if (result?.data?.success) {
        setQrConfig(result.data.data);
      } else {
        setConfigError(
          result?.error?.data?.message ||
            result?.data?.message ||
            "No se pudo cargar la configuración de la cuenta.",
        );
        setQrConfig(null);
      }
    } catch (err: any) {
      setConfigError(err?.message || "Unknown error loading config");
    } finally {
      setConfigLoading(false);
    }
    // execute is rebuilt on every render, so it stays out of the deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bankAccountId]);

  // Collection accounts to pick from. Only a FOS user can list them and only
  // a FOS user reaches this screen, so an empty list means "nothing to test".
  useEffect(() => {
    (async () => {
      const res = await execute(
        "/bank-accounts",
        "GET",
        { perPage: -1, page: 1 },
        false,
        true,
      );
      if (res?.data?.success) setAccounts(res.data.data ?? []);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const maskValue = (value: string | null | undefined): string => {
    if (!value) return "No configurado";
    if (value.length <= 4) return "****";
    return "****" + value.slice(-4);
  };

  const addToHistory = (
    operation: string,
    success: boolean,
    message: string,
    request?: Record<string, unknown>,
    response?: Record<string, unknown>,
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
    const config = OPERATION_CONFIG[activeOperation];

    if (!bankAccountId) {
      setError("Elegí una cuenta bancaria antes de llamar al banco.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResponseData(null);

    try {
      // Every tester call names its bank account: the API resolves the
      // credentials from it and never accepts them from the browser.
      const result = await execute(config.endpoint, "POST", {
        ...requestData,
        bank_account_id: bankAccountId,
      });

      const body = result?.data;
      if (!body?.success) {
        const errorResult = result?.error?.data || body || {};
        const message = errorResult.message || "Request failed";
        setError(message);
        setResponseData(errorResult);
        addToHistory(config.name, false, message, requestData, errorResult);
        return;
      }

      const payload = body.data ?? {};
      setResponseData(payload);

      if (activeOperation === "generate" && payload?.qrId) {
        // Auto-fill status and cancel with the generated QR ID
        DEFAULT_DATA.status.qr_id = payload.qrId;
        DEFAULT_DATA.cancel.qr_id = payload.qrId;
        addToHistory(
          config.name,
          true,
          `QR created: ${payload.qrId}`,
          requestData,
          payload,
        );
      } else {
        addToHistory(
          config.name,
          true,
          body.message || "Success",
          requestData,
          payload,
        );
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
            Configuración QR
          </div>
          <label className={styles.accountPicker}>
            <span className={styles.configFieldLabel}>Cuenta bancaria:</span>
            <select
              id="tester-bank-account"
              className={styles.accountSelect}
              value={bankAccountId ?? ""}
              onChange={(e) =>
                setBankAccountId(e.target.value ? Number(e.target.value) : null)
              }
            >
              <option value="">Elegí una cuenta…</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.alias || acc.description || `Cuenta ${acc.id}`}
                  {acc.account_number ? ` · ${acc.account_number}` : ""}
                </option>
              ))}
            </select>
          </label>
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
          ) : qrConfig ? (
            <>
              {/* Status Section */}
              <div className={styles.configSection}>
                <div className={styles.configSectionTitle}>Estado</div>
                <div className={styles.configRow}>
                  <div className={styles.configField}>
                    <span className={styles.configFieldLabel}>Entorno:</span>
                    <span className={styles.configFieldValue}>
                      {qrConfig.environment_label || "Sin proveedor"}
                    </span>
                  </div>
                  <div className={styles.configField}>
                    <span className={styles.configFieldLabel}>QR dinámico:</span>
                    <span
                      className={`${styles.configFieldValue} ${qrConfig.qr_dynamic_enabled ? styles.statusActive : styles.statusInactive}`}
                    >
                      <span
                        className={`${styles.statusDot} ${qrConfig.qr_dynamic_enabled ? styles.statusDotActive : styles.statusDotInactive}`}
                      />
                      {qrConfig.qr_dynamic_enabled ? "HABILITADO" : "DESHABILITADO"}
                    </span>
                  </div>
                  <div className={styles.configField}>
                    <span className={styles.configFieldLabel}>Proveedor:</span>
                    <span
                      className={`${styles.configFieldValue} ${qrConfig.bank_is_active ? styles.statusActive : styles.statusInactive}`}
                    >
                      <span
                        className={`${styles.statusDot} ${qrConfig.bank_is_active ? styles.statusDotActive : styles.statusDotInactive}`}
                      />
                      {qrConfig.bank_is_active === null
                        ? "SIN ASIGNAR"
                        : qrConfig.bank_is_active
                          ? "ACTIVO"
                          : "INACTIVO"}
                    </span>
                  </div>
                </div>
                <div className={styles.configSource}>
                  Condominio: {qrConfig.client_id || "—"}
                </div>
              </div>

              {/* Credentials Section — the API never ships the secrets, only
                  whether the account has them and a masked username. */}
              <div className={styles.configSection}>
                <div className={styles.configSectionTitle}>Credenciales</div>
                <div className={styles.configRow}>
                  <div className={styles.configField}>
                    <span className={styles.configFieldLabel}>Banco:</span>
                    <span
                      className={`${styles.configFieldValue} ${!qrConfig.bank_code ? styles.notConfigured : ""}`}
                    >
                      {qrConfig.bank_code
                        ? `${qrConfig.bank_code} - ${qrConfig.bank_name}`
                        : "Sin proveedor asignado"}
                    </span>
                  </div>
                  <div className={styles.configField}>
                    <span className={styles.configFieldLabel}>Cargadas:</span>
                    <span
                      className={`${styles.configFieldValue} ${qrConfig.has_credentials ? styles.statusActive : styles.notConfigured}`}
                    >
                      {qrConfig.has_credentials ? "Sí" : "No"}
                    </span>
                  </div>
                </div>
                <div className={styles.configRow}>
                  <div className={styles.configField}>
                    <span className={styles.configFieldLabel}>Usuario:</span>
                    <span
                      className={`${styles.configFieldValue} ${styles.maskedField} ${!qrConfig.qr_dynamic_username_masked ? styles.notConfigured : ""}`}
                    >
                      {qrConfig.qr_dynamic_username_masked || "No configurado"}
                    </span>
                  </div>
                  <div className={styles.configField}>
                    <span className={styles.configFieldLabel}>Referencia:</span>
                    <span
                      className={`${styles.configFieldValue} ${!qrConfig.account_reference ? styles.notConfigured : ""}`}
                    >
                      {qrConfig.account_reference || "No configurado"}
                    </span>
                  </div>
                </div>
                <div className={styles.configRow}>
                  <div className={styles.configField} style={{ flex: 1 }}>
                    <span className={styles.configFieldLabel}>URL Base:</span>
                    <span
                      className={`${styles.configFieldValue} ${styles.urlField}`}
                    >
                      {qrConfig.base_url || "—"}
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className={styles.configEmpty}>
              Elegí una cuenta bancaria para ver su configuración.
            </div>
          )}
        </div>
      </motion.div>

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
