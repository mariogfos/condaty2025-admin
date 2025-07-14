import Chart from 'react-apexcharts';
import { COLORS20, ProptypesAdapter } from './GraphsTypes';
import { useEffect, useState } from 'react';
import GraphAdapterBar from './GraphAdapterBar';
import GraphAdapterRadialBar from './GraphAdapterRadialbar';
import GraphAdapterLine from './GraphAdapterLine';
import GraphAdapterPie from './GraphAdapterPie';
import { formatNumber } from '@/mk/utils/numbers';
import GraphAdapterDonut from './GraphAdapterDonut';
import React from 'react';

const GraphsAdapter = ({
  data,
  chartType,
  options,
  downloadPdf,
  exportando = false,
}: ProptypesAdapter & { exportando?: boolean }) => {
  const [optionsChart, setOptionsChart]: any = useState(null);
  const [dataChart, setDataChart]: any = useState(null);

  const iconDownload = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M4 15.504V16.5C4 17.2956 4.31607 18.0587 4.87868 18.6213C5.44129 19.1839 6.20435 19.5 7 19.5H17C17.7956 19.5 18.5587 19.1839 19.1213 18.6213C19.6839 18.0587 20 17.2956 20 16.5V15.5M12 4V15M12 15L15.5 11.5M12 15L8.5 11.5" stroke="white" fill="transparent" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
  `;
  const colorWhite = '#A7A7A7';
  const colorBlack = '#000000';

  const o = {
    chart: {
      // No forzar fondo ni tema al exportar
      stackOnlyBar: true,
      redrawOnParentResize: true,
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
      formatter: function (val: any, opts: any) {
        return ' ';
      },
    },
    stroke: {
      width: 0,
    },

    legend: {
      show: false,
      fontFamily: 'Inter',
      labels: {
        colors: colorWhite,
        useSeriesColors: false,
      },
      position: 'bottom',
      offsetY: 8,
      offsetX: 0,
      formatter: function (seriesName: string, opts: any) {
        const value = opts.w.globals.seriesTotals[opts.seriesIndex];
        return [seriesName, ': Bs. ' + formatNumber(value)];
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
          fontFamily: 'Roboto',
        },
      },
    },
    tooltip: {
      enabled: true,
      followCursor: false,
      theme: true,
      shared: false,
      intersect: true,
      style: {
        fontSize: '12px',
        fontFamily: 'Roboto',
      },
      custom: function ({ series, seriesIndex, dataPointIndex, w }: any) {
        const seriesName = w.globals.seriesNames[seriesIndex];
        const value = series[seriesIndex][dataPointIndex];
        const xLabel = w.globals.labels[dataPointIndex];
        // Obtener el color de la serie
        const color = w.globals.colors[seriesIndex] || '#A7A7A7';

        return `
          <div style="padding: 8px; background: rgba(255, 255, 255, 0.9); border-radius: 4px; display: flex; align-items: center; gap: 8px;">
            <span style="display:inline-block; width:12px; height:12px; border-radius:50%; background:${color}; margin-right:6px;"></span>
            <div>
              <div style="margin-bottom: 4px; color: #A7A7A7;">${seriesName}</div>
              <div style=" font-weight: bold; color: #000;"> Bs ${formatNumber(
                value
              )}</div>
            </div>
          </div>
        `;
      },
      y: {
        formatter: function (val: any) {
          return ': Bs. ' + formatNumber(val);
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: [colorWhite],
          fontSize: '14px',
          fontFamily: 'Roboto',
        },
        formatter: (value: any) => {
          return 'Bs. ' + formatNumber(value);
        },
      },
    },
    fill: {
      opacity: 1,
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
        fontFamily: 'Roboto',
        color: '#a7a7a7',
      },
    },
  };

  const factory = async () => {
    let datos: any = {};
    switch (chartType) {
      case 'bar':
        datos = await GraphAdapterBar(data, options, o);
        break;
      case 'radialBar':
        datos = await GraphAdapterRadialBar(data, options, o);
        break;
      case 'line':
        datos = await GraphAdapterLine(data, options, o);
        break;
      case 'pie':
        datos = await GraphAdapterPie(data, options, o);
        break;
      case 'donut': // Añadir este caso
        datos = await GraphAdapterDonut(data, options, o);
        break;

      default:
        break;
    }
    setDataChart(datos.data);
    setOptionsChart({ ...o, ...datos.options });
  };
  useEffect(() => {
    if (!data) return;
    factory();
  }, [data, chartType]);

  return (
    <>
      {dataChart && optionsChart && (
        <>
          <Chart
            options={optionsChart}
            series={dataChart}
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
