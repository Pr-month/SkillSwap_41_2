import { dataSource } from 'src/config/database.config';

const tables = ['users', 'categories', 'cities', 'skills'];

async function cleanDb() {
  try {
    await dataSource.initialize();
    console.log('Очистка базы данных...');

    // удалить все записи + сбросить id sequence
    await dataSource.query(`
      TRUNCATE TABLE ${tables.join(', ')}
      RESTART IDENTITY
      CASCADE;
    `);

    console.log('✅ База данных очищена');
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

cleanDb().catch((error) => {
  console.error('❌ Ошибка при очистке базы данных:', error);
});
