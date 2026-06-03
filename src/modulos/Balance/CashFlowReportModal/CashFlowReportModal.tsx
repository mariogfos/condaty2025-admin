"use client";

import React, { useState } from "react";
import axios from "axios";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import Input from "@/mk/components/forms/Input/Input";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { logError } from "@/mk/utils/logs";
import styles from "./CashFlowReportModal.module.css";

interface CashFlowReportModalProps {
  open: boolean;
  onClose: () => void;
}

interface FormState {
  start_date: string;
  end_date: string;
}

interface ErrorState {
  start_date?: string;
  end_date?: string;
}

// Create axios instance with interceptors to handle auth token
const getApiInstance = () => {
  const instance = axios.create();

  // Request interceptor to add auth token
  instance.interceptors.request.use(
    (config: any) => {
      let apiToken = null;
      try {
        apiToken = JSON.parse(
          localStorage.getItem(
            (process.env.NEXT_PUBLIC_AUTH_IAM as string) + "token",
          ) + "",
        ).token;
      } catch (e) {
        apiToken = null;
      }

      if (apiToken) {
        config.headers = {
          ...(config.headers || {}),
          Authorization: "Bearer " + apiToken,
          accept: "application/json",
        };
      }
      return config;
    },
    (error: any) => {
      logError("Network error1:", error);
      return Promise.reject(error);
    },
  );

  return instance;
};

const CashFlowReportModal: React.FC<CashFlowReportModalProps> = ({
  open,
  onClose,
}) => {
  const { showToast }: any = useAuth();
  const [formState, setFormState] = useState<FormState>({
    start_date: "",
    end_date: "",
  });
  const [errors, setErrors] = useState<ErrorState>({});
  const [loading, setLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: ErrorState = {};

    if (!formState.start_date) {
      newErrors.start_date = "La fecha de inicio es obligatoria";
    }

    if (!formState.end_date) {
      newErrors.end_date = "La fecha de fin es obligatoria";
    }

    if (formState.start_date && formState.end_date) {
      if (formState.start_date > formState.end_date) {
        newErrors.start_date =
          "La fecha de inicio no puede ser mayor a la fecha de fin";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDownload = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const startDate = formState.start_date;
      const endDate = formState.end_date;

      const url = `${apiUrl}/payments-v2/export-cash-flow?start_date=${startDate}&end_date=${endDate}`;

      const apiInstance = getApiInstance();

      const response = await apiInstance.get(url, {
        responseType: "blob",
      });

      // Get filename from content-disposition header or default
      let filename = `cash-flow-report-${startDate}-${endDate}.xlsx`;
      const contentDisposition = response.headers["content-disposition"];
      if (contentDisposition) {
        const match = contentDisposition.match(
          /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/,
        );
        if (match && match[1]) {
          filename = match[1].replace(/['"]/g, "");
        }
      }

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(blobUrl);

      showToast("Reporte descargado exitosamente", "success");
      handleClose();
    } catch (err: any) {
      console.error("Download error:", err);
      // Handle blob error response (when backend returns JSON error as blob)
      if (err.response?.data instanceof Blob) {
        const text = await err.response.data.text();
        try {
          const json = JSON.parse(text);
          showToast(json.message || "Error al descargar el reporte", "error");
        } catch {
          showToast("Error al descargar el reporte", "error");
        }
      } else {
        showToast(err.message || "Error al descargar el reporte", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormState({ start_date: "", end_date: "" });
    setErrors({});
    onClose();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name as keyof ErrorState]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <DataModal
      open={open}
      onClose={handleClose}
      onSave={handleDownload}
      title="Reporte Mensual CashFlow"
      buttonText={loading ? "Descargando..." : "Descargar"}
      buttonCancel="Cancelar"
      disabled={loading}
      minWidth={400}
      maxWidth={500}
    >
      <div className={styles.formContainer}>
        <p className={styles.description}>
          Seleccione el rango de fechas para generar el reporte de CashFlow.
        </p>

        <div className={styles.inputGroup}>
          <Input
            type="date"
            name="start_date"
            label="Fecha Inicio"
            value={formState.start_date}
            onChange={handleInputChange}
            error={errors}
            required
          />
        </div>

        <div className={styles.inputGroup}>
          <Input
            type="date"
            name="end_date"
            label="Fecha Fin"
            value={formState.end_date}
            onChange={handleInputChange}
            error={errors}
            required
          />
        </div>
      </div>
    </DataModal>
  );
};

export default CashFlowReportModal;
