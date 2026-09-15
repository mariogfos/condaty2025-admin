import Chart from 'react-apexcharts';
import { COLORS20, ProptypesAdapter } from './GraphsTypes';
import { useMemo } from 'react';
import GraphAdapterBar from './GraphAdapterBar';
import GraphAdapterRadialBar from './GraphAdapterRadialbar';
import GraphAdapterLine from './GraphAdapterLine';
import GraphAdapterPie from './GraphAdapterPie';
import { formatBs } from '@/mk/utils/numbers';
import GraphAdapterDonut from './GraphAdapterDonut';

const GraphsAdapter = ({
  data,
  chartType,
  options,
  downloadPdf,
  exportando = false,
}: ProptypesAdapter & { exportando?: boolean }) => {
  const chartConfig = useMemo(() => {
    if (!data) return null;

    const chartFontFamily = 'Inter, sans-serif';
    const isDashboard = options?.variant === 'dashboard';
    const iconDownload = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M4 15.504V16.5C4 17.2956 4.31607 18.0587 4.87868 18.6213C5.44129 19.1839 6.20435 19.5 7 19.5H17C17.7956 19.5 18.5587 19.1839 19.1213 18.6213C19.6839 18.0587 20 17.2956 20 16.5V15.5M12 4V15M12 15L15.5 11.5M12 15L8.5 11.5" stroke="white" fill="transparent" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
  `;
    const colorWhite = isDashboard ? '#8693a0' : '#A7A7A7';
    const baseOptions = {
      chart: {
        stackOnlyBar: true,
        redrawOnParentResize: true,
        background: 'transparent',
        foreColor: colorWhite,
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 800,
          animateGradually: {
            enabled: true,
            delay: 150,
          },
          dynamicAnimation: {
            enabled: true,
            speed: 350,
          },
        },
        type: chartType || 'bar',
        toolbar: {
          show: downloadPdf,
          tools: {
            download: iconDownload,
          },
        },
        zoom: {
          enabled: true,
        },
      },
      colors: options?.colors || COLORS20,
      plotOptions: {
        bar: {
          horizontal: false,
        },
      },
      dataLabels: {
        formatter: function () {
          return ' ';
        },
      },
      stroke: {
        width: 0,
      },
      legend: {
        show: false,
        fontFamily: chartFontFamily,
        labels: {
          colors: colorWhite,
          useSeriesColors: false,
        },
        position: 'bottom',
        offsetY: 8,
        offsetX: 0,
        formatter: function (seriesName: string, opts: any) {
          const value = opts.w.globals.seriesTotals[opts.seriesIndex];
          return [seriesName, ': ' + formatBs(value)];
        },
        markers: {
          width: 12,
          height: 12,
          radius: 50,
          offsetX: 0,
          offsetY: 0,
        },
        itemMargin: {
          horizontal: 20,
          vertical: 5,
        },
        containerMargin: {
          top: 10,
          right: 0,
          bottom: 0,
          left: 0,
        },
        horizontalAlign: 'center',
        width: '100%',
      },
      xaxis: {
        labels: {
          style: {
            color: colorWhite,
            fontSize: '16px',
            fontWeight: 400,
            fontFamily: chartFontFamily,
          },
        },
      },
      tooltip: {
        enabled: true,
        followCursor: false,
        theme: isDashboard ? 'dark' : true,
        shared: isDashboard,
        intersect: !isDashboard,
        style: {
          fontSize: '12px',
          fontFamily: chartFontFamily,
        },
        custom: function ({ series, seriesIndex, dataPointIndex, w }: any) {
          const tooltipBackground = isDashboard ? '#121519' : 'rgba(255, 255, 255, 0.9)';
          const tooltipBorder = isDashboard ? 'rgba(174, 185, 198, 0.12)' : 'transparent';
          const tooltipLabel = isDashboard ? '#aab6c3' : '#A7A7A7';
          const tooltipValue = isDashboard ? '#f4f7fa' : '#000';

          if (isDashboard && series.length > 1) {
            const category =
              w.globals.categoryLabels?.[dataPointIndex] ||
              w.config.xaxis?.categories?.[dataPointIndex] ||
              w.globals.labels[dataPointIndex] ||
              '';
            const rows = series
              .map((values: number[], index: number) => {
                const rowColor = w.globals.colors[index] || '#A7A7A7';
                const rowName = w.globals.seriesNames[index] || '';
                const rowValue = values[dataPointIndex];

                return `<div style="display:flex; align-items:center; justify-content:space-between; gap:20px; min-width:190px; padding-top:7px;">
                  <span style="display:flex; align-items:center; gap:7px; color:${tooltipLabel};">
                    <span style="display:inline-block; width:7px; height:7px; border-radius:50%; background:${rowColor};"></span>
                    ${rowName}
                  </span>
                  <strong style="color:${tooltipValue}; font-weight:650;">${formatBs(rowValue)}</strong>
                </div>`;
              })
              .join('');

            return `<div style="padding:11px 12px; background:${tooltipBackground}; border:1px solid ${tooltipBorder}; border-radius:10px; box-shadow:0 14px 30px rgba(0,0,0,0.28);">
              <div style="color:${tooltipValue}; font-weight:700;">${category}</div>
              ${rows}
            </div>`;
          }

          const seriesName = w.globals.seriesNames[seriesIndex];
          const value = series[seriesIndex][dataPointIndex];
          const color = w.globals.colors[seriesIndex] || '#A7A7A7';

          return `
          <div style="padding: 10px 12px; background: ${tooltipBackground}; border: 1px solid ${tooltipBorder}; border-radius: 10px; display: flex; align-items: center; gap: 8px; box-shadow: 0 14px 30px rgba(0, 0, 0, 0.28);">
            <span style="display:inline-block; width:12px; height:12px; border-radius:50%; background:${color}; margin-right:6px;"></span>
            <div>
              <div style="margin-bottom: 4px; color: ${tooltipLabel};">${seriesName}</div>
              <div style="font-weight: 700; color: ${tooltipValue};"> ${formatBs(
                value
              )}</div>
            </div>
          </div>
        `;
        },
        y: {
          formatter: function (val: any) {
            return formatBs(val);
          },
        },
      },
      yaxis: {
        labels: {
          style: {
            colors: [colorWhite],
            fontSize: isDashboard ? '12px' : '14px',
            fontFamily: chartFontFamily,
          },
          formatter: (value: any) => {
            return formatBs(value);
          },
        },
      },
      fill: {
        opacity: isDashboard ? 0.94 : 1,
      },
      title: {
        text: options?.title || '',
        align: 'left',
        margin: 10,
        offsetX: 0,
        offsetY: 0,
        floating: false,
        style: {
          fontSize: '32px',
          fontWeight: 900,
          fontFamily: chartFontFamily,
          color: '#a7a7a7',
        },
      },
    };

    let datos: any = {};
    switch (chartType) {
      case 'bar':
        datos = GraphAdapterBar(data, options, baseOptions);
        break;
      case 'radialBar':
        datos = GraphAdapterRadialBar(data, options, baseOptions);
        break;
      case 'line':
        datos = GraphAdapterLine(data, options, baseOptions);
        break;
      case 'area':
        datos = GraphAdapterLine(data, { ...options, area: true }, baseOptions);
        break;
      case 'pie':
        datos = GraphAdapterPie(data, options, baseOptions);
        break;
      case 'donut':
        datos = GraphAdapterDonut(data, options, baseOptions);
        break;
      default:
        break;
    }

    return {
      dataChart: datos?.data || [],
      optionsChart: { ...baseOptions, ...(datos?.options || {}) },
    };
  }, [chartType, data, downloadPdf, options]);

  return (
    <>
      {chartConfig?.dataChart && chartConfig?.optionsChart && (
        <>
          <Chart
            options={chartConfig.optionsChart}
            series={chartConfig.dataChart}
            type={chartType as any}
            height={options?.height || 'auto'}
            width={options?.width || '100%'}
          />
        </>
      )}
    </>
  );
};

export default GraphsAdapter;
