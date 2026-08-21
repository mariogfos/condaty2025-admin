export default function GraphAdapterRadialBar(data:any, options:any, oDef: any = {}) {
  const xLabels: any = [];
  data.values.map((v:any) => {
    xLabels.push(v.name);
  });
  let totalRadial = 0;
  const r = {
    chart: {
      ...oDef.chart,
      type: "radialBar",
      plotOptions: {
        radialBar: {
          startAngle: 0,
          endAngle: 360,
          offsetX: 0,
          offsetY: 0,
          track: {
            show: true,
            startAngle: undefined,
            endAngle: undefined,
            background: "#2C2C2CB3",
            strokeWidth: "97%",
            opacity: 1,
            margin: 5,
            dropShadow: {
              enabled: false,
              top: 0,
              left: 0,
              blur: 3,
              opacity: 0.5,
            },
          },
          dataLabels: {
            show: true,
            name: {
              fontSize: "32px",
              color: "#00E38C",
            },
            value: {
              fontWeight: 900,
              fontSize: "16px",
              color: "#a7a7a7",
            },
            total: {
              show: true,
              label: "Total",
              fontSize: "16px",
              color: "#00E38C",

              formatter: function (w:any) {
                return totalRadial + " Bs";
              },
            },
          },
        },
      },
      labels: xLabels,
      tooltip: {
        ...oDef.tooltip,
        y: {
          formatter: function (val:any) {
            return val + " %"; // Personaliza el modal cunado hacen hover
          },
        },
      },
    },
  };

  const d: any = [];
  const d1: any = [];
  data.values.map((e: any) => {
    let total = e.values.reduce((a:any, b:any) => a + b, 0);
    d.push(total);
  });
  let totalRa = d.reduce((a:any, b:any) => a + b, 0);
  totalRadial = totalRa;
  d.map((v:any) => {
    d1.push(((v / totalRadial) * 100).toFixed(1));
  });
  return { options: r, data: d1 };
}
