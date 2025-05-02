import React, { useState } from 'react';
import DataModal from '@/mk/components/ui/DataModal/DataModal';
import Button from '@/mk/components/forms/Button/Button';
import KeyValue from '@/mk/components/ui/KeyValue/KeyValue';
import { formatNumber } from "@/mk/utils/numbers";
import { getDateStrMes } from "@/mk/utils/date";
import { getFullName } from "@/mk/utils/string";
import styles from "./BudgetDirApprovalModal.module.css"; // Ajusta el nombre si es diferente
import TextArea from '@/mk/components/forms/TextArea/TextArea';

const formatPeriod = (periodCode: string): string => {
    const map: Record<string, string> = { D: "Diario", W: "Semanal", F: "Quincenal", M: "Mensual", B: "Bimestral", Q: "Trimestral", S: "Semestral", Y: "Anual" };
    return map[periodCode] || periodCode;
};
const formatStatus = (statusCode: string): string => {
    const map: Record<string, string> = { D: "Borrador", P: "Pendiente Aprobación", A: "Aprobado", R: "Rechazado", C: "Completado", X: "Cancelado" };
    return map[statusCode] || statusCode;
};

type BudgetApprovalViewProps = {
    open: boolean;
    onClose: () => void;
    item: any;
    execute: (url: string, method: string, payload: any, noWaiting?: boolean, noGenericError?: boolean) => Promise<{ data?: any, error?: any }>;
    reLoad: () => void;
    showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
    extraData?: any;
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
    const [comment, setComment] = useState("");

// Dentro del componente BudgetApprovalView

    const handleAction = async (newStatus: 'A' | 'R') => {
        const isLoadingSetter = newStatus === 'A' ? setIsApproving : setIsRejecting;
        // Mantenemos el texto descriptivo de la acción
        const actionText = newStatus === 'A' ? 'aprobado' : 'rechazado';

        const budgetId = item?.id;
        if (!budgetId) {
            showToast("Error: No se encontró el ID del presupuesto.", "error");
            return;
        }

        isLoadingSetter(true);
        try {
            const payload = {
                status: newStatus,
                id: budgetId,
                comment: comment || ""
            };
            const url = '/change-budget'; // Ajusta si es necesario

            console.log("Enviando (Approve/Reject):", { url, method: 'POST', payload });

            const { data: response } = await execute(
                url,
                'POST',
                payload,
                false, // noWaiting = false
                true   // noGenericError = true
            );

            // --- INICIO: Modificación del Tipo de Toast ---

            // 1. Determina el tipo de toast basado en newStatus
            const toastType: 'success' | 'info' | 'warning' = newStatus === 'A'
                ? 'success' // Éxito si es Aprobado
                : 'info';   // Información (o 'warning') si es Rechazado

            // 2. Llama a showToast con el tipo determinado
            showToast(
                response?.message || `Presupuesto ${actionText} correctamente.`, // El mensaje puede seguir siendo el mismo o personalizado
                toastType // Usa la variable para el tipo
            );

            // --- FIN: Modificación del Tipo de Toast ---

            reLoad(); // Recarga la lista
            onClose(); // Cierra el modal

        } catch (err: any) {
            const errorMessage = err?.response?.data?.message || err?.message || `Ocurrió un error al ${actionText}.`;
            showToast(errorMessage, 'error');
            console.error(`Error on budget ${actionText}:`, err);
        } finally {
            isLoadingSetter(false);
        }
    };

    const handleApprove = () => handleAction('A');
    const handleReject = () => handleAction('R');

    const handleCloseModal = () => { onClose() };

    return (
        <DataModal
            open={open}
            onClose={handleCloseModal}
            title="Aprobar / Rechazar Presupuesto"
            buttonText=""
            buttonCancel=""
        >
            <div className={styles.divider}></div>
            <div className={styles.viewDetailsContainer}>
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
            </div>

            <div style={{ marginTop: '15px', marginBottom: '15px' }}>
                <TextArea
                    label="Comentario"
                    name="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Ingrese un comentario..."
                />
            </div>
            <div className={styles.actionButtonsContainer}>
                <Button
                    className={styles.secondaryActionButton}
                    onClick={handleReject}
                    variant="cancel"
                    disabled={isApproving || isRejecting}
                >
                    Rechazar
                </Button>
                <Button
                    className={styles.primaryActionButton}
                    onClick={handleApprove}
                    variant="primary"
                    disabled={isApproving || isRejecting}
                >
                    Aprobar
                </Button>
            </div>
        </DataModal>
    );
};

export default BudgetApprovalView;