export default function GraphAdapterLine(data:any, options:any, oDef: any = {}) {
  const xLabels = data.labels;
  const l = {
    stroke: {
      curve: "smooth",
      width: 2,
    },

    markers: {
      size: 6,
      discrete: [],
      strokeColors: "#333536",
      strokeWidth: 0,
    },
  };
  const d: any = [];
  data.values.forEach((e: any) => {
    const d1: any = [];
    e.values.forEach((e1: any) => {
      d1.push(Number(e1));
    });
    d.push({ data: d1, name: e.name || "11" });
  });
  return {
    options: l,
    data: d,
  };
}
