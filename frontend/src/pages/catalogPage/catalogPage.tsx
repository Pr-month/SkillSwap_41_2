import { userSliceSelectors } from '@/services/slices/authSlice';
import { getCategoriesSelector } from '@/services/slices/categorySlice';
import { getCitiesSelector } from '@/services/slices/citiesSlice';
import { useSelector } from '@/services/store/store';
import SelectedFilters from '@/shared/ui/selectedFilters/selectedFilters';
import Catalog from '@/widgets/catalog/catalog';
import { FiltersPanel } from '@/widgets/filters-panel/filtersPanel';
import RequestPanel from '@/widgets/requestPanel/requestPanel';
import React from 'react';
import styles from './catalogPage.module.css';

export const CatalogPage: React.FC = () => {
  // Данные user из Redux
  const user = useSelector(userSliceSelectors.selectUser);

  const citiesFromStore = useSelector(getCitiesSelector);
  const cityNames = citiesFromStore.map(c => c.name);

  const categories = useSelector(getCategoriesSelector);

  const mappingCategories = Object.fromEntries(
    categories.map(category => [
      category.name,
      category.subCategory ? category.subCategory.map(sub => sub.name) : [],
    ]),
  );

  // isAuthenticated = true, если user не null
  const isAuthenticated = Boolean(user);

  return (
    <div className={styles.filtersPage}>
      <div className={styles.filtersPanelPontainer}>
        <FiltersPanel skillsCategories={mappingCategories} cities={cityNames} />
        {isAuthenticated && <RequestPanel />}
      </div>

      <div className={styles.filtersGrid}>
        <SelectedFilters />
        <Catalog isAuthenticated={isAuthenticated} isFiltered={false} />
      </div>
    </div>
  );
};
