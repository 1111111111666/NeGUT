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
    telegramMessages: [],
    readNotifications: [],
    lastAction: null,
    rebootCount: 0,
    vpnEnabled: false,
    deepseekUnlocked: false,
    terminalHistory: []
};

// Расписание пар по дням
let scheduleByDay = {};

// Команды терминала и их результаты
const terminalCommands = {
    "help": { description: "Показать список доступных команд" },
    "system.queue.check": { description: "Проверить очередь загрузки", day: 1, success: true, trust: 10, clue: "Очередь переполнена с 14:00 вчера", message: "✅ Файл восстановлен! Проблема решена.", explanation: "Очередь загрузки была переполнена, поэтому ваш файл не попал в систему. После очистки очереди файл успешно загрузился." },
    "auth.service.restart": { description: "Перезапустить аутентификацию", day: 1, success: false, trust: -5, clue: null, message: "❌ Ошибка осталась.", explanation: "Проблема не в аутентификации — сессия активна, но файл не может пройти через переполненную очередь." },
    "backup.files.list": { description: "Посмотреть бэкапы", day: 1, success: false, trust: 0, intellect: 5, clue: "Бэкапы не создавались 3 дня", message: "🔍 Улика найдена, но файл не восстановлен.", explanation: "Вы нашли важную улику: бэкапы не создавались 3 дня. Это объясняет, почему файл нельзя восстановить из резервной копии, но не решает проблему с очередью." },
    "api.gateway.restart": { description: "Перезапустить API-шлюз", day: 2, success: true, trust: 15, clue: "Шлюз не отвечал 2 часа", message: "✅ Оценка обновилась на 5!", explanation: "API-шлюз завис, поэтому оценки не обновлялись. После перезапуска всё заработало." },
    "api.timeout.set(60000)": { description: "Увеличить таймаут", day: 2, success: false, trust: -10, clue: null, message: "❌ Ошибка осталась.", explanation: "Увеличение таймаута не помогает — проблема не в скорости ответа, а в том, что шлюз полностью завис." },
    "curl -X GET /grades": { description: "Проверить эндпоинт", day: 2, success: false, trust: 0, intellect: 10, clue: "Эндпоинт возвращает пустой массив", message: "🔍 Диагностика найдена, но не исправлена.", explanation: "Эндпоинт /grades возвращает пустой массив — это подтверждает проблему, но не решает её. Нужно перезапустить шлюз." },
    "cache.flush": { description: "Сбросить кеш", day: 3, success: true, trust: 10, clue: "Кеш-ключи не обновлялись 7 дней", message: "✅ Данные обновились!", explanation: "Кеш не обновлялся неделю, поэтому пользователи видели старые данные. После сброса кеша всё актуально." },
    "system.reboot": { description: "Перезагрузить сервер", day: 3, success: false, trust: -15, clue: null, message: "❌ Кеш сбросился временно.", explanation: "Полная перезагрузка сервера — слишком радикальная мера. Кеш сбросился, но скоро вернётся к старым данным." },
    "cache.ttl.set(300)": { description: "Настроить TTL", day: 3, success: true, trust: 5, intellect: 5, clue: "TTL был 30 дней", message: "✅ Проблема решена!", explanation: "TTL был установлен на 30 дней — слишком много. Установка 5 минут решит проблему устаревших данных." },
    "vpn.check.disable": { description: "Отключить проверку VPN", day: 4, success: true, trust: 10, intellect: 5, clue: "Проверка VPN вызывала задержки", message: "✅ Ошибки 403 исчезли!", explanation: "Система проверяла VPN через внешние API, что вызывало задержки и ошибки 403. Отключение проверки решило проблему." },
    "vpn.check.keep": { description: "Оставить проверку VPN", day: 4, success: false, trust: -10, clue: null, message: "❌ Ошибки 403 остались.", explanation: "Оставление проверки VPN не решает проблему — внешние API продолжают блокировать запросы." },
    "vpn.check.migrate.local": { description: "Локальная проверка", day: 4, success: true, trust: 5, intellect: 10, clue: "Локальный флаг быстрее", message: "✅ Проблема решена!", explanation: "Замена внешней проверки на локальный флаг — хорошее решение, но требует миграции данных." },
    "report.generate": { description: "Сгенерировать отчёт", day: 5, success: true, trust: 20, intellect: 10, message: "✅ Отчёт готов! Угроза отчисления снята.", explanation: "Отчёт принят. Преподаватель доволен вашим расследованием." }
};

// Начальные сообщения для Telegram
const initialTelegramMessages = [
    { sender: "Одногруппник Петя", text: "Коля, работа не загрузилась! Почему у меня 2?" },
    { sender: "Классный руководитель", text: "Коля, это ещё что такое?! Почему у тебя 2 за лабораторную работу? Даже файл не отправил!" },
    { sender: "Преподаватель", text: "Студенты жалуются, что не могут сдать работы. Нужно срочно разобраться!" },
    { sender: "Зав. кафедрой", text: "Коля, бери ситуацию под контроль. Если не починишь - будут последствия." }
];

