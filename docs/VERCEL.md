# Деплой приложения на Vercel

## Предварительные требования

1. Аккаунт на GitHub
2. Аккаунт на [Vercel](https://vercel.com)
3. Ваш проект должен быть размещен в репозитории GitHub

## Шаги по развертыванию

### 1. Подготовка репозитория

1. Убедитесь, что ваш проект находится в GitHub репозитории
2. Убедитесь, что в корне проекта есть файл `next.config.js`
3. Проверьте, что все зависимости указаны в `package.json`

### 2. Настройка на Vercel

1. Перейдите на [vercel.com](https://vercel.com)
2. Войдите в систему или зарегистрируйтесь с помощью GitHub
3. Нажмите "Import Project" или "New Project"
4. Выберите "Import Git Repository"
5. Выберите репозиторий с вашим проектом из списка
6. Vercel автоматически определит, что это Next.js проект

### 3. Настройка деплоя

В процессе импорта проекта Vercel предложит настройки:

1. Project Name: оставьте по умолчанию или измените
2. Framework Preset: должен автоматически определиться как Next.js
3. Root Directory: оставьте как есть, если проект находится в корне репозитория
4. Build Command: оставьте по умолчанию (`next build`)
5. Output Directory: оставьте по умолчанию (`.next`)
6. Environment Variables: если требуются, добавьте их здесь

### 4. Запуск деплоя

1. Нажмите "Deploy"
2. Дождитесь завершения процесса сборки и деплоя
3. После успешного деплоя вы получите URL вашего приложения

### 5. Дальнейшие действия

- Каждый push в main/master ветку будет автоматически запускать новый деплой
- В настройках проекта на Vercel вы можете:
  - Настроить кастомный домен
  - Добавить/изменить переменные окружения
  - Просматривать логи деплоев
  - Настроить превью для pull requests

### Полезные команды

Для локальной разработки с Vercel CLI:

```bash
# Установка Vercel CLI
npm i -g vercel

# Логин в Vercel
vercel login

# Деплой
vercel

# Деплой в production
vercel --prod
```

### Troubleshooting

1. Если сборка не проходит, проверьте:
   - Логи сборки в интерфейсе Vercel
   - Все ли зависимости указаны в package.json
   - Правильность конфигурации в next.config.js

2. Если приложение падает после деплоя:
   - Проверьте логи в разделе "Runtime Logs"
   - Убедитесь, что все переменные окружения настроены правильно

### Полезные ссылки

- [Документация Vercel](https://vercel.com/docs)
- [Деплой Next.js на Vercel](https://nextjs.org/docs/deployment)
- [Vercel CLI](https://vercel.com/cli)

# Vercel Deployment Configuration

## Начальная настройка Vercel CLI

1. Установка Vercel CLI глобально:
```bash
npm install -g vercel
```

2. Привязка проекта к Vercel:
```bash
vercel link
```

Процесс привязки включает:
- Авторизацию через GitHub (если не выполнена ранее)
- Подтверждение настройки текущей директории проекта
- Выбор области (scope) для проекта
- Привязку к существующему проекту или создание нового
- Создание `.vercel` директории (автоматически добавляется в .gitignore)

Пример успешной привязки:
```
Vercel CLI 41.3.0
> No existing credentials found. Please log in:
? Log in to Vercel Continue with GitHub
> Success! GitHub authentication complete for ad3002@gmail.com
? Set up "~/mafia_game"? yes
? Which scope should contain your project? ad3002's projects
? Found project "ad3002s-projects/mafia-game". Link to it? yes
✅  Linked to ad3002s-projects/mafia-game (created .vercel and added it to .gitignore)
```

## Отключение автоматического деплоя

1. Отключение через конфигурацию (уже применено):
   - В корне проекта создан файл `vercel.json`
   - Установлен параметр `github.enabled: false`
   - Это отключает автоматический деплой через GitHub интеграцию

После этого Vercel будет создавать новые деплои только при:
- Ручном деплое через интерфейс Vercel
- Пуше тега с версией (через наш скрипт `npm run deploy`)
- Использовании Vercel CLI

## GitHub Actions Configuration

После привязки проекта к Vercel с помощью `vercel link`, в директории `.vercel` создается файл `project.json`, 
который содержит необходимые ID для настройки деплоя через GitHub Actions:

```json
{
  "projectId": "...",
  "orgId": "..."
}
```

Для настройки GitHub Actions вам понадобятся:
- VERCEL_PROJECT_ID: `...`
- VERCEL_ORG_ID: `...`
- VERCEL_TOKEN: создается в настройках аккаунта Vercel (Settings -> Tokens)

Эти значения необходимо добавить в секреты GitHub репозитория (Settings -> Secrets and variables -> Actions).

## Текущая настройка деплоя

- Автоматический деплой отключен через:
  - UI настройки Vercel
  - Конфигурацию в vercel.json
- Деплои происходят только при создании git-тегов с префиксом `v*` (например, v1.0.0)
- Для деплоя используется команда: `npm run deploy`
- CI/CD настроен через GitHub Actions (`.github/workflows/deploy.yml`)