import GuardDevices from "@/modulos/GuardDevices/GuardDevices";
import GateSection from "@/modulos/CondatyGate/GateSection";
import React from "react";

const guardDevices = () => {
  return <GateSection section="devices"><GuardDevices /></GateSection>;
};

export default guardDevices;
