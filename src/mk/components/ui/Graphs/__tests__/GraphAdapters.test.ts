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
  ])('%s omits grid instead of passing it as undefined', (_type, adapter) => {
    const { options } = adapter(chartData, {}, {});

    expect(options).not.toHaveProperty('grid');
  });

  it.each([
    ['bar', GraphAdapterBar],
    ['line', GraphAdapterLine],
  ])('%s keeps dashboard grid padding', (_type, adapter) => {
    const { options } = adapter(chartData, { variant: 'dashboard' }, {});

    expect(options.grid.padding).toBeDefined();
  });
});
