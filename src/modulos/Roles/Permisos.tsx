'use client'
import Switch from "@/mk/components/forms/Switch/Switch";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { useEffect, useState } from "react";

const Permisos = ({
  field = "",
  data,
  setItem,
  options = [],
  error = {},
}: any) => {
  const [permisos, setPermisos]: any = useState([]);
  const { user } = useAuth();

  const onSelAll = (e: any) => {
    const { name, checked } = e.target;
    setPermisos({ ...permisos, [name]: checked ? "CRUD" : "" });
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
  return (
    <fieldset>
      <legend>Permisos</legend>
      {options?.map((item: any) => (
        <div key={item.name}>
          <div>
            <span>{item.description}</span>
            {setItem && (
              <span>
                Seleccionar todo{" "}
                <input
                  type="checkbox"
                  className="ml-16 mobileM:ml-28 mobileL:ml-2"
                  name={item.name}
                  onClick={onSelAll}
                  value={1}
                  checked={permisos[item.name] == "CRUD"}
                />
              </span>
            )}
          </div>
          <div>
            <div>
              Leer
              <Switch
                name={item.name + "_R"}
                checked={(permisos[item.name] + "").indexOf("R") > -1}
                onChange={onSelItem}
                optionValue={["Y", "N"]}
                value={(permisos[item.name] + "").indexOf("R") > -1 ? "Y" : "N"}
                disabled={setItem ? false : true}
              />
            </div>
            <div>
              Crear
              <Switch
                name={item.name + "_C"}
                checked={(permisos[item.name] + "").indexOf("C") > -1}
                onChange={onSelItem}
                optionValue={["Y", "N"]}
                value={(permisos[item.name] + "").indexOf("C") > -1 ? "Y" : "N"}
                disabled={setItem ? false : true}
              />
            </div>
            <div>
              Modificar
              <Switch
                name={item.name + "_U"}
                checked={(permisos[item.name] + "").indexOf("U") > -1}
                onChange={onSelItem}
                optionValue={["Y", "N"]}
                value={(permisos[item.name] + "").indexOf("U") > -1 ? "Y" : "N"}
                disabled={setItem ? false : true}
              />
            </div>
            <div>
              Eliminar
              <Switch
                name={item.name + "_D"}
                checked={(permisos[item.name] + "").indexOf("D") > -1}
                onChange={onSelItem}
                optionValue={["Y", "N"]}
                value={(permisos[item.name] + "").indexOf("D") > -1 ? "Y" : "N"}
                disabled={setItem ? false : true}
              />
            </div>
          </div>
        </div>
      ))}
    </fieldset>
  );
};

export default Permisos;
