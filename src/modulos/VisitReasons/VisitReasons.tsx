"use client";
import useCrud from "@/mk/hooks/useCrud/useCrud";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import { useEffect, useMemo } from "react";
import { useAuth } from "@/mk/contexts/AuthProvider";

const mod = {
  modulo: "visit-reasons",
  singular: "Motivo de visita",
  plural: "Motivos de visitas",
  permiso: "", //"visit_reasons",
  extraData: false,
  // renderForm: RenderForm,
  // renderView: (props: any) => <RenderView {...props} />,
  loadView: { fullType: "DET" },
};

const paramsInitial = {
  perPage: 20,
  page: 1,
  fullType: "L",
  searchBy: "",
  _debug: 2,
};

const VisitReasons = () => {
  const fields = useMemo(() => {
    return {
      id: { rules: [], api: "e" },
      name: {
        rules: ["required"],
        api: "ae",
        label: "Nombre",
        form: { type: "text" },
        list: true,
      },
    };
  }, []);

  const { setStore, store } = useAuth();

  useEffect(() => {
    setStore({ ...store, title: "Motivos de visitas" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { userCan, List } = useCrud({
    paramsInitial,
    mod,
    fields,
  });

  if (!userCan(mod.permiso, "R")) return <NotAccess />;

  return (
    <div>
      <List height={"calc(100vh - 350px)"} />
    </div>
  );
};

export default VisitReasons;
