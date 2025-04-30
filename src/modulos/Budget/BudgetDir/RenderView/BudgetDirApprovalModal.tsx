import React, { useState } from 'react';
import DataModal from '@/mk/components/ui/DataModal/DataModal';
import Button from '@/mk/components/forms/Button/Button';
import KeyValue from '@/mk/components/ui/KeyValue/KeyValue'; // Asumiendo que tienes este componente
import { formatNumber } from "@/mk/utils/numbers";
import { getDateStrMes } from "@/mk/utils/date";
import { getFullName } from "@/mk/utils/string";
import styles from "./BudgetDirApprovalModal.module.css"; // Puedes usar los mismos estilos o crear unos nuevos

// Funciones de formato (puedes importarlas desde BudgetDir o definirlas aquí si prefieres)
const formatPeriod = (periodCode: string): string => {
    const map: Record<string, string> = { D: "Diario", W: "Semanal", F: "Quincenal", M: "Mensual", B: "Bimestral", Q: "Trimestral", S: "Semestral", Y: "Anual" };
    return map[periodCode] || periodCode;
};
const formatStatus = (statusCode: string): string => {
    const map: Record<string, string> = { D: "Borrador", P: "Pendiente Aprobación", A: "Aprobado", R: "Rechazado", C: "Completado", X: "Cancelado" };
    return map[statusCode] || statusCode;
};


// Tipos para las props que recibe de useCrud
type BudgetApprovalViewProps = {
    open: boolean;
    onClose: () => void;
    item: any; // El objeto del presupuesto seleccionado
    execute: (url: string, method: string, payload: any, noWaiting?: boolean, noGenericError?: boolean) => Promise<{ data?: any, error?: any }>; // Función para llamadas API
    reLoad: () => void; // Función para recargar la lista
    showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void; // Función para mostrar notificaciones
    extraData?: any; // Datos extra si los necesitas
};

const BudgetApprovalView: React.FC<BudgetApprovalViewProps> = ({
    open,
    onClose,
    item,
    execute,
    reLoad,
    showToast,
    extraData
}) => {
    const [isApproving, setIsApproving] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);

    const handleAction = async (newStatus: 'A' | 'R') => {
        const isLoadingSetter = newStatus === 'A' ? setIsApproving : setIsRejecting;
        const actionText = newStatus === 'A' ? 'aprobado' : 'rechazado';

        isLoadingSetter(true);
        try {
            const url = `/budgets/${item.id}`; // Endpoint para actualizar el presupuesto
            const method = 'PUT'; // o 'PATCH' si tu API lo prefiere
            const payload = { status: newStatus };

            // noGenericError = true para manejar el error manualmente aquí
            const { data: response, error } = await execute(url, method, payload, false, true);

            if (response?.success) {
                showToast(`Presupuesto ${actionText} correctamente.`, 'success');
                reLoad(); // Recarga la lista para reflejar el cambio
                onClose(); // Cierra el modal
            } else {
                // Muestra el mensaje de error de la API o uno genérico
                throw new Error(response?.message || error?.message || `Error al ${actionText} el presupuesto.`);
            }

        } catch (err: any) {
            showToast(err.message || `Ocurrió un error al ${actionText}.`, 'error');
            console.error(`Error on budget ${actionText}:`, err);
        } finally {
            isLoadingSetter(false);
        }
    };

    const handleApprove = () => handleAction('A');
    const handleReject = () => handleAction('R');

    // Prevenir cierre si está cargando
    const handleCloseModal = () => {
        if (!isApproving && !isRejecting) {
            onClose();
        }
    }

    return (
        <DataModal
            open={open}
            onClose={handleCloseModal}
            title="Aprobar / Rechazar Presupuesto"
            // Quitamos botones por defecto del footer para usar los nuestros
            buttonText=""
            buttonCancel=""
        >
            {/* Cuerpo del Modal: Detalles del Presupuesto */}
            <div className={styles.viewDetailsContainer}> {/* Añade un estilo si es necesario */}
                <KeyValue title="ID" value={item?.id} />
                <KeyValue title="Nombre" value={item?.name} />
                <KeyValue title="Categoría" value={item?.category?.name || 'N/A'} />
                <KeyValue title="Monto" value={`Bs ${formatNumber(item?.amount)}`} />
                <KeyValue title="Periodo" value={formatPeriod(item?.period)} />
                <KeyValue title="Fecha Inicio" value={getDateStrMes(item?.start_date)} />
                <KeyValue title="Fecha Fin" value={getDateStrMes(item?.end_date)} />
                <KeyValue title="Estado Actual" value={
                    <div className={`${styles.statusBadge} ${styles[`status${item?.status}`] || ''}`}>
                        {formatStatus(item?.status)}
                    </div>
                } />
                <KeyValue title="Creado por" value={getFullName(item?.user) || 'Sistema'} />
                {/* Puedes añadir más campos si son relevantes */}
            </div>

            {/* Footer del Modal: Botones de Acción */}
            <div className={styles.viewActionsFooter}> {/* Añade un estilo para el footer */}
                <Button
                    onClick={handleReject}
                    variant="cancel" // Estilo para rechazar
                    disabled={isApproving || isRejecting}
                   
                >
                    Rechazar
                </Button>
                <Button
                    onClick={handleApprove}
                    variant="primary" // Estilo para aprobar
                    disabled={isApproving || isRejecting}
                
                    
                >
                    Aprobar
                </Button>
            </div>
        </DataModal>
    );
};

export default BudgetApprovalView;