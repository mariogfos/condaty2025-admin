export default function GraphAdapterLine(
  data: any,
  options: any,
  oDef: any = {}
) {
  const xLabels = data.labels;
  const chartFontFamily = 'Inter, sans-serif';
  const isDashboard = options?.variant === 'dashboard';
  const isArea = options?.area === true;
  const lineColors = options?.colors || [];
  const l = {
    chart: {
      ...oDef.chart,
      type: isArea ? 'area' : 'line',
      zoom: {
        enabled: false,
      },
    },
    stroke: {
      curve: 'smooth',
      width: isDashboard ? [2, 2.5, 2.5, 3] : 2,
      lineCap: 'round',
    },
    dataLabels: {
      enabled: false,
    },
    grid: isDashboard
      ? {
          borderColor: '#20262d',
          strokeDashArray: 4,
          padding: {
            top: 8,
            right: 12,
            bottom: 0,
            left: 8,
          },
        }
      : undefined,
    fill:
      isDashboard && isArea
        ? {
            type: 'gradient',
            gradient: {
              shade: 'dark',
              type: 'vertical',
              shadeIntensity: 0,
              inverseColors: false,
              opacityFrom: [0.22, 0.28, 0.25, 0.7],
              opacityTo: [0.01, 0.015, 0.012, 0.04],
              stops: [0, 68, 100],
            },
          }
        : oDef.fill,
    states: {
      hover: {
        filter: {
          type: 'none',
        },
      },
      active: {
        filter: {
          type: 'none',
        },
      },
    },
    xaxis: {
      categories: xLabels,
      axisBorder: isDashboard
        ? {
            show: true,
            color: '#20262d',
          }
        : undefined,
      axisTicks: isDashboard
        ? {
            show: false,
          }
        : undefined,
      labels: {
        style: {
          colors: isDashboard ? '#8693a0' : '#A7A7A7',
          fontSize: '12px',
          fontWeight: 400,
          fontFamily: chartFontFamily,
        },
      },
    },
    markers: {
      size: isDashboard ? 4 : 6,
      discrete: [],
      colors: lineColors,
      strokeColors: isDashboard ? '#11161c' : '#333536',
      strokeWidth: isDashboard ? 2 : 0,
      hover: {
        sizeOffset: 3,
      },
    },
  };
  const d: any = [];
  data.values.forEach((e: any) => {
    const d1: any = [];
    e.values.forEach((e1: any) => {
      d1.push(Number(e1));
    });
    d.push({ data: d1, name: e.name || '11' });
  });
  return {
    options: l,
    data: d,
  };
}
