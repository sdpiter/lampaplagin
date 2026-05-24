# 📺 Online Mod + SeasonVar — плагин для Lampa

**Модифицированная версия [online_mod.js](https://nb557.github.io/plugins/online_mod.js) с добавленным источником SeasonVar.**

## Что это

Объединение двух плагинов в один:
- **online_mod.js** от [nb557](https://nb557.github.io/plugins/) — 16 источников онлайн-просмотра (HDRezka, Kinobase, Filmix, FanSerials, Lumex, CDNMovies, Zetflix, FanCDN, VideoSeed, Vibix, Alloha, RedHeadSound, CDNVideoHub, AniLibria, AnimeLib, Kodik)
- **SeasonVar** — добавлен как 17-й источник для просмотра сериалов с seasonvar.ru / seasonvar-enter.ru

## Установка

1. **Lampa** → **Настройки** → **Расширения** → **Добавить плагин**
2. URL:

```
https://sdpiter.github.io/lampaplagin/online_mod_seasonvar.js
```

## Источники

| Источник | Поиск | Тип |
|----------|-------|-----|
| HDRezka | ✅ | Фильмы/Сериалы |
| Kinobase | ✅ | Фильмы/Сериалы |
| Filmix | ✅ | Фильмы/Сериалы |
| FanCDN | ✅ | Сериалы |
| FanSerials | ID | Сериалы |
| Kodik | ✅+ID | Фильмы/Сериалы |
| Collaps | ID | Сериалы |
| CDNMovies | ID | Фильмы |
| Lumex | IMDb | Сериалы |
| Zetflix | ID | Сериалы |
| VideoSeed | ID | Сериалы |
| Vibix | ID | Сериалы |
| Alloha | ID | Фильмы/Сериалы |
| RedHeadSound | ✅ | Сериалы |
| CDNVideoHub | ID | Сериалы |
| AniLibria | ✅ | Аниме |
| AnimeLib | ✅ | Аниме |
| **SeasonVar** | ✅ | **Сериалы** |

## SeasonVar

### Возможности
- 🔍 **Поиск** по названию сериала
- 📺 **Сезоны и серии** — автоматическая группировка
- ▶️ **Прямые ссылки** (m3u8, mp4)
- 🖼️ **Iframe-плееры** — поддержка встроенных плееров
- 📋 **Playlist .js** — загрузка JSON-плейлистов
- 🎯 **Парсинг качеств** — `[480p]url[720p]url[1080p]url`
- 🌐 **CORS-прокси** — 3 встроенных прокси с ротацией
- 🏠 **Зеркала** — настраиваемые домены

### Настройки SeasonVar

**Настройки → Online Mod →** (внизу списка):

| Параметр | По умолчанию | Описание |
|----------|-------------|----------|
| CORS-прокси Seasonvar | Выкл | Включить CORS-прокси для обхода ограничений |

### Использование
- Откройте любой фильм/сериал в Lampa
- Нажмите **«Смотреть онлайн»** → выберите **SeasonVar** в списке балансеров
- Или выберите SeasonVar как балансер по умолчанию в настройках

## API SeasonVar

| Эндпоинт | Назначение |
|----------|-----------|
| `autocomplete.php?query=...` | Поиск сериалов |
| `serial-{id}-slug-N-season.html` | Страница сезона |
| `pl/playlist_{id}.js` | Плейлист эпизодов (JSON) |
| `playls2/{mark}/trans/{id}/list.xml` | Плейлист (XML, fallback) |

## Совместимость

- **Lampa**: v1.12+
- **Платформы**: Android, Android TV, Windows, Браузер

## Благодарности

- [nb557](https://nb557.github.io/plugins/) — за оригинальный online_mod.js
- [lampa-app](https://github.com/lampa-app/LAMPA) — за приложение Lampa

## Лицензия

MIT
