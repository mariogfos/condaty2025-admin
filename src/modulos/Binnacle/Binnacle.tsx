"use client";
import useCrud from "@/mk/hooks/useCrud/useCrud";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import useCrudUtils from "../shared/useCrudUtils";
import { useMemo, useState } from "react";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import RenderView from "./RenderView/RenderView";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { getDateTimeStrMesShort } from "@/mk/utils/date";
import { IconPencilPaper } from "@/components/layout/icons/IconsBiblioteca";
import DateRangeFilterModal from "@/components/DateRangeFilterModal/DateRangeFilterModal";

const DateCell = ({ createdAt }: { createdAt: string }) => {
  return <div>{getDateTimeStrMesShort(createdAt)}</div>;
};

const GuardCell = ({ guardia }: { guardia: any }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Avatar
        hasImage={guardia.has_image}
        src={getUrlImages(
          '/GUARD-' +
            guardia.id +
            '.webp?d=' +
            guardia.updated_at
        )}
        name={getFullName(guardia)}
      />
      <div>
        <p>{getFullName(guardia)} </p>
        <p>CI: {guardia?.ci}</p>
      </div>
    </div>
  );
};

const DescriptionCell = ({ description }: { description: string }) => {
  return (
    <div
      title={description}
      style={{
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        maxWidth: '100%',
        width: '100%'
      }}
    >
      {description}
    </div>
  );
};

const renderDateCell = (props: any) => {
  return <DateCell createdAt={props?.item?.created_at} />;
};

const renderGuardCell = (props: any) => {
  return <GuardCell guardia={props?.item?.guardia} />;
};

const renderDescriptionCell = (props: any) => {
  const description = props?.item?.descrip || '';
  return <DescriptionCell description={description} />;
};

const Binnacle = () => {
  const [openCustomFilter, setOpenCustomFilter] = useState(false);
  const [customDateRange, setCustomDateRange] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});
  const [customDateErrors, setCustomDateErrors] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});

  const handleGetFilter = (opt: string, value: string, oldFilterState: any) => {
    const currentFilters = { ...(oldFilterState?.filterBy || {}) };
    if (opt === "created_at" && value === "custom") {
      setCustomDateRange({});
      setCustomDateErrors({});
      setOpenCustomFilter(true);
      delete currentFilters[opt];
      return { filterBy: currentFilters };
    }
    if (value === "" || value === null || value === undefined) {
      delete currentFilters[opt];
    } else {
      currentFilters[opt] = value;
    }
    return { filterBy: currentFilters };
  };

  const getPeriodOptions = () => [
    { id: "ALL", name: "Todos" },
    { id: "d", name: "Hoy" },
    { id: "ld", name: "Ayer" },
    { id: "w", name: "Esta semana" },
    { id: "lw", name: "Semana anterior" },
    { id: "m", name: "Este mes" },
    { id: "lm", name: "Mes anterior" },
    { id: "y", name: "Este año" },
    { id: "ly", name: "Año anterior" },
    { id: "custom", name: "Personalizado" },
  ];

  const mod = {
    modulo: "guardnews",
    singular: "Bitácora",
    plural: "Bitácoras",
    permiso: "guardlogs",
    extraData: true,
    filter: true,
    hideActions: { edit: true, del: true, add: true },
    renderView: (props: any) => <RenderView {...props} />,
    loadView: { fullType: "DET" },
    export: true
  };

  const paramsInitial = {
    perPage: 20,
    page: 1,
    fullType: "L",
    searchBy: "",
  };

  const fields = useMemo(
    () => ({
      id: { rules: [], api: 'e' },
      created_at: {
        rules: ['required'],
        api: 'e',
        label: 'Fecha',
        list: {
          width: 210,
          onRender: renderDateCell,
        },
        filter: {
          label: 'Periodo',
          options: getPeriodOptions,
        },
      },
      guardia: {
        rules: [''],
        api: '',
        label: 'Guardia',
        list: {
          width: 300,
          onRender: renderGuardCell,
        },
      },
      descrip: {
        rules: ['required'],
        api: 'ae',
        label: 'Descripción',
        form: { type: 'text' },
        list: {
          onRender: renderDescriptionCell,
        },
      },
      image: {},
    }),
    []
  );

  const {
    userCan,
    List,
    setStore,
    onSearch,
    searchs,
    onEdit,
    onDel,
    onFilter,
  } = useCrud({
    paramsInitial,
    mod,
    fields,
    getFilter: handleGetFilter,
  });

  useCrudUtils({
    onSearch,
    searchs,
    setStore,
    mod,
    onEdit,
    onDel,
  });

  const handleCustomFilterClose = () => {
    setCustomDateRange({});
    setOpenCustomFilter(false);
    setCustomDateErrors({});
  };

  const handleCustomFilterSave = ({ startDate, endDate }: { startDate: string; endDate: string }) => {
    let err: { startDate?: string; endDate?: string } = {};
    if (!startDate) err.startDate = "La fecha de inicio es obligatoria";
    if (!endDate) err.endDate = "La fecha de fin es obligatoria";
    if (startDate && endDate && startDate > endDate) {
      err.startDate = "La fecha de inicio no puede ser mayor a la fecha fin";
    }
    if (Object.keys(err).length > 0) {
      setCustomDateErrors(err);
      return;
    }
    const customDateFilterString = `${startDate},${endDate}`;
    onFilter("created_at", customDateFilterString);
    setOpenCustomFilter(false);
    setCustomDateErrors({});
  };

  if (!userCan(mod.permiso, "R")) return <NotAccess />;

  return (
    <div>
      <List
        height={"calc(100vh - 330px)"}
        emptyMsg="Lista de bitácora vacía. Cuando los guardias registren"
        emptyLine2="sus reportes los verás aquí."
        emptyIcon={<IconPencilPaper size={80} color="var(--cWhiteV1)" />}
      />

      <DateRangeFilterModal
        open={openCustomFilter}
        onClose={handleCustomFilterClose}
        onSave={handleCustomFilterSave}
        initialStartDate={customDateRange.startDate || ""}
        initialEndDate={customDateRange.endDate || ""}
        errorStart={customDateErrors.startDate}
        errorEnd={customDateErrors.endDate}
      />
    </div>
  );
};

export default Binnacle;
