// === ИГРОВЫЕ ДАННЫЕ ===
let gameData = {
    hasActiveGame: false,
    day: 1,
    trust: 70,
    intellect: 0,
    completedDays: [],
    errorLog: [],
    clues: [],
    notifications: [],
    readNotifications: [],
    lastAction: null
};

// Расписание пар по дням
const scheduleByDay = {
    1: [
        { name: "Программирование (10:00-11:30)", time: "10:00", intellectReward: 10 },
        { name: "Математика (12:00-13:30)", time: "12:00", intellectReward: 8 },
        { name: "Английский язык (14:00-15:30)", time: "14:00", intellectReward: 5 }
    ],
    2: [
        { name: "Базы данных (10:00-11:30)", time: "10:00", intellectReward: 10 },
        { name: "Веб-разработка (12:00-13:30)", time: "12:00", intellectReward: 12 },
        { name: "Физика (14:00-15:30)", time: "14:00", intellectReward: 5 }
    ],
    3: [
        { name: "Операционные системы (10:00-11:30)", time: "10:00", intellectReward: 12 },
        { name: "Компьютерные сети (12:00-13:30)", time: "12:00", intellectReward: 10 }
    ],
    4: [
        { name: "Тестирование ПО (10:00-11:30)", time: "10:00", intellectReward: 8 },
        { name: "Английский язык (13:00-14:30)", time: "13:00", intellectReward: 5 },
        { name: "Математика (15:00-16:30)", time: "15:00", intellectReward: 8 }
    ],
    5: [
        { name: "Дипломное проектирование (10:00-11:30)", time: "10:00", intellectReward: 15 },
        { name: "Карьера в IT (12:00-13:30)", time: "12:00", intellectReward: 10 }
    ],
    6: [
        { name: "Защита курсовой (10:00-12:00)", time: "10:00", intellectReward: 20 }
    ]
};

// Подсказки DeepSeek по дням
const deepseekAdvice = {
    1: "🔍 Обнаружена ошибка загрузки файла. Рекомендую проверить очередь загрузки файлов в панели администратора.",
    2: "⚠️ API оценивания не отвечает. Попробуй перезапустить API-шлюз.",
    3: "🔄 Кеш показывает старые данные. Сбрось кеш вручную в админке.",
    4: "🌐 Замечены странные запросы к внешним API. Отключи проверку VPN в конфиге.",
    5: "📋 Администрация требует отчёт. Собери все улики в архиве и подготовь отчёт."
};

// Сообщения для уведомлений
const notificationMessages = {
    1: [
        { text: "🤔 Странно... Вчера же отправлял курсовую работу, а в отправленных пусто.", type: "thought" },
        { text: "💭 Может, система зависла? Нужно проверить очередь загрузки.", type: "thought" },
        { text: "⚠️ Пользователь пишет: 'Коля, у меня 2! Почему?'", type: "alert" }
    ],
    2: [
        { text: "💭 Учитель сказал, что поставил 5, но в дневнике всё ещё 2...", type: "thought" },
        { text: "🔧 API оценивания, похоже, не работает. Нужно перезапустить шлюз.", type: "thought" },
        { text: "⚠️ Система: 'API /grades возвращает 502'", type: "alert" }
    ],
    3: [
        { text: "💭 Почему я вижу оценки за прошлый семестр? Кеш не обновился?", type: "thought" },
        { text: "🔄 Нужно сбросить кеш вручную, TTL настроен неправильно.", type: "thought" }
    ],
    4: [
        { text: "🤔 Что за запросы к Telegram API? Зачем нашему серверу ютуб?", type: "thought" },
        { text: "💡 А, это проверка VPN! Но зачем она здесь? Нужно отключить.", type: "thought" }
    ],
    5: [
        { text: "😰 Завтра отчисление, если не предоставлю отчёт!", type: "alert" },
        { text: "📝 Нужно собрать все улики и подготовить таймлайн.", type: "thought" }
    ]
};

// Элементы DOM
let desktop, browserModal, deepseekChat, startMenu, notificationPanel;
let activeBrowserTab = "user.html";
let markedLessons = [];
let rebootRequired = false;

