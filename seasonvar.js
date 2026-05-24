(function () {
    'use strict';

    function getDomain() {
        var d = Lampa.Storage.get('seasonvar_domain', '');
        return (d && d.indexOf('http') === 0) ? d.replace(/\/+$/, '') : 'https://seasonvar.ru';
    }

    function getCdnUrl() {
        var domain = getDomain();
        return domain.replace(/^(https?:\/\/)(.+)$/i, '$1cdn.$2');
    }

    // ─── Языки ───────────────────────────────────────────────
    Lampa.Lang.add({
        seasonvar_title: {
            ru: 'SeasonVar',
            uk: 'SeasonVar',
            en: 'SeasonVar',
            zh: 'SeasonVar'
        },
        seasonvar_search: {
            ru: 'Поиск на SeasonVar',
            uk: 'Пошук на SeasonVar',
            en: 'Search on SeasonVar',
            zh: '在SeasonVar上搜索'
        },
        seasonvar_search_desc: {
            ru: 'Поиск сериалов на SeasonVar.ru',
            uk: 'Пошук серіалів на SeasonVar.ru',
            en: 'Search TV shows on SeasonVar.ru',
            zh: '在SeasonVar.ru上搜索电视剧'
        },
        seasonvar_nolink: {
            ru: 'Не удалось получить ссылку на видео',
            uk: 'Не вдалося отримати посилання на відео',
            en: 'Failed to get video link',
            zh: '无法获取视频链接'
        },
        seasonvar_nosecure: {
            ru: 'Не удалось получить маркер безопасности',
            uk: 'Не вдалося отримати маркер безпеки',
            en: 'Failed to obtain security mark',
            zh: '无法获取安全标记'
        },
        seasonvar_noepisodes: {
            ru: 'Эпизоды не найдены',
            uk: 'Епізоди не знайдені',
            en: 'No episodes found',
            zh: '未找到剧集'
        },
        seasonvar_new: {
            ru: 'Новинки',
            uk: 'Новинки',
            en: 'New',
            zh: '新'
        },
        seasonvar_popular: {
            ru: 'Популярное',
            uk: 'Популярне',
            en: 'Popular',
            zh: '热门'
        },
        seasonvar_balanser: {
            ru: 'SeasonVar',
            uk: 'SeasonVar',
            en: 'SeasonVar',
            zh: 'SeasonVar'
        },
        seasonvar_domain: {
            ru: 'Домен',
            uk: 'Домен',
            en: 'Domain',
            zh: '域名'
        },
        seasonvar_domain_desc: {
            ru: 'Основной домен seasonvar (по умолчанию: seasonvar.ru)',
            uk: 'Основний домен seasonvar',
            en: 'Main seasonvar domain (default: seasonvar.ru)',
            zh: 'seasonvar主域名'
        },
        seasonvar_proxy: {
            ru: 'CORS прокси',
            uk: 'CORS проксі',
            en: 'CORS proxy',
            zh: 'CORS代理'
        },
        seasonvar_proxy_desc: {
            ru: 'Адрес CORS прокси для обхода ограничений (например, https://corsproxy.io/?)',
            uk: 'Адреса CORS проксі для обходу обмежень',
            en: 'CORS proxy URL to bypass restrictions (e.g. https://corsproxy.io/?)',
            zh: 'CORS代理地址以绕过限制'
        },
        seasonvar_season: {
            ru: 'Сезон',
            uk: 'Сезон',
            en: 'Season',
            zh: '季'
        },
        seasonvar_episode: {
            ru: 'Серия',
            uk: 'Серія',
            en: 'Episode',
            zh: '集'
        },
        seasonvar_select_serial: {
            ru: 'Выберите сериал',
            uk: 'Оберіть серіал',
            en: 'Select a TV show',
            zh: '选择电视剧'
        },
        seasonvar_select_season: {
            ru: 'Выберите сезон',
            uk: 'Оберіть сезон',
            en: 'Select a season',
            zh: '选择季'
        },
        seasonvar_select_episode: {
            ru: 'Выберите серию',
            uk: 'Оберіть серію',
            en: 'Select an episode',
            zh: '选择集'
        }
    });

    // ─── Утилиты ─────────────────────────────────────────────
    function getProxy() {
        var proxy = Lampa.Storage.get('seasonvar_cors_proxy', '');
        return proxy;
    }

    function fetchUrl(url) {
        var proxy = getProxy();
        if (proxy && proxy.indexOf('http') === 0) {
            // Если прокси заканчивается на ? — просто добавляем URL
            if (proxy.endsWith('?')) {
                url = proxy + encodeURIComponent(url);
            } else {
                url = proxy + url;
            }
        }
        return url;
    }

    // ─── Парсинг ─────────────────────────────────────────────

    // Парсинг HTML страницы сериала для получения secureMark и ID
    function parseSerialPage(html) {
        var result = {};

        // secureMark
        var secureMatch = html.match(/'secureMark':\s*'(\w+)',/);
        if (secureMatch) {
            result.secureMark = secureMatch[1] + '0';
        }

        // ID сериала
        var idMatch = html.match(/'id':\s*'(\d+)'/) || html.match(/serial-(\d+)/);
        if (idMatch) {
            result.id = idMatch[1];
        }

        // Название
        var titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
        if (titleMatch) {
            result.title = titleMatch[1].replace(/<[^>]+>/g, '').trim();
        }

        // Описание
        var descMatch = html.match(/class="[^"]*descr[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
        if (descMatch) {
            result.description = descMatch[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
        }

        // Обложка
        var coverMatch = html.match(/oblojka\/(\d+)\.jpg/);
        if (coverMatch) {
            result.coverId = coverMatch[1];
        }

        return result;
    }

    // Парсинг XML плейлиста
    function parsePlaylist(xmlText) {
        var episodes = [];
        var parser = new DOMParser();
        var xmlDoc = parser.parseFromString(xmlText, 'text/xml');

        var playlistEl = xmlDoc.getElementsByTagName('playlist')[0];
        if (!playlistEl) return episodes;

        var items = playlistEl.children;

        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (item.tagName !== 'item') continue;

            var fileEl = item.getElementsByTagName('file')[0];
            var commentEl = item.getElementsByTagName('comment')[0];

            if (fileEl && fileEl.textContent) {
                episodes.push({
                    file: fileEl.textContent.trim(),
                    comment: commentEl ? commentEl.textContent.trim() : ''
                });
            }
        }

        return episodes;
    }

    // Группировка эпизодов по сезонам
    function groupBySeason(episodes) {
        var seasons = {};

        episodes.forEach(function (ep, index) {
            // Попытка определить сезон из комментария или имени файла
            var seasonNum = 1;
            var episodeNum = index + 1;

            // Формат: "Сезон 1 Серия 5" или "S01E05" и т.д.
            var seasonMatch = ep.comment.match(/[Сс]езон\s*(\d+)/i) || ep.file.match(/[Ss](\d+)[Ee]\d+/);
            var episodeMatch = ep.comment.match(/[Сс]ерия\s*(\d+)/i) || ep.file.match(/[Ss]\d+[Ee](\d+)/);

            if (seasonMatch) {
                seasonNum = parseInt(seasonMatch[1]);
            }
            if (episodeMatch) {
                episodeNum = parseInt(episodeMatch[1]);
            }

            if (!seasons[seasonNum]) {
                seasons[seasonNum] = [];
            }

            seasons[seasonNum].push({
                season: seasonNum,
                episode: episodeNum,
                title: ep.comment || ('S' + seasonNum + 'E' + episodeNum),
                file: ep.file
            });
        });

        return seasons;
    }

    // Парсинг результатов поиска (autocomplete)
    function parseSearchResults(response) {
        var results = [];

        if (!response || !response.data) return results;

        for (var i = 0; i < response.data.length; i++) {
            var path = response.data[i];
            if (!path || /\/+/.test(path)) continue;

            var title = response.suggestions && response.suggestions.valu ? response.suggestions.valu[i] : path;
            var id = response.id ? response.id[i] : '';

            var rating = 0;
            var votes = 0;
            if (response.suggestions && response.suggestions.kp && response.suggestions.kp[i]) {
                var ratingHtml = response.suggestions.kp[i];
                var ratingMatch = ratingHtml.match(/:\s*(\d+)\s*"\s*>(\d+(?:\.\d+)?)</);
                if (ratingMatch) {
                    votes = parseInt(ratingMatch[1] || 0);
                    rating = parseFloat(ratingMatch[2] || 0);
                }
            }

            results.push({
                id: id,
                title: title,
                path: path,
                rating: rating,
                votes: votes,
                url: getDomain() + path
            });
        }

        return results;
    }

    // Парсинг главной страницы (новинки/популярное) — только regex, без cheerio
    function parseMainPage(html) {
        var results = [];

        // Разбор блоков по div.pgs-search-wrap
        var blockRegex = /<div[^>]*pgs-search-wrap[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi;
        var match;

        while ((match = blockRegex.exec(html)) !== null) {
            var block = match[0];

            var linkMatch = block.match(/<a[^>]*pst[^>]*href="([^"]+)"/i);
            var imgMatch = block.match(/oblojka\/(\d+)\.jpg/i);
            var titleMatch = block.match(/pgs-search-info[^>]*>([\s\S]*?)<\/div>/i);

            if (linkMatch && titleMatch) {
                var titleText = titleMatch[1]
                    .replace(/<br\s*\/?>/gi, ' / ')
                    .replace(/<[^>]+>/g, '')
                    .replace(/&nbsp;/g, ' ')
                    .replace(/&amp;/g, '&')
                    .replace(/\s+/g, ' ')
                    .trim();

                if (titleText) {
                    results.push({
                        path: linkMatch[1],
                        title: titleText,
                        coverId: imgMatch ? imgMatch[1] : '',
                        url: (linkMatch[1].indexOf('http') === 0 ? '' : getDomain()) + linkMatch[1]
                    });
                }
            }
        }

        return results;
    }

    // ─── Источник данных ─────────────────────────────────────

    function seasonvarApi(component, _object) {
        var network = new Lampa.Reguest();
        var object = _object;
        var searchResults = [];
        var serialInfo = {};
        var seasonsData = {};
        var currentSeason = 1;

        // Поиск сериалов
        this.search = function (query, callback) {
            var _this = this;
            var url = fetchUrl(getDomain() + '/autocomplete.php?query=' + encodeURIComponent(query));

            network.silent(url, function (response) {
                try {
                    var data = typeof response === 'string' ? JSON.parse(response) : response;
                    searchResults = parseSearchResults(data);
                    if (callback) callback(searchResults);
                } catch (e) {
                    console.error('SeasonVar', 'search parse error', e);
                    if (callback) callback([]);
                }
            }, function () {
                console.error('SeasonVar', 'search request failed');
                if (callback) callback([]);
            });
        };

        // Получение списка новинок
        this.getNew = function (callback) {
            var url = fetchUrl(getDomain() + '/?mode=top&period=1');

            network.silent(url, function (html) {
                try {
                    var results = parseMainPage(html);
                    if (callback) callback(results);
                } catch (e) {
                    console.error('SeasonVar', 'getNew parse error', e);
                    if (callback) callback([]);
                }
            }, function () {
                console.error('SeasonVar', 'getNew request failed');
                if (callback) callback([]);
            });
        };

        // Получение популярного
        this.getPopular = function (callback) {
            var url = fetchUrl(getDomain() + '/?mode=top&period=31');

            network.silent(url, function (html) {
                try {
                    var results = parseMainPage(html);
                    if (callback) callback(results);
                } catch (e) {
                    console.error('SeasonVar', 'getPopular parse error', e);
                    if (callback) callback([]);
                }
            }, function () {
                console.error('SeasonVar', 'getPopular request failed');
                if (callback) callback([]);
            });
        };

        // Загрузка информации о сериале и получение плейлиста
        this.loadSerial = function (serialUrl, callback) {
            var _this = this;
            var url = fetchUrl(serialUrl);

            network.silent(url, function (html) {
                try {
                    serialInfo = parseSerialPage(html);

                    if (!serialInfo.secureMark || !serialInfo.id) {
                        console.error('SeasonVar', 'secureMark or id not found');
                        Lampa.Noty.show(Lampa.Lang.translate('seasonvar_nosecure'));
                        if (callback) callback(null);
                        return;
                    }

                    // Загрузка плейлиста
                    var playlistUrl = fetchUrl(getDomain() + '/playls2/' + serialInfo.secureMark + '/trans/' + serialInfo.id + '/list.xml');

                    network.silent(playlistUrl, function (xmlText) {
                        try {
                            var episodes = parsePlaylist(xmlText);
                            seasonsData = groupBySeason(episodes);
                            if (callback) callback({
                                info: serialInfo,
                                seasons: seasonsData
                            });
                        } catch (e) {
                            console.error('SeasonVar', 'playlist parse error', e);
                            Lampa.Noty.show(Lampa.Lang.translate('seasonvar_noepisodes'));
                            if (callback) callback(null);
                        }
                    }, function () {
                        console.error('SeasonVar', 'playlist request failed');
                        Lampa.Noty.show(Lampa.Lang.translate('seasonvar_noepisodes'));
                        if (callback) callback(null);
                    });
                } catch (e) {
                    console.error('SeasonVar', 'serial page parse error', e);
                    if (callback) callback(null);
                }
            }, function () {
                console.error('SeasonVar', 'serial page request failed');
                if (callback) callback(null);
            });
        };

        this.destroy = function () {
            network.clear();
            searchResults = [];
            serialInfo = {};
            seasonsData = {};
        };
    }

    // ─── Компонент: Каталог (поиск + новинки) ────────────────

    function catalogComponent(object) {
        var network = new Lampa.Reguest();
        var scroll = new Lampa.Scroll({
            mask: true,
            over: true
        });
        var api = new seasonvarApi(this, object);
        var last;
        var searchTimer;

        this.create = function () {
            var _this = this;
            this.activity.loader(true);

            scroll.render().addClass('torrent-list');

            // Поиск
            if (object.search && object.search.length) {
                api.search(object.search, function (results) {
                    _this.buildSearchResults(results);
                });
            } else {
                // Показываем новинки по умолчанию
                api.getNew(function (results) {
                    _this.buildCatalog(results, Lampa.Lang.translate('seasonvar_new'));
                });
            }

            return this.render();
        };

        this.buildSearchResults = function (results) {
            var _this = this;
            this.activity.loader(false);

            if (!results || results.length === 0) {
                this.empty(Lampa.Lang.translate('seasonvar_search') + ': ' + object.search);
                return;
            }

            results.forEach(function (item) {
                var card = _this.createCard(item);
                card.on('hover:enter', function () {
                    // Открываем просмотр сериала
                    Lampa.Activity.push({
                        url: item.url,
                        title: item.title,
                        component: 'seasonvar_serial',
                        movie: {
                            title: item.title,
                            original_title: item.title,
                            img: item.coverId ? getCdnUrl() + '/oblojka/' + item.coverId + '.jpg' : ''
                        },
                        page: 1
                    });
                });
                card.on('hover:focus', function (e) {
                    last = e.target;
                    scroll.update($(e.target), true);
                });
                scroll.append(card);
            });

            this.start(true);
        };

        this.buildCatalog = function (results, title) {
            var _this = this;
            this.activity.loader(false);

            if (!results || results.length === 0) {
                this.empty('Нет результатов');
                return;
            }

            results.forEach(function (item) {
                var card = _this.createCard(item);
                card.on('hover:enter', function () {
                    Lampa.Activity.push({
                        url: item.url,
                        title: item.title,
                        component: 'seasonvar_serial',
                        movie: {
                            title: item.title,
                            original_title: item.title,
                            img: item.coverId ? getCdnUrl() + '/oblojka/' + item.coverId + '.jpg' : ''
                        },
                        page: 1
                    });
                });
                card.on('hover:focus', function (e) {
                    last = e.target;
                    scroll.update($(e.target), true);
                });
                scroll.append(card);
            });

            this.start(true);
        };

        this.createCard = function (item) {
            var card = Lampa.Template.get('card', {
                title: item.title
            });

            // Устанавливаем постер
            if (item.coverId) {
                var img = getCdnUrl() + '/oblojka/' + item.coverId + '.jpg';
                card.find('img').attr('src', img);
            }

            return card;
        };

        this.empty = function (msg) {
            var empty = Lampa.Template.get('list_empty');
            if (msg) empty.find('.empty__descr').text(msg);
            scroll.append(empty);
            this.loading(false);
        };

        this.loading = function (status) {
            if (status) this.activity.loader(true);
            else {
                this.activity.loader(false);
                this.activity.toggle();
            }
        };

        this.start = function (first_select) {
            if (Lampa.Activity.active().activity !== this.activity) return;

            Lampa.Controller.add('content', {
                toggle: function () {
                    Lampa.Controller.collectionSet(scroll.render());
                    Lampa.Controller.collectionFocus(last || false, scroll.render());
                },
                up: function () {
                    if (Navigator.canmove('up')) Navigator.move('up');
                    else Lampa.Controller.toggle('head');
                },
                down: function () {
                    Navigator.move('down');
                },
                right: function () {
                    if (Navigator.canmove('right')) Navigator.move('right');
                    else Lampa.Controller.toggle('menu');
                },
                left: function () {
                    if (Navigator.canmove('left')) Navigator.move('left');
                    else Lampa.Controller.toggle('menu');
                },
                back: this.back
            });
            Lampa.Controller.toggle('content');
        };

        this.render = function () {
            return scroll.render();
        };

        this.back = function () {
            Lampa.Activity.backward();
        };

        this.destroy = function () {
            network.clear();
            scroll.destroy();
            api.destroy();
        };
    }

    // ─── Компонент: Просмотр сериала (сезоны/серии) ─────────

    function serialComponent(object) {
        var network = new Lampa.Reguest();
        var scroll = new Lampa.Scroll({
            mask: true,
            over: true
        });
        var api = new seasonvarApi(this, object);
        var serialData = null;
        var currentSeason = 1;
        var last;
        var last_filter;
        var filter_items = {};
        var choice = {
            season: 0,
            voice: 0,
            voice_name: ''
        };

        this.create = function () {
            var _this = this;
            this.activity.loader(true);

            scroll.render().addClass('torrent-list');

            api.loadSerial(object.url, function (data) {
                if (!data) {
                    _this.empty(Lampa.Lang.translate('seasonvar_noepisodes'));
                    return;
                }
                serialData = data;
                _this.buildSeasons();
            });

            return this.render();
        };

        this.buildSeasons = function () {
            var _this = this;
            this.activity.loader(false);

            var seasons = serialData.seasons;
            var seasonNumbers = Object.keys(seasons).map(Number).sort(function (a, b) { return a - b; });

            if (seasonNumbers.length === 0) {
                this.empty(Lampa.Lang.translate('seasonvar_noepisodes'));
                return;
            }

            // Если один сезон — сразу показываем серии
            if (seasonNumbers.length === 1) {
                currentSeason = seasonNumbers[0];
                this.buildEpisodes(currentSeason);
                return;
            }

            // Показываем список сезонов
            seasonNumbers.forEach(function (seasonNum) {
                var episodes = seasons[seasonNum];
                var item = {
                    title: Lampa.Lang.translate('seasonvar_season') + ' ' + seasonNum,
                    info: episodes.length + ' ' + Lampa.Lang.translate('seasonvar_episode').toLowerCase() + '(s)',
                    season: seasonNum
                };

                var card = _this.createSeasonCard(item);
                card.on('hover:enter', function () {
                    currentSeason = seasonNum;
                    _this.buildEpisodes(seasonNum);
                });
                card.on('hover:focus', function (e) {
                    last = e.target;
                    scroll.update($(e.target), true);
                });
                scroll.append(card);
            });

            this.start(true);
        };

        this.buildEpisodes = function (seasonNum) {
            var _this = this;
            this.activity.loader(true);
            scroll.clear();

            var episodes = serialData.seasons[seasonNum];
            if (!episodes || episodes.length === 0) {
                this.empty(Lampa.Lang.translate('seasonvar_noepisodes'));
                return;
            }

            var viewed = Lampa.Storage.cache('online_view', 5000, []);

            episodes.forEach(function (ep, index) {
                var hash = Lampa.Utils.hash([seasonNum, ep.episode, object.movie.title].join(''));
                var view = Lampa.Timeline.view(hash);
                var hash_file = Lampa.Utils.hash([seasonNum, ep.episode, object.movie.title].join(''));

                var item = {
                    title: Lampa.Lang.translate('seasonvar_season') + ' ' + seasonNum + ' — ' + Lampa.Lang.translate('seasonvar_episode') + ' ' + ep.episode,
                    quality: ep.comment || '',
                    season: seasonNum,
                    episode: ep.episode,
                    file: ep.file,
                    timeline: view
                };

                var card = _this.createEpisodeCard(item);
                card.append(Lampa.Timeline.render(view));

                if (viewed.indexOf(hash_file) !== -1) {
                    card.append('<div class="torrent-item__viewed">' + Lampa.Template.get('icon_star', {}, true) + '</div>');
                }

                card.on('hover:enter', function () {
                    if (object.movie.id) {
                        Lampa.Favorite.add('history', object.movie, 100);
                    }

                    var playlist = [];
                    episodes.forEach(function (e) {
                        playlist.push({
                            title: Lampa.Lang.translate('seasonvar_season') + ' ' + seasonNum + ' — ' + Lampa.Lang.translate('seasonvar_episode') + ' ' + e.episode,
                            url: e.file,
                            timeline: Lampa.Timeline.view(Lampa.Utils.hash([seasonNum, e.episode, object.movie.title].join('')))
                        });
                    });

                    var first = {
                        url: ep.file,
                        timeline: view,
                        title: object.movie.title + ' / ' + item.title
                    };

                    if (playlist.length > 1) first.playlist = playlist;

                    Lampa.Player.play(first);
                    Lampa.Player.playlist(playlist);

                    if (viewed.indexOf(hash_file) === -1) {
                        viewed.push(hash_file);
                        card.append('<div class="torrent-item__viewed">' + Lampa.Template.get('icon_star', {}, true) + '</div>');
                        Lampa.Storage.set('online_view', viewed);
                    }
                });

                card.on('hover:focus', function (e) {
                    last = e.target;
                    scroll.update($(e.target), true);
                });

                scroll.append(card);
            });

            this.activity.loader(false);
            this.start(true);
        };

        this.createSeasonCard = function (item) {
            var html = '<div class="online selector">' +
                '<div class="online__body">' +
                '<div style="position: absolute;left: 0;top: -0.3em;width: 2.4em;height: 2.4em">' +
                '<svg style="height: 2.4em; width: 2.4em;" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                '<circle cx="64" cy="64" r="56" stroke="white" stroke-width="16"/>' +
                '<path d="M90.5 64.3827L50 87.7654L50 41L90.5 64.3827Z" fill="white"/>' +
                '</svg></div>' +
                '<div class="online__title" style="padding-left: 2.1em;">' + item.title + '</div>' +
                '<div class="online__quality" style="padding-left: 3.4em;">' + item.info + '</div>' +
                '</div></div>';

            return $(html);
        };

        this.createEpisodeCard = function (item) {
            var html = '<div class="online selector">' +
                '<div class="online__body">' +
                '<div style="position: absolute;left: 0;top: -0.3em;width: 2.4em;height: 2.4em">' +
                '<svg style="height: 2.4em; width: 2.4em;" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                '<circle cx="64" cy="64" r="56" stroke="white" stroke-width="16"/>' +
                '<path d="M90.5 64.3827L50 87.7654L50 41L90.5 64.3827Z" fill="white"/>' +
                '</svg></div>' +
                '<div class="online__title" style="padding-left: 2.1em;">' + item.title + '</div>' +
                '<div class="online__quality" style="padding-left: 3.4em;">' + item.quality + '</div>' +
                '</div></div>';

            return $(html);
        };

        this.empty = function (msg) {
            var empty = Lampa.Template.get('list_empty');
            if (msg) empty.find('.empty__descr').text(msg);
            scroll.append(empty);
            this.loading(false);
        };

        this.loading = function (status) {
            if (status) this.activity.loader(true);
            else {
                this.activity.loader(false);
                this.activity.toggle();
            }
        };

        this.start = function (first_select) {
            if (Lampa.Activity.active().activity !== this.activity) return;

            if (first_select) {
                var last_views = scroll.render().find('.selector.online').find('.torrent-item__viewed').parent().last();
                if (last_views.length) last = last_views.eq(0)[0];
                else last = scroll.render().find('.selector').eq(0)[0];
            }

            Lampa.Background.immediately(Lampa.Utils.cardImgBackground(object.movie));

            Lampa.Controller.add('content', {
                toggle: function () {
                    Lampa.Controller.collectionSet(scroll.render());
                    Lampa.Controller.collectionFocus(last || false, scroll.render());
                },
                up: function () {
                    if (Navigator.canmove('up')) Navigator.move('up');
                    else Lampa.Controller.toggle('head');
                },
                down: function () {
                    Navigator.move('down');
                },
                right: function () {
                    if (Navigator.canmove('right')) Navigator.move('right');
                    else Lampa.Controller.toggle('menu');
                },
                left: function () {
                    if (Navigator.canmove('left')) Navigator.move('left');
                    else Lampa.Controller.toggle('menu');
                },
                back: this.back
            });
            Lampa.Controller.toggle('content');
        };

        this.render = function () {
            return scroll.render();
        };

        this.back = function () {
            Lampa.Activity.backward();
        };

        this.destroy = function () {
            network.clear();
            scroll.destroy();
            api.destroy();
        };
    }

    // ─── Регистрация ─────────────────────────────────────────

    Lampa.Component.add('seasonvar_catalog', catalogComponent);
    Lampa.Component.add('seasonvar_serial', serialComponent);

    Lampa.Manifest.plugins = {
        type: 'video',
        version: '1.0.0',
        name: Lampa.Lang.translate('seasonvar_title'),
        description: Lampa.Lang.translate('seasonvar_search_desc'),
        component: 'seasonvar_catalog'
    };

    // Кнопка в карточке фильма (полный просмотр)
    Lampa.Listener.follow('full', function (e) {
        if (e.type == 'complite') {
            var btn = $(
                '<div class="full-start__button selector view--online" data-subtitle="v1.0.0">' +
                '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 30.051 30.051">' +
                '<g fill="currentColor">' +
                '<path d="M19.982,14.438l-6.24-4.536c-0.229-0.166-0.533-0.191-0.784-0.062c-0.253,0.128-0.411,0.388-0.411,0.669v9.069c0,0.284,0.158,0.543,0.411,0.671c0.107,0.054,0.224,0.081,0.342,0.081c0.154,0,0.31-0.049,0.442-0.146l6.24-4.532c0.197-0.145,0.312-0.369,0.312-0.607C20.295,14.803,20.177,14.58,19.982,14.438z"/>' +
                '<path d="M15.026,0.002C6.726,0.002,0,6.728,0,15.028c0,8.297,6.726,15.021,15.026,15.021c8.298,0,15.025-6.725,15.025-15.021C30.052,6.728,23.324,0.002,15.026,0.002z M15.026,27.542c-6.912,0-12.516-5.601-12.516-12.514c0-6.91,5.604-12.518,12.516-12.518c6.911,0,12.514,5.607,12.514,12.518C27.541,21.941,21.937,27.542,15.026,27.542z"/>' +
                '</g></svg>' +
                '<span>' + Lampa.Lang.translate('seasonvar_title') + '</span>' +
                '</div>'
            );

            btn.on('hover:enter', function () {
                Lampa.Activity.push({
                    url: '',
                    title: Lampa.Lang.translate('seasonvar_title'),
                    component: 'seasonvar_catalog',
                    search: e.data.movie.title,
                    search_one: e.data.movie.title,
                    search_two: e.data.movie.original_title,
                    movie: e.data.movie,
                    page: 1
                });
            });

            e.object.activity.render().find('.view--torrent').after(btn);
        }
    });

    // Пункт меню
    Lampa.Listener.follow('app', function (e) {
        if (e.type == 'ready') {
            var menu = '<div class="menu__item selector" data-action="seasonvar">' +
                '<div class="menu__ico">' +
                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                '<polygon points="5 3 19 12 5 21 5 3"/>' +
                '</svg></div>' +
                '<div class="menu__text">' + Lampa.Lang.translate('seasonvar_title') + '</div>' +
                '</div>';

            var $menu = $(menu);
            $menu.on('hover:enter', function () {
                Lampa.Activity.push({
                    url: '',
                    title: Lampa.Lang.translate('seasonvar_title'),
                    component: 'seasonvar_catalog',
                    search: '',
                    movie: {
                        title: Lampa.Lang.translate('seasonvar_title'),
                        original_title: 'seasonvar'
                    },
                    page: 1
                });
            });

            // Добавляем в меню
            var $menuList = $('.menu .menu__list').eq(0);
            if ($menuList.length) {
                $menuList.append($menu);
            }
        }
    });

    // ─── Настройки ───────────────────────────────────────────

    Lampa.SettingsApi.addComponent({
        component: 'seasonvar_config',
        name: Lampa.Lang.translate('seasonvar_title'),
        icon: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>'
    });

    Lampa.SettingsApi.addParam({
        component: 'seasonvar_config',
        param: {
            name: 'seasonvar_domain',
            type: 'input',
            placeholder: 'https://seasonvar.ru',
            values: '',
            default: ''
        },
        field: {
            name: Lampa.Lang.translate('seasonvar_domain'),
            description: Lampa.Lang.translate('seasonvar_domain_desc')
        }
    });

    Lampa.SettingsApi.addParam({
        component: 'seasonvar_config',
        param: {
            name: 'seasonvar_cors_proxy',
            type: 'input',
            placeholder: 'https://corsproxy.io/?',
            values: '',
            default: ''
        },
        field: {
            name: Lampa.Lang.translate('seasonvar_proxy'),
            description: Lampa.Lang.translate('seasonvar_proxy_desc')
        }
    });

})();