// Сообщения по дням (каждый день новые)
const telegramMessagesByDay = {
    1: [
        { sender: "Одногруппник Миша", text: "Слушай, у меня тоже файлы вообще не отправляются... Нас отчислят?" },
        { sender: "Одногруппница Лена", text: "Коля, ты же админ? Почини уже ЛК, а то я не могу лабу сдать!" }
    ],
    2: [
        { sender: "Преподаватель", text: "Учитель сказал, что поставил 5, но у меня всё ещё 2! Почини API!" },
        { sender: "Одногруппник Дима", text: "Коля, оценки не обновляются! Я уже 3 работы отправил, а в дневнике пусто!" },
        { sender: "Зав. кафедрой", text: "Коля, срочно почини всё это! Звонки от родителей студентов!" }
    ],
    3: [
        { sender: "Студентка Маша", text: "Коля, я вижу свои прошлогодние оценки! Это какой-то ужас!" },
        { sender: "Одногруппник Саша", text: "Коля, расписание старое! Я опоздал на пару из-за этого..." },
        { sender: "Преподаватель", text: "Коля, студенты путаются в расписании. Срочно разберись с кешем!" }
    ],
    4: [
        { sender: "Сис. администратор", text: "Коля, сервер стучится в Telegram/YouTube API! Это проверка VPN? Отключи это!" },
        { sender: "Одногруппница Лена", text: "Коля, у меня то загружается файл, то нет... Магия какая-то!" },
        { sender: "Преподаватель", text: "Коля, почему ЛК то работает, то нет? У меня студенты жалуются!" }
    ],
    5: [
        { sender: "Зам. директора", text: "Коля, завтра последний день. Если не исправишь всё - отчисление!" },
        { sender: "Преподаватель", text: "Коля, жду отчёт о причинах сбоев на столе завтра утром!" },
        { sender: "Одногруппник Петя", text: "Коля, держись! Мы верим в тебя! Почини этот чёртов ЛК!" }
    ]
};

// Инициализация расписания
function initSchedule() {
    scheduleByDay = {
        1: [
            { name: "Программирование", time: "10:00-11:30", reward: 10, taken: false },
            { name: "Математика", time: "12:00-13:30", reward: 8, taken: false },
            { name: "Английский язык", time: "14:00-15:30", reward: 5, taken: false }
        ],
        2: [
            { name: "Базы данных", time: "10:00-11:30", reward: 10, taken: false },
            { name: "Веб-разработка", time: "12:00-13:30", reward: 12, taken: false },
            { name: "Физика", time: "14:00-15:30", reward: 5, taken: false }
        ],
        3: [
            { name: "Операционные системы", time: "10:00-11:30", reward: 12, taken: false },
            { name: "Компьютерные сети", time: "12:00-13:30", reward: 10, taken: false }
        ],
        4: [
            { name: "Тестирование ПО", time: "10:00-11:30", reward: 8, taken: false },
            { name: "Английский язык", time: "13:00-14:30", reward: 5, taken: false },
            { name: "Математика", time: "15:00-16:30", reward: 8, taken: false }
        ],
        5: [
            { name: "Дипломное проектирование", time: "10:00-11:30", reward: 15, taken: false },
            { name: "Карьера в IT", time: "12:00-13:30", reward: 10, taken: false }
        ],
        6: [
            { name: "Защита курсовой", time: "10:00-12:00", reward: 20, taken: false }
        ]
    };
}

// Перетаскивание окон
function makeDraggable(element, handle) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    handle.onmousedown = dragMouseDown;
    
    function dragMouseDown(e) {
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }
    
    function elementDrag(e) {
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        let newTop = element.offsetTop - pos2;
        let newLeft = element.offsetLeft - pos1;
        newTop = Math.max(0, Math.min(window.innerHeight - element.offsetHeight, newTop));
        newLeft = Math.max(0, Math.min(window.innerWidth - element.offsetWidth, newLeft));
        element.style.top = newTop + "px";
        element.style.left = newLeft + "px";
        element.style.bottom = "auto";
        element.style.right = "auto";
    }
    
    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

// Загрузка сохранения
function loadGame() {
    const saved = localStorage.getItem("spbGameSave");
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            gameData = { ...gameData, ...parsed };
            if (!gameData.terminalHistory) gameData.terminalHistory = [];
            // Восстанавливаем расписание
            for (let day in scheduleByDay) {
                for (let lesson of scheduleByDay[day]) {
                    const savedKey = `marked_${day}_${lesson.name}`;
                    lesson.taken = localStorage.getItem(savedKey) === 'true';
                }
            }
        } catch(e) { console.error("Ошибка загрузки", e); }
    } else {
        initSchedule();
    }
    updateStatsDisplay();
}

// Сохранение
function saveGame() {
    localStorage.setItem("spbGameSave", JSON.stringify(gameData));
    // Сохраняем отметки на парах отдельно для каждого дня
    for (let day in scheduleByDay) {
        for (let lesson of scheduleByDay[day]) {
            const savedKey = `marked_${day}_${lesson.name}`;
            if (lesson.taken) {
                localStorage.setItem(savedKey, 'true');
            } else {
                localStorage.removeItem(savedKey);
            }
        }
    }
    updateStatsDisplay();
}

