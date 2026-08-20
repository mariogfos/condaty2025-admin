"use client";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import ProgressBar from "../../ui/ProgressBar/ProgressBar";

const BATCH_SIZE = 200;
const ImportDataModal = ({
  children = null,
  mod,
  onClose,
  open = false,
  showToast,
  execute,
  reLoad,
  getExtraData = null,
  opcionalCols = "",
  requiredCols = "",
}: any) => {
  const [dataImport, setDataImport]: any = useState([]);
  const [errorImport, setErrorImport]: any = useState([]);

  useEffect(() => {
    if (open) {
      setErrorImport(null);
      setDataImport(null);
      return;
    }
  }, [open]);

  const _reLoad = async () => {
    console.log("reLoad");
    if (getExtraData) {
      await getExtraData();
    }
    reLoad();
  };

  const [isProcessing, setIsProcessing] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const onImport = async () => {
    if (dataImport && dataImport.length > 0) {
      let remainingData = [...dataImport];

      setIsProcessing(true);
      while (remainingData.length > 0) {
        const currentBatch = remainingData.slice(0, BATCH_SIZE);
        remainingData = remainingData.slice(BATCH_SIZE);

        try {
          setPendingCount(currentBatch.length);
          const { data, errors } = await execute(
            `${mod.modulo}-import`,
            "POST",
            {
              data: currentBatch,
              lineBase: dataImport.length - remainingData.length - BATCH_SIZE,
            }
          );

          if (data?.success) {
            console.log(
              data.data?.total,
              currentBatch.length,
              remainingData.length
            );
            setPendingCount(0);
            setSentCount((prev) => prev + currentBatch.length * 1);
            if (data?.data?.total === 0) {
              // onClose(true);
              showToast("Se importaron todos los datos", "success");
              _reLoad();
              break;
            } else {
              setErrorImport((old: any) => {
                if (Array.isArray(old)) {
                  return [...old, ...data.data?.error];
                }
                return data?.data?.error;
              });
              showToast(
                `Importado  ${currentBatch.length} registros, aun quedan ${remainingData.length} registros por enviar`,
                "warning"
              );
            }
            // reLoad();
          } else {
            setErrorImport((old: any) => {
              if (Array.isArray(old)) {
                return [...old, ...data?.data?.error];
              }
              return data?.data?.error;
            });
            setDataImport(null);
            showToast(`Error al importar: ${errors}`, "error");
            break;
          }
        } catch (error: any) {
          setErrorImport(error.message);
          setDataImport(null);
          showToast(`Error al importar: ${error.message}`, "error");
          break;
        }
      }

      // setIsProcessing(false);
    } else {
      showToast("No disponible", "error");
    }
    // setIsProcessing(false);
    showToast("Se importaron todos los datos", "success");
    _reLoad();
  };

  const onImportFile = (e: any) => {
    e.preventDefault();
    if (
      e.target.files &&
      e.target?.files.length > 0 &&
      e.target?.files[0].name
    ) {
      const file = e.target.files[0];
      if (
        !["xls", "xlsx"].includes(
          file.name
            .toLowerCase()
            .slice(((file.name.lastIndexOf(".") - 1) >>> 0) + 2)
        )
      ) {
        showToast("Solo se permiten archivos xls o xlsx", "error");
        return;
      }
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

  return (
    <>
      {open && (
        <DataModal
          id="Importar"
          title="Importar de Excel"
          buttonText={dataImport?.length > 0 && !errorImport ? "Importar" : ""}
          buttonCancel=""
          onSave={(e) => onImport()}
          onClose={() => onClose(false)}
          open={open}
        >
          {isProcessing && (
            <ProgressBar
              total={dataImport?.length}
              sent={sentCount}
              pending={pendingCount}
              paquete={BATCH_SIZE}
            />
          )}
          {requiredCols && (
            <div className="text-[14px]">
              <span className="font-bold my-2">
                Columnas Obligatorias deben tener de título exactamente como se
                indica:
              </span>{" "}
              {requiredCols}
            </div>
          )}
          {opcionalCols && (
            <div className="text-[14px] my-2">
              <span className="font-bold">Columnas Opcionales:</span>{" "}
              {opcionalCols}
            </div>
          )}
          {!isProcessing && (
            <label htmlFor="file">
              <div className="btn-primary w-full ">
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
          {dataImport &&
            dataImport.length > 0 &&
            !isProcessing &&
            !errorImport && (
              <>
                <div className="overflow-auto max-h-[300px]">
                  <table>
                    {" "}
                    <thead>
                      <tr>
                        {Object.keys(dataImport[0]).map((item, index) => (
                          <th
                            key={"item-" + index}
                            style={{ padding: "4px", textAlign: "left" }}
                          >
                            {item.toUpperCase()}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {dataImport &&
                        dataImport.map((item: any, index: number) => (
                          <tr key={"item" + index}>
                            {Object.keys(item).map((col, i) => (
                              <td key={"item-" + i} style={{ padding: "4px" }}>
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
            {errorImport && errorImport.length > 0 && (
              <>
                <div className="font-extrabold border-b  mt-2 ">Errores</div>
                <div className="flex flex-col gap-x-2 w-full text-[8px]">
                  {errorImport.map((item: any, index: number) => (
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

export default ImportDataModal;
