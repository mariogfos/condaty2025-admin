// app/dashDpto/[id]/page.tsx
"use client";
import DashDptos from "@/modulos/DashDptos/DashDptos";
import { useParams } from "next/navigation";
import React from "react";

const DashDpto = () => {
  const params = useParams();
  const id = params.id as string;
  
  return <DashDptos id={id} />;
};

export default DashDpto;