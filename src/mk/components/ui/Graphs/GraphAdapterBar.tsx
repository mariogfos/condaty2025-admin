export default function GraphAdapterBar(
  data: any,
  options: any,
  oDef: any = {}
) {
  const xLabels = data.labels;
  const chartFontFamily = 'Inter, sans-serif';
  const isDashboard = options?.variant === 'dashboard';
  const axisColor = isDashboard ? '#8693a0' : '#A7A7A7';
  const gridColor = '#20262d';

  const o = {
    chart: {
      ...oDef.chart,
      type: 'bar',
      stacked: options?.stacked || false,
    },
    plotOptions: {
      bar: {
        borderRadius: isDashboard ? 5 : 4,
        borderRadiusApplication: 'end',
        columnWidth: isDashboard ? '58%' : undefined,
      },
    },
    ...(isDashboard
      ? {
          grid: {
            borderColor: gridColor,
            strokeDashArray: 4,
            padding: {
              top: 2,
              right: 8,
              bottom: 0,
              left: 8,
            },
          },
        }
      : {}),
    xaxis: {
      categories: xLabels,
      axisBorder: isDashboard
        ? {
            show: true,
            color: gridColor,
          }
        : undefined,
      axisTicks: isDashboard
        ? {
            show: false,
          }
        : undefined,
      labels: {
        style: {
          colors: axisColor,
          fontSize: isDashboard ? '12px' : '16px',
          fontWeight: isDashboard ? 400 : 500,
          fontFamily: chartFontFamily,
        },
      },
    },
    // dataLabels: {
    //   ...oDef.dataLabels,
    //   offsetY: 200,
    // },
  };

  const d: any = [];
  data.values.forEach((e: any) => {
    const d1: any = [];
    e.values.forEach((e1: any) => {
      d1.push(Number(e1));
    });
    d.push({ data: d1, name: e.name || '' });
  });
  return { options: o, data: d };
}
