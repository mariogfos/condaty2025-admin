"use client";
import { useEffect, useState } from "react";
import Input from "../Input/Input";
import {
  IconSearch,
  IconX,
} from "../../../../components/layout/icons/IconsBiblioteca";
import Button from "../Button/Button";
import styles from "./dataSearch.module.css";
import { PropsTypeInputBase } from "../ControlLabel";
import idioma from "@/mk/utils/traductor/es";

interface PropsType extends PropsTypeInputBase {
  setSearch: Function;
  textButton?: string;
}

const DataSearch = ({
  setSearch,
  name,
  value,
  label = "",
  textButton = idioma.search,
  className = "",
}: PropsType) => {
  const [searchBy, setSearchBy] = useState("");
  const [oldSearch, setOldSearch] = useState("");

  const onSearch = (v: any = false) => {
    let s = searchBy.trim();
    if (v !== false) {
      s = v.trim();
      setSearchBy(s);
    }

    if (s == oldSearch) return;

    setSearch(s);
    setOldSearch(s);
  };

  const onChange = (e: any) => {
    setSearchBy(e.target.value);
  };

  useEffect(() => {
    setSearchBy(value);
    setOldSearch(value);
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onSearch();
    }
  };

  return (
    <Input
      name={name}
      className={styles.dataSearch + " " + className}
      required={false}
      label={label}
      placeholder={textButton + "..."}
      onKeyDown={handleKeyDown}
      value={searchBy}
      style={{ backgroundColor: "var(--cBlackV1" }}
      onChange={onChange}
      iconLeft={
        !value ? (
          <IconSearch
            size={24}
            color={"var(--cWhiteV1)"}
            style={{ marginRight: "var(--spS)" }}
          />
        ) : (
          <IconX
            onClick={() => onSearch("")}
            color={"var(--cWhiteV1)"}
            className="error"
          />
        )
      }
      iconRight={
        searchBy && (
          <Button variant="primary" onClick={() => onSearch()}>
            {textButton}
          </Button>
        )
      }
    />
  );
};

export default DataSearch;
