"use client";

import { useState, useEffect } from "react";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import Input from "@/mk/components/forms/Input/Input";
import Button from "@/mk/components/forms/Button/Button";
import styles from "./AssemblyAttendanceForm.module.css";
import useAxios from "@/mk/hooks/useAxios";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import {
  IconSearch,
  IconUser,
  IconCheck,
  IconGenericQr,
} from "@/components/layout/icons/IconsBiblioteca";
import Radio from "@/mk/components/forms/Ratio/Radio";
import dynamic from "next/dynamic";

const QrScanner = dynamic(
  () => import("@/mk/components/ui/QrScanner/QrScanner"),
  { ssr: false },
);

interface AssemblyAttendanceFormProps {
  open: boolean;
  onClose: () => void;
  assemblyId: string;
  assemblyModality?: "P" | "V" | "H"; // P.27: Modalidad de la asamblea para restringir opciones
  onSuccess?: () => void;
}

const AssemblyAttendanceForm: React.FC<AssemblyAttendanceFormProps> = ({
  open,
  onClose,
  assemblyId,
  assemblyModality,
  onSuccess,
}) => {
  const [search, setSearch] = useState("");
  const [residents, setResidents] = useState<any[]>([]);
  const [selectedResident, setSelectedResident] = useState<any>(null);
  const [selectedDptoId, setSelectedDptoId] = useState<string | null>(null);
  const [modality, setModality] = useState<"P" | "V">("P");
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const { execute: fetchResidents } = useAxios();
  const { execute: saveAttendance } = useAxios();
  const { showToast } = useAuth();

  useEffect(() => {
    if (!open) {
      setSearch("");
      setResidents([]);
      setSelectedResident(null);
      setSelectedDptoId(null);
      // P.27: Resetear modalidad al cerrar, usando la modalidad de la asamblea como default
      setModality(assemblyModality === "V" ? "V" : "P");
      setIsScannerOpen(false);
    } else {
      // P.27: Al abrir, setear la modalidad predeterminada según la asamblea
      setModality(assemblyModality === "V" ? "V" : "P");
    }
  }, [open, assemblyModality]);

  useEffect(() => {
    if (selectedResident) {
      const units = selectedResident.dpto || [];
      if (units.length === 1) {
        setSelectedDptoId(units[0].id);
      } else {
        setSelectedDptoId(null);
      }
    }
  }, [selectedResident]);

  const handleSearch = async (searchTerm?: string) => {
    const term = searchTerm !== undefined ? searchTerm : search;
    if (!term.trim()) return;
    setIsSearching(true);

    const params: any = { searchBy: term, fullType: "L" };
    if (searchTerm !== undefined) {
      params.searchById = term;
    }

    try {
      const { data: response, error } = await fetchResidents(
        `/owners`,
        "GET",
        params,
        false,
        true,
      );
      if (response?.data) {
        const results = Array.isArray(response.data)
          ? response.data
          : [response.data];
        setResidents(results || []);
        // Si solo hay un resultado, seleccionarlo automáticamente
        if (results.length === 1) {
          setSelectedResident(results[0]);
        }
      }
      if (error) {
        showToast(error.data?.message || "Error al buscar residentes", "error");
      }
    } catch (error) {
      console.error("Error searching residents:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleQrSuccess = (decodedText: string) => {
    setIsScannerOpen(false);
    const data = (decodedText + "||").split("|");

    if (data[0] === "condaty" && data[1] === "qr") {
      let codeId = data[3];
      // Según lógica de Guard, tipo 'O' (Owner) tiene 10 dígitos de ltime al final
      if (data[2] === "O" && codeId.length > 10) {
        codeId = codeId.slice(0, -10);
      }
      setSearch(codeId);
      handleSearch(codeId);
    } else {
      showToast("QR no reconocido como credencial de Condaty", "warning");
    }
  };

  const handleScannerInitError = (err: any) => {
    console.warn("Scanner Init Error:", err);
    const errMsg = err?.toString() || "";
    if (errMsg.includes("NotFoundError") || errMsg.includes("device not found")) {
      showToast("No se encontró la cámara o está deshabilitada", "error");
    } else if (errMsg.includes("NotAllowedError") || errMsg.includes("Permission denied")) {
      showToast("Permiso de cámara denegado", "error");
    } else {
      showToast("Error al iniciar el escáner", "error");
    }
    setIsScannerOpen(false);
  };

  const handleRegister = async () => {
    if (!selectedResident) return;
    if (!selectedDptoId && (selectedResident.dpto?.length || 0) > 1) {
      showToast(
        "Por favor selecciona el departamento que representa.",
        "warning",
      );
      return;
    }

    setIsSaving(true);
    try {
      const { data: response, error } = await saveAttendance(
        `/assemblies/${assemblyId}/manual-attendance`,
        "POST",
        {
          owner_id: selectedResident.id,
          modality_type: modality,
          dpto_id: selectedDptoId,
        },
      );

      if (response?.success) {
        showToast("Asistencia registrada correctamente", "success");
        onSuccess?.();
        onClose();
      } else {
        showToast(
          response?.message ||
            error?.data?.message ||
            "Error al registrar asistencia",
          "error",
        );
      }
    } catch (error) {
      console.error("Error registering attendance:", error);
      showToast("Error crítico al registrar asistencia", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleLabel = (owner: any, dpto: any) => {
    if (owner.id === dpto.homeowner_id) return "Propietario";
    if (owner.id === dpto.tenant_id) return "Inquilino";
    return dpto.holder === "H" ? "Dependiente de prop." : "Dependiente de inq.";
  };

  return (
    <DataModal
      open={open}
      onClose={onClose}
      title="Registrar Participante"
      buttonText=""
      maxWidth={500}
    >
      <div className={styles.container}>
        <div className={styles.searchSection}>
          <label className={styles.label}>Buscar residente o unidad</label>
          <div className={styles.searchBar}>
            <Input
              name="search"
              value={search}
              onChange={(e: any) => setSearch(e.target.value)}
              onKeyDown={(e: any) => e.key === "Enter" && handleSearch()}
              placeholder="Nombre, CI o Nro de Unidad..."
              className={styles.searchInput}
            />
            <Button
              variant="primary"
              onClick={() => handleSearch()}
              disabled={isSearching}
              className={styles.searchBtn}
              style={{ minWidth: "40px", padding: "0 8px" }}
            >
              <IconSearch size={20} />
            </Button>
            <Button
              variant="secondary"
              onClick={() => setIsScannerOpen(!isScannerOpen)}
              className={styles.qrBtn}
              style={{
                minWidth: "40px",
                padding: "0 8px",
                backgroundColor: isScannerOpen
                  ? "var(--cAccent)"
                  : "transparent",
                borderColor: "var(--cAccent)",
                color: isScannerOpen ? "var(--cBlack)" : "var(--cAccent)",
              }}
            >
              <IconGenericQr size={20} />
            </Button>
          </div>
        </div>

        {isScannerOpen && (
          <div className={styles.scannerContainer}>
            <QrScanner
              onScanSuccess={handleQrSuccess}
              onScanError={(err) => console.debug(err)}
              onInitError={handleScannerInitError}
              qrbox={280}
              aspectRatio={1.0}
              fps={10}
            />
            <p className={styles.scannerHint}>
              Apunta la cámara al QR de la App del residente
            </p>
          </div>
        )}

        <div className={styles.resultsList}>
          {isSearching ? (
            <div className={styles.message}>Buscando...</div>
          ) : residents.length > 0 ? (
            residents.map((res: any) => (
              <div
                key={res.id}
                className={`${styles.residentItem} ${selectedResident?.id === res.id ? styles.selected : ""}`}
                onClick={() => setSelectedResident(res)}
              >
                <Avatar src={res.url_avatar} name={res.name} w={40} h={40} />
                <div className={styles.residentInfo}>
                  <p className={styles.resName}>
                    {res.name} {res.last_name}
                  </p>
                  <p className={styles.resDetail}>
                    Unidad: {res.all_units || "S/N"} | CI: {res.ci || "-"}
                  </p>
                </div>
                {selectedResident?.id === res.id && (
                  <IconCheck size={18} color="var(--cSuccess)" />
                )}
              </div>
            ))
          ) : search && !isSearching ? (
            <div className={styles.message}>No se encontraron resultados.</div>
          ) : (
            <div className={styles.message}>
              Ingresa un nombre o unidad para buscar.
            </div>
          )}
        </div>

        {selectedResident && (
          <div className={styles.registrationForm}>
            {selectedResident.dpto && selectedResident.dpto.length > 1 && (
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Unidad que representa</label>
                <div className={styles.dptoSelection}>
                  {selectedResident.dpto.map((d: any) => (
                    <div
                      key={d.id}
                      className={`${styles.dptoCard} ${selectedDptoId === d.id ? styles.active : ""}`}
                      onClick={() => setSelectedDptoId(d.id)}
                    >
                      <div className={styles.dptoContent}>
                        <span className={styles.dptoNro}>Unidad {d.nro}</span>
                        <span className={styles.dptoRole}>
                          {getRoleLabel(selectedResident, d)}
                        </span>
                      </div>
                      {selectedDptoId === d.id && (
                        <IconCheck size={14} color="var(--cSuccess)" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Modalidad de Asistencia</label>
              <div className={styles.modalityOptions}>
                {/* P.27: Solo mostrar modalidades compatibles con la asamblea */}
                {(!assemblyModality || assemblyModality === "P" || assemblyModality === "H") && (
                  <Radio
                    label="Presencial"
                    checked={modality === "P"}
                    onChange={() => setModality("P")}
                  />
                )}
                {(!assemblyModality || assemblyModality === "V" || assemblyModality === "H") && (
                  <Radio
                    label="Virtual"
                    checked={modality === "V"}
                    onChange={() => setModality("V")}
                  />
                )}
              </div>
            </div>

            <Button
              variant="primary"
              onClick={handleRegister}
              disabled={isSaving || !selectedDptoId}
              className={styles.registerBtn}
              style={{ width: "100%" }}
            >
              {isSaving ? "Registrando..." : "Confirmar Registro"}
            </Button>
          </div>
        )}

        {/* <div className={styles.footer}>
          <Button
            variant="secondary"
            onClick={onClose}
            style={{ width: "100%" }}
          >
            Cancelar
          </Button>
        </div> */}
      </div>
    </DataModal>
  );
};

export default AssemblyAttendanceForm;
