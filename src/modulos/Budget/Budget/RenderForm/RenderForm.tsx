// BudgetApprovalView.tsx
import React, { useState, useEffect } from 'react';
import DataModal from '@/mk/components/ui/DataModal/DataModal';
import Button from '@/mk/components/forms/Button/Button';
import KeyValue from '@/mk/components/ui/KeyValue/KeyValue';
import TextArea from '@/mk/components/forms/TextArea/TextArea'; // Asegúrate de tener este componente
import { formatNumber } from "@/mk/utils/numbers";
import { getDateStrMes } from "@/mk/utils/date";
import { getFullName } from "@/mk/utils/string";
import styles from "./RenderForm.module.css"; // O los estilos apropiados

// Funciones de formato
const formatPeriod = (periodCode: string): string => {
    const map: Record<string, string> = { M: "Mensual", Q: "Trimestral", B: "Bimestral", Y: "Anual" }; // M: monthly | Q: quaterly | B: biannual | Y: yearly
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

    useEffect(() => {
        if (open) {
            setComment("");
        }
    }, [open, item]);

    // --- Función handleAction (Usa POST y Query Params) ---
    const handleAction = async (newStatus: 'A' | 'R') => {
        const isLoadingSetter = newStatus === 'A' ? setIsApproving : setIsRejecting;
        const actionText = newStatus === 'A' ? 'aprobado' : 'rechazado';

        isLoadingSetter(true);
        try {
            const method = 'POST'; // Método es POST
            const budgetId = item?.id;
            if (!budgetId) {
                throw new Error("ID del presupuesto no encontrado.");
            }

            // Construye Query Params
            const params = new URLSearchParams({
                status: newStatus,
                id: budgetId.toString(),
                comment: comment || ""
            });
            // AJUSTA "/change-budget-status" a tu endpoint real
            const url = `/change-budget-status?${params.toString()}`;
            const payload = {}; // Payload vacío

            console.log("Enviando (Approve/Reject):", { url, method, payload });

            const { data: response, error } = await execute(url, method, payload, false, true);

            if (response?.success) {
                showToast(`Presupuesto ${actionText} correctamente.`, 'success');
                reLoad();
                onClose();
            } else {
                throw new Error(response?.message || error?.message || `Error al ${actionText} el presupuesto.`);
            }

        } catch (err: any) {
            showToast(err.message || `Ocurrió un error al ${actionText}.`, 'error');
            console.error(`Error on budget ${actionText}:`, err);
        } finally {
            isLoadingSetter(false);
        }
    };
    // --- Fin handleAction ---

    const handleApprove = () => handleAction('A');
    const handleReject = () => handleAction('R');

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
            buttonText=""
            buttonCancel=""
            
        >
            {/* Detalles del Presupuesto */}
            <div className={styles.viewDetailsContainer}>
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
            </div>

            {/* Campo de Comentario */}
            <div style={{ marginTop: '15px', marginBottom: '15px' }}>
                <TextArea
                    label="Comentario"
                    name="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Ingrese un comentario..."
                 
                />
            </div>

            {/* Footer con Botones de Acción */}
            <div className={styles.viewActionsFooter}>
                <Button onClick={handleReject} variant="cancel" disabled={isApproving || isRejecting}> Rechazar </Button>
                <Button onClick={handleApprove} variant="primary" disabled={isApproving || isRejecting}> Aprobar </Button>
            </div>
        </DataModal>
    );
};

export default BudgetApprovalView;