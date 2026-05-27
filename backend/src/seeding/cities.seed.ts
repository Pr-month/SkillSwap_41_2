import { City } from 'src/cities/entities/city.entity';
import { dataSource } from 'src/config/database.config';
import { citiesData } from './cities-data';
import { In } from 'typeorm';

export async function seedCities() {
  try {
    // Инициализация соединения (перенести в root-seed)
    await dataSource.initialize();

    // Получение репозитория
    const citiesRepository = dataSource.getRepository(City);

    const normalize = (str: string) =>
      str.trim().toLowerCase().replace(/\s+/g, ' ').replace(/ё/g, 'е');

    const existingCities = await citiesRepository.find({
      where: { name: In(citiesData.map((city) => city.name)) },
    });

    const existingNames = existingCities.map((city) => normalize(city.name));

    const newCities = citiesData.filter(
      (city) => !existingNames.includes(normalize(city.name)),
    );

    if (newCities.length === 0) {
      console.log('Новые города не найдены. Сидинг пропущен.');
      return;
    }

    await citiesRepository.save(newCities);

    console.log(`✅ Добавлено городов: ${newCities.length}`);
  } finally {
    // Закрытие соединения (перенести в root-seed)
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

// Автозапуск (убрать после переноса в root-seed)
seedCities().catch((error) => {
  console.error('❌ Ошибка при сидинге городов:', error);
});