// Загрузка сохранения
function loadGame() {
    const saved = localStorage.getItem("spbGameSave");
    if (saved) {
        gameData = JSON.parse(saved);
    }
    const savedMarked = localStorage.getItem("markedLessons");
    if (savedMarked) {
        markedLessons = JSON.parse(savedMarked);
    }
    updateStatsDisplay();
}

// Сохранение
function saveGame() {
    localStorage.setItem("spbGameSave", JSON.stringify(gameData));
    localStorage.setItem("markedLessons", JSON.stringify(markedLessons));
    updateStatsDisplay();
}

function updateStatsDisplay() {
    const trustValue = document.getElementById('trustValue');
    const intellectValue = document.getElementById('intellectValue');
    const trustFill = document.getElementById('trustFill');
    const intellectFill = document.getElementById('intellectFill');
    
    if (trustValue) trustValue.textContent = gameData.trust;
    if (intellectValue) intellectValue.textContent = gameData.intellect;
    if (trustFill) trustFill.style.width = Math.min(100, Math.max(0, gameData.trust)) + '%';
    if (intellectFill) intellectFill.style.width = Math.min(100, (gameData.intellect / 100) * 100) + '%';
    
    // Показываем DeepSeek при интеллекте >= 30
    const deepseekIcon = document.getElementById('deepseekIcon');
    if (deepseekIcon) {
        deepseekIcon.style.display = gameData.intellect >= 30 ? 'flex' : 'none';
    }
    
    // Обновляем DeepSeek совет
    updateDeepseekAdvice();
}

function updateDeepseekAdvice() {
    const adviceDiv = document.getElementById('deepseekAdvice');
    if (adviceDiv && gameData.intellect >= 30) {
        const advice = deepseekAdvice[gameData.day] || "Продолжай расследование, используй панель администратора для диагностики проблем.";
        adviceDiv.innerHTML = `<strong>💡 Совет:</strong><br>${advice}`;
    }
}

// Уведомления
function addNotification(text, type = "thought") {
    const newNotif = {
        id: Date.now(),
        text: text,
        type: type,
        time: new Date().toLocaleTimeString(),
        read: false
    };
    gameData.notifications.unshift(newNotif);
    if (gameData.notifications.length > 20) gameData.notifications.pop();
    saveGame();
    updateNotificationBadge();
}

function updateNotificationBadge() {
    const badge = document.querySelector('.notification-badge');
    const unreadCount = gameData.notifications.filter(n => !n.read).length;
    if (badge) {
        if (unreadCount > 0) {
            badge.classList.add('has-notification');
        } else {
            badge.classList.remove('has-notification');
        }
    }
}

function renderNotifications() {
    const list = document.getElementById('notificationList');
    if (!list) return;
    
    const unreadNotifs = gameData.notifications.filter(n => !n.read);
    const allNotifs = gameData.notifications.slice(0, 15);
    
    if (allNotifs.length === 0) {
        list.innerHTML = '<div class="notification-item">Нет уведомлений</div>';
        return;
    }
    
    list.innerHTML = allNotifs.map(notif => `
        <div class="notification-item ${!notif.read ? 'unread' : ''}" data-id="${notif.id}">
            <div>${notif.text}</div>
            <div class="notification-time">${notif.time}</div>
        </div>
    `).join('');
    
    // Отмечаем как прочитанные при открытии
    gameData.notifications.forEach(n => { n.read = true; });
    saveGame();
    updateNotificationBadge();
}

// Генерация уведомлений для текущего дня
function generateDayNotifications() {
    const msgs = notificationMessages[gameData.day];
    if (msgs) {
        setTimeout(() => {
            msgs.forEach((msg, index) => {
                setTimeout(() => {
                    addNotification(msg.text, msg.type);
                    if (msg.type === "alert") {
                        showBubble(msg.text, "system");
                    }
                }, index * 3000);
            });
        }, 1000);
    }
}

// БАБЛЫ
function showBubble(text, type = 'system') {
    const container = document.getElementById('bubbleContainer');
    if (!container) return;
    
    const bubble = document.createElement('div');
    bubble.className = `bubble ${type}`;
    bubble.textContent = text;
    container.appendChild(bubble);
    
    setTimeout(() => {
        bubble.style.opacity = '0';
        bubble.style.transform = 'translateX(-50px)';
        setTimeout(() => bubble.remove(), 300);
    }, 4000);
}

