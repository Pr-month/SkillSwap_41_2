import { userSliceSelectors } from '@/services/slices/authSlice';
import { useSelector, useDispatch } from '@/services/store/store';
import { toggleLike } from '@/services/slices/likeSlice';
import { selectLikedItems } from '@/services/selectors/likeSelectors';
import { Button } from '@/shared/ui/button/button';
import { useNavigate } from 'react-router-dom';
import styles from './ProfileFavorites.module.css';
import { Skill } from '@/entities/skill/model/types';

function FavoriteSkillItem({ skill }: { skill: Skill }) {
  const dispatch = useDispatch();

  const handleRemove = () => {
    dispatch(toggleLike(skill.id));
  };

  return (
    <div className={styles.skillItem}>
      <span className={styles.skillTitle}>{skill.title}</span>
      <button
        className={styles.removeButton}
        onClick={handleRemove}
        aria-label={`Убрать ${skill.title} из избранного`}
      >
        ✕
      </button>
    </div>
  );
}

export function ProfileFavorites() {
  const user = useSelector(userSliceSelectors.selectUser);
  const likedItems = useSelector(selectLikedItems);
  const navigate = useNavigate();

  const allFavorites = user?.favoriteSkills ?? [];
  const hasLoadedLikes = Object.keys(likedItems).length > 0;
  const favoriteSkills = hasLoadedLikes
    ? allFavorites.filter(skill => likedItems[skill.id])
    : allFavorites;

  if (favoriteSkills.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <p className={styles.emptyText}>К сожалению, на данный момент, избранных обменов нет</p>
        <Button type="primary" onClick={() => navigate('/')}>
          На главную
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {favoriteSkills.map(skill => (
        <FavoriteSkillItem key={skill.id} skill={skill} />
      ))}
    </div>
  );
}
