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
  { id: 'w',   name: 'Semana actual' },
  { id: 'lw',  name: 'Semana anterior' },
  { id: 'm',   name: 'Mes actual' },
  { id: 'lm',  name: 'Mes anterior' },
  { id: 'y',   name: 'Año actual' },
  { id: 'ly',  name: 'Año anterior' },
  { id: 'custom', name: 'Personalizado...' },
];
