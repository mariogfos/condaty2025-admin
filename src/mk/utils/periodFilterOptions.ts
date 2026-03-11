/**
 * getPeriodOptions
 *
 * Reusable list of period filter options for use with useCrud's `filter.options`.
 * Matches backend PeriodFilterService tokens exactly.
 *
 * Usage in any module's fields config:
 *   import { getPeriodOptions } from '@/mk/utils/periodFilterOptions';
 *   ...
 *   created_at: {
 *     filter: { label: 'Período', options: getPeriodOptions },
 *   }
 */

export type PeriodOption = { id: string; name: string };

export const getPeriodOptions = (): PeriodOption[] => [
  { id: 'ALL', name: 'Todos los períodos' },
  { id: 'd',   name: 'Hoy' },
  { id: 'ld',  name: 'Ayer' },
  { id: 'w',   name: 'Esta semana' },
  { id: 'lw',  name: 'Semana anterior' },
  { id: 'm',   name: 'Este mes' },
  { id: 'lm',  name: 'Mes anterior' },
  { id: 'y',   name: 'Este año' },
  { id: 'ly',  name: 'Año anterior' },
  { id: 'custom', name: 'Personalizado...' },
];
