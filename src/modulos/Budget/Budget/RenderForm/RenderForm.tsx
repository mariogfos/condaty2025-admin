// /modulos/budget/BudgetRenderForm.tsx (o donde prefieras guardarlo)
"use client";
import React, { useEffect, useState, useMemo } from "react";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import Input from "@/mk/components/forms/Input/Input";
import Select from "@/mk/components/forms/Select/Select";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { checkRules, hasErrors } from "@/mk/utils/validate/Rules"; // Asumiendo que tienes esta utilidad
import TextArea from "@/mk/components/forms/TextArea/TextArea"; // Si necesitas un campo de descripción

// Importa las funciones de opciones si las tienes separadas
// o defínelas aquí si es más conveniente
const getPeriodOptions = () => [
    // { id: "", name: "Seleccione Periodo" }, // Opcional: Placeholder
    { id: "M", name: "Mensual" },
    { id: "B", name: "Bimestral" },
    { id: "Q", name: "Trimestral" },
    { id: "S", name: "Semestral" },
    { id: "Y", name: "Anual" }
    // Añade otros si existen (Diario, Semanal, etc.) si aplican a presupuesto
];

// --- Interfaz de Props (Asegúrate que coincida con lo que useCrud pasa) ---
interface BudgetRenderFormProps {
    open: boolean;
    onClose: () => void;
    item: any; // El presupuesto a editar (o vacío/null si es nuevo)
    setItem?: (item: any) => void; // Función para actualizar item (si useCrud la pasa y la necesitas)
    execute: (url: string, method: string, payload: any, wait?: boolean, genericError?: boolean) => Promise<any>; // Función de useAxios/useCrud
    extraData: any; // Datos extra como categorías
    user: any; // Información del usuario (si es necesaria)
    reLoad: () => void; // Función para recargar la lista principal
    action: 'add' | 'edit'; // Acción actual
    errors?: any; // Errores pasados desde useCrud (opcional)
    setErrors?: (errors: any) => void; // Función para setear errores (opcional)
}

