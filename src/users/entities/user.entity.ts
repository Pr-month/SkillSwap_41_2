export class User {
  // Уникальный идентификатор пользователя
  id!: number;

  // Email пользователя (уникальный)
  email!: string;

  // Хеш пароля
  password!: string;

  // Имя пользователя (опционально)
  name?: string;

  //Дата регистрации
  createdAt!: Date;

  // Дата последнего обновления
  updatedAt!: Date;
}
