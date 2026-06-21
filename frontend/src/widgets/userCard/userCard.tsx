import { Skill } from '@/shared/ui/skill/skill.tsx';
import styles from './userCard.module.css';
import { Button } from '@/shared/ui/button/button';
import { calculateAge } from '@/shared/lib/helpers/data';
import { User } from '@/entities/user/model/types';
import { useDispatch, useSelector } from '@/services/store/store';
import { selectIsLiked } from '@/services/selectors/likeSelectors';
import { toggleLike } from '@/services/slices/likeSlice';
import { useNavigate } from 'react-router-dom';
import { useExchange } from '@/shared/hooks/useExchange';

type UserCardProps = User & {
  showLike?: boolean;
  showDescription?: boolean;
  showDetails?: boolean;
};

export const UserCard: React.FC<UserCardProps> = ({
  id,
  name,
  about,
  birthdate,
  city,
  avatar,
  skills,
  // favoriteSkills, // лайки
  wantToLearn,
  showLike = true,
  showDescription = false,
  showDetails = true,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { hasSentRequest } = useExchange();
  const alreadyRequested = hasSentRequest(id);
  const learnSkill = wantToLearn.slice(0, 2);
  const moreSkills = wantToLearn.length - learnSkill.length;
  const primarySkillId = skills?.[0]?.id;
  const isLiked = useSelector(state =>
    primarySkillId !== undefined ? selectIsLiked(state, primarySkillId) : false,
  );

  const handleLikeClick = () => {
    if (primarySkillId !== undefined) {
      dispatch(toggleLike(primarySkillId));
    }
  };

  const openProfile = () => {
    navigate(`/skill/${id}`);
  };

  const imageUrl =
    typeof avatar === 'string'
      ? avatar.startsWith('http')
        ? avatar
        : `${import.meta.env.VITE_SKILLSWAP_API_URL}/${avatar}`
      : undefined;

  return (
    <div className={styles.cardContainer}>
      <div className={styles.headerCard}>
        <img src={imageUrl} alt={`Avatar ${name}`} className={styles.image} />
        {showLike && primarySkillId !== undefined && (
          <div className={styles.cardLike}>
            <button
              type="button"
              aria-label={isLiked ? 'Убрать лайк' : 'Поставить лайк'}
              onClick={handleLikeClick}
              className={`${styles.likeButton} ${isLiked ? styles.likeButtonActive : ''}`}
            />
          </div>
        )}
        <div className={styles.userInfo}>
          <p className={styles.userName}>{name}</p>
          <p
            className={styles.userCityAndAge}
          >{`${city ? city.name : 'бомж'}, ${calculateAge(birthdate)}`}</p>
        </div>
      </div>
      <div className={styles.bodyCard}>
        {showDescription && <p className={styles.description}>{about}</p>}
        <div className={styles.teach}>
          <p className={styles.pointCard}>Может научить:</p>
          <div className={styles.skills}>
            {skills &&
              skills.map((skill, index) => (
                <Skill key={index} type={skill.category?.parentSlug}>
                  {skill.title}
                </Skill>
              ))}
          </div>
        </div>
        <div className={styles.teach}>
          <p className={styles.pointCard}>Хочет научиться:</p>
          <div className={styles.skills}>
            {learnSkill &&
              learnSkill.map((category, index) => (
                <Skill key={index} type={category.parentSlug}>
                  {category.name}
                </Skill>
              ))}
            {wantToLearn.length > 2 && (
              <Skill type={'other'}>{`+ ${moreSkills}`}</Skill>
            )}
          </div>
        </div>
      </div>
      {showDetails &&
        (alreadyRequested ? (
          <Button onClick={openProfile} type="secondary">
            <span className={styles.contentClock}>
              <div className={styles.clock} />
              <span>Обмен предложен</span>
            </span>
          </Button>
        ) : (
          <Button onClick={openProfile} type="primary">
            Подробнее
          </Button>
        ))}
    </div>
  );
};
