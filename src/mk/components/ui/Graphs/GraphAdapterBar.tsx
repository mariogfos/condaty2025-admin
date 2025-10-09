export default function GraphAdapterBar(data:any, options:any, oDef: any = {}) {
  const xLabels = data.labels;

  const o = {
    chart: {
      ...oDef.chart,
      type: "bar",
      stacked: options.stacked || false,
    },
    xaxis: {
      categories: xLabels,
      labels: {
        style: {
          colors: "#FFFFFF",
          fontSize: "12px",
          fontWeight: 400,
          fontFamily: "Poppins, Arial,",
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
    d.push({ data: d1, name: e.name || "" });
  });
  return { options: o, data: d };
}