// Обновление статистики на панели
function updateStatsDisplay() {
    const trustValue = document.getElementById('trustValue');
    const intellectValue = document.getElementById('intellectValue');
    const trustFill = document.getElementById('trustFill');
    const intellectFill = document.getElementById('intellectFill');
    
    if (trustValue) trustValue.textContent = gameData.trust;
    if (intellectValue) intellectValue.textContent = gameData.intellect;
    if (trustFill) trustFill.style.width = Math.min(100, Math.max(0, gameData.trust)) + '%';
    if (intellectFill) intellectFill.style.width = Math.min(100, (gameData.intellect / 100) * 100) + '%';
    
    updateDeepseekAdvice();
    
    if (gameData.trust <= 20 && gameData.day < 5 && !gameData.completedDays.includes(4)) {
        gameData.day = 5;
        saveGame();
        addTelegramMessage("Зам. директора", "Доверия больше нет. Завтра отчисление!");
        addNotification("⚠️ ДОВЕРИЕ НА НУЛЕ! Завтра отчисление!", "alert");
    }
}

// DeepSeek подсказки
function updateDeepseekAdvice() {
    const adviceDiv = document.getElementById('deepseekAdvice');
    if (!adviceDiv) return;
    
    if (gameData.intellect >= 30) {
        gameData.deepseekUnlocked = true;
        const dayCommands = {
            1: "system.queue.check",
            2: "api.gateway.restart", 
            3: "cache.flush",
            4: "vpn.check.disable",
            5: "report.generate"
        };
        const advice = terminalCommands[dayCommands[gameData.day]]?.description || "Введите 'help' для списка команд";
        adviceDiv.innerHTML = `<strong>🤖 Совет DeepSeek:</strong><br>Попробуйте команду: ${dayCommands[gameData.day] || "help"} - ${advice}`;
        adviceDiv.style.background = "#0a0a1a";
        adviceDiv.style.color = "#00ff00";
    } else {
        gameData.deepseekUnlocked = false;
        adviceDiv.innerHTML = `<strong>🔒 DeepSeek заблокирован</strong><br>Посещайте пары, чтобы повысить интеллект до 30 (сейчас ${gameData.intellect}/30) и получить доступ к подсказкам!`;
        adviceDiv.style.background = "#2a1a1a";
        adviceDiv.style.color = "#ff8888";
    }
}

// Telegram сообщения
function addTelegramMessage(sender, text) {
    const newMsg = {
        id: Date.now(),
        sender: sender,
        text: text,
        time: new Date().toLocaleTimeString(),
        read: false
    };
    gameData.telegramMessages.unshift(newMsg);
    if (gameData.telegramMessages.length > 50) gameData.telegramMessages.pop();
    saveGame();
    
    addNotification(`📨 ${sender}: ${text.substring(0, 50)}...`, "telegram");
    updateTelegramBadge();
    renderTelegramMessages();
}

function updateTelegramBadge() {
    const unreadCount = gameData.telegramMessages.filter(m => !m.read).length;
    const badge = document.getElementById('telegramBadge');
    if (badge) {
        badge.style.display = unreadCount > 0 ? 'flex' : 'none';
    }
}

// Проверка доступности Telegram (всегда требует VPN после дня 3)
function isTelegramAvailable() {
    if (gameData.day >= 4 && !gameData.completedDays.includes(4)) {
        return gameData.vpnEnabled;
    }
    return gameData.vpnEnabled;
}

// Проверка доступности ЛК
function isLKAvailable() {
    if (gameData.day >= 4 && !gameData.completedDays.includes(4)) {
        return !gameData.vpnEnabled;
    }
    return true;
}

// Отображение сообщений Telegram
function renderTelegramMessages() {
    const container = document.getElementById('telegramMessagesContainer');
    if (!container) return;
    
    if (!isTelegramAvailable()) {
        container.innerHTML = `
            <div class="telegram-error">
                <div class="telegram-error-icon">🔒</div>
                <div class="telegram-error-title">403 Forbidden</div>
                <div class="telegram-error-text">Доступ к Telegram заблокирован</div>
                <div class="telegram-error-text" style="margin-top: 10px;">Для доступа необходимо включить VPN</div>
                <div class="telegram-error-text" style="margin-top: 5px; font-size: 11px;">Откройте приложение VPN Client</div>
            </div>
        `;
        return;
    }
    
    if (gameData.telegramMessages.length === 0) {
        container.innerHTML = '<div style="padding: 20px; text-align: center; color: #886633;">Нет сообщений</div>';
        return;
    }
    
    container.innerHTML = gameData.telegramMessages.slice(0, 50).map(msg => `
        <div class="telegram-message" style="background: white; border: 2px solid #ffdd99; padding: 12px; margin-bottom: 12px; border-radius: 8px;">
            <div style="font-weight: bold; color: #442200; font-size: 13px; margin-bottom: 5px;">📨 ${msg.sender}</div>
            <div style="font-size: 13px; color: #333; margin-bottom: 5px;">${msg.text}</div>
            <div style="font-size: 10px; color: #886633; text-align: right;">${msg.time}</div>
        </div>
    `).join('');
    
    gameData.telegramMessages.forEach(m => { m.read = true; });
    saveGame();
    updateTelegramBadge();
}

