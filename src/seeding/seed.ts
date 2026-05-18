import { execSync } from 'child_process';

const run = (script: string) => {
  console.log(`\n▶ Running: ${script}`);
  execSync(`ts-node -r tsconfig-paths/register ${script}`, {
    stdio: 'inherit',
    env: process.env,
  });
};

async function master() {
  run('src/seeding/create-test-db.ts');
  run('src/seeding/clean-db.ts');
  run('src/seeding/admin.seed.ts');
  run('src/seeding/categories.seed.ts');
  run('src/seeding/cities.seed.ts');
  run('src/seeding/seed-test-users.ts');
  run('src/seeding/seed-test-skills.ts');

  await Promise.resolve();

  console.log('\n✅ Master seeding finished');
}

master().catch((err) => {
  console.error('Master seeding failed:', err);
  process.exit(1);
});
