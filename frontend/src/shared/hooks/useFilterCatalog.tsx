import { createSelector } from '@reduxjs/toolkit';
import { useSelector } from 'react-redux';
import { RootState } from '@/services/store/store';

// Приведение текста к нужному формату для поиска
const cleanStringForSearch = (str: string): string => {
  if (!str) return '';
  return str
    .normalize('NFD') // Разбивает акцентированные символы
    .replace(/[\u0300-\u036f]/g, '') // Удаляет диакритические знаки
    .replace(/[^\p{L}\p{N}\s]/gu, '') // Удаляет все спецсимволы
    .toLowerCase() // Переводит в нижний регистр
    .trim(); // Удаляет пробелы с обоих концов строки
};

// Селектор для мемоизированной фильтрации (может использоваться вне компонентов)
export const selectFilteredUsers = createSelector(
  [
    (state: RootState) => state.catalog.users,
    (state: RootState) => state.filters,
    (state: RootState) => state.catalog.searchQuery,
  ],
  (users, filters, searchQuery) => {
    const normalizedQuery = cleanStringForSearch(searchQuery);

    return users.filter(user => {
      // 1. Фильтрация по полу
      if (filters.gender !== 'other' && user.gender !== filters.gender) return false;

      // 2. Фильтрация по городам
      if (filters.city.length > 0 && !filters.city.includes(user.city.name)) return false;

      // 3. Поиск по названию навыка
      let foundInCanTeach = false;
      let foundInWantsToLearn = false;

      if (normalizedQuery) {
        foundInCanTeach = user.skills.some(skill =>
          cleanStringForSearch(skill.title).includes(normalizedQuery),
        );
        foundInWantsToLearn = user.wantToLearn.some(item =>
          cleanStringForSearch(item.name).includes(normalizedQuery),
        );

        // Если есть поисковый запрос и нет совпадений - исключаем
        if (!foundInCanTeach && !foundInWantsToLearn) return false;
      }

      // 4. Фильтрация по режиму и подкатегориям
      switch (filters.mode) {
        case 'want-to-learn':
          // Должно быть совпадение в wantsToLearn И соответствие подкатегориям
          if (normalizedQuery && !foundInWantsToLearn) return false;

          if (filters.skill.length === 0) return true;
          return user.wantToLearn.some(
            category => filters.skill.includes(category.name),
          );

        case 'can-teach':
          // Должно быть совпадение в canTeach И соответствие подкатегориям
          if (normalizedQuery && !foundInCanTeach) return false;

          if (filters.skill.length === 0) return true;
          return user.skills.some(skill => filters.skill.includes(skill.category.parentSlug || ''))
          ;

        case 'all':
        default:
          // Должно быть совпадение в любом поле И соответствие подкатегориям
          if (normalizedQuery && !foundInCanTeach && !foundInWantsToLearn) return false;
          if (filters.skill.length === 0) return true;

          const canTeachMatch = user.skills.some(skill =>
            filters.skill.includes(skill.category.parentSlug || ''),
          );
          const wantToLearnMatch = user.wantToLearn.some(category =>
            filters.skill.includes(category.name),
          );

          return canTeachMatch || wantToLearnMatch;
      }
    });
  },
);

// Хук для использования в компонентах
const useFilteredUsers = () => {
  return useSelector(selectFilteredUsers);
};

export default useFilteredUsers;