// Генерация сообщений по дням (каждый день новые)
function generateTelegramMessages() {
    if (!gameData.hasActiveGame || gameData.telegramMessages.length === 0) {
        setTimeout(() => {
            initialTelegramMessages.forEach((msg, index) => {
                setTimeout(() => {
                    addTelegramMessage(msg.sender, msg.text);
                }, index * 2000);
            });
        }, 1000);
    }
    
    const msgs = telegramMessagesByDay[gameData.day];
    if (msgs) {
        // Проверяем, не отправляли ли уже сообщения за этот день
        const todayMessagesKey = `day_${gameData.day}_messages_sent`;
        if (!localStorage.getItem(todayMessagesKey)) {
            setTimeout(() => {
                msgs.forEach((msg, index) => {
                    setTimeout(() => {
                        addTelegramMessage(msg.sender, msg.text);
                    }, index * 3000);
                });
                localStorage.setItem(todayMessagesKey, 'true');
            }, 5000);
        }
    }
}

// Уведомления (только важные)
function addNotification(text, type = "thought") {
    const newNotif = {
        id: Date.now(),
        text: text,
        type: type,
        time: new Date().toLocaleTimeString(),
        read: false
    };
    gameData.notifications.unshift(newNotif);
    if (gameData.notifications.length > 30) gameData.notifications.pop();
    saveGame();
    updateNotificationBadge();
}

function updateNotificationBadge() {
    const badge = document.querySelector('.notification-badge');
    const unreadCount = gameData.notifications.filter(n => !n.read).length;
    if (badge) {
        badge.style.display = unreadCount > 0 ? 'block' : 'none';
    }
}

function renderNotifications() {
    const list = document.getElementById('notificationList');
    if (!list) return;
    
    if (gameData.notifications.length === 0) {
        list.innerHTML = '<div class="notification-item">Нет уведомлений</div>';
        return;
    }
    
    list.innerHTML = gameData.notifications.slice(0, 30).map(notif => `
        <div class="notification-item ${!notif.read ? 'unread' : ''}" data-id="${notif.id}">
            <div>${notif.text}</div>
            <div class="notification-time">${notif.time}</div>
        </div>
    `).join('');
    
    gameData.notifications.forEach(n => { n.read = true; });
    saveGame();
    updateNotificationBadge();
}

// Изменение доверия
function modifyTrust(delta) {
    let newTrust = gameData.trust + delta;
    if (delta === 5 && gameData.rebootCount >= gameData.day) return;
    if (delta === 5) gameData.rebootCount = gameData.day;
    
    gameData.trust = Math.min(100, Math.max(0, newTrust));
    saveGame();
    updateStatsDisplay();
}

// Изменение интеллекта
function modifyIntellect(delta) {
    gameData.intellect = Math.min(100, Math.max(0, gameData.intellect + delta));
    saveGame();
    updateStatsDisplay();
}

// Добавление улики
function addClue(clue) {
    if (clue && !gameData.clues.includes(clue)) {
        gameData.clues.push(clue);
        addNotification(`🔍 Улика: ${clue}`, "clue");
        saveGame();
    }
}

// Добавление в журнал ошибок
function addToErrorLog(action, result, message, day, explanation, trustDelta, intellectDelta) {
    gameData.errorLog.unshift({
        id: Date.now(),
        day: day || gameData.day,
        action: action,
        result: result,
        message: message,
        explanation: explanation || message,
        timestamp: new Date().toLocaleTimeString(),
        trustDelta: trustDelta || 0,
        intellectDelta: intellectDelta || 0
    });
    saveGame();
}

// Функция для добавления в терминал
function addToTerminalFromGame(text, isError, isSuccess) {
    const adminIframe = document.getElementById('browserIframe');
    if (adminIframe && adminIframe.contentWindow && adminIframe.contentWindow.addToTerminal) {
        adminIframe.contentWindow.addToTerminal(text, isError, isSuccess);
    }
    gameData.terminalHistory.push({ text, isError, isSuccess, timestamp: Date.now() });
    if (gameData.terminalHistory.length > 100) gameData.terminalHistory.shift();
    saveGame();
}

// Восстановление истории терминала
function restoreTerminalHistory() {
    const adminIframe = document.getElementById('browserIframe');
    if (adminIframe && adminIframe.contentWindow && adminIframe.contentWindow.addToTerminal && gameData.terminalHistory) {
        gameData.terminalHistory.forEach(entry => {
            adminIframe.contentWindow.addToTerminal(entry.text, entry.isError, entry.isSuccess);
        });
    }
}

