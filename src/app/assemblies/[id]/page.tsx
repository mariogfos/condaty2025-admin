// src/app/assemblies/[id]/page.tsx
"use client";

import React from "react";
import { useParams } from "next/navigation";
import AssemblyDetail from "@/modulos/Assemblies/components/AssemblyDetail/AssemblyDetail";

const AssemblyDetailPage = () => {
  const params = useParams();
  
  if (!params || !params.id) {
    return <div>Cargando o ID no encontrado...</div>;
  }

  const id = params.id as string;

  return <AssemblyDetail id={id} />;
};

export default AssemblyDetailPage;
