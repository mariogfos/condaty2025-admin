"use client";
import Button from "@/mk/components/forms/Button/Button";
import Switch from "@/mk/components/forms/Switch/Switch";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { useEffect, useRef, useState } from "react";
import Check from "@/mk/components/forms/Check/Check";
import styles from "./Permisos.module.css";
import stylesInput from "@/mk/components/forms/Input/input.module.css";
import { getFieldErrorMessage } from "@/mk/components/forms/ControlLabel";
import { canGrantLetter, lettersOf } from "./grantPolicy";

const Permisos = ({
  field = "",
  data,
  setItem,
  options = [],
  error = {},
  extraData = { ability_categories: [{ id: 1, name: "General" }] },
}: any) => {
  const [permisos, setPermisos]: any = useState([]);
  // El 422 del API (`RoleWriteRequest`) llega en `errors.abilities`.
  const abilitiesError = getFieldErrorMessage(error, "abilities");
  const { user } = useAuth();

  /**
   * What the role had when the editor opened. The API rejects only ADDED
   * letters the actor lacks (`RoleWriteRequest`), so a stored letter stays
   * tickable and untickable even when the actor does not have it.
   */
  const stored = useRef<string>(data?.abilities || "");
  const allowed = (module: string, letter: string) =>
    canGrantLetter(user, module, letter) ||
    lettersOf(stored.current, module).includes(letter);
  const grantable = (module: string, current: string = "") =>
    "CRUD"
      .split("")
      .filter((letter) => current.includes(letter) || allowed(module, letter))
      .join("");

  const onSelAll = (e: any) => {
    const { name, checked } = e.target;
    setPermisos({
      ...permisos,
      [name]: checked ? grantable(name, permisos[name] || "") : "",
    });
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
        per[item.name] = llenar ? grantable(item.name, per[item.name] || "") : "";
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

  /**
   * La casilla de una letra se llama `<modulo>_<letra>`, y el módulo puede
   * tener `_` (`bank_accounts`, `debts_manager`): la letra es lo que va
   * después del ÚLTIMO `_`. Partir por el primero guardaba `bank:accounts`
   * —sin la letra— y el API lo rechaza (`RoleWriteRequest`).
   */
  const onSelItem = (e: any) => {
    const { name, checked } = e.target;
    const cut = name.lastIndexOf("_");
    const ability = name.slice(0, cut);
    const letter = name.slice(cut + 1);
    let value = permisos[ability] || "";
    const has = value.indexOf(letter);
    if (checked && has == -1) {
      value += letter;
    }
    if (!checked && has > -1) {
      value = value.replace(letter, "");
    }
    setPermisos({ ...permisos, [ability]: value });
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
      {/* Arriba y no al pie: la lista es larga y el pie queda fuera de vista. */}
      {abilitiesError && (
        <p className={stylesInput.error}>{abilitiesError}</p>
      )}

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
                      disabled={
                        !setItem ||
                        ((permisos[item.name] + "").indexOf("R") == -1 &&
                          !allowed(item.name, "R"))
                      }
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
                      disabled={
                        !setItem ||
                        ((permisos[item.name] + "").indexOf("C") == -1 &&
                          !allowed(item.name, "C"))
                      }
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
                      disabled={
                        !setItem ||
                        ((permisos[item.name] + "").indexOf("U") == -1 &&
                          !allowed(item.name, "U"))
                      }
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
                      disabled={
                        !setItem ||
                        ((permisos[item.name] + "").indexOf("D") == -1 &&
                          !allowed(item.name, "D"))
                      }
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
    </div>
  );
};

export default Permisos;
