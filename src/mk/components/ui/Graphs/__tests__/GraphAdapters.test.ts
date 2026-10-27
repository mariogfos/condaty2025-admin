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

    expect(options.grid.padding).toBeDefined();
  });

  it.each([
    ['bar', GraphAdapterBar],
    ['line', GraphAdapterLine],
  ])('%s clears a previous area gradient when changing the financial chart view', (_type, adapter) => {
    const series = {
      labels: ['Ene'],
      values: [
        { name: 'Saldo inicial', values: [100] },
        { name: 'Ingresos', values: [300] },
        { name: 'Egresos', values: [200] },
        { name: 'Saldo acumulado', values: [200] },
      ],
    };
    const previousArea = GraphAdapterLine(series, {
      variant: 'dashboard',
      area: true,
    }).options;
    const { options, data } = adapter(series, { variant: 'dashboard' }, previousArea);

    expect(previousArea.fill?.type).toBe('gradient');
    expect(options.fill).toEqual({ type: 'solid', opacity: 1 });
    expect(options.states?.hover.filter.type).toBe('none');
    expect(options.states?.active.filter.type).toBe('none');
    expect(data).toEqual([
      { name: 'Saldo inicial', data: [100] },
      { name: 'Ingresos', data: [300] },
      { name: 'Egresos', data: [200] },
      { name: 'Saldo acumulado', data: [200] },
    ]);
    if ('plotOptions' in options) {
      expect(options.chart.stacked).toBe(false);
    }
  });
});
