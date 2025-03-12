const GraphAdapterPie = (data: any, options: any, oDef: any = {}) => {
  // Validar que data y data.values existan y sean un array
  if (!data || !data.values || !Array.isArray(data.values) || data.values.length === 0) {
    return { options: {}, data: [] };
  }

  const xLabels: any = [];
  let totalRadial = 0;
  
  data.values.forEach((v: any) => {
    if (v && v.name) {
      xLabels.push(v.name);
    }
  });

  const p = {
    plotOptions: {
      pie: {
        customScale: 0.8,
      },
    },
    dataLabels: {
      ...oDef.dataLabels,
      formatter: function (val: any, opts: any) {
        if (val !== 0)
          return Number(val).toFixed(1) + "%";
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
        borderWidth: 1,
        borderColor: "#fff",
        dropShadow: {
          enabled: false,
          top: 1,
          left: 1,
          blur: 1,
          color: "#000",
          opacity: 0.45,
        },
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
  
  data.values.forEach((e: any) => {
    // Validar que e.values exista y sea un array
    if (e && e.values && Array.isArray(e.values)) {
      let total = e.values.reduce((a: any, b: any) => a + b, 0);
      d.push(total);
    } else {
      // Si e.values no existe o no es un array, agregar un valor por defecto
      d.push(0);
    }
  });

  // Validar que d tenga elementos antes de usar reduce
  if (d.length > 0) {
    let totalRa = d.reduce((a: any, b: any) => a + b, 0);
    totalRadial = totalRa;

    d.forEach((v: any) => {
      if (totalRadial !== 0) {
        d1.push(Number(((v / totalRadial) * 100).toFixed(1)));
      } else {
        d1.push(0);
      }
    });
  }

  return { options: p, data: d1 };
};

export default GraphAdapterPie;