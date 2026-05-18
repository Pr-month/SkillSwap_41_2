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
