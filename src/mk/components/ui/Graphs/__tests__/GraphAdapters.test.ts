import { describe, expect, it } from 'vitest';

import GraphAdapterBar from '../GraphAdapterBar';
import GraphAdapterLine from '../GraphAdapterLine';

const chartData = {
  labels: ['Ene'],
  values: [{ name: 'Ingresos', values: [100] }],
};

describe('graph adapters', () => {
  it.each([
    ['bar', GraphAdapterBar],
    ['line', GraphAdapterLine],
  ])('%s supplies the complete grid configuration ApexCharts requires', (_type, adapter) => {
    const { options } = adapter(chartData, {}, {});

    expect(options.grid).toMatchObject({
      show: true,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
      row: { opacity: 0.5 },
      column: { opacity: 0.5 },
      padding: expect.any(Object),
    });
    expect(options.xaxis.axisBorder.show).toBe(true);
    expect(options.xaxis.axisTicks.show).toBe(true);
  });

  it.each([
    ['bar', GraphAdapterBar],
    ['line', GraphAdapterLine],
  ])('%s keeps dashboard grid padding', (_type, adapter) => {
    const { options } = adapter(chartData, { variant: 'dashboard' }, {});
    const { options: defaults } = adapter(chartData, {}, {});

    // Desde 36843bbe las dos variantes traen `padding`: que exista ya no mide
    // nada. Lo que distingue a la variante del inicio es su grilla propia.
    expect(options.grid.strokeDashArray).toBe(4);
    expect(options.grid.padding).not.toEqual(defaults.grid.padding);
  });
});
