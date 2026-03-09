"use client";
import Check from "@/mk/components/forms/Check/Check";
import DataSearch from "@/mk/components/forms/DataSearch/DataSearch";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import React, { use, useEffect, useState } from "react";

const ModalDestiny = ({
  open,
  onClose,
  selDestinies,
  formState,
  setFormState,
  onSave,
  execute,
  showToast,
}: any) => {
  const [sel, setSel]: any = useState([]);
  const [destiniesFiltered, setDestiniesFiltered]: any = useState([]);
  const [search, setSearch]: any = useState("");
  useEffect(() => {
    setSel(formState?.lDestiny || []);
  }, [formState]);
  // const getMeta = async () => {
  //   const { data } = await execute("/surveys", "GET", {
  //     destiny: sel,
  //     fullType: "DES",
  //     lDestinies: formState.lDestiny,
  //   });

  //   setFormState({
  //     ...formState,
  //     affCount: data?.data?.affCount,
  //     lDestiny: sel,
  //   });
  // };
  const normalizeText = (text: string) =>
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase();

  useEffect(() => {
    if (!search) {
      setDestiniesFiltered(selDestinies);
      return;
    }
    // const search = formState?.searchDestiny;
    const filtered = selDestinies.filter((d: any) =>
      normalizeText(d.name).includes(normalizeText(search))
    );
    setDestiniesFiltered(filtered);
  }, [search]);
  const _onSave = async () => {
    // getMeta();
    if (sel <= 0) {
      showToast("Debe seleccionar al menos un destino", "error");
      return;
    }
    onSave(sel);
    onClose();
  };

  const _onClose = () => {
    if (formState?.destiny && formState?.lDestiny?.length <= 0) {
      setFormState({ ...formState, destiny: null });
    }
    onClose();
  };

  const onSearch = (e: any) => {
    setSearch(e);
  };
  return (
    <DataModal open={open} onClose={_onClose} onSave={_onSave}>
      {/* <Check
        key={"check0"}
        name={"destiny_0"}
        reverse
        label="Todos"
        checked={sel.length == 0}
        onChange={(e: any) => {
          const { name, checked } = e.target;
          if (checked) {
            setSel([]);
          }
        }}
        value={0}
        optionValue={["0", "N"]}
      /> */}
      <DataSearch name="searchDestiny" setSearch={onSearch} value={search} />
      {destiniesFiltered.map((d: any, i: number) => (
        <Check
          key={"check" + i}
          name={"destiny_" + d.id}
          reverse
          label={d.name}
          checked={sel.includes(d.id)}
          onChange={(e: any) => {
            const { name, checked } = e.target;
            const id: any = parseInt(name.replace("destiny_", ""));

            const il: any = sel?.filter((d: number) => d != id) || [];
            if (checked) {
              il.push(d.id);
            }
            setSel(il);
          }}
          value={d.id}
          optionValue={[d.id, "N"]}
        />
      ))}
    </DataModal>
  );
};

export default ModalDestiny;
