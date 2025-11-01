# CI/CD Deployment Guide

Здесь описано как работает автоматический деплой вашего приложения.

## Архитектура

```
GitHub (code push)
    ↓
GitHub Actions: docker.yml
    ↓ (собирает и отправляет образ)
GitHub Container Registry (GHCR)
    ↓
GitHub Actions: deploy.yml
    ↓ (SSH на сервер)
VPS Server (docker compose)
    ↓
PostgreSQL + Next.js + Traefik
```

## Как работает CI/CD

### 1. Build Stage (`docker.yml`)

Когда вы делаете `git push` в `main` или создаёте tag `v*`:

1. GitHub Actions запускает `docker.yml` workflow
2. Собирается Docker образ с multi-stage build:
   - **Stage 1 (deps)**: устанавливает зависимости
   - **Stage 2 (builder)**: собирает Next.js приложение
   - **Stage 3 (runner)**: финальный образ (без исходников и node_modules)
3. Образ отправляется в **GitHub Container Registry**
4. Генерируется SBOM (Software Bill of Materials) для безопасности

### 2. Deploy Stage (`deploy.yml`)

После успешной сборки:

1. GitHub Actions подключается к вашему серверу через SSH
2. Выполняет команды в папке приложения:
   ```bash
   docker login ghcr.io  # Логин в реестр
   docker compose pull  # Скачивает новый образ
   docker compose up -d  # Перезапускает контейнеры
   ```
3. PostgreSQL сохраняет данные (volume)
4. Prisma миграции применяются автоматически при запуске контейнера
5. Traefik перенаправляет трафик на новую версию приложения

## Требуемые GitHub Secrets

Для работы CI/CD нужно добавить secrets в репозиторий:

```
Settings → Secrets and variables → Actions → New repository secret
```

| Secret | Значение | Пример |
|--------|----------|---------|
| `SERVER_IP` | IP адрес вашего VPS | `1.2.3.4` |
| `SERVER_USER` | Пользователь для SSH | `debian` |
| `SSH_PRIVATE_KEY` | Приватный SSH ключ (без пароля!) | `-----BEGIN PRIVATE KEY-----...` |
| `SERVER_PORT` | SSH порт (опционально) | `22` |
| `APP_PATH` | Путь к приложению на сервере | `/home/debian/chat-ui-nextjs-example` |

### Как получить SSH ключ?

На сервере:

```bash
# Если его еще нет
ssh-keygen -t ed25519 -f ~/.ssh/deploy_key -N ""

# Публичный ключ добавляем в authorized_keys
cat ~/.ssh/deploy_key.pub >> ~/.ssh/authorized_keys

# Копируем приватный ключ в GitHub Secrets
cat ~/.ssh/deploy_key
```

Или используйте существующий ключ:

```bash
cat ~/.ssh/id_rsa  # или id_ed25519
```

## Окружение на сервере

Создайте `.env` файл в директории приложения:

```bash
# Database
POSTGRES_USER=chatuser
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=chatdb

# Next.js
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=https://chat.yourdomain.com

# OAuth (GitHub)
GITHUB_ID=your_github_app_id
GITHUB_SECRET=your_github_app_secret

# OAuth (Google)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# OpenAI
OPENAI_API_KEY=your_openai_api_key
OPENAI_BASE_URL=https://api.openai.com/v1

# Domain (for Traefik)
DOMAIN_NAME=yourdomain.com
SUBDOMAIN=chat

# Files
UPLOAD_DIR=/app/public/uploads
MAX_FILE_SIZE=10485760  # 10MB
```

## Первый запуск

```bash
# 1. Клонируем репозиторий
git clone <your-repo-url>
cd chat-ui-nextjs-example

# 2. Создаём .env файл с переменными окружения
nano .env

# 3. Проверяем что Traefik сеть создана
docker network ls | grep traefik
# Если её нет:
docker network create traefik

# 4. Запускаем приложение (первый раз собирает образ локально)
docker compose up -d

# 5. Смотрим логи
docker compose logs -f

# 6. После полного развёртывания GitHub Actions будет использовать образ из GHCR
```

## Мониторинг

```bash
# Смотреть логи
docker compose logs -f

# Конкретного сервиса
docker compose logs -f nextjs
docker compose logs -f postgres

# Проверить статус контейнеров
docker compose ps

# Перезагрузить приложение
docker compose restart nextjs

# Остановить всё
docker compose down

# Остановить но сохранить данные
docker compose down --remove-orphans
```

## Откат версии

Если в новой версии проблемы, можно откатиться:

```bash
# Посмотреть доступные теги
docker pull ghcr.io/justgithubaccount/chat-ui-nextjs-example

# Отредактировать docker-compose.yml с нужным тегом
nano docker-compose.yml
# Измените image: ghcr.io/... с нужным тегом

# Перезагрузить
docker compose up -d
```

## Дополнительно

### Backups PostgreSQL

```bash
# Backup
docker compose exec postgres pg_dump -U chatuser chatdb > backup.sql

# Restore
docker compose exec -T postgres psql -U chatuser chatdb < backup.sql
```

### Очистка образов

```bash
docker image prune -a  # Удалит неиспользуемые образы
docker system prune -a  # Полная очистка (будьте осторожны!)
```

### Логирование на сервере

Логи хранятся в Docker daemon:

```bash
# Логи контейнера за последний час
docker logs --since 1h chat-nextjs

# Реал-тайм логи
docker logs -f chat-nextjs
```

## Troubleshooting

### "Column does not exist" ошибка при старте

Миграции не были применены. Проверьте:

```bash
docker compose exec nextjs npx prisma migrate status
docker compose exec nextjs npx prisma migrate deploy
```

```bash
sudo docker compose run --rm nextjs npx prisma db push
```

### Образ не обновляется

```bash
# Проверить текущий образ
docker compose images

# Скачать новый образ
docker compose pull

# Перезагрузить контейнер
docker compose up -d
```

### SSH ключ не работает

```bash
# На сервере проверить пермиссии
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys

# Тестировать локально
ssh -i /path/to/key user@server
```

## Безопасность

- ✅ Образ собирается в изолированном GitHub Actions
- ✅ Миграции БД применяются автоматически
- ✅ SSH ключ используется вместо пароля
- ✅ Переменные окружения в `.env` (не в коде)
- ✅ HTTPS через Traefik с автоматическим сертификатом
- ✅ Регулярное создание backups БД

## Дальнейшие улучшения

- [ ] Добавить health checks и alerting
- [ ] Настроить logrotate для логов
- [ ] Backup стратегия (ежедневные снапшоты)
- [ ] Database replication для HA
- [ ] Staging окружение для тестирования перед продакшном
