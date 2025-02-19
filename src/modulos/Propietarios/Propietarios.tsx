import useCrud from "@/mk/hooks/useCrud";
import Buscar from "../Buscar";
import List from "./List";
import Crud from "./Crud";
import View from "./View";
import DataModal from "@/mk/components/DataModal";
import AddFloat from "../AddFloat";
import { useState } from "react";
import Button from "@/mk/components/ui/Button";
import { IconSimpleAdd } from "../layout/icons/IconsBiblioteca";
import * as XLSX from "xlsx";
import NoPermiso from "../NoPermiso";
import { getFullName } from "../../mk/utils/string";

const mod = {
  modulo: "homeowners",
  singular: "propietario",
  permiso: "homeowners",
  plural: "propietarios",
  avatarPrefix: "PRO",
  exportCols:
    "ci,name,last_name,_ifnull|phone|(_text|Sin registrar)|phone,email,_ifnull|created_at|(_text|Sin registrar)|(_format|created_at|date)",
  exportTitulos: [
    "CI",
    "Nombre",
    "Apellido",
    "Teléfono",
    "Email",
    "Fecha de creación",
  ],
};

const fields = {
  id: { rules: "", api: "e" },
  ci: { rules: "number|required|ci", api: "ae" },
  name: { rules: "required|nom", api: "ae" },
  middle_name: { rules: "alfa", api: "ae" },
  last_name: { rules: "required|nom", api: "ae" },
  mother_last_name: { rules: "alfa", api: "ae" },
  phone: { rules: "number|phone", api: "ae" },
  email: { rules: "email|required", api: "ae" },
};

