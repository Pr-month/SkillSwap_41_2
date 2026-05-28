import { Skill } from 'src/skills/entities/skill.entity';

export const seedTestSkills: Partial<Skill>[] = [
  {
    title: 'NestJS Framework',
    description: 'Advanced backend development with TypeScript and Node.js',
    images: ['https://nestjs.com/img/logo-small.svg'],
  },
  {
    title: 'React & Redux Toolkit',
    description: 'Building scalable SPA with modern state management',
    images: ['https://reactjs.org/logo-og.png'],
  },
  {
    title: 'Docker & Kubernetes',
    description: 'Containerization and orchestration',
    images: [],
  },
  {
    title: 'PostgreSQL & TypeORM',
    description: 'Complex relations and query optimization',
    images: [],
  },
];

interface SeedCreateSkills {
  id: number;
  title: string;
  description: string;
  images: string[];
  category: { name: string };
}

export const seedTestSkillsExtended: Partial<SeedCreateSkills>[] = [
  {
    id: 1,
    title: 'Создание эффективных рекламных кампаний',
    description: 'Научим запускать рекламу, которая действительно продает',
    images: [
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71',
      'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5',
      'https://images.unsplash.com/photo-1551434678-e076c223a692',
    ],
    category: { name: 'Маркетинг и реклама' },
  },
  {
    id: 2,
    title: 'Портретная фотография',
    description: 'Основы композиции и работы со светом',
    images: [
      'https://images.unsplash.com/photo-1502982720700-bfff97f2ecac',
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f',
    ],
    category: { name: 'Фотография' },
  },
  {
    id: 3,
    title: 'Подготовка к IELTS',
    description: 'Эффективные стратегии для успешной сдачи экзамена',
    images: [
      'https://images.unsplash.com/photo-1523050854058-8df90110c9f1',
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f',
    ],
    category: { name: 'Английский язык' },
  },
  {
    id: 4,
    title: 'Планирование ремонта квартиры',
    description: 'От концепции до реализации',
    images: [
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb',
      'https://images.unsplash.com/photo-1513694203232-719a280e022f',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267',
    ],
    category: { name: 'Ремонт' },
  },
  {
    id: 5,
    title: 'Хатха-йога для начинающих',
    description: 'Базовые асаны и принципы правильного дыхания',
    images: [
      'https://images.unsplash.com/photo-1545205597-3d9d02c29597',
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b',
      'https://images.unsplash.com/photo-1518611012118-696072aa579a',
    ],
    category: { name: 'Йога и медитация' },
  },
  {
    id: 6,
    title: 'Создание личного бренда в финансах',
    description: 'Как стать узнаваемым экспертом',
    images: [
      'https://images.unsplash.com/photo-1450101499163-c8848c66ca85',
      'https://images.unsplash.com/photo-1554224155-6726b3ff858f',
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f',
    ],
    category: { name: 'Личный бренд' },
  },
  {
    id: 7,
    title: 'Основы итальянской кухни',
    description: 'Паста, ризотто и тирамису как в Италии',
    images: [
      'https://images.unsplash.com/photo-1551183053-bf91a1d81141',
      'https://images.unsplash.com/photo-1490645935967-10de6ba17061',
      'https://images.unsplash.com/photo-1533134242443-d4fd215305ad',
    ],
    category: { name: 'Приготовление еды' },
  },
  {
    id: 8,
    title: 'Профессиональный монтаж в Premiere Pro',
    description: 'От базовых принципов до продвинутых техник',
    images: [
      'https://images.unsplash.com/photo-1551190822-a9333d879b1f',
      'https://images.unsplash.com/photo-1581094794329-c8112a89af12',
    ],
    category: { name: 'UX/UI' },
  },
  {
    id: 9,
    title: 'Коучинг для карьерного роста',
    description: 'Определение целей и составление плана развития',
    images: [
      'https://images.unsplash.com/photo-1542744173-8e7e53415bb0',
      'https://images.unsplash.com/photo-1521791136064-7986c2920216',
    ],
    category: { name: 'Управление командой' },
  },
  {
    id: 10,
    title: 'Ремонт бытовой техники своими руками',
    description: 'Основные неисправности и их устранение',
    images: [
      'https://images.unsplash.com/photo-1556740738-b6a63e27c4df',
      'https://images.unsplash.com/photo-1581093450021-4a7360e9a7c8',
      'https://images.unsplash.com/photo-1581094794329-c8112a89af12',
    ],
    category: { name: 'Ремонт' },
  },
  {
    id: 11,
    title: 'Основы цифровой иллюстрации',
    description: 'Работа в Procreate и Photoshop',
    images: [
      'https://images.unsplash.com/photo-1541963463532-d68292c34b19',
      'https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1',
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32',
    ],
    category: { name: 'Рисование и иллюстрация' },
  },
  {
    id: 12,
    title: 'Цигун для начинающих',
    description: 'Древние практики для здоровья и энергии',
    images: [
      'https://images.unsplash.com/photo-1545389336-cf090694435e',
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b',
    ],
    category: { name: 'Цигун и тайцзи' },
  },
  {
    id: 13,
    title: 'Как пройти собеседование',
    description: 'Подготовка к вопросам и самопрезентация',
    images: [
      'https://images.unsplash.com/photo-1556740738-b6a63e27c4df',
      'https://images.unsplash.com/photo-1450101499163-c8848c66ca85',
    ],
    category: { name: 'Резюме и собеседование' },
  },
  {
    id: 14,
    title: 'Личный финансовый план',
    description: 'Как управлять бюджетом и накапливать сбережения',
    images: [
      'https://images.unsplash.com/photo-1554224155-6726b3ff858f',
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f',
      'https://images.unsplash.com/photo-1450101499163-c8848c66ca85',
    ],
    category: { name: 'Личная финансовая грамотность' },
  },
  {
    id: 15,
    title: 'Метод КонМари в организации дома',
    description: 'Как навести порядок раз и навсегда',
    images: [
      'https://images.unsplash.com/photo-1484154218962-a197022b5858',
      'https://images.unsplash.com/photo-1513694203232-719a280e022f',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267',
    ],
    category: { name: 'Уборка и организация' },
  },
  {
    id: 16,
    title: 'Функциональный тренинг для всех уровней',
    description: 'Сила, выносливость и мобильность',
    images: [
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b',
      'https://images.unsplash.com/photo-1538805060514-97d9cc17730c',
      'https://images.unsplash.com/photo-1518611012118-696072aa579a',
    ],
    category: { name: 'Функциональный тренинг' },
  },
  {
    id: 17,
    title: 'Разговорный французский с нуля',
    description: 'Грамматика, лексика и произношение',
    images: [
      'https://images.unsplash.com/photo-1503917988258-f87a78e3c995',
      'https://images.unsplash.com/photo-1495147466023-ac5c588e2e94',
    ],
    category: { name: 'Французский язык' },
  },
  {
    id: 18,
    title: 'Собеседование в IT-компаниях',
    description: 'Как пройти техническое интервью',
    images: [
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71',
      'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5',
    ],
    category: { name: 'Резюме и собеседование' },
  },
  {
    id: 19,
    title: 'Сбалансированное питание для занятых',
    description: 'Простые и полезные рецепты',
    images: [
      'https://images.unsplash.com/photo-1490645935967-10de6ba17061',
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd',
    ],
    category: { name: 'Приготовление еды' },
  },
  {
    id: 20,
    title: 'Основы звукозаписи дома',
    description: 'Оборудование и программное обеспечение',
    images: [
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4',
      'https://images.unsplash.com/photo-1517230878961-549a6a04fec7',
    ],
    category: { name: 'Звукорежиссура' },
  },
  {
    id: 21,
    title: 'Техники скорочтения для работы',
    description: 'Увеличиваем скорость чтения без потери понимания',
    images: [
      'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6',
      'https://images.unsplash.com/photo-1544947950-fa07a98d237f',
    ],
    category: { name: 'Скорочтение' },
  },
  {
    id: 22,
    title: 'Уход за орхидеями и суккулентами',
    description: 'Как не убить даже кактус',
    images: [
      'https://images.unsplash.com/photo-1485955900006-10f4d324d411',
      'https://images.unsplash.com/photo-1517191434949-5e90cd67d2b6',
      'https://images.unsplash.com/photo-1526397751294-331021109fbd',
    ],
    category: { name: 'Домашние растения' },
  },
  {
    id: 23,
    title: 'Постановка целей по SMART',
    description: 'Как ставить и достигать любые цели',
    images: [
      'https://images.unsplash.com/photo-1521791136064-7986c2920216',
      'https://images.unsplash.com/photo-1542744173-8e7e53415bb0',
    ],
    category: { name: 'Тайм-менеджмент' },
  },
  {
    id: 24,
    title: 'Основы миксологии для дома',
    description: 'Классические и авторские коктейли',
    images: [
      'https://images.unsplash.com/photo-1551751299-1b51cab2694c',
      'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b',
      'https://images.unsplash.com/photo-1536935338-878bb8469981813',
    ],
    category: { name: 'Миксология' },
  },
  {
    id: 25,
    title: 'Японский для начинающих',
    description: 'Иероглифы, грамматика и разговорная практика',
    images: [
      'https://images.unsplash.com/photo-1528164344705-47542687000d',
      'https://images.unsplash.com/photo-1492571350019-22de08371fd3',
    ],
    category: { name: 'Японский язык' },
  },
  {
    id: 26,
    title: 'Ремонт компьютеров своими руками',
    description: 'Диагностика и замена комплектующих',
    images: [
      'https://images.unsplash.com/photo-1581093450021-4a7360e9a7c8',
      'https://images.unsplash.com/photo-1581094794329-c8112a89af12',
    ],
    category: { name: 'Ремонт' },
  },
  {
    id: 27,
    title: 'Развитие эмоционального интеллекта у детей',
    description: 'Практические упражнения и игры',
    images: [
      'https://images.unsplash.com/photo-1542744173-8e7e53415bb0',
      'https://images.unsplash.com/photo-1521791136064-7986c2920216',
    ],
    category: { name: 'Детская психология' },
  },
  {
    id: 28,
    title: 'Реставрация старой мебели',
    description: 'От простого обновления до сложного ремонта',
    images: [
      'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6',
      'https://images.unsplash.com/photo-1583845112203-29329902330b',
      'https://images.unsplash.com/photo-1592078615290-033ee584e267',
    ],
    category: { name: 'Ремонт' },
  },
  {
    id: 29,
    title: 'Испанский для путешествий',
    description: 'Базовые фразы и грамматика',
    images: [
      'https://images.unsplash.com/photo-1503917988258-f87a78e3c995',
      'https://images.unsplash.com/photo-1495147466023-ac5c588e2e94',
    ],
    category: { name: 'Испанский язык' },
  },
  {
    id: 30,
    title: 'Основы китайской каллиграфии',
    description: 'Традиционные техники и материалы',
    images: ['https://images.unsplash.com/photo-1534945773093-1119d31a2f2c'],
    category: { name: 'Каллиграфия' },
  },
  {
    id: 31,
    title: 'Интуитивное питание без диет',
    description: 'Как наладить гармоничные отношения с едой',
    images: [
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd',
    ],
    category: { name: 'Интуитивное питание' },
  },
  {
    id: 32,
    title: 'Метод Pomodoro в работе',
    description: 'Как успевать больше без переутомления',
    images: [
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40',
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71',
    ],
    category: { name: 'Тайм-менеджмент' },
  },
  {
    id: 33,
    title: 'Создание букетов в европейском стиле',
    description: 'Композиции из свежих цветов',
    images: [
      'https://images.unsplash.com/photo-1526397751294-331021109fbd',
      'https://images.unsplash.com/photo-1517191434949-5e90cd67d2b6',
      'https://images.unsplash.com/photo-1485955900006-10f4d324d411',
    ],
    category: { name: 'Флористика' },
  },
  {
    id: 34,
    title: 'Тренировки с собственным весом',
    description: 'Эффективные упражнения без оборудования',
    images: [
      'https://images.unsplash.com/photo-1538805060514-97d9cc17730c',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b',
    ],
    category: { name: 'Calisthenics' },
  },
  {
    id: 35,
    title: 'Основы сценической речи',
    description: 'Дыхание, дикция и выразительность',
    images: [
      'https://images.unsplash.com/photo-1494972308805-463bc619d34e',
      'https://images.unsplash.com/photo-1547153760-18fc86324498',
    ],
    category: { name: 'Сценическая речь' },
  },
  {
    id: 36,
    title: 'Немецкий для работы',
    description: 'Деловая переписка и переговоры',
    images: [
      'https://images.unsplash.com/photo-1503917988258-f87a78e3c995',
      'https://images.unsplash.com/photo-1495147466023-ac5c588e2e94',
    ],
    category: { name: 'Немецкий язык' },
  },
  {
    id: 37,
    title: 'Рисование как терапия',
    description: 'Снятие стресса через творчество',
    images: [
      'https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1',
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32',
    ],
    category: { name: 'Арт-терапия' },
  },
  {
    id: 38,
    title: 'Основы Figma для начинающих',
    description: 'Создание прототипов и макетов',
    images: [
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71',
      'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5',
    ],
    category: { name: 'UX/UI' },
  },
  {
    id: 39,
    title: 'Ремонт стиральных машин',
    description: 'Основные неисправности и их устранение',
    images: [
      'https://images.unsplash.com/photo-1556740738-b6a63e27c4df',
      'https://images.unsplash.com/photo-1581093450021-4a7360e9a7c8',
    ],
    category: { name: 'Ремонт' },
  },
  {
    id: 40,
    title: 'Ментальная арифметика для взрослых',
    description: 'Развитие скорости мышления и памяти',
    images: [
      'https://images.unsplash.com/photo-1542744173-8e7e53415bb0',
      'https://images.unsplash.com/photo-1521791136064-7986c2920216',
    ],
    category: { name: 'Ментальная арифметика' },
  },
  {
    id: 41,
    title: 'Пейзажная и travel-фотография',
    description: 'Композиция и работа с естественным светом',
    images: [
      'https://images.unsplash.com/photo-1502982720700-bfff97f2ecac',
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f',
    ],
    category: { name: 'Фотография' },
  },
  {
    id: 42,
    title: 'Китайский для бизнеса',
    description: 'Деловой этикет и переговоры',
    images: [
      'https://images.unsplash.com/photo-1528164344705-47542687000d',
      'https://images.unsplash.com/photo-1492571350019-22de08371fd3',
    ],
    category: { name: 'Китайский язык' },
  },
  {
    id: 43,
    title: 'Ремонт смартфонов своими руками',
    description: 'Замена экранов и батарей',
    images: [
      'https://images.unsplash.com/photo-1581094794329-c8112a89af12',
      'https://images.unsplash.com/photo-1581093450021-4a7360e9a7c8',
    ],
    category: { name: 'Ремонт' },
  },
  {
    id: 44,
    title: 'Построение гармоничных отношений',
    description: 'Коммуникация и эмоциональный интеллект',
    images: [
      'https://images.unsplash.com/photo-1542744173-8e7e53415bb0',
      'https://images.unsplash.com/photo-1521791136064-7986c2920216',
    ],
    category: { name: 'Психология отношений' },
  },
  {
    id: 45,
    title: 'Искусство винных пар',
    description: 'Как сочетать вино с едой',
    images: [
      'https://images.unsplash.com/photo-1551751299-1b51cab2694c',
      'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b',
    ],
    category: { name: 'Винная культура' },
  },
  {
    id: 46,
    title: 'Акварельная живопись для начинающих',
    description: 'Техники и материалы',
    images: [
      'https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1',
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32',
    ],
    category: { name: 'Рисование и иллюстрация' },
  },
  {
    id: 47,
    title: 'Инвестиции для начинающих',
    description: 'Как начать с маленьких сумм',
    images: [
      'https://images.unsplash.com/photo-1554224155-6726b3ff858f',
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f',
    ],
    category: { name: 'Инвестиции' },
  },
  {
    id: 48,
    title: 'Изготовление мебели своими руками',
    description: 'От простых полок до сложных конструкций',
    images: [
      'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6',
      'https://images.unsplash.com/photo-1583845112203-29329902330b',
      'https://images.unsplash.com/photo-1592078615290-033ee584e267',
    ],
    category: { name: 'Ремонт' },
  },
];