// ГЛАВНАЯ ФУНКЦИЯ ВЫПОЛНЕНИЯ КОМАНД
function executeCommand(command) {
    console.log("📟 Выполнение команды:", command);
    const cmd = command.toLowerCase().trim();
    
    addToTerminalFromGame(`> ${command}`, false, false);
    
    if (cmd === "help") {
        addToTerminalFromGame("=== ДОСТУПНЫЕ КОМАНДЫ ===", false, false);
        for (let cmdName in terminalCommands) {
            if (terminalCommands[cmdName].description) {
                const dayInfo = terminalCommands[cmdName].day ? `[День ${terminalCommands[cmdName].day}]` : '';
                addToTerminalFromGame(`${cmdName.padEnd(30)} ${dayInfo.padEnd(10)} - ${terminalCommands[cmdName].description}`, false, false);
            }
        }
        addToTerminalFromGame(`📅 Текущий день: ${gameData.day} | ❤️ Доверие: ${gameData.trust} | 🧠 Интеллект: ${gameData.intellect}`, false, false);
        return;
    }
    
    const cmdData = terminalCommands[cmd];
    if (!cmdData) {
        addToTerminalFromGame(`❌ Команда не найдена: ${command}`, true, false);
        addToTerminalFromGame(`💡 Введите 'help' для списка команд`, false, false);
        return;
    }
    
    // Проверка дня
    if (cmdData.day && cmdData.day !== gameData.day) {
        if (gameData.day > cmdData.day && gameData.completedDays.includes(cmdData.day)) {
            addToTerminalFromGame(`⚠️ Эта проблема уже решена в день ${cmdData.day}`, true, false);
        } else {
            addToTerminalFromGame(`❌ Сейчас день ${gameData.day}. Эта команда не актуальна.`, true, false);
        }
        return;
    }
    
    if (cmdData.day && gameData.completedDays.includes(gameData.day)) {
        addToTerminalFromGame(`⚠️ Проблема дня ${gameData.day} уже решена!`, true, false);
        return;
    }
    
    // Выполнение команды
    if (cmdData.trust) modifyTrust(cmdData.trust);
    if (cmdData.intellect) modifyIntellect(cmdData.intellect);
    if (cmdData.clue) addClue(cmdData.clue);
    
    addToErrorLog(command, cmdData.success ? 'исправлена' : 'не исправлена', cmdData.message, cmdData.day, cmdData.explanation, cmdData.trust || 0, cmdData.intellect || 0);
    
    if (cmdData.success) {
        addToTerminalFromGame(`✅ ${cmdData.message}`, false, true);
        addToTerminalFromGame(`📝 Пояснение: ${cmdData.explanation}`, false, false);
    } else {
        addToTerminalFromGame(`❌ ${cmdData.message}`, true, false);
        addToTerminalFromGame(`📝 Пояснение: ${cmdData.explanation}`, false, false);
    }
    
    // Если команда успешна и соответствует дню
    if (cmdData.success && cmdData.day && cmdData.day === gameData.day) {
        if (!gameData.completedDays.includes(cmdData.day)) {
            gameData.completedDays.push(cmdData.day);
            saveGame();
            addToTerminalFromGame(`📅 День ${gameData.day} решён! Выключите компьютер и нажмите "Продолжить игру".`, false, false);
            addNotification(`✅ День ${gameData.day} решён! Выключите компьютер и нажмите "Продолжить игру".`, "success");
        }
    }
}

// Переход на следующий день (вызывается при продолжении игры)
function advanceToNextDay() {
    if (gameData.completedDays.includes(gameData.day) && gameData.day < 5) {
        gameData.day++;
        saveGame();
        addNotification(`📅 День ${gameData.day} начался! Решите новую проблему.`, "info");
        generateTelegramMessages();
        
        // Обновляем расписание в user.html
        const iframe = document.getElementById('browserIframe');
        if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage({ type: 'updateSchedule' }, '*');
        }
        return true;
    }
    return false;
}

// Отметка на паре
function markAttendance(lessonName, reward) {
    const gameData = getGameData();
    const currentDay = gameData?.day || 1;
    const savedKey = `marked_${currentDay}_${lessonName}`;
    
    if (localStorage.getItem(savedKey)) {
        addNotification("❌ Вы уже отметились на этой паре!", "alert");
        return false;
    }
    
    localStorage.setItem(savedKey, 'true');
    modifyIntellect(reward);
    addNotification(`✅ Отмечено на "${lessonName}"! +${reward} интеллекта`, "success");
    saveGame();
    
    const iframe = document.getElementById('browserIframe');
    if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: 'updateSchedule' }, '*');
    }
    return true;
}

