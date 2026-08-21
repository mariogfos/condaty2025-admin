"use client";
import Button from "@/mk/components/forms/Button/Button";
import Switch from "@/mk/components/forms/Switch/Switch";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { useEffect, useState } from "react";
import Check from "@/mk/components/forms/Check/Check";
import styles from "./Permisos.module.css";

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
    <div className={styles.permissions}>
      {/* <legend>Permisos</legend> */}

      {extraData?.ability_categories?.map((cat: any) => (
        <section key={cat.id} className={styles.category}>
          <header className={styles.categoryHeader}>
            <div className={styles.categoryTitle}>{cat.name}</div>
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
          </header>
          <div className={styles.abilityList}>
            {options
              ?.filter((o: any) => o.ability_category_id == cat.id)
              .map((item: any) => (
                <div key={item.id} className={styles.abilityRow}>
                  <div className={styles.abilityName}>{item.description}</div>
                  <div className={styles.checks}>
                    <Check
                      name={item.name + "_R"}
                      checked={(permisos[item.name] + "").indexOf("R") > -1}
                      value={
                        (permisos[item.name] + "").indexOf("R") > -1
                          ? "Y"
                          : "N"
                      }
                      onChange={onSelItem}
                      disabled={!setItem}
                      label="Ver"
                      reverse={true}
                    />
                    <Check
                      name={item.name + "_C"}
                      checked={(permisos[item.name] + "").indexOf("C") > -1}
                      value={
                        (permisos[item.name] + "").indexOf("C") > -1
                          ? "Y"
                          : "N"
                      }
                      onChange={onSelItem}
                      disabled={!setItem}
                      label="Crear"
                      reverse={true}
                    />
                    <Check
                      name={item.name + "_U"}
                      checked={(permisos[item.name] + "").indexOf("U") > -1}
                      value={
                        (permisos[item.name] + "").indexOf("U") > -1
                          ? "Y"
                          : "N"
                      }
                      onChange={onSelItem}
                      disabled={!setItem}
                      label="Editar"
                      reverse={true}
                    />
                    <Check
                      name={item.name + "_D"}
                      checked={(permisos[item.name] + "").indexOf("D") > -1}
                      value={
                        (permisos[item.name] + "").indexOf("D") > -1
                          ? "Y"
                          : "N"
                      }
                      onChange={onSelItem}
                      disabled={!setItem}
                      label="Eliminar"
                      reverse={true}
                    />
                  </div>

                  {setItem && (
                    <div className={styles.toggle}>
                      <Switch
                        name={item.name}
                        onChange={onSelAll}
                        optionValue={["Y", "N"]}
                        value={isCRUD(item) ? "Y" : "N"}
                        checked={isCRUD(item)}
                      />
                    </div>
                  )}
                </div>
              ))}
          </div>
        </section>
      ))}
      {/* {options?.map((item: any) => (

      ))} */}
    </div>
  );
};

export default Permisos;