// --- Componente RenderForm para Budget ---
const RenderForm: React.FC<BudgetRenderFormProps> = ({
    open,
    onClose,
    item,
    setItem, // Recibe setItem si lo necesitas
    execute,
    extraData,
    user,
    reLoad,
    action // Recibe la acción actual
}) => {
    // Estado local para el formulario
    const [formState, setFormState] = useState<any>({});
    const [errors, setErrors] = useState<any>({}); // Estado local de errores
    const { showToast } = useAuth();

    // Inicializa/Resetea el estado del formulario cuando 'item' o 'open' cambian
    useEffect(() => {
        if (open) {
            // Si es acción 'add', inicializa vacío o con defaults
            // Si es 'edit', inicializa con los datos de 'item'
            setFormState(action === 'edit' && item ? { ...item } : {
                period: "M", // Valor por defecto ejemplo
                start_date: "",
                end_date: "",
                name: "",
                amount: "",
                category_id: "",
                // Inicializa otros campos si es necesario
            });
            setErrors({}); // Limpia errores al abrir/cambiar item
        }
    }, [item, open, action]);

    // Manejador genérico de cambios en inputs/selects
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const finalValue = type === 'number' ? parseFloat(value) || '' : value; // Manejar números

        setFormState((prev: any) => ({ ...prev, [name]: finalValue }));

        // Limpia el error del campo específico al modificarlo
        if (errors[name]) {
            setErrors((prevErrors: any) => ({ ...prevErrors, [name]: undefined }));
        }
    };

    // Función de Validación (adaptada a los campos de Budget)
    const validate = () => {
        let errs: any = {};
        // Usa checkRules o validaciones simples
        errs = checkRules({ value: formState.name, rules: ["required"], key: "name", errors: errs });
        errs = checkRules({ value: formState.start_date, rules: ["required"], key: "start_date", errors: errs });
        errs = checkRules({ value: formState.end_date, rules: ["required"], key: "end_date", errors: errs });
        errs = checkRules({ value: formState.amount, rules: ["required", "number"], key: "amount", errors: errs });
        errs = checkRules({ value: formState.period, rules: ["required"], key: "period", errors: errs });
        errs = checkRules({ value: formState.category_id, rules: ["required"], key: "category_id", errors: errs });

        // Validación Fechas (Ejemplo simple: fin >= inicio)
        if (formState.start_date && formState.end_date && formState.end_date < formState.start_date) {
             errs.end_date = (errs.end_date ? errs.end_date + " " : "") + "La fecha fin debe ser igual o posterior a la fecha de inicio.";
        }


        setErrors(errs);
        return errs;
    };

    // Función para guardar (Crear o Editar)
    const onSave = async () => {
        const formErrors = validate();
        if (hasErrors(formErrors)) {
             showToast("Por favor, corrija los errores marcados.", "warning");
             return;
        }

        const method = formState.id ? "PUT" : "POST"; // Determina el método basado en si hay ID
        const url = "/budgets" + (formState.id ? "/" + formState.id : ""); // Construye la URL

        // Payload con los datos a enviar (ajusta según tu API)
        const payload = {
            name: formState.name,
            start_date: formState.start_date,
            end_date: formState.end_date,
            amount: parseFloat(formState.amount) || 0, // Asegura que sea número
            period: formState.period,
            category_id: parseInt(formState.category_id, 10), // Asegura que sea número entero
            // Incluye otros campos si son necesarios para tu API
        };

        try {
            const { data: response } = await execute(url, method, payload, false, false);

            if (response?.success === true) {
                const successMsg = action === 'add'
                    ? "Presupuesto creado con éxito"
                    : "Presupuesto actualizado con éxito"; 
                showToast(successMsg, "success");
                reLoad(); // Recarga la lista principal
                // setItem(formState); // Actualiza item si useCrud lo necesita
                onClose(); // Cierra el modal
            } else {
                 // Intenta mostrar mensaje de error específico de la API
                const errorMsg = response?.message || response?.data?.message || `Error al ${action === 'add' ? 'crear' : 'actualizar'} el presupuesto.`;
                showToast(errorMsg, "error");
                // Opcional: Mapear errores específicos de campos si la API los devuelve
                if (response?.data?.errors) {
                     setErrors(response.data.errors);
                }
            }
        } catch (error: any) {
             console.error(`Error en ${action === 'add' ? 'creación' : 'edición'} de presupuesto:`, error);
             showToast(`Ocurrió un error inesperado. ${error?.message || ''}`, "error");
        }
    };

    // Prepara las opciones de categoría desde extraData
    const categoryOptions = useMemo(() => {
        return [
            { id: "", name: "Seleccione Categoría" }, // Placeholder
            ...(extraData?.categories || []).map((cat: any) => ({
                id: cat.id,
                name: cat.name,
            }))
        ];
    }, [extraData?.categories]);

    // --- Renderizado del Modal y Formulario ---
    return (
        <DataModal
            open={open}
            onClose={onClose}
            title={action === 'add' ? "Crear Presupuesto" : "Editar Presupuesto"}
            onSave={onSave} // Llama a la función onSave local
            // Puedes añadir más props a DataModal si es necesario (buttonText, etc.)
        >
            {/* --- Campos del Formulario --- */}

            {/* Nombre */}
            <Input
                label="Nombre del Presupuesto"
                name="name"
                value={formState.name || ''}
                onChange={handleChange}
                error={errors.name}
                required
            />

            {/* Fecha Inicio */}
            <Input
                label="Fecha de Inicio"
                name="start_date"
                value={formState.start_date || ''}
                onChange={handleChange}
                type="date"
                error={errors.start_date}
                required
            />

            {/* Fecha Fin */}
            <Input
                label="Fecha de Fin"
                name="end_date"
                value={formState.end_date || ''}
                onChange={handleChange}
                type="date"
                error={errors.end_date}
                required
            />

            {/* Monto */}
            <Input
                label="Monto Presupuestado (Bs)"
                name="amount"
                value={formState.amount || ''}
                onChange={handleChange}
                type="number" // O "text" con pattern="[0-9]*\.?[0-9]+" si necesitas más control
                placeholder="Ej: 5000.00"
                error={errors.amount}
                required
            />

            {/* Periodo */}
            <Select
                label="Periodo"
                name="period"
                value={formState.period || ''}
                options={getPeriodOptions()} // Usa la función definida
                onChange={handleChange}
                error={errors.period}
                required
            />

            {/* Categoría */}
            <Select
                label="Categoría"
                name="category_id"
                value={formState.category_id || ''}
                options={categoryOptions} // Usa las opciones preparadas
                onChange={handleChange}
                error={errors.category_id}
                required
            />

             {/* Aquí es donde iría la lógica compleja si fuera necesaria: */}
             {/* Por ejemplo, si action === 'edit' y item.status === 'PA' */}
             {/* mapearías los egresos y los renderizarías condicionalmente */}
             {/* {action === 'edit' && formState.status === 'PA' && (
                 <div>
                     <h3>Egresos</h3>
                     {egresos.map(egreso => (
                         <div key={egreso.id}>
                             <Input name={`egreso_${egreso.id}_name`} value={...} disabled={egreso.status === 'A'} />
                             // ... otros campos del egreso ...
                         </div>
                     ))}
                 </div>
             )} */}


        </DataModal>
    );
};

export default RenderForm;