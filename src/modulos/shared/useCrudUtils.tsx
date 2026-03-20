"use client";
import {
  IconEdit,
  IconFilter,
  IconImport,
  IconSearch,
  IconTrash,
} from "@/components/layout/icons/IconsBiblioteca";
import DataSearch from "@/mk/components/forms/DataSearch/DataSearch";
import { useEffect, useState } from "react";

type PropsType = {
  onSearch: Function;
  searchs: Record<string, any>;
  setStore: Function;
  mod: Record<string, any>;
  onEdit: Function;
  onDel: Function;
  title?: string;
};

type ResultPropsType = {
  onLongPress: Function;
  right: Function;
  customTitle: Function;
  selItem: any;
  setSelItem: Function;
  searchState: number;
  setSearchState: Function;
};

const useCrudUtils = ({
  onSearch,
  searchs,
  setStore,
  mod,
  onEdit,
  onDel,
  title = "",
}: PropsType): ResultPropsType => {
  const [searchState, setSearchState] = useState(0);
  const [clearSearch, setClearSearch] = useState(false);
  const capitalizeFirstLetter = (str: any) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };
  useEffect(() => {
    if (searchState == 1 && searchs?.searchBy == "" && clearSearch) {
      setClearSearch(false);
      setSearchState(0);
      return;
    }
    if (searchs.searchBy) setClearSearch(true);

    setStore({
      title:
        searchState == 0
          ? title
            ? title
            : capitalizeFirstLetter(mod.plural)
          : "Acciones",
      right,
      customTitle,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchState, searchs.searchBy]);

  const right = () => {
    if (searchState == 0)
      return (
        <div style={{ display: "flex", gap: "12px" }}>
          <IconSearch
            onClick={() => {
              setSearchState(1);
            }}
          />
          {mod.import && (
            <IconImport
              onClick={() => {
                setSearchState(3);
              }}
            />
          )}
        </div>
      );
    if (searchState == 1)
      return <IconFilter onClick={() => setSearchState(0)} />;

    if (searchState == 2)
      return (
        <div style={{ display: "flex", gap: "12px" }}>
          <IconEdit
            onClick={() => {
              onEdit({ ...selItem });
              setSelItem(null);
              setSearchState(0);
            }}
          />
          <IconTrash
            onClick={() => {
              onDel({ ...selItem });
              setSelItem(null);
              setSearchState(0);
            }}
          />
        </div>
      );
  };

  const customTitle = () => {
    if (searchState == 1)
      return (
        <DataSearch
          name="search"
          setSearch={onSearch}
          value={searchs.searchBy || ""}
        />
      );
    return null;
  };
  const [selItem, setSelItem]: any = useState(null);
  const onLongPress = (item: any) => {
    setSelItem(item);
    setSearchState(2);
  };

  return {
    onLongPress,
    right,
    customTitle,
    selItem,
    setSelItem,
    searchState,
    setSearchState,
  };
};

export default useCrudUtils;