// VPN логика
function toggleVPN() {
    gameData.vpnEnabled = !gameData.vpnEnabled;
    saveGame();
    
    const vpnStatusDiv = document.getElementById('vpnStatus');
    const vpnBtn = document.getElementById('vpnToggleBtn');
    
    if (gameData.vpnEnabled) {
        if (vpnStatusDiv) {
            vpnStatusDiv.className = 'vpn-status on';
            vpnStatusDiv.innerHTML = '<div class="vpn-status-icon">🟢</div><div class="vpn-status-text">VPN: ВКЛЮЧЕН</div>';
        }
        if (vpnBtn) {
            vpnBtn.textContent = 'ВЫКЛЮЧИТЬ VPN';
            vpnBtn.className = 'vpn-toggle-btn on';
        }
        addNotification("🌐 VPN ВКЛЮЧЕН. Telegram работает, Личный кабинет может выдавать 403!", "alert");
    } else {
        if (vpnStatusDiv) {
            vpnStatusDiv.className = 'vpn-status off';
            vpnStatusDiv.innerHTML = '<div class="vpn-status-icon">🔴</div><div class="vpn-status-text">VPN: ВЫКЛЮЧЕН</div>';
        }
        if (vpnBtn) {
            vpnBtn.textContent = 'ВКЛЮЧИТЬ VPN';
            vpnBtn.className = 'vpn-toggle-btn off';
        }
        addNotification("🌐 VPN ВЫКЛЮЧЕН. Личный кабинет работает, Telegram недоступен", "alert");
    }
    
    renderTelegramMessages();
    
    const iframe = document.getElementById('browserIframe');
    if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: 'vpnToggle', enabled: gameData.vpnEnabled }, '*');
    }
}

// Перезагрузка компьютера
function rebootComputer() {
    const overlay = document.getElementById('shutdownOverlay');
    if (overlay) {
        overlay.classList.add('active');
        overlay.querySelector('.shutdown-text').textContent = 'Перезагрузка...';
        setTimeout(() => {
            overlay.classList.remove('active');
            overlay.querySelector('.shutdown-text').textContent = 'Выключение...';
            addNotification("🔄 Компьютер перезагружен.", "info");
            modifyTrust(5);
        }, 2000);
    }
}

// Выключение компьютера
function shutdownComputer() {
    const overlay = document.getElementById('shutdownOverlay');
    if (overlay) {
        overlay.classList.add('active');
        setTimeout(() => {
            const desktopElem = document.getElementById('desktop');
            if (desktopElem) desktopElem.style.display = 'none';
            overlay.classList.remove('active');
            saveGame();
        }, 1500);
    }
}

// Включение рабочего стола
function powerOnDesktop() {
    const desktopElem = document.getElementById('desktop');
    if (desktopElem) {
        desktopElem.style.display = 'block';
        updateStatsDisplay();
        
        setTimeout(() => {
            restoreTerminalHistory();
        }, 500);
        
        if (!gameData.hasActiveGame) {
            gameData.hasActiveGame = true;
            initSchedule();
            saveGame();
            addNotification("👋 Привет! Впервые тут? Открой файл 'Инструкция', расположенный на рабочем столе.", "character");
            generateTelegramMessages();
        } else {
            // Проверяем, нужно ли перейти на следующий день
            if (gameData.completedDays.includes(gameData.day) && gameData.day < 5) {
                advanceToNextDay();
            } else if (gameData.day === 5 && gameData.completedDays.includes(5)) {
                showFinalChoice();
            } else {
                addNotification(`📅 День ${gameData.day}. Продолжаем расследование!`, "character");
                generateTelegramMessages();
            }
        }
    }
}

// Сброс прогресса
function resetProgress() {
    if (confirm("⚠ ВЫ УВЕРЕНЫ? Весь прогресс будет потерян!")) {
        gameData = {
            hasActiveGame: false,
            day: 1,
            trust: 70,
            intellect: 0,
            completedDays: [],
            errorLog: [],
            clues: [],
            notifications: [],
            telegramMessages: [],
            readNotifications: [],
            lastAction: null,
            rebootCount: 0,
            vpnEnabled: false,
            deepseekUnlocked: false,
            terminalHistory: []
        };
        initSchedule();
        // Очищаем отметки на парах
        for (let day in scheduleByDay) {
            for (let lesson of scheduleByDay[day]) {
                localStorage.removeItem(`marked_${day}_${lesson.name}`);
            }
        }
        // Очищаем отметки о отправленных сообщениях
        for (let i = 1; i <= 6; i++) {
            localStorage.removeItem(`day_${i}_messages_sent`);
        }
        saveGame();
        addNotification("🔄 Прогресс сброшен.", "system");
        
        const desktopElem = document.getElementById('desktop');
        if (desktopElem) desktopElem.style.display = 'none';
        
        const iframe = document.getElementById('browserIframe');
        if (iframe) iframe.src = 'user.html';
    }
}

