# 🎬 CineSync — Дивитись фільми разом

Веб-додаток для спільного перегляду фільмів на відстані. Один транслює свій екран, обидва бачать вебкамери один одного + чат.

## Як працює

1. **Хост** створює кімнату → отримує унікальне посилання
2. **Гість** переходить за посиланням
3. Хост натискає "Транслювати екран" → обирає вікно з фільмом
4. Гість бачить екран хоста + обидві вебкамери
5. Вбудований чат для спілкування

## Технології

- **WebRTC** — peer-to-peer відео/аудіо (низька затримка)
- **WebSocket** — сигнальний сервер для WebRTC
- **Screen Sharing API** — захоплення екрану з аудіо
- **Express** — HTTP сервер

## Локальний запуск

```bash
npm install
npm start
# Відкрий http://localhost:3000
```

## Деплой на Railway (рекомендовано)

### Варіант 1: Через GitHub

1. Створи репозиторій на GitHub і завантаж код:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USER/cinesync.git
   git push -u origin main
   ```

2. Зайди на [railway.app](https://railway.app) → "New Project" → "Deploy from GitHub"
3. Обери свій репозиторій
4. Railway автоматично задеплоїть додаток
5. Перейди в Settings → Networking → "Generate Domain" для отримання HTTPS URL

### Варіант 2: Через Railway CLI

```bash
npm install -g @railway/cli
railway login
railway init
railway up
railway domain
```

## Деплой на Render

1. Завантаж код на GitHub
2. Зайди на [render.com](https://render.com) → New → Web Service
3. Підключи репозиторій
4. Render прочитає `render.yaml` і налаштує все автоматично

## Деплой на Fly.io

```bash
fly launch
fly deploy
```

## Важливо

- **HTTPS обов'язковий** — WebRTC та Screen Sharing працюють тільки по HTTPS (або localhost)
- **STUN сервери** — використовуються безкоштовні Google STUN сервери для NAT traversal
- **TURN сервер** — якщо у когось дуже закритий NAT (корпоративний VPN), може знадобитись TURN сервер. Безкоштовні опції: [metered.ca](https://www.metered.ca/stun-turn) або [Twilio TURN](https://www.twilio.com/docs/stun-turn)

## Структура проєкту

```
watch-together/
├── server.js          # Express + WebSocket сигнальний сервер
├── public/
│   └── index.html     # Весь фронтенд (SPA)
├── package.json
├── Dockerfile         # Для Docker деплою
├── railway.toml       # Конфіг Railway
├── render.yaml        # Конфіг Render
└── README.md
```