const Propietarios = () => {
  const paramsInitial = {
    perPage: 10,
    page: 1,
    sortBy: "name,last_name",
    orderBy: "asc,asc",
    searchBy: "",
    relations: "dptos",
    cols: "*",
  };
  const [filter, setFilter] = useState("");
  const getFilter = (opt: string | boolean = "", firsDay, lastDay, search) => {
    let searchBy: any = "";
    const _search = opt === true;
    if (_search) {
      opt = filter || "";
    } else {
      searchBy = onSearch(true);
    }


    return searchBy;
  };

  const getSearch = (search, _searchBy = "") => {
    console.log("search", search, _searchBy);

    if (
      search == "" ||
      search === true ||
      search == null ||
      search == undefined
    )
      return "";
    let searchBy = "";
    searchBy =
      "|name,l," +
      search +
      ",o,(" +
      "|last_name,l," +
      search +
      ",o,," +
      "|middle_name,l," +
      search +
      ",o,," +
      "|mother_last_name,l," +
      search +
      ",o,," +
      "|ci,l," +
      search +
      ",o,," +
      "|phone,l," +
      search +
      ",o," +
      "|email,l," +
      search +
      ",o,),";
    return searchBy;
  };

  const {
    data,
    formState,
    setFormState,
    errors,
    setErrors,
    user,
    showToast,
    searchs,
    onAdd,
    onSave,
    onSearch,
    onFilter,
    onView,
    onEdit,
    onDel,
    onExist,
    onCloseCrud,
    onCloseDel,
    onCloseView,
    onExport,
    params,
    setParams,
    open,
    openDel,
    openView,
    execute,
    reLoad,
    userCan,
  } = useCrud({
    paramsInitial,
    mod,
    fields,
    getFilter,
    getSearch,
  });



  const [openImport, setOpenImport] = useState(false);
  const [dataImport, setDataImport]: any = useState(null);
  const [errorImport, setErrorImport]: any = useState(null);
  const onImport = async () => {
    if (!openImport) {
      setErrorImport(null);
      setDataImport(null);
      setOpenImport(true);
      return;
    }

    if (dataImport && dataImport.length > 0) {
      const { data, errors } = await execute("owners-import", "POST", {
        data: dataImport,
      });
      if (data?.success) {
        // setOpenImport(false);
        if (data.data?.total == 0) {
          setOpenImport(false);
          showToast("Se importaron todos los datos", "success");
        } else {
          setErrorImport(data.data?.error);
          showToast(
            "Importado con algunos errores: " +
              data.data?.total +
              " de " +
              dataImport.length +
              " datos",
            "warning"
          );
        }
        reLoad();
      } else {
        setErrorImport(data?.data?.error);
        setDataImport(null);
        showToast("Error al importar:" + errors, "error");
      }
    }
    // showToast("No disponible", "error");
  };

  const onImportFile = (e) => {
    e.preventDefault();
    if (e.target.files) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        setDataImport(json);
        // console.log(json);
      };
      reader.readAsArrayBuffer(e.target.files[0]);
    }
  };
  const FilterContent = () => {
    return (
      <>
        <div
          className="border-b hover:text-lightv3 cursor-pointer"
          onClick={() => onFilter(" ")}
        >
          Sin Filtro
        </div>
        <div
          className="hover:text-lightv3 cursor-pointer"
          onClick={() => onFilter("active")}
        >
          Activos
        </div>
        <div
          className="hover:text-lightv3 cursor-pointer"
          onClick={() => onFilter("noactive")}
        >
          No activos
        </div>
      </>
    );
  };

  const getDptos = (item) => {
    let dptos = "";
    item?.dptos?.map((dpto) => {
      dptos += dpto.nro + " - " + dpto.description + ", ";
    });
    return dptos.slice(0, -2);
  };

  if (!userCan(mod.permiso, "R")) return <NoPermiso />;
  return (
    <>
      <div className="w-full flex justify-between items-center mb-2">
        <div className="w-full mr-5">
          <p className="hidden tablet:block text-lightColor tablet:text-[25px] font-semibold tablet:mt-2 laptop:mt-0">
            {mod.plural.charAt(0).toUpperCase() + mod.plural.slice(1)}
          </p>
          <p className="text-lightv3 text-center tablet:text-left text-xs tablet:text-sm mt-3 tablet:mt-0">
            Administre, agregue, elimine y organice a todos los {mod.plural}
          </p>
        </div>
        <div className="tablet:hidden">
          <AddFloat onAdd={onAdd} />
        </div>
      </div>
      <div className="flex justify-between">
        <div className="w-full tablet:w-[65%] laptop:w-[68%] laptopL:[70%]">
          <Buscar
            onSearch={onSearch}
            onFilter={onFilter}
            onExport={onExport}
            onImport={onImport}
            className="mt-[14px]"
            filter={searchs.filter}
            FilterContent={FilterContent}
          />
        </div>

        <Button
          onClick={onAdd}
          className="btn btn-primary flex items-center justify-center text-xs w-60 h-10 laptop:text-sm laptopL:text-base"
        >
          <IconSimpleAdd className="w-3 h-3 mt-[3px] mr-1 laptop:w-4 laptop:h-4" />{" "}
          Agregar {mod.singular}
        </Button>
      </div>
      <List
        data={data}
        onDel={onDel}
        onEdit={onEdit}
        params={params}
        setParams={setParams}
        onView={onView}
        mod={{ ...mod, getDptos }}
        reLoad={reLoad}
      />

      <Crud
        onClose={onCloseCrud}
        open={open}
        formState={formState}
        setFormState={setFormState}
        onSave={onSave}
        onExist={onExist}
        errors={errors}
        setErrors={setErrors}
        mod={mod}
      />
      <View
        onClose={onCloseView}
        open={openView}
        className=""
        data={formState}
        setData={setFormState}
        reLoad={reLoad}
        actions={{ edit: onEdit, del: onDel }}
        mod={{ ...mod, getDptos }}
      />
      <DataModal
        id="Eliminar"
        title="Confirmar la eliminación"
        buttonText="Eliminar"
        buttonCancel=""
        onSave={(e) => onSave(formState)}
        onClose={onCloseDel}
        open={openDel}
      >
        Seguro de Querer Eliminar al {mod.singular}: {getFullName(formState)}
      </DataModal>
      {openImport && (
        <DataModal
          id="Importar"
          title="Importar de Excel"
          buttonText={dataImport?.length > 0 && !errorImport ? "Importar" : ""}
          buttonCancel=""
          onSave={(e) => onImport()}
          onClose={() => setOpenImport(false)}
          open={openImport}
        >
          <div className="text-[10px] tablet:text-xs laptop:text-base p-2">
            <span className="font-bold">Columnas Obligatorias:</span> Carnet,
            primer nombre, segundo nombre,apellido paterno, apellido materno,
            contraseña.
            <br />
            <span className="font-bold">Columnas Opcionales:</span> Telefono,
            Correo electrónico, Nro
          </div>
          {!errorImport && (
            <label htmlFor="file">
              <div className="btn-primary w-full text-xs tablet:text-base mb-2">
                Seleccionar Archivo
                <input
                  type="file"
                  id="file"
                  className="hidden"
                  onChange={onImportFile}
                />
              </div>
            </label>
          )}

          {dataImport && dataImport.length > 0 && !errorImport && (
            <>
              <div className="overflow-auto max-h-[300px]">
                <table>
                  {" "}
                  <thead>
                    <tr>
                      {Object.keys(dataImport[0]).map((item, index) => (
                        <th key={"item-" + index} className="text-left px-2">
                          {item.toUpperCase()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dataImport &&
                      dataImport.map((item, index) => (
                        <tr key={"item" + index}>
                          {Object.keys(item).map((col, i) => (
                            <td
                              key={"item-" + i}
                              className="text-left text-[8px] px-2"
                            >
                              {item[col]}
                            </td>
                          ))}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          <div className="overflow-auto max-h-[300px]">
            {errorImport && (
              <>
                <div className="font-extrabold border-b  mt-2 ">Errores</div>
                <div className="flex flex-col gap-x-2 w-full text-[8px]">
                  {errorImport.map((item, index) => (
                    <div
                      key={"error" + index}
                      className={
                        item.toLowerCase().indexOf("se grabo pero") == -1
                          ? "text-red-500"
                          : "text-yellow-700"
                      }
                    >
                      {item.toLowerCase().indexOf("sqlstate") == -1
                        ? item
                        : item.toLowerCase().split("sqlstate")[0] + "SQL"}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </DataModal>
      )}
    </>
  );
};

export default Propietarios;
