import React from 'react';
import { FiltersPanel } from '@/widgets/filters-panel/filtersPanel';
import styles from './catalogPage.module.css';
import { cities } from '@/shared/lib/cities';
import SelectedFilters from '@/shared/ui/selectedFilters/selectedFilters';
import Catalog from '@/widgets/catalog/catalog';
import RequestPanel from '@/widgets/requestPanel/requestPanel';
import { useSelector } from '@/services/store/store';
import { userSliceSelectors } from '@/services/slices/authSlice';
import { getCategoriesSelector } from '@/services/slices/categorySlice';

export const CatalogPage: React.FC = () => {
  // Получаем данные пользователя из Redux
  const user = useSelector(userSliceSelectors.selectUser);

  const categories = useSelector(getCategoriesSelector);

  const mappingCategories = Object.fromEntries(
    categories.map(category => [category.name, category.subCategory.map(sub => sub.name)]),
  );

  // isAuthenticated = true, если user не null
  const isAuthenticated = Boolean(user);

  return (
    <div className={styles.filtersPage}>
      <div className={styles.filtersPanelPontainer}>
        <FiltersPanel skillsCategories={mappingCategories} cities={cities} />
        {isAuthenticated && <RequestPanel />}
      </div>

      <div className={styles.filtersGrid}>
        <SelectedFilters />
        <Catalog isAuthenticated={isAuthenticated} isFiltered={false} />
      </div>
    </div>
  );
};
