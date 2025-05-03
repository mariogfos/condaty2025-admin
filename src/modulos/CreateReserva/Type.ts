// ./Type.ts (o la ruta correcta)

// --- Interfaces para la API /dptos ---
export interface ApiHomeowner {
    id: string;
    name: string;
    middle_name?: string | null;
    last_name: string;
    mother_last_name?: string | null;
    updated_at?: string;
  }
  export interface ApiTitularOwner extends ApiHomeowner {}
  export interface ApiDptoTitular {
    id: number;
    owner_id: string;
    dpto_id: number;
    owner: ApiTitularOwner;
  }
  export interface ApiTypeField {
    id: number;
    type_id: number;
    name: string;
    type: string;
  }
  export interface ApiDptoType {
    id: number;
    name: string;
    description?: string | null;
    is_fixed?: string | null;
    status?: string;
    client_id?: string;
    created_at?: string;
    updated_at?: string;
    fields?: ApiTypeField[];
  }
  export interface ApiUnitFieldValue {
    id: number;
    unit_id: number;
    field_id: number;
    value: string | any; // Usamos 'any' si el valor puede variar mucho
  }
  export interface ApiUnidad {
    id: number;
    nro: string;
    description?: string | null;
    dimension?: string | null;
    expense_amount?: string | null;
    homeowner_id?: string | null;
    type_id: number;
    homeowner?: ApiHomeowner | null;
    titular?: ApiDptoTitular | null;
    type?: ApiDptoType;
    field_values?: ApiUnitFieldValue[];
    updated_at?: string;
  }
  export interface ApiDptosResponse {
      success: boolean;
      data: ApiUnidad[];
      message?: { total?: number };
      // Debug_Querys?: any[];
      // debugMsg?: any[];
  }
  
  // --- Interfaces para la API /areas ---
  export interface ApiAreaImage {
    id: number;
    area_id: string;
    ext: string;
  }
  export interface ApiArea {
    id: string;
    title: string;
    description?: string | null;
    max_capacity?: number | null;
    status?: string;
    available_days?: string[];
    available_hours?: Record<string, string[]> | null;
    booking_mode?: 'hour' | 'day' | string | null;
    price?: string | null;
    is_free?: 'X' | string | null;
    max_booking_duration?: number | null;
    special_restrictions?: string | null;
    usage_rules?: string | null;
    max_reservations_per_day?: number | null;
    max_reservations_per_week?: number | null;
    penalty_or_debt_restriction?: 'X' | string | null;
    requires_approval?: 'A' | string | null;
    approval_response_hours?: number | null;
    auto_approval_available?: 'X' | string | null;
    cancellable?: 'A' | string | null;
    min_cancel_hours?: number | null;
    late_cancellation_penalty?: 'X' | string | null;
    cancellation_policy?: string | null;
    penalty_fee?: string | null;
    enable_survey?: 'A' | string | null;
    survey_template?: string | null;
    show_in_calendar?: 'A' | string | null;
    show_real_time_availability?: 'A' | string | null;
    client_id?: string;
    deleted_at?: string | null;
    created_at?: string;
    updated_at?: string;
    images?: ApiAreaImage[];
  }
  export interface ApiAreasResponse {
      success: boolean;
      data: ApiArea[];
      message?: { total?: number };
      // Debug_Querys?: any[];
      // debugMsg?: any[];
  }
  
  // --- Interfaces para la API /reservations-calendar ---
  export interface ApiReservationsCalendarData {
      reserved?: string[];
      // available_slots?: string[];
  }
  export interface ApiReservationsCalendarResponse {
    success?: boolean;
    // La API parece anidar los datos así: response.data.data
    data?: {
       data?: ApiCalendarAvailabilityData; // <--- Usa la interfaz renombrada y completa
    } | ApiCalendarAvailabilityData | []; // <-- AÑADIDO: O puede ser directamente el objeto O un array vacío []
    message?: string; // Mensaje general de la respuesta
    // Debug_Querys?: any[];
    // debugMsg?: any[];
}
  
  // --- Interfaz para Opciones de Select (Usada en el Frontend) ---
  export interface Option {
    id: number | string;
    name: string;
  }
  export interface FormState {
    unidad: string;
    area_social: string;
    fecha: string;
    // REMOVIDOS: hora_inicio, hora_fin
    // NO AÑADIMOS NADA AQUÍ, la selección va a un estado separado
    cantidad_personas: string | number;
    motivo: string;
    nombre_responsable: string;
    telefono_responsable: string;
    email_responsable: string;
  }
  export interface ApiCalendarAvailabilityData { // <--- RENOMBRADA para claridad
    reserved?: string[];       // Días con alguna reserva (cuando no pides fecha)
    available?: string[];      // Slots disponibles (cuando pides fecha)
    reservations?: boolean;    // Si se permite reservar en la fecha pedida
    message?: string;          // Mensaje asociado a 'reservations'
}