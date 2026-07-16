/**
 * Enums SSoT cross-app sync test (admin).
 *
 * S5 PLAN-FIX-FINANZAS: Centraliza enums compartidos entre admin/rnGuard/rnOwner
 * via JSON SSoT versionado en humandistor (`.makromania/projects/condaty/sprints/enums-ssot.json`).
 * Cada app copia el SSoT a `tests/__fixtures__/enums-ssot.json` y este test pineá que
 * el enum local coincide con el SSoT.
 *
 * Si alguien cambia un enum local sin actualizar el SSoT, este test falla en CI.
 * Si alguien actualiza el SSoT sin propagar a las apps, cada app detecta drift.
 *
 * Sync manual:
 *   cp /Users/marioguzman/.mavis/projects/condaty/sprints/enums-ssot.json \
 *      tests/__fixtures__/enums-ssot.json
 */
import { describe, it, expect } from 'vitest';
import ssot from '../../../../tests/__fixtures__/enums-ssot.json';

// Enums locales de admin (numeric int-backed o string char-backed según SSoT)
import { ReservationStatus } from '@/modulos/Reservas/constants/reservationConstants';
import {
  PaymentStatus,
  PaymentMethod,
  PaymentType,
} from '@/modulos/Payments/Type/PaymentType';
import { DebtStatus } from '@/types/PaymentType';
import {
  AssemblyStatus,
  AssemblyType,
  AssemblyModality,
  TargetAudience,
} from '@/modulos/Assemblies/types/assemblies.types';
import { SurveyStatus } from '@/modulos/Surveys/types/surveys.types';

// Mapeo enum-name → import local. El test itera el SSoT y busca en este mapa.
const LOCAL_ENUMS: Record<string, Record<string, number | string>> = {
  ReservationStatus,
  PaymentStatus,
  PaymentMethod,
  PaymentType,
  DebtStatus,
  AssemblyStatus,
  AssemblyType,
  AssemblyModality,
  TargetAudience,
  SurveyStatus,
};

describe('Enums SSoT sync (admin vs cross-app SSoT)', () => {
  it('JSON SSoT es válido y tiene la estructura esperada', () => {
    expect(ssot.version).toBeDefined();
    expect(ssot.enums).toBeDefined();
    expect(Object.keys(ssot.enums).length).toBeGreaterThan(0);
  });

  for (const [enumName, enumSsot] of Object.entries(ssot.enums)) {
    describe(`${enumName} (type=${enumSsot.type}, apps=${enumSsot.apps.join(',')})`, () => {
      it(`existe en admin y todos los valores matchean el SSoT`, () => {
        const localEnum = LOCAL_ENUMS[enumName];
        if (!localEnum) {
          if (!enumSsot.apps.includes('admin')) {
            return; // skip silencioso — admin no consume este enum
          }
          throw new Error(
            `SSoT declara ${enumName} con apps=['${enumSsot.apps.join("','")}'] pero admin no lo importa en LOCAL_ENUMS. Agregá el import.`
          );
        }

        for (const ssotVal of enumSsot.values) {
          const localVal = localEnum[ssotVal.name];
          expect(
            localVal,
            `${enumName}.${ssotVal.name} debería ser ${JSON.stringify(ssotVal.value)} (SSoT), pero el enum local retorna ${JSON.stringify(localVal)}`
          ).toBe(ssotVal.value);
        }
      });

      it(`admin no tiene valores extra que no estén en el SSoT`, () => {
        const localEnum = LOCAL_ENUMS[enumName];
        if (!localEnum || !enumSsot.apps.includes('admin')) return;

        const ssotNames = new Set(enumSsot.values.map((v) => v.name));
        for (const localKey of Object.keys(localEnum)) {
          // Filter TypeScript reverse-mappings en enums numéricos:
          // Para `enum X { A = 1 }`, el runtime también tiene `X[1] = "A"`.
          // localKey es la string "1" y localEnum["1"] es "A". No es un valor real.
          if (enumSsot.type === 'int') {
            // Si la key parseable como int, es un reverse mapping, no un valor real.
            if (/^\d+$/.test(localKey)) continue;
            // Si el valor es un string (sería el reverse mapping del int), skip.
            if (typeof localEnum[localKey] === 'string') continue;
          }
          expect(
            ssotNames.has(localKey),
            `${enumName}.${localKey} existe en admin pero NO está en SSoT. Agregalo al SSoT o borrá el enum local.`
          ).toBe(true);
        }
      });
    });
  }
});
