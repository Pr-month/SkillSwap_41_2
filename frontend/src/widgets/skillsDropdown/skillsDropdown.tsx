import { useEffect, useState, forwardRef } from 'react';
import { skillsMapping } from '@/shared/lib/categories';
import styles from './skillsDropdown.module.css';
import { useSelector } from '@/services/store/store';
import { getCategoriesSelector } from '@/services/slices/categorySlice';

interface SkillsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SkillsDropdown = forwardRef<HTMLDivElement, SkillsDropdownProps>(({ isOpen }, ref) => {
  const [isMobile, setIsMobile] = useState(false);

  const categories = useSelector(getCategoriesSelector);

  const mapCategories = categories.map(category => ({
    id: category.id,
    slug: category.slug,
    name: category.name,
    subcategories: category.subCategory.map(sub => sub.name),
  }));

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isOpen) return null;

  const renderCategory = (
    skillscategory: string,
    subcategories: string[],
    iconPath?: string,
    bgColor?: string,
  ) => (
    <div className={styles.skillscategory} key={skillscategory}>
      <div className={styles.skillscategoryHeader}>
        <div className={styles.icon} style={{ backgroundColor: bgColor }}>
          <div
            className={styles.iconMask}
            style={{
              maskImage: `url(${iconPath})`,
              WebkitMaskImage: `url(${iconPath})`,
            }}
          />
        </div>
        <div className={styles.categoryContent}>
          <h3 className={styles.categoryTitle}>{skillscategory}</h3>
          <div className={styles.subcategories}>
            {subcategories?.map(sub => (
              <div key={sub} className={styles.subcategory}>
                {sub}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const firstColumnCategories = [mapCategories[0], mapCategories[2], mapCategories[4]];
  const secondColumnCategories = [mapCategories[1], mapCategories[5], mapCategories[6]];

  return (
    <div ref={ref} className={styles.skillsDropdown}>
      <div className={styles.skillsdropdownContent}>
        {!isMobile && (
          <>
            <div className={styles.skillscolumn}>
              {firstColumnCategories.map(category => {
                const { color, icon } = skillsMapping[category.slug];
                return renderCategory(category.name, category.subcategories, icon, color);
              })}
            </div>
            <div className={styles.skillscolumn}>
              {secondColumnCategories.map(category => {
                const { color, icon } = skillsMapping[category.slug];
                return renderCategory(category.name, category.subcategories, icon, color);
              })}
            </div>
          </>
        )}
        {isMobile && (
          <div className={styles.skillscolumn}>
            {mapCategories.map(category => {
              const { color, icon } = skillsMapping[category.id];

              return renderCategory(category.name, category.subcategories, icon, color);
            })}
          </div>
        )}
      </div>
    </div>
  );
});

SkillsDropdown.displayName = 'SkillsDropdown';
