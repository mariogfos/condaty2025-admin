import { Card } from '@/mk/components/ui/Card/Card'
import GraphBase from '@/mk/components/ui/Graphs/GraphBase'
import { COLORS20 } from '@/mk/components/ui/Graphs/GraphsTypes'
import React from 'react'


interface WidgetDonutProps {
  title: string | any;
  emptyTitle: string;
  allCountZero: boolean;
  graphData: any;
  style?: any;
  className?: string;
}
const WidgetDonut = ({title,emptyTitle,allCountZero,graphData,style,className}:WidgetDonutProps) => {
  return (
    <Card style={style} className={className}>
    <div className="tTitle">{title}</div>
    {allCountZero ? (
      <div
        className={"tSubtitle"}
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: 100,
        }}
      >
       {emptyTitle}
      </div>
    ) : (
      <GraphBase
        data={graphData}
        chartTypes={["donut"]}
        options={{
          height: 256,
          colors: COLORS20,
        }}
      />
    )}
  </Card>
  )
}

export default WidgetDonut