// Финальная катсцена
function showFinalChoice() {
    addNotification("🏆 РАССЛЕДОВАНИЕ ЗАВЕРШЕНО! 🏆", "system");
    
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.95);
        z-index: 10000;
        display: flex;
        justify-content: center;
        align-items: center;
        font-family: 'Courier New', monospace;
    `;
    
    const endings = {
        tech: { title: "🏆 ТЕХНИЧЕСКАЯ ПОБЕДА", text: "API не выдержал нагрузки. Систему масштабировали, вас повысили до старшего администратора.", icon: "🔧", color: "#4caf50" },
        sabotage: { title: "🕵️ ЗАГОВОР РАСКРЫТ", text: "Вы нашли следы взлома! Обиженный студент. Его отчислили, вас наградили.", icon: "🕵️", color: "#ff9800" },
        accident: { title: "😅 НЕСЧАСТНЫЙ СЛУЧАЙ", text: "Сисадмин споткнулся о кабель. Его не уволили, поставили на кофе. Вас угостили пиццей!", icon: "🍕", color: "#2196f3" },
        virus: { title: "💻 ВИРУСНАЯ АТАКА", text: "Вы обнаружили вирус! Антивирусная компания предложила вам работу.", icon: "💻", color: "#9c27b0" }
    };
    
    let html = `
        <div style="background: #ffdd99; border: 8px solid #ffaa44; padding: 30px; max-width: 500px; text-align: center;">
            <h2 style="color: #442200; margin-bottom: 20px;">🔍 ВЫБЕРИТЕ ПРИЧИНУ СБОЯ</h2>
    `;
    
    for (let [key, ending] of Object.entries(endings)) {
        html += `
            <button class="final-option" data-result="${key}" style="
                display: block;
                width: 100%;
                margin: 10px 0;
                padding: 15px;
                background: ${ending.color};
                border: none;
                font-family: 'Courier New', monospace;
                font-weight: bold;
                font-size: 16px;
                cursor: pointer;
                color: white;
            ">
                ${ending.icon} ${ending.title.split(' ').slice(1).join(' ')}
            </button>
        `;
    }
    
    html += `
            <div style="margin-top: 20px; padding: 15px; background: #ffcc77;">
                <p>📊 ВАША СТАТИСТИКА:</p>
                <p>❤️ Доверие: ${gameData.trust}% | 🧠 Интеллект: ${gameData.intellect}</p>
                <p>📅 Пройдено дней: ${gameData.completedDays.length}/5</p>
                <p>🔍 Собрано улик: ${gameData.clues.length}</p>
            </div>
            <button id="closeFinalModal" style="margin-top: 15px; padding: 8px 20px; background: #442200; color: white; border: none; cursor: pointer;">Закрыть</button>
        </div>
    `;
    
    modal.innerHTML = html;
    document.body.appendChild(modal);
    
    document.querySelectorAll('.final-option').forEach(btn => {
        btn.addEventListener('click', () => {
            const result = btn.dataset.result;
            const ending = endings[result];
            
            modal.innerHTML = `
                <div style="background: #ffdd99; border: 8px solid #ffaa44; padding: 30px; max-width: 500px; text-align: center;">
                    <h2 style="color: #442200;">${ending.title}</h2>
                    <div style="font-size: 64px; margin: 20px;">${ending.icon}</div>
                    <p style="margin: 20px 0;">${ending.text}</p>
                    <button id="restartGameBtn" style="margin-top: 10px; padding: 10px 30px; background: #4caf50; color: white; border: none; cursor: pointer;">▶ Играть снова</button>
                    <button id="closeFinalModal2" style="margin-top: 10px; margin-left: 10px; padding: 10px 30px; background: #442200; color: white; border: none; cursor: pointer;">Закрыть</button>
                </div>
            `;
            
            document.getElementById('restartGameBtn')?.addEventListener('click', () => {
                modal.remove();
                resetProgress();
                powerOnDesktop();
            });
            document.getElementById('closeFinalModal2')?.addEventListener('click', () => modal.remove());
        });
    });
    
    document.getElementById('closeFinalModal')?.addEventListener('click', () => modal.remove());
}

// Открытие приложений
function openApp(appName) {
    const apps = {
        'deepseek': document.getElementById('deepseekChat'),
        'telegram': document.getElementById('telegramChat'),
        'vpn': document.getElementById('vpnApp'),
        'notepad': document.getElementById('notepadApp')
    };
    
    const app = apps[appName];
    if (app) {
        app.style.display = 'flex';
        if (appName === 'telegram') renderTelegramMessages();
    }
}

// Обработка сообщений от iframe (терминал)
window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'terminalCommand') {
        const command = event.data.command;
        console.log("📟 Получена команда из iframe:", command);
        executeCommand(command);
    }
});

// ИНИЦИАЛИЗАЦИЯ
document.addEventListener('DOMContentLoaded', () => {
    initSchedule();
    loadGame();
    
    console.log("Game initialized");
    
    const desktop = document.getElementById('desktop');
    const browserModal = document.getElementById('browserModal');
    const startMenu = document.getElementById('startMenu');
    const notificationPanel = document.getElementById('notificationPanel');
    
    // Настройка перетаскивания
    const deepseek = document.getElementById('deepseekChat');
    const telegram = document.getElementById('telegramChat');
    const vpn = document.getElementById('vpnApp');
    const notepad = document.getElementById('notepadApp');
    
    if (deepseek && deepseek.querySelector('.deepseek-header')) {
        makeDraggable(deepseek, deepseek.querySelector('.deepseek-header'));
    }
    if (telegram && telegram.querySelector('.telegram-header')) {
        makeDraggable(telegram, telegram.querySelector('.telegram-header'));
    }
    if (vpn && vpn.querySelector('.vpn-header')) {
        makeDraggable(vpn, vpn.querySelector('.vpn-header'));
    }
    if (notepad && notepad.querySelector('.notepad-header')) {
        makeDraggable(notepad, notepad.querySelector('.notepad-header'));
    }
    
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
            alert("❌ Нет сохранённой игры.");
        }
    });
    
    document.getElementById('resetBtn')?.addEventListener('click', resetProgress);
    
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
        if (iframe && (!iframe.src || iframe.src === 'about:blank')) {
            iframe.src = 'user.html';
        }
        setTimeout(() => {
            restoreTerminalHistory();
        }, 500);
    });
    
    document.getElementById('deepseekIcon')?.addEventListener('click', () => openApp('deepseek'));
    document.getElementById('telegramIcon')?.addEventListener('click', () => openApp('telegram'));
    document.getElementById('vpnIcon')?.addEventListener('click', () => openApp('vpn'));
    document.getElementById('notepadIcon')?.addEventListener('click', () => openApp('notepad'));
    
    // Панель задач - иконки
    document.querySelector('.taskbar-app-icon[data-app="browser"]')?.addEventListener('click', () => {
        browserModal?.classList.add('active');
        setTimeout(() => {
            restoreTerminalHistory();
        }, 500);
    });
    
    document.getElementById('deepseekTaskbarIcon')?.addEventListener('click', () => openApp('deepseek'));
    document.getElementById('telegramTaskbarIcon')?.addEventListener('click', () => openApp('telegram'));
    document.getElementById('vpnTaskbarIcon')?.addEventListener('click', () => openApp('vpn'));
    document.getElementById('notepadTaskbarIcon')?.addEventListener('click', () => openApp('notepad'));
    
    // Кнопки закрытия
    document.querySelector('.deepseek-close')?.addEventListener('click', () => {
        document.getElementById('deepseekChat').style.display = 'none';
    });
    
    document.querySelector('.telegram-close')?.addEventListener('click', () => {
        document.getElementById('telegramChat').style.display = 'none';
    });
    
    document.querySelector('.vpn-close')?.addEventListener('click', () => {
        document.getElementById('vpnApp').style.display = 'none';
    });
    
    document.querySelector('.notepad-close')?.addEventListener('click', () => {
        document.getElementById('notepadApp').style.display = 'none';
    });
    
    document.getElementById('vpnToggleBtn')?.addEventListener('click', toggleVPN);
    
    // Браузер
    document.getElementById('closeBrowserBtn')?.addEventListener('click', () => {
        browserModal?.classList.remove('active');
    });
    
    document.getElementById('browserMinBtn')?.addEventListener('click', () => {
        browserModal?.classList.remove('active');
    });
    
    browserModal?.addEventListener('click', (e) => {
        if (e.target === browserModal) browserModal.classList.remove('active');
    });
    
    // Вкладки браузера
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const page = btn.dataset.page;
            if (page) {
                const iframe = document.getElementById('browserIframe');
                if (iframe) iframe.src = page;
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                if (page === 'admin.html') {
                    setTimeout(() => {
                        restoreTerminalHistory();
                    }, 500);
                }
            }
        });
    });
    
    // Меню пуск
    document.getElementById('startShutdownBtn')?.addEventListener('click', shutdownComputer);
    document.getElementById('startRebootBtn')?.addEventListener('click', rebootComputer);
    
    const startBrowserBtn = document.querySelector('.start-menu-item[data-app="browser"]');
    if (startBrowserBtn) {
        startBrowserBtn.addEventListener('click', () => {
            startMenu?.classList.remove('active');
            browserModal?.classList.add('active');
            setTimeout(() => {
                restoreTerminalHistory();
            }, 500);
        });
    }
    
    document.getElementById('startDeepseekBtn')?.addEventListener('click', () => {
        startMenu?.classList.remove('active');
        openApp('deepseek');
    });
    
    document.getElementById('startTelegramBtn')?.addEventListener('click', () => {
        startMenu?.classList.remove('active');
        openApp('telegram');
    });
    
    document.getElementById('startVpnBtn')?.addEventListener('click', () => {
        startMenu?.classList.remove('active');
        openApp('vpn');
    });
    
    document.getElementById('startNotepadBtn')?.addEventListener('click', () => {
        startMenu?.classList.remove('active');
        openApp('notepad');
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
    
    if (gameData.hasActiveGame && desktop) {
        desktop.style.display = 'block';
        setTimeout(() => {
            restoreTerminalHistory();
        }, 1000);
    }
});

// Экспорт глобальных функций
window.executeCommand = executeCommand;
window.modifyTrust = modifyTrust;
window.modifyIntellect = modifyIntellect;
window.addNotification = addNotification;
window.getGameData = () => gameData;
window.updateGameData = (data) => { if (data) { Object.assign(gameData, data); saveGame(); } };
window.markAttendance = markAttendance;
window.rebootComputer = rebootComputer;
window.shutdownComputer = shutdownComputer;
window.getTodaySchedule = () => scheduleByDay[gameData.day];
window.toggleVPN = toggleVPN;
window.isTelegramAvailable = isTelegramAvailable;
window.isLKAvailable = isLKAvailable;
window.renderTelegramMessages = renderTelegramMessages;
window.addToTerminalFromGame = addToTerminalFromGame;
window.advanceToNextDay = advanceToNextDay;

console.log("Game.js loaded, executeCommand exported");