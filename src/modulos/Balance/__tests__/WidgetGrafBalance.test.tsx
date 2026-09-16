import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import WidgetGrafBalance from '@/components/Widgets/WidgetGrafBalance/WidgetGrafBalance';

vi.mock('@/mk/components/ui/Graphs/GraphBase', () => ({
  default: ({ data }: { data: unknown }) => (
    <output data-testid="balance-chart-data">{JSON.stringify(data)}</output>
  ),
}));

const findLastIndexDescriptor = Object.getOwnPropertyDescriptor(
  Array.prototype,
  'findLastIndex'
);

afterEach(() => {
  if (findLastIndexDescriptor) {
    Object.defineProperty(
      Array.prototype,
      'findLastIndex',
      findLastIndexDescriptor
    );
  }
});

describe('WidgetGrafBalance', () => {
  it('renders the annual balance when findLastIndex is unavailable', async () => {
    Object.defineProperty(Array.prototype, 'findLastIndex', {
      configurable: true,
      value: undefined,
    });

    render(
      <WidgetGrafBalance
        ingresos={[
          { mes: 2, amount: 100 },
          { mes: 4, amount: 200 },
        ]}
        egresos={[{ mes: 3, amount: 50 }]}
        periodo="y"
      />
    );

    await waitFor(() => {
      const chartData = JSON.parse(
        screen.getByTestId('balance-chart-data').textContent ?? '{}'
      );

      expect(chartData.labels).toHaveLength(3);
      expect(chartData.values[1].values).toEqual([100, 0, 200]);
    });
  });
});
