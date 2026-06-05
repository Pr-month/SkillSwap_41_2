import styles from './SearchInput.module.css';
import { ChangeEvent } from 'react';

type SearchInputProps = {
  placeholder?: string;
  value: string;
  onSearch: (query: string) => void;
};

export const SearchInput = ({ placeholder, value, onSearch }: SearchInputProps) => {

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onSearch(e.target.value);
  };

  return (
    <div className={styles.searchContainer}>
      <div className={styles.searchIcon}></div>
      <input
        type="text"
        placeholder={placeholder}
        className={styles.input}
        value={value}
        onChange={handleChange}
      />
    </div>
  );
};
