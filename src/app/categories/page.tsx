"use client";

import Categories from "@/modulos/Categories/Categories";
import { useSearchParams } from "next/navigation";
import React from "react";

const CategoriesPage = () => {
  const searchParams = useSearchParams();
  const type = searchParams?.get("type") === "I" ? "I" : "";
  return <Categories type={type} />;
};
//Se modifico la nomemcaltura para que next js lo procese bien por eso se uso "CategoriesPage" en lugar de "categories"
export default CategoriesPage;