// Изменение статистики
function modifyTrust(delta) {
    gameData.trust = Math.min(100, Math.max(0, gameData.trust + delta));
    saveGame();
    showBubble(delta > 0 ? `❤️ Доверие +${delta}` : `❤️ Доверие ${delta}`, 'system');
    if (gameData.trust <= 0) {
        showBubble('❌ Доверие потеряно! Игра окончена. Начните заново.', 'system');
        setTimeout(() => resetProgress(), 3000);
    }
}

function modifyIntellect(delta) {
    gameData.intellect = Math.min(100, Math.max(0, gameData.intellect + delta));
    saveGame();
    showBubble(`🧠 Интеллект +${delta}`, 'system');
}

// Добавление улики
function addClue(clue) {
    if (!gameData.clues.includes(clue)) {
        gameData.clues.push(clue);
        showBubble(`🔍 Улика: ${clue}`, 'system');
        saveGame();
    }
}

// Добавление в журнал ошибок
function addToErrorLog(action, result, message) {
    gameData.errorLog.unshift({
        id: Date.now(),
        day: gameData.day,
        action: action,
        result: result,
        message: message,
        timestamp: new Date().toLocaleTimeString()
    });
    saveGame();
}

// Выполнение действий админа
function executeAdminAction(actionId) {
    const dayActions = {
        1: {
            correct: 'checkQueue',
            actions: {
                checkQueue: { trust: 10, intellect: 0, clue: 'Очередь переполнена с 14:00 вчера', success: true, message: 'Файл восстановлен! Проблема решена.' },
                restartAuth: { trust: -5, intellect: 0, clue: null, success: false, message: 'Ошибка осталась. Файл не восстановлен.' },
                checkBackups: { trust: 0, intellect: 5, clue: 'Бэкапы не создавались 3 дня', success: false, message: 'Улика найдена, но файл не восстановлен.' }
            }
        },
        2: {
            correct: 'restartGateway',
            actions: {
                restartGateway: { trust: 15, intellect: 0, clue: 'Шлюз не отвечал на /grades 2 часа', success: true, message: 'Оценка обновилась на 5!' },
                increaseTimeout: { trust: -10, intellect: 0, clue: null, success: false, message: 'Ошибка осталась.' },
                checkCurl: { trust: 0, intellect: 10, clue: 'Эндпоинт возвращает пустой массив', success: false, message: 'Диагностика найдена, но не исправлена.' }
            }
        },
        3: {
            correct: 'resetCache',
            actions: {
                resetCache: { trust: 10, intellect: 0, clue: 'Кеш-ключи не обновлялись 7 дней', success: true, message: 'Данные обновились!' },
                rebootServer: { trust: -15, intellect: 0, clue: null, success: false, message: 'Кеш сбросился временно.' },
                configureTTL: { trust: 5, intellect: 5, clue: 'Конфиг TTL был установлен в 30 дней', success: true, message: 'Проблема решена!' }
            }
        },
        4: {
            correct: 'disableVPN',
            actions: {
                disableVPN: { trust: 10, intellect: 5, clue: 'Проверка VPN вызывала задержки и ложные 403', success: true, message: 'Ошибки 403 исчезли!' },
                keepVPN: { trust: -10, intellect: 0, clue: null, success: false, message: 'Пользователь продолжает получать 403.' },
                localFlag: { trust: 5, intellect: 10, clue: 'Локальный флаг быстрее, но требует миграции', success: true, message: 'Проблема решена!' }
            }
        }
    };
    
    const actions = dayActions[gameData.day];
    if (!actions) {
        showBubble("Сначала реши проблему текущего дня!", "system");
        return;
    }
    
    const result = actions.actions[actionId];
    if (!result) return;
    
    modifyTrust(result.trust);
    modifyIntellect(result.intellect);
    if (result.clue) addClue(result.clue);
    
    addToErrorLog(actionId, result.success ? 'исправлена' : 'не исправлена', result.message);
    showBubble(result.message, result.success ? 'system' : 'user');
    
    if (result.success) {
        if (!gameData.completedDays.includes(gameData.day)) {
            gameData.completedDays.push(gameData.day);
        }
        
        if (gameData.day < 5) {
            gameData.day++;
            saveGame();
            showBubble(`📅 День ${gameData.day} начался. Откройте Личный кабинет для новых задач.`, 'character');
            generateDayNotifications();
        } else if (gameData.day === 5) {
            gameData.day = 6;
            saveGame();
            showFinalChoice();
        }
    } else if (actionId === 'rebootServer') {
        showBubble("🔄 Сервер перезагружен. Некоторые проблемы могут решиться.", "system");
        rebootRequired = false;
    }
}

// Финальный выбор
function showFinalChoice() {
    showBubble("🔍 Расследование завершено! Выберите главную причину сбоя.", "system");
    
    setTimeout(() => {
        const choice = confirm('🔍 ВЫБЕРИТЕ ГЛАВНУЮ ПРИЧИНУ:\n\n"OK" - Техническая причина (сломанный API)\n"Отмена" - Сюжетный твист');
        
        if (choice === false) {
            if (gameData.intellect >= 50) {
                addClue('В логах питания: "Unexpected power loss" — сисадмин споткнулся за кабель');
            }
            modifyTrust(25);
            showBubble('🎉 Сисадмин кабель выдернул! Пользователь угощает пиццей!', 'character');
            showBubble('🏆 КОНЦОВКА ДОСТИГНУТА!', 'system');
        } else {
            modifyTrust(10);
            showBubble('🎉 API не выдержало нагрузки. Нужно масштабирование.', 'character');
            showBubble('🏆 ТЕХНИЧЕСКАЯ ПОБЕДА!', 'system');
        }
        
        if (gameData.intellect <= 10) {
            showBubble('👨‍🏫 Ты вообще на парах был?', 'user');
        }
    }, 1000);
}

// Отметка на паре
function markAttendance(lessonName, reward) {
    if (markedLessons.includes(lessonName)) return;
    
    markedLessons.push(lessonName);
    modifyIntellect(reward);
    showBubble(`✅ Отмечено на паре "${lessonName}"! +${reward} интеллекта`, 'character');
    saveGame();
    
    // Обновляем iframe
    const iframe = document.getElementById('browserIframe');
    if (iframe && iframe.src.includes('user.html')) {
        iframe.contentWindow.postMessage({ type: 'updateSchedule' }, '*');
    }
}

// Перезагрузка компьютера
function rebootComputer() {
    showBubble("🔄 Перезагрузка компьютера...", "system");
    setTimeout(() => {
        showBubble("✅ Компьютер перезагружен. Система работает стабильнее.", "system");
        rebootRequired = false;
        modifyTrust(5);
    }, 2000);
}

// Выключение компьютера (возврат на главный экран)
function shutdownComputer() {
    const shutdownOverlay = document.getElementById('shutdownOverlay');
    if (shutdownOverlay) {
        shutdownOverlay.classList.add('active');
        setTimeout(() => {
            const desktopElem = document.getElementById('desktop');
            if (desktopElem) desktopElem.style.display = 'none';
            shutdownOverlay.classList.remove('active');
            saveGame();
        }, 1500);
    }
}

// Включение компьютера (переход на рабочий стол)
function powerOnDesktop() {
    const desktopElem = document.getElementById('desktop');
    if (desktopElem) {
        desktopElem.style.display = 'block';
        updateStatsDisplay();
        generateDayNotifications();
        
        if (!gameData.hasActiveGame) {
            gameData.hasActiveGame = true;
            saveGame();
            showBubble("👋 Привет! Ты — Коля, первокурсник.", "character");
            showBubble("📁 Открой Браузер и зайди в Личный кабинет, чтобы начать расследование.", "system");
        } else {
            showBubble(`📅 День ${gameData.day}. Продолжаем расследование!`, "character");
        }
    }
}

// Сброс прогресса
function resetProgress() {
    if (confirm("⚠️ ВЫ УВЕРЕНЫ? Весь прогресс будет потерян!")) {
        gameData = {
            hasActiveGame: false,
            day: 1,
            trust: 70,
            intellect: 0,
            completedDays: [],
            errorLog: [],
            clues: [],
            notifications: [],
            readNotifications: [],
            lastAction: null
        };
        markedLessons = [];
        saveGame();
        showBubble("🔄 Прогресс сброшен.", "system");
        
        const desktopElem = document.getElementById('desktop');
        if (desktopElem) desktopElem.style.display = 'none';
    }
}

