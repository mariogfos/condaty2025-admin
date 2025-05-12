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
          size: "50%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "Total",
              fontSize: "16px",
              color: "#00E38C",
              formatter: function () {
                return totalRadial + " Bs";
              }
            }
          }
        },
      },
    },
    dataLabels: {
      ...oDef.dataLabels,
      formatter: function (val: any, opts: any) {
        if (val !== 0) return Number(val).toFixed(1) + "%";
      },
      style: {
        fontSize: "16px",
        color: "#000",
      },
      background: {
        enabled: true,
        foreColor: "#000",
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
        color: "#000",
        opacity: 0.45,
      },
    },
    labels: xLabels,
    tooltip: {
      ...oDef.tooltip,
      y: {
        formatter: function (val: any) {
          return val + " %";
        },
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
    d1.push(Number(((v / totalRadial) * 100).toFixed(1)));
  });

  return { options: p, data: d1 };
};

export default GraphAdapterDonut;
