"use client";
import Button from "@/mk/components/forms/Button/Button";
import Switch from "@/mk/components/forms/Switch/Switch";
import { Card } from "@/mk/components/ui/Card/Card";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { useEffect, useState } from "react";

const Permisos = ({
  field = "",
  data,
  setItem,
  options = [],
  error = {},
  extraData = { ability_categories: [{ id: 1, name: "General" }] },
}: any) => {
  const [permisos, setPermisos]: any = useState([]);
  const { user } = useAuth();

  const onSelAll = (e: any) => {
    const { name, checked } = e.target;
    setPermisos({ ...permisos, [name]: checked ? "CRUD" : "" });
  };

  const onSelAllCat = (catId: number) => {
    const per = permisos;
    let llenar = "CRUD";
    options.map((item: any) => {
      if (item.ability_category_id == catId && per[item.name]) {
        llenar = "";
      }
    });
    options.map((item: any) => {
      if (item.ability_category_id == catId) {
        per[item.name] = llenar;
      }
    });
    setPermisos({ ...permisos, ...per });
  };

  useEffect(() => {
    const permiso: any = {};
    if (data?.abilities == "**" + user?.client_id + "**") {
      options.map((item: any) => {
        permiso[item.name] = "CRUD";
      });
      setPermisos(permiso);
    }

    const permisosTiene: string[] = (data?.abilities || "|").split("|");
    permisosTiene.map((item) => {
      if (item && item != "") {
        const perm = (item + ":").split(":");
        if (perm[0]) {
          permiso[perm[0]] = perm[1];
        }
      }
    });
    setPermisos(permiso);
  }, []);

  useEffect(() => {
    let permiso = "";
    Object.keys(permisos).map((item) => {
      if (permisos[item] != "") {
        permiso += item + ":" + permisos[item] + "|";
      }
    });
    if (setItem) setItem({ ...data, abilities: permiso });
  }, [permisos]);

  const onSelItem = (e: any) => {
    const { name, checked } = e.target;
    const perm: string[] = (name + "_C_").split("_");
    let value = permisos[perm[0]] || "";
    const has = value.indexOf(perm[1]);
    if (checked && has == -1) {
      value += perm[1];
    }
    if (!checked && has > -1) {
      value = value.replace(perm[1], "");
    }
    setPermisos({ ...permisos, [perm[0]]: value });
  };

  const isCRUD = (item: any) => {
    return (
      (permisos[item.name] + "").indexOf("C") > -1 &&
      (permisos[item.name] + "").indexOf("R") > -1 &&
      (permisos[item.name] + "").indexOf("U") > -1 &&
      (permisos[item.name] + "").indexOf("D") > -1
    );
  };

  return (
    <div>
      {/* <legend>Permisos</legend> */}

      {extraData?.ability_categories?.map((cat: any) => (
        <Card key={cat.id} style={{ backgroundColor: "var(--cBlackV2)" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              color: "var(--cWhite)",
              fontWeight: "bold",
            }}
          >
            <div>{cat.name}</div>
            {setItem && (
              <div>
                <Button
                  small
                  onClick={() => onSelAllCat(cat.id)}
                  variant="terciary"
                >
                  Todos
                </Button>
              </div>
            )}
          </div>
          {options
            ?.filter((o: any) => o.ability_category_id == cat.id)
            .map((item: any) => (
              <Card
                key={item.id}
                style={{
                  backgroundColor: "var(--cBlackV4",
                  border: "1px solid var(--cWhiteV3)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    justifyItems: "center",
                  }}
                >
                  <div>
                    <div
                      style={{ color: "var(--cWhite)", marginBottom: "8px" }}
                    >
                      {item.description}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        color: "var(cWhiteV2)",
                      }}
                    >
                      <span>
                        <input
                          type="checkbox"
                          name={item.name + "_R"}
                          checked={(permisos[item.name] + "").indexOf("R") > -1}
                          onClick={onSelItem}
                          value={
                            (permisos[item.name] + "").indexOf("R") > -1
                              ? "Y"
                              : "N"
                          }
                          disabled={!setItem}
                        />{" "}
                        Ver
                      </span>
                      <span>
                        <input
                          type="checkbox"
                          name={item.name + "_C"}
                          checked={(permisos[item.name] + "").indexOf("C") > -1}
                          onClick={onSelItem}
                          value={
                            (permisos[item.name] + "").indexOf("C") > -1
                              ? "Y"
                              : "N"
                          }
                          disabled={!setItem}
                        />{" "}
                        Crear
                      </span>
                      <span>
                        <input
                          type="checkbox"
                          name={item.name + "_U"}
                          checked={(permisos[item.name] + "").indexOf("U") > -1}
                          onClick={onSelItem}
                          value={
                            (permisos[item.name] + "").indexOf("U") > -1
                              ? "Y"
                              : "N"
                          }
                          disabled={!setItem}
                        />{" "}
                        Editar
                      </span>
                      <span>
                        <input
                          type="checkbox"
                          name={item.name + "_D"}
                          checked={(permisos[item.name] + "").indexOf("D") > -1}
                          onClick={onSelItem}
                          value={
                            (permisos[item.name] + "").indexOf("D") > -1
                              ? "Y"
                              : "N"
                          }
                          disabled={!setItem}
                        />{" "}
                        Eliminar
                      </span>
                    </div>
                  </div>

                  {setItem && (
                    <Switch
                      name={item.name}
                      onChange={onSelAll}
                      optionValue={["Y", "N"]}
                      value={isCRUD(item) ? "Y" : "N"}
                      checked={isCRUD(item)}
                    />
                  )}
                </div>
              </Card>
            ))}
        </Card>
      ))}
      {/* {options?.map((item: any) => (

      ))} */}
    </div>
  );
};

export default Permisos;