// ИНИЦИАЛИЗАЦИЯ
document.addEventListener('DOMContentLoaded', () => {
    loadGame();
    
    // Элементы
    desktop = document.getElementById('desktop');
    browserModal = document.getElementById('browserModal');
    deepseekChat = document.getElementById('deepseekChat');
    startMenu = document.getElementById('startMenu');
    notificationPanel = document.getElementById('notificationPanel');
    
    // Кнопки главного меню
    document.getElementById('newGameBtn')?.addEventListener('click', () => {
        if (gameData.hasActiveGame && confirm("Начать новую игру? Прогресс потеряется.")) {
            resetProgress();
        }
        powerOnDesktop();
    });
    
    document.getElementById('continueBtn')?.addEventListener('click', () => {
        if (gameData.hasActiveGame) {
            powerOnDesktop();
        } else {
            alert("❌ Нет сохранённой игры. Начните новую.");
        }
    });
    
    document.getElementById('resetBtn')?.addEventListener('click', resetProgress);
    document.getElementById('shutdownBtn')?.addEventListener('click', shutdownComputer);
    
    // Панель задач
    document.querySelector('.start-button')?.addEventListener('click', (e) => {
        e.stopPropagation();
        startMenu?.classList.toggle('active');
        notificationPanel?.classList.remove('active');
    });
    
    document.querySelector('.notification-area')?.addEventListener('click', (e) => {
        e.stopPropagation();
        notificationPanel?.classList.toggle('active');
        startMenu?.classList.remove('active');
        renderNotifications();
    });
    
    // Иконки на рабочем столе
    document.querySelector('.icon[data-app="browser"]')?.addEventListener('click', () => {
        browserModal?.classList.add('active');
        const iframe = document.getElementById('browserIframe');
        if (iframe && !iframe.src) {
            iframe.src = 'user.html';
        }
    });
    
    document.getElementById('deepseekIcon')?.addEventListener('click', () => {
        deepseekChat?.classList.toggle('active');
    });
    
    document.querySelector('.deepseek-close')?.addEventListener('click', () => {
        deepseekChat?.classList.remove('active');
    });
    
    // Закрытие окон
    document.getElementById('closeBrowserBtn')?.addEventListener('click', () => {
        browserModal?.classList.remove('active');
    });
    
    document.getElementById('browserMinBtn')?.addEventListener('click', () => {
        browserModal?.classList.remove('active');
    });
    
    browserModal?.addEventListener('click', (e) => {
        if (e.target === browserModal) browserModal.classList.remove('active');
    });
    
    // Переключение вкладок
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const page = btn.dataset.page;
            if (page) {
                const iframe = document.getElementById('browserIframe');
                if (iframe) iframe.src = page;
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            }
        });
    });
    
    // Меню пуск - кнопки
    document.getElementById('startShutdownBtn')?.addEventListener('click', shutdownComputer);
    document.getElementById('startRebootBtn')?.addEventListener('click', rebootComputer);
    document.getElementById('startBrowserBtn')?.addEventListener('click', () => {
        startMenu?.classList.remove('active');
        browserModal?.classList.add('active');
    });
    
    // Закрытие меню при клике вне
    document.addEventListener('click', (e) => {
        if (startMenu && !startMenu.contains(e.target) && !e.target.closest('.start-button')) {
            startMenu.classList.remove('active');
        }
        if (notificationPanel && !notificationPanel.contains(e.target) && !e.target.closest('.notification-area')) {
            notificationPanel.classList.remove('active');
        }
    });
    
    // Время
    function updateTime() {
        const timeElem = document.getElementById('currentTime');
        const dateElem = document.getElementById('currentDate');
        if (timeElem && dateElem) {
            const now = new Date();
            timeElem.textContent = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
            dateElem.textContent = now.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
        }
    }
    updateTime();
    setInterval(updateTime, 1000);
    
    // Если есть активная игра, показываем рабочий стол
    if (gameData.hasActiveGame && desktop) {
        desktop.style.display = 'block';
    }
});