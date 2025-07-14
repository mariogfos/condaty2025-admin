'use client';
import { useEffect, useState } from 'react';
import Input from '../Input/Input';
import {
  IconSearch,
  IconX,
} from '../../../../components/layout/icons/IconsBiblioteca';
// import Button from "../Button/Button";
import styles from './dataSearch.module.css';
import { PropsTypeInputBase } from '../ControlLabel';
import idioma from '@/mk/utils/traductor/es';

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
    <div style={{ position: 'relative' }}>
      <Input
        name={name}
        className={styles.dataSearch + ' ' + className}
        required={false}
        label={label}
        placeholder={textButton + '...'}
        onKeyDown={handleKeyDown}
        value={searchBy}
        onChange={onChange}
        iconLeft={
          !value && !searchBy ? (
            <IconSearch
              size={24}
              color={'var(--cWhiteV1)'}
              style={{ marginRight: 'var(--spS)' }}
            />
          ) : (
            <IconX
              onClick={() => onSearch('')}
              color={'var(--cWhiteV1)'}
              className="error"
            />
          )
        }
        iconRight={
          searchBy && (
            // <Button variant="primary" onClick={() => onSearch()}>
            //   {textButton}
            // </Button>
            <div
              onClick={() => onSearch()}
              style={{
                backgroundColor: 'var(--cPrimary)',
                padding: 4,
                borderRadius: '100%',
                display: 'flex',
                marginRight: 8,
              }}
            >
              <IconSearch color="var(--cBlack)" />
            </div>
          )
        }
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 200)}
        autoComplete="off"
      />
      {focused && searchMsg && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 40,
            background: 'rgba(0,0,0,0.85)',
            color: 'var(--cWhite)',
            padding: 8,
            borderRadius: 8,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            zIndex: 10,
            minWidth: 250,
            fontSize: 13,
            marginTop: 4,
          }}
        >
          {searchMsg}
        </div>
      )}
    </div>
  );
};

export default DataSearch;
