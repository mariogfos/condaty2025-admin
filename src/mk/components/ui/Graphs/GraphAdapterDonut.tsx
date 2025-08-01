import { formatBs, formatNumber } from '@/mk/utils/numbers';
import { fontWeight } from 'html2canvas/dist/types/css/property-descriptors/font-weight';

const GraphAdapterDonut = (data: any, options: any, oDef: any = {}) => {
  const xLabels: any = [];
  let totalRadial = 0;
  data.values.map((v: any) => {
    xLabels.push(v.name);
  });

  const p = {
    plotOptions: {
      pie: {
        donut: {
          size: '50%',
          labels: {
            show: true,
            value: {
              color: 'var(--cWhite)',
              formatter: function (val: any) {
                // return formatNumber(totalRadial) + " Bs";
                return val !== 0 ? formatNumber(Number(val)) + ' Bs' : '';
              },
            },
            total: {
              show: true,
              label: options?.centerText || 'Total',
              fontSize: '16px',
              color: '#00E38C',
              formatter: function () {
                return formatBs(totalRadial);
              },
            },
          },
        },
      },
    },
    dataLabels: {
      ...oDef.dataLabels,
      formatter: function (val: any, opts: any) {
        if (val !== 0) return Number(val).toFixed(2) + '%';
      },
      style: {
        fontSize: '16px',
        fontWeight: 'var(--bMedium)',
      },
      background: {
        enabled: true,
        foreColor: 'var(--cWhiteV2)',
        padding: 4,
        borderRadius: 2,

        //   borderColor: "#fff",
        dropShadow: {
          enabled: false,
          //     top: 1,
          //     left: 1,
          //     blur: 1,
          //     color: "#000",
          //     opacity: 0.45,
        },
      },
      dropShadow: {
        enabled: false,
        top: 1,
        left: 1,
        blur: 1,
        color: '#000',
        opacity: 0.45,
      },
    },
    labels: xLabels,
    tooltip: {
      ...oDef.tooltip,
      custom: function ({ series, seriesIndex, dataPointIndex, w }: any) {
        const seriesName = w.globals.seriesNames[seriesIndex] || w.globals.labels[seriesIndex];
        const value = series[seriesIndex];
        // Obtener el color de la serie
        const color = w.globals.colors[seriesIndex] || '#A7A7A7';

        return `
          <div style="padding: 12px; background: rgba(255, 255, 255, 0.95); border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); min-width: 160px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <span style="display:inline-block; width:12px; height:12px; border-radius:50%; background:${color};"></span>
              <div style="font-weight: 600; color: #333; font-size: 14px;">${seriesName}</div>
            </div>
            <div style="margin-left: 20px;">
              <div style="color: #666; font-size: 12px; margin-bottom: 2px;">Monto:</div>
              <div style="font-weight: bold; color: #000; font-size: 16px;">Bs ${formatNumber(
                value
              )}</div>
            </div>
          </div>
        `;
      },
    },
  };

  const d: any = [];
  const d1: any = [];
  data?.values?.map((e: any) => {
    let total = e?.values?.reduce((a: any, b: any) => a + b, 0);
    d.push(total);
  });

  let totalRa = d.reduce((a: any, b: any) => a + b, 0);
  totalRadial = totalRa;
  d.map((v: any) => {
    // d1.push(Number(((v / totalRadial) * 100).toFixed(1)));
    d1.push(v);
  });

  return { options: p, data: d1 };
};

export default GraphAdapterDonut;
