'use client';
import { useEffect, useState } from 'react';
import Input from '../Input/Input';
import {
  IconSearch,
  IconX,
} from '../../../../components/layout/icons/IconsBiblioteca';
// import Button from "../Button/Button";
import styles from "./dataSearch.module.css";
import { PropsTypeInputBase } from "../ControlLabel";
import idioma from "@/mk/utils/traductor/es";
import Tooltip from "../../ui/Tooltip/Tooltip";

interface PropsType extends PropsTypeInputBase {
  setSearch: Function;
  textButton?: string;
  searchMsg?: string; // Nuevo prop
}

const DataSearch = ({
  setSearch,
  name,
  value,
  label = '',
  textButton = idioma.search,
  className = '',
  searchMsg = '', // Nuevo prop
}: PropsType) => {
  const [searchBy, setSearchBy] = useState('');
  const [oldSearch, setOldSearch] = useState('');
  const [focused, setFocused] = useState(false); // Nuevo estado

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
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <Tooltip title={searchMsg} fullWidth={true}>
        <Input
          name={name}
          className={styles.dataSearch + " " + className}
          required={false}
          label={label}
          placeholder={textButton + "..."}
          onKeyDown={handleKeyDown}
          value={searchBy}
          onChange={onChange}
          iconLeft={
            !value && !searchBy ? (
              <IconSearch
                // size={24}
                color={"var(--cWhiteV1)"}
                style={{ marginRight: "var(--spS)" }}
              />
            ) : (
              <div onClick={() => onSearch("")} style={{ cursor: "pointer" }}>
                <IconX color={"var(--cWhiteV1)"} className="error" />
              </div>
            )
          }
          iconRight={
            searchBy && (
              <div
                onClick={() => onSearch()}
                style={{
                  backgroundColor: "var(--cPrimary)",
                  padding: "4px",
                  borderRadius: "100%",
                  display: "flex",
                  marginRight: "8px",
                  // width: "22px",
                  // height: "22px",
                  alignItems: "center",
                  justifyContent: "center",
                  boxSizing: "border-box",
                  cursor: "pointer",
                }}
              >
                <IconSearch
                  color="var(--cBlack)"
                  size={16}
                  // style={{ boxSizing: "content-box }}
                />
              </div>
            )
          }
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          autoComplete="off"
        />
      </Tooltip>
      {/* {focused && searchMsg && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '-8px',
            transform: 'translate(-50%, -100%)',
            fontSize: 14,
            zIndex: 9999,
            textAlign: 'end',
            marginTop: 0,
          }}
        >
          <span />
        </Tooltip>
      )}
          {searchMsg}
        </div>
      )} */}
    </div>
  );
};

export default DataSearch;
