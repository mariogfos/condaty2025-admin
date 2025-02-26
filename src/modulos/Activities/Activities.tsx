"use client";
import { useRef, useState, useEffect } from "react";
import useAxios from "@/mk/hooks/useAxios";
import Pagination from "@/mk/components/ui/Pagination/Pagination";
import { getDateStrMes } from "@/mk/utils/date";
import { getNow } from "@/mk/utils/date";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import Dropdown from "@/mk/components/ui/Dropdown/Dropdown";
import DataSearch from "@/mk/components/forms/DataSearch/DataSearch";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import List from "@/mk/components/ui/List/List";
import LoadingScreen from "@/mk/components/ui/LoadingScreen/LoadingScreen";


import {
  IconDownload,
  IconFilter,
  IconSearch,
  IconGroupsQr,
  IconSingleQr,
} from "@/components/layout/icons/IconsBiblioteca";
import styles from "./Activities.module.css";
import TabsButtons from "@/mk/components/ui/TabsButton/TabsButtons";
import { useAuth } from "@/mk/contexts/AuthProvider";
import InvitacionInfo from "./InvitacionInfo/InvitacionInfo";


type FormStateType = {
  [key: string]: any;
};

type ParamsType = {
  perPage: number;
  page: number;
  sortBy: string;
  cols: string;
  orderBy: string;
  joins: string;
  relations: string;
  searchBy: string;
  [key: string]: any;
};

type AccessType = {
  id: string | number;
  in_at?: string;
  out_at?: string;
  plate?: string;
  visit?: any;
  owner?: any;
  guardia?: any;
  out_guard?: any;
  [key: string]: any;
};

type PedidoType = {
  id: string | number;
  descrip?: string;
  access?: any;
  owner?: any;
  other_type_id?: any;
  [key: string]: any;
};

type InvitationType = {
  id: string | number;
  type?: string;
  date_event?: string;
  owner?: any;
  access?: any[];
  guests?: any[];
  status?: string;
  [key: string]: any;
};

type TabType = {
  value: string;
  text: string;
};

// Definición de parámetros iniciales
const paramsInitial: ParamsType = {
  perPage: 10,
  page: 1,
  sortBy: "accesses.created_at,in_at",
  cols: "accesses.*",
  orderBy: "desc,desc",
  joins: "visits|owners",
  relations:
    "invitation|visit|owner|other:id,other_type_id|other.otherType:id,name|guardia|out_guard",
  searchBy: "|__!null__in_at,,,a,(,|__!null__out_at,,,a,),",
};

const paramsInitialPed: ParamsType = {
  page: 1,
  perPage: 10,
  sortBy: "created_at",
  orderBy: "desc",
  relations:
    "otherType:id,name|owner:id,name,middle_name,last_name,mother_last_name|access|access.visit:id,name,middle_name,last_name,mother_last_name,ci|access.guardia:id,name,middle_name,last_name,mother_last_name|access.out_guard:id,name,middle_name,last_name,mother_last_name",
  searchBy: "__!null__accesses.in_at,,,a,," + "|__!null__accesses.out_at,,,a,,",
  joins: "accesses|owners",
  cols: "others.*",
};

const paramsInitialQr: ParamsType = {
  page: 1,
  perPage: 10,
  sortBy: "invitations.date_event,invitations.created_at",
  cols: "invitations.*",
  orderBy: "desc,desc",
  joins: "visits|owners",
  relations:
    "access|access.guardia|access.out_guard|access.visit:id,name,middle_name,last_name,mother_last_name,ci,phone|guests:id,invitation_id,visit_id,access_id,status|owner:id,ci,name,middle_name,last_name,mother_last_name,phone|guests.visit:id,name,middle_name,last_name,mother_last_name,ci|guests.access:id,invitation_id,visit_id,in_at,out_at,obs_in,obs_out,plate",
  searchBy: "|__date__date_event,<=," + getNow() + ",,,",
};

const filtroLabels: Record<string, string> = {
  week: "Esta Semana",
  lastweek: "Anterior Semana",
  month: "Este Mes",
  lastmonth: "Anterior Mes",
};

// Componente EmptyItem simplificado para evitar errores de importación
const EmptyItem = ({ text }: { text: string }) => {
  return (
    <div className={styles.emptyList}>
      <p>{text}</p>
    </div>
  );
};
 //const { setStore } = useAuth();

