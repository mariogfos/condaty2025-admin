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
    const { options, data } = adapter(series, { variant: 'dashboard', barGap: 3 }, previousArea);

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
      expect(options.stroke).toEqual({ show: true, width: 3, colors: ['transparent'] });
    }
  });

  it.each([false, true])('restores line colors after bar separators (area: %s)', (area) => {
    const colors = ['#8b98a8', '#00e38c', '#f2a65a', '#8ea7ff'];
    const previousBars = GraphAdapterBar(chartData, { variant: 'dashboard', barGap: 3 }).options;
    const { options } = GraphAdapterLine(chartData, { variant: 'dashboard', colors, area }, previousBars);

    expect(options.stroke).toMatchObject({ show: true, width: area ? [2, 2.5, 2.5, 3] : 2.5, colors });
    expect(options.fill?.type).toBe(area ? 'gradient' : 'solid');
  });
});
