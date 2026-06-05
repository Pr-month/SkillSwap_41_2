import { Link } from 'react-router-dom';
import { Logo } from '@/shared/ui/Logo/Logo';
import { SearchInput } from '@/shared/ui/SearchInput/SearchInput';
import { UserPanel } from '@/features/auth/ui/UserPanel/UserPanel';
import { GuestPanel } from '@/features/auth/ui/GuestPanel/GuestPanel';
import styles from './Header.module.css';
import { useState, useEffect, useRef } from 'react';
import { RootState, useDispatch, useSelector } from '@/services/store/store';
import { SkillsDropdown } from '@/widgets/skillsDropdown/skillsDropdown';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { searchSkills } from '@/services/thunk/skills.thunk';
import { Skill } from '@/entities/skill/model/types';
import { clearSkillSearch } from '@/services/slices/skillsSlice';

const MIN_SEARCH_LENGTH = 3;
const DEBOUNCE_DELAY = 300; // 300ms

export const Header = () => {
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light');
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();
  const [isSkillsDropdownOpen, setIsSkillsDropdownOpen] = useState(false);
  const skillsButtonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Локальное состояние для поиска
  const [query, setQuery] = useState('');
  const debouncedSearchValue = useDebounce(query, DEBOUNCE_DELAY);

  // Обработчик изменения поиска
  const handleSearch = (value: string) => {
    setQuery(value);
  };

  const { searchResults } = useSelector((state: RootState) => state.skills);

  // Эффект для поиска
  useEffect(() => {
    const trimmed = debouncedSearchValue?.trim();

    if (trimmed && trimmed.length >= MIN_SEARCH_LENGTH) {
      dispatch(searchSkills(trimmed));
    } else {
      dispatch(clearSkillSearch());
    }
  }, [debouncedSearchValue, dispatch]);

  const handleSelectSkill = (skill: Skill) => {
    setQuery(skill.title.toLowerCase());
    dispatch(clearSkillSearch());
  };

  const showDropdown =
  searchResults.length > 0 &&
  !(
    searchResults.length === 1 &&
    searchResults[0].title.toLowerCase() === query.trim().toLowerCase()
  );

  const toggleSkillsDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSkillsDropdownOpen(prev => !prev);
  };

  const closeSkillsDropdown = () => {
    setIsSkillsDropdownOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        skillsButtonRef.current &&
        !skillsButtonRef.current.contains(event.target as Node)
      ) {
        closeSkillsDropdown();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleTheme = () => {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setCurrentTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    localStorage.setItem('theme', newTheme);
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme || (systemPrefersDark ? 'dark' : 'light');

    setCurrentTheme(theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, []);

  return (
    <header className={`${styles.header} ${currentTheme === 'dark' ? styles.dark : ''}`}>
      <div className={styles.container}>
        <div className={styles.leftSection}>
          <Link to="/" className={styles.logoLink}>
            <Logo />
          </Link>
          <nav className={styles.allSkills}>
            <Link to="/about" className={styles.linkAbout}>
              О проекте
            </Link>
            <button
              type="button"
              ref={skillsButtonRef}
              className={`${styles.linkSkills} ${isSkillsDropdownOpen ? styles.active : ''}`}
              onClick={toggleSkillsDropdown}
              // aria-expanded={isSkillsDropdownOpen}
              aria-haspopup="menu"
            >
              Все навыки
              <span className={styles.chevronIcon} />
            </button>
            {isSkillsDropdownOpen && (
              <SkillsDropdown
                isOpen={isSkillsDropdownOpen}
                onClose={closeSkillsDropdown}
                ref={dropdownRef}
              />
            )}
          </nav>
        </div>

        <div className={styles.searchWrapper}>

          <SearchInput placeholder="Искать навык" onSearch={handleSearch} value={query} />

          {showDropdown && (
            <ul className={styles.searchDropdown}>
              {searchResults.map(skill => (
                <li key={skill.id} onClick={() => handleSelectSkill(skill)}>
                  {skill.title.toLowerCase()}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={styles.rightSection}>
          <button
            type="button"
            className={styles.themeToggle}
            onClick={toggleTheme}
            aria-label={
              currentTheme === 'dark' ? 'Переходи на светлую сторону' : 'Переходи на темную сторону'
            }
          >
            <span
              className={`${styles.themeIcon} ${
                currentTheme === 'dark' ? styles.sunIcon : styles.moonIcon
              }`}
            />
          </button>
          {isAuthenticated ? <UserPanel /> : <GuestPanel />}
        </div>
      </div>
    </header>
  );
};
