import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { getUrlImages } from "@/mk/utils/string";
import { useEffect, useState } from "react";
import style from "./EventsRenderView.module.css";
import {
  IconClarityForm,
  IconComment,
  IconLike,
  IconLocation,
  IconScanLine,
  IconUserAddline,
} from "@/components/layout/icons/IconsBiblioteca";
import WidgetBase from "@/components/ Widgets/WidgetBase/WidgetBase";
import WidgetDonut from "@/components/ Widgets/WidgetDonut/WidgetDonut";
import WidgetEducation from "@/components/ Widgets/WidgetEducation/WidgetEducation";
import WidgetAge from "@/components/ Widgets/WidgetAge/WidgetAge";
import Table from "@/mk/components/ui/Table/Table";
import HorizontalProgresiveBar from "@/mk/components/ui/HorizontalProgresiveBar/HorizontalProgresiveBar";
import { lComDestinies, RandomsColors } from "@/mk/utils/utils";
import {
  GMT,
  getDateStrMes,
  getDateTimeStrMes,
  getUTCNow,
} from "@/mk/utils/date";
import StatsCard from "@/mk/components/ui/StatsCard/StatsCard";
import EventStatsCard from "@/mk/components/ui/EventsStatsCard/EventStatsCards";
import ComparisonBar from "@/mk/components/ui/ComparisonBar/ComparisonBar";
import { formatNumber } from "@/mk/utils/numbers";

const RenderView = (props: {
  open: boolean;
  onClose: any;
  item: Record<string, any>;
  onConfirm?: Function;
  extraData?: any;
}) => {
 
  return (
    <DataModal
      open={props.open}
      onClose={props?.onClose}
      title={"Detalle del evento"}
      buttonText=""
      buttonCancel=""
      fullScreen={true}
    >
    aaas
     
         
    </DataModal>
  );
};

export default RenderView;