const Activities = () => {
  // Estados
  const { user, showToast } = useAuth();
  const [params, setParams] = useState<ParamsType>(paramsInitial);
  const [paramsPed, setParamsPed] = useState<ParamsType>(paramsInitialPed);
  const [paramsQr, setParamsQr] = useState<ParamsType>(paramsInitialQr);
  const [typeSearch, setTypeSearch] = useState<string>("A");
  const [menuExport, setMenuExport] = useState<boolean>(false);
  const [menuFilter, setMenuFilter] = useState<boolean>(false);
  const [formState, setFormState] = useState<FormStateType>({});
  const [errors, setErrors] = useState<FormStateType>({});
  const [openReport, setOpenReport] = useState<boolean>(false);
  
  // Estados para Invitaciones
  const [openInvitationInfo, setOpenInvitationInfo] = useState<boolean>(false);
  const [selectedInvitation, setSelectedInvitation] = useState<InvitationType | null>(null);
  
  // Hook useAxios para fetching
  const {
    data: accesses,
    reLoad,
    execute,
  } = useAxios("/accesses", "GET", params);

  const { data: pedidos, reLoad: reLoadPed } = useAxios(
    "/others",
    "GET",
    paramsPed
  );

  const { data: qrs, reLoad: reLoadQr } = useAxios(
    "/invitations",
    "GET",
    paramsQr
  );

  const linkDownload = useRef<string>("");

  // Funciones para manejar reportes
  const onOpenReport = () => {
    setOpenReport(true);
  };
  
  const onCloseReport = () => {
    setOpenReport(false);
  };
  
  // Función para cambiar parámetros de búsqueda según el tipo actual
  const activeSetParams = (param: Record<string, any>) => {
    if (typeSearch === "A") {
      reLoad({ ...params, ...param });
      setParams({ ...params, ...param });
    }
    if (typeSearch === "P") {
      reLoadPed({ ...paramsPed, ...param });
      setParamsPed({ ...paramsPed, ...param });
    }
    if (typeSearch === "Q") {
      reLoadQr({ ...paramsQr, ...param });
      setParamsQr({ ...paramsQr, ...param });
    }
  };

  // Función para exportar datos
  const onExport = async (type: string) => {
    setMenuExport(false);
    const mod: Record<string, any> = {
      A: {
        modulo: "accesses",
        exportCols:
          "visit.name,in_at,out_at,plate,owner.name,guardia.name,out_guard.name",
        exportTitulo: "Historial de Accesos",
        exportTitulos:
          "Visitante,Entrada,Salida,Placa,Residente,Guardia,G.Salida",
        params: params,
      },
      P: {
        modulo: "others",
        exportCols:
          "descrip,access.in_at,access.out_at,owner.name,access.guardia.name,access.out_guard.name",
        exportTitulo: "Historial de Pedidos",
        exportTitulos: "Pedido,Ingreso,Salida,Residente,Guardia,G.Salida",
        params: paramsPed,
      },
      Q: {
        modulo: "invitations",
        exportCols:
          "_text|aa [1]|(_if|(_count|access)|>|0|(_count|access)|(_text|Expirado))",
        exportTitulo: "Historial de Invitaciones QR",
        exportTitulos: "Fecha,Visita,Residente,Acceso,Guardia",
        params: paramsQr,
      },
    };
    
    const { data: file } = await execute("/" + mod[typeSearch].modulo, "GET", {
      ...mod[typeSearch].params,
      _export: type,
      exportCols:
        mod[typeSearch].exportCols || mod[typeSearch].params.cols || "",
      exportTitulo: mod[typeSearch].exportTitulo,
      exportTitulos: mod[typeSearch].exportTitulos || "",
      exportAnchos: mod[typeSearch].exportAnchos || "",
    });
    
    if (file?.success === true) {
      linkDownload.current = getUrlImages("/" + file?.data?.path);
      onOpenReport();
    } else {
      showToast("No hay datos para exportar", "warning");
    }
  };

  // Función de búsqueda - CORREGIDA
  const onSearch = (filter: boolean = false, _search: any = false): string => {
    let searchBy: string = "";
    let search: string = "";
    let param: string = "";

    if (typeSearch === "A") {
      searchBy = paramsInitial.searchBy;
      search = formState.search || "";
      param = "search";
    } else if (typeSearch === "P") {
      searchBy = paramsInitialPed.searchBy;
      search = formState.searchPed || "";
      param = "searchPed";
    } else if (typeSearch === "Q") {
      searchBy = paramsInitialQr.searchBy;
      search = formState.searchQr || "";
      param = "searchQr";
    }

    if (_search !== false) {
      search = _search || "";
      setFormState({ ...formState, [param]: search });
    }

    if (search && search !== "") {
      searchBy =
        searchBy +
        "|accesses.plate,l," +
        search +
        ",o,(" +
        "|accesses.obs_out,l," +
        search +
        ",o," +
        "|accesses.obs_confirm,l," +
        search +
        ",o," +
        "|owners.name,l," +
        search +
        ",o,," +
        "|owners.last_name,l," +
        search +
        ",o,," +
        "|owners.middle_name,l," +
        search +
        ",o,," +
        "|owners.mother_last_name,l," +
        search +
        ",o,," +
        "|owners.ci,l," +
        search +
        ",o,,";

      if (typeSearch === "A") {
        searchBy =
          searchBy +
          "|visits.name,l," +
          search +
          ",o,," +
          "|visits.middle_name,l," +
          search +
          ",o,," +
          "|visits.last_name,l," +
          search +
          ",o,," +
          "|visits.mother_last_name,l," +
          search +
          ",o,," +
          "|visits.ci,l," +
          search +
          ",,,";
      }
      
      searchBy = searchBy + "|accesses.obs_in,l," + search + ",o,),";

      if (typeSearch === "Q") {
        searchBy =
          "|owners.name,l," +
          search +
          ",o,(," +
          "|owners.middle_name,l," +
          search +
          ",o,," +
          "|owners.last_name,l," +
          search +
          ",o,," +
          "|owners.mother_last_name,l," +
          search +
          ",o,," +
          "|invitations.title,l," +
          search +
          ",o,," +
          "|invitations.obs,l," +
          search +
          ",o,," +
          "|owners.ci,l," +
          search +
          ",o,),";
      }
    }

    if (filter) return searchBy;
    
    const filterStr = onFilter("", true);
    if (typeof filterStr === "string") {
      searchBy += filterStr;
    }

    activeSetParams({ searchBy });
    return searchBy;
  };

  // Función para aplicar filtros de fecha - CORREGIDA
  const onFilter = (opt: string = "", _search: boolean = false): string => {
    setMenuFilter(false);
    let searchBy: string = "";
    let filter: string = "";
    
    if (typeSearch === "A") filter = "filter";
    else if (typeSearch === "P") filter = "filterPed";
    else if (typeSearch === "Q") filter = "filterQr";

    if (_search) {
      opt = formState[filter] || "";
    } else {
      searchBy = onSearch(true);
    }

    let firstDay: string = "";
    let lastDay: string = "";
    
    if (opt && opt !== "") {
      switch (opt) {
        case "week":
          firstDay = new Date(
            new Date().setDate(new Date().getDate() - new Date().getDay() + 1)
          )
            .toISOString()
            .split("T")[0];
          lastDay = new Date(
            new Date().setDate(new Date().getDate() - new Date().getDay() + 7)
          )
            .toISOString()
            .split("T")[0];
          break;
          
        case "lastweek":
          firstDay = new Date(
            new Date().setDate(new Date().getDate() - new Date().getDay() - 6)
          )
            .toISOString()
            .split("T")[0];
          lastDay = new Date(
            new Date().setDate(new Date().getDate() - new Date().getDay())
          )
            .toISOString()
            .split("T")[0];
          break;
          
        case "month":
          firstDay = new Date(
            new Date().getFullYear(),
            new Date().getMonth(),
            1
          )
            .toISOString()
            .split("T")[0];
          lastDay = new Date(
            new Date().getFullYear(),
            new Date().getMonth() + 1,
            0
          )
            .toISOString()
            .split("T")[0];
          break;
          
        case "lastmonth":
          firstDay = new Date(
            new Date().getFullYear(),
            new Date().getMonth() - 1,
            1
          )
            .toISOString()
            .split("T")[0];
          lastDay = new Date(new Date().getFullYear(), new Date().getMonth(), 0)
            .toISOString()
            .split("T")[0];
          break;
          
        default:
          break;
      }
      
      let fieldDate: string = "accesses.created_at";
      if (typeSearch === "P") fieldDate = "others.created_at";
      if (typeSearch === "Q") fieldDate = "invitations.date_event";
      
      searchBy +=
        "|__date__" +
        fieldDate +
        ",>=," +
        firstDay +
        ",a,(," +
        "|__date__" +
        fieldDate +
        ",<=," +
        lastDay +
        ",,),";
    }

    if (_search) return searchBy;

    setFormState({ ...formState, [filter]: opt });
    activeSetParams({ searchBy });
    return searchBy;
  };

  // Funciones para paginación
  const onChangePage = (page: number) => {
    activeSetParams({ page });
  };
  
  const onChangePerPage = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const perPage = e.target.value;
    
    if (typeSearch === "A" && params?.perPage === parseInt(perPage)) return;
    if (typeSearch === "P" && paramsPed?.perPage === parseInt(perPage)) return;
    if (typeSearch === "Q" && paramsQr?.perPage === parseInt(perPage)) return;
    
    activeSetParams({ perPage: perPage || -1 });
  };

  const onClearSearch = () => {
    onSearch(false, "");
  };

  const getTotalPages = () => {
    let total = 0;
    if (typeSearch === "A")
      total = Math.ceil((accesses?.message.total || 1) / (params?.perPage || 1));
    if (typeSearch === "P")
      total = Math.ceil((pedidos?.message.total || 1) / (paramsPed?.perPage || 1));
    if (typeSearch === "Q")
      total = Math.ceil((qrs?.message.total || 1) / (paramsQr?.perPage || 1));
    return total;
  };

  const setSearch = async (v: any = false) => {
    let name = "search";
    if (typeSearch === "P") name = "searchPed";
    if (typeSearch === "Q") name = "searchQr";
    await setFormState({ ...formState, [name]: v });
    onSearch(false, v);
  };

  const tabs: TabType[] = [
    { value: "A", text: "Accesos" },
    { value: "Q", text: "QR" },
    { value: "P", text: "Pedidos" },
  ];
 /* useEffect(() => {
    setStore({ title: mod.plural.toUpperCase() });
  }, []);
  */

  // Función para renderizar ítems de accesos
  const renderAccessItem = (access: AccessType) => {
    return (
      <div className={styles.itemCard}>
        <div className={styles.itemHeader}>
          <div className={styles.itemTitle}>
            {access.visit ? getFullName(access.visit) : "Visitante"}
          </div>
          <div className={styles.itemDate}>
            {getDateStrMes(access.in_at || "")}
          </div>
        </div>
        <div className={styles.itemContent}>
          <div className={styles.itemField}>
            <div className={styles.itemLabel}>Entrada</div>
            <div className={styles.itemValue}>{getDateStrMes(access.in_at || "")}</div>
          </div>
          <div className={styles.itemField}>
            <div className={styles.itemLabel}>Salida</div>
            <div className={styles.itemValue}>{access.out_at ? getDateStrMes(access.out_at) : "No registrada"}</div>
          </div>
          <div className={styles.itemField}>
            <div className={styles.itemLabel}>Placa</div>
            <div className={styles.itemValue}>{access.plate || "No registrada"}</div>
          </div>
          <div className={styles.itemField}>
            <div className={styles.itemLabel}>Residente</div>
            <div className={styles.itemValue}>{access.owner ? getFullName(access.owner) : "No registrado"}</div>
          </div>
        </div>
      </div>
    );
  };

  // Función para renderizar ítems de pedidos
  const renderPedidoItem = (pedido: PedidoType) => {
    return (
      <div className={styles.itemCard}>
        <div className={styles.itemHeader}>
          <div className={styles.itemTitle}>
            {pedido.descrip || "Pedido"}
          </div>
          <div className={styles.itemDate}>
            {pedido.access?.in_at ? getDateStrMes(pedido.access.in_at) : "Sin fecha"}
          </div>
        </div>
        <div className={styles.itemContent}>
          <div className={styles.itemField}>
            <div className={styles.itemLabel}>Descripción</div>
            <div className={styles.itemValue}>{pedido.descrip || "Sin descripción"}</div>
          </div>
          <div className={styles.itemField}>
            <div className={styles.itemLabel}>Entrada</div>
            <div className={styles.itemValue}>{pedido.access?.in_at ? getDateStrMes(pedido.access.in_at) : "No registrada"}</div>
          </div>
          <div className={styles.itemField}>
            <div className={styles.itemLabel}>Salida</div>
            <div className={styles.itemValue}>{pedido.access?.out_at ? getDateStrMes(pedido.access.out_at) : "No registrada"}</div>
          </div>
          <div className={styles.itemField}>
            <div className={styles.itemLabel}>Residente</div>
            <div className={styles.itemValue}>{pedido.owner ? getFullName(pedido.owner) : "No registrado"}</div>
          </div>
        </div>
      </div>
    );
  };

  // Función para manejar el click en una invitación
  const handleInvitationClick = (invitation: InvitationType) => {
    setSelectedInvitation(invitation);
    setOpenInvitationInfo(true);
  };

  // Función para renderizar invitaciones
  const renderInvitationItems = () => {
    let lastDateAccess: string = "";
    
    if (!qrs?.data || !Array.isArray(qrs.data)) {
      return <EmptyItem text="No hay invitaciones registradas" />;
    }
    
    return (
      <div className={styles.invitationsList}>
        {qrs.data.map((invitation: InvitationType) => {
          const dateChanged = getDateStrMes(lastDateAccess) !== getDateStrMes(invitation.date_event || "");
          
          // Si la fecha cambió, actualiza lastDateAccess y muestra el separador
          if (dateChanged) {
            lastDateAccess = invitation.date_event || "";
          }
          
          return (
            <div key={invitation.id} onClick={() => handleInvitationClick(invitation)}>
              {dateChanged && (
                <div className={styles.dateHeader}>
                  <div className={styles.dateTitle}>
                    {getDateStrMes(invitation.date_event || "")}
                  </div>
                </div>
              )}
              
              <div className={styles.invitationCard}>
                <div className={styles.invitationIcon}>
                  {invitation?.type === "G" ? <IconGroupsQr /> : <IconSingleQr />}
                </div>
                
                <div className={styles.invitationContent}>
                  <div className={styles.invitationTitle}>
                    Residente: {getFullName(invitation.owner)}
                  </div>
                  <div className={styles.invitationDetails}>
                    {invitation.type === "G" ? (
                      <>{invitation.guests?.length || 0} Invitados</>
                    ) : (
                      <>
                        {invitation.access && invitation.access[0] ? (
                          <>
                            Invitado: {getFullName(invitation.access[0]?.visit)}
                          </>
                        ) : (
                          <span className={styles.expiredInvitation}>
                            {invitation.status === "X" ? "Anulado" : "Expirado"}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Función para obtener la página actual según el tipo de búsqueda
  const getCurrentPage = (): number => {
    if (typeSearch === "A") return params?.page || 1;
    if (typeSearch === "P") return paramsPed?.page || 1;
    return paramsQr?.page || 1;
  };

  // Función para obtener el valor actual de perPage según el tipo de búsqueda
  const getCurrentPerPage = (): number => {
    if (typeSearch === "A") return params?.perPage || 10;
    if (typeSearch === "P") return paramsPed?.perPage || 10;
    return paramsQr?.perPage || 10;
  };

    // Añadir un evento para manejar las rutas de los dropdowns
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash) {
        // Filtros
        if (hash === '#sin-filtro') onFilter("");
        else if (hash === '#week') onFilter("week");
        else if (hash === '#lastweek') onFilter("lastweek"); 
        else if (hash === '#month') onFilter("month");
        else if (hash === '#lastmonth') onFilter("lastmonth");
        
        // Exportar
        else if (hash === '#pdf') onExport("pdf");
        else if (hash === '#xls') onExport("xls");
        else if (hash === '#csv') onExport("csv");
        
        // Limpiar el hash después de procesarlo
        setTimeout(() => {
          window.location.hash = '';
        }, 100);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [typeSearch]); // Añadir dependencia de typeSearch para que se actualice al cambiar de pestaña
  
  // Función para obtener los parámetros actuales según el tipo de búsqueda
  const getCurrentParams = (): ParamsType => {
    if (typeSearch === "A") return params;
    if (typeSearch === "P") return paramsPed;
    return paramsQr;
  };
  

  return (
    <div className={styles.container}>
      {/* tabs */}
      <TabsButtons
        tabs={tabs}
        sel={typeSearch}
        setSel={setTypeSearch}
      />
      
      <div className={styles.searchContainer}>
        <div className={styles.searchRow}>
          {/* buscar */}
          <div className={styles.searchInputContainer}>
            <DataSearch
              name={
                typeSearch === "A"
                  ? "search"
                  : typeSearch === "P"
                  ? "searchPed"
                  : "searchQr"
              }
              value={
                typeSearch === "A"
                  ? formState.search || ""
                  : typeSearch === "P"
                  ? formState.searchPed || ""
                  : formState.searchQr || ""
              }
              // @ts-ignore
              icon={
                (typeSearch === "A" && formState.search) ||
                (typeSearch === "P" && formState.searchPed) ||
                (typeSearch === "Q" && formState.searchQr) ? (
                  <button
                    onClick={() => onSearch()}
                    className={styles.searchButton}
                  >
                    Buscar
                  </button>
                ) : (
                  <IconSearch />
                )
              }
              setSearch={setSearch}
              onClear={onClearSearch}
              msg={
                typeSearch === "A" && formState.filter
                  ? "Filtro: " + filtroLabels[formState.filter]
                  : typeSearch === "P" && formState.filterPed
                  ? "Filtro: " + filtroLabels[formState.filterPed]
                  : typeSearch === "Q" && formState.filterQr
                  ? "Filtro: " + filtroLabels[formState.filterQr]
                  : ""
              }
            />
          </div>

          {/* filtros */}
          <div className={styles.actionsContainer}>
            <div className={styles.filterContainer}>
              <Dropdown
                trigger={<IconFilter />}
                items={[
                  { name: "Sin Filtro", route: "#sin-filtro" },
                  { name: "Esta Semana", route: "#week" },
                  { name: "Ant. Semana", route: "#lastweek" },
                  { name: "Este Mes", route: "#month" },
                  { name: "Ant. Mes", route: "#lastmonth" }
                ]}
              />
            </div>
            
            <div className={styles.exportContainer}>
              <Dropdown
                trigger={<IconDownload />}
                items={[
                  { name: "PDF", route: "#pdf" },
                  { name: "Excel", route: "#xls" },
                  { name: "CSV", route: "#csv" }
                ]}
              />
            </div>
          </div>
        </div>
      </div>

      {/* listado */}
      <div className={styles.listContainer}>
        <LoadingScreen className={styles.loadingScreen}>
          {typeSearch === "A" && (
            <>
              {accesses?.data && Array.isArray(accesses.data) && accesses.data.length ? (
                <List
                  data={accesses.data}
                  renderItem={(item: AccessType) => renderAccessItem(item)}
                  emptyLabel="No hay accesos registrados"
                />
              ) : (
                <EmptyItem text="No hay accesos registrados" />
              )}
            </>
          )}
          
          {typeSearch === "P" && (
            <>
              {pedidos?.data && Array.isArray(pedidos.data) && pedidos.data.length ? (
                <List
                  data={pedidos.data}
                  renderItem={(item: PedidoType) => renderPedidoItem(item)}
                  emptyLabel="No hay pedidos registrados"
                />
              ) : (
                <EmptyItem text="No hay pedidos registrados" />
              )}
            </>
          )}
          
          {typeSearch === "Q" && (
            <>
              {qrs?.data && Array.isArray(qrs.data) && qrs.data.length ? (
                <div className={styles.invitationsContainer}>
                  {renderInvitationItems()}
                </div>
              ) : (
                <EmptyItem text="No hay invitaciones registradas" />
              )}
            </>
          )}
        </LoadingScreen>
      </div>
      
      <div className={styles.paginationContainer}>
        <Pagination
          currentPage={getCurrentPage()}
          onPageChange={onChangePage}
          totalPages={getTotalPages()}
          previousLabel=""
          nextLabel=""
          setParams={typeSearch === "A" ? setParams : typeSearch === "P" ? setParamsPed : setParamsQr}
          params={getCurrentParams()}
          total={
            typeSearch === "A" 
              ? accesses?.message.total || 0 
              : typeSearch === "P" 
                ? pedidos?.message.total || 0 
                : qrs?.message.total || 0
          }
        />
      </div>
      
      {/* Modal para mostrar reportes descargados */}
      <DataModal
        open={openReport}
        onClose={onCloseReport}
        title="Reporte de descargas"
        buttonText=""
        buttonCancel=""      >
        <div className={styles.downloadContainer}>
          <a
            href={linkDownload.current}
            className={styles.downloadLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            <IconDownload size={48} className={styles.downloadIcon} />
            Click para descargar
          </a>
        </div>
      </DataModal>

      {/* Modal para mostrar detalles de invitación */}
      {selectedInvitation && openInvitationInfo && (
        <InvitacionInfo
          open={openInvitationInfo}
          onClose={() => setOpenInvitationInfo(false)}
          data={selectedInvitation}
          onOut={null}
          onIn={null}
        />
      )}
    </div>
  );
};

export default Activities;