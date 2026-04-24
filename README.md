# Shared Shelf Backend

Бекенд для платформи обміну книжками на `NestJS + PostgreSQL + TypeORM`.

## Що є

- локальний запуск NestJS;
- Postgres у `Docker Compose`;
- TypeORM-сутності для предметної області;
- початкова migration для всієї схеми БД.

## Сутності

- `users` — профілі користувачів і рейтинг;
- `groups` — спільноти;
- `group_memberships` — членство, ролі й статуси;
- `books` — книги користувачів;
- `group_books` — книги, додані до каталогу групи;
- `borrow_requests` — запити на книгу та черга;
- `loans` — видані книги;
- `notifications` — нагадування та службові події;
- `reputation_reviews` — відгуки після завершення позики.

## Локальний запуск

1. Скопіювати `.env.example` у `.env`
2. Підняти БД: `docker compose up -d`
3. Застосувати міграції: `npm run migration:run`
4. Запустити бекенд локально: `npm run start:dev`

Postgres буде доступний на `localhost:5433`, а застосунок слухає `PORT` з `.env`.
Swagger UI буде доступний за адресою `http://localhost:3000/docs`.

## Корисні команди

- `docker compose down` — зупинити БД
- `npm run build` — перевірити збірку
- `npm run migration:revert` — відкотити останню migration
