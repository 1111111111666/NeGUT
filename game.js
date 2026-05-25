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
    deepseekUnlocked: false
};

// Расписание пар по дням
let scheduleByDay = {};

// Правильные решения по дням
const correctActions = {
    1: "system.queue.check",
    2: "api.gateway.restart",
    3: "cache.flush",
    4: "vpn.check.disable"
};

// Команды терминала
const terminalCommands = {
    "help": { description: "Показать список доступных команд" },
    "system.queue.check": { description: "Проверить очередь загрузки файлов", day: 1, success: true, trust: 10, clue: "Очередь переполнена с 14:00 вчера", message: "✅ Файл восстановлен!" },
    "auth.service.restart": { description: "Перезапустить сервис аутентификации", day: 1, success: false, trust: -5, message: "❌ Ошибка осталась." },
    "backup.files.list": { description: "Посмотреть бэкапы файлов", day: 1, success: false, trust: 0, intellect: 5, clue: "Бэкапы не создавались 3 дня", message: "🔍 Улика найдена." },
    "api.gateway.restart": { description: "Перезапустить API-шлюз", day: 2, success: true, trust: 15, clue: "Шлюз не отвечал 2 часа", message: "✅ Оценка обновилась на 5!" },
    "api.timeout.set(60000)": { description: "Увеличить таймаут до 60 секунд", day: 2, success: false, trust: -10, message: "❌ Ошибка осталась." },
    "curl -X GET /grades": { description: "Проверить эндпоинт /grades", day: 2, success: false, trust: 0, intellect: 10, clue: "Эндпоинт возвращает пустой массив", message: "🔍 Диагностика найдена." },
    "cache.flush": { description: "Сбросить кеш вручную", day: 3, success: true, trust: 10, clue: "Кеш-ключи не обновлялись 7 дней", message: "✅ Данные обновились!" },
    "system.reboot": { description: "Перезагрузить сервер", day: 3, success: false, trust: -15, message: "❌ Кеш сбросился временно." },
    "cache.ttl.set(300)": { description: "Настроить TTL кеша", day: 3, success: true, trust: 5, intellect: 5, clue: "TTL был 30 дней", message: "✅ Проблема решена!" },
    "vpn.check.disable": { description: "Отключить проверку VPN", day: 4, success: true, trust: 10, intellect: 5, clue: "Проверка VPN вызывала задержки", message: "✅ Ошибки 403 исчезли!" },
    "vpn.check.keep": { description: "Оставить проверку VPN", day: 4, success: false, trust: -10, message: "❌ Ошибки 403 остались." },
    "vpn.check.migrate.local": { description: "Локальная проверка VPN", day: 4, success: true, trust: 5, intellect: 10, clue: "Локальный флаг быстрее", message: "✅ Проблема решена!" },
    "report.generate": { description: "Сгенерировать отчёт", day: 5, success: true, trust: 20, intellect: 10, message: "✅ Отчёт готов!" }
};

// Начальные сообщения для Telegram
const initialTelegramMessages = [
    { sender: "Преподаватель", text: "Привет, Коля! Ты же на программиста поступил? У нас проблемы с личным кабинетом." },
    { sender: "Классный руководитель", text: "Коля, это ещё что такое?! Почему у тебя 2 за лабораторную работу? Даже файл не отправил!" },
    { sender: "Преподаватель", text: "Студенты жалуются, что не могут сдать работы. Нужно срочно разобраться!" },
    { sender: "Зав. кафедрой", text: "Коля, бери ситуацию под контроль. Если не починишь - будут последствия." }
];

// Сообщения для Телеграма по дням
const telegramMessagesByDay = {
    1: [
        { sender: "Преподаватель", text: "Коля, работа не загрузилась! Почему у меня 2?" },
        { sender: "Одногруппник Петя", text: "Слушай, у меня тоже файлы не отправляются..." }
    ],
    2: [
        { sender: "Преподаватель", text: "Учитель сказал, что поставил 5, но у меня всё ещё 2!" },
        { sender: "Зав. кафедрой", text: "Коля, срочно почини API оценивания!" }
    ],
    3: [
        { sender: "Студентка Маша", text: "Коля, я вижу свои прошлогодние оценки!" },
        { sender: "Преподаватель", text: "Расписание старое! Студенты путаются!" }
    ],
    4: [
        { sender: "Сис. администратор", text: "Коля, сервер стучится в Telegram/YouTube API! Это какая-то проверка VPN?" },
        { sender: "Одногруппница Лена", text: "У меня то загружается файл, то нет... Магия какая-то!" }
    ],
    5: [
        { sender: "Зам. директора", text: "Завтра последний день. Если не исправишь - отчисление!" },
        { sender: "Преподаватель", text: "Жду отчёт о причинах сбоев!" }
    ]
};

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

function loadGame() {
    const saved = localStorage.getItem("spbGameSave");
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            gameData = { ...gameData, ...parsed };
            for (let day in scheduleByDay) {
                const savedDay = localStorage.getItem(`schedule_day_${day}`);
                if (savedDay) {
                    const takenLessons = JSON.parse(savedDay);
                    scheduleByDay[day].forEach(lesson => {
                        lesson.taken = takenLessons.includes(lesson.name);
                    });
                }
            }
        } catch(e) { console.error("Ошибка загрузки", e); }
    } else {
        initSchedule();
    }
    updateStatsDisplay();
}

function saveGame() {
    localStorage.setItem("spbGameSave", JSON.stringify(gameData));
    for (let day in scheduleByDay) {
        const takenLessons = scheduleByDay[day].filter(l => l.taken).map(l => l.name);
        localStorage.setItem(`schedule_day_${day}`, JSON.stringify(takenLessons));
    }
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
    
    updateDeepseekAdvice();
    
    if (gameData.trust <= 20 && gameData.day < 5 && !gameData.completedDays.includes(4)) {
        gameData.day = 5;
        saveGame();
        addTelegramMessage("Зам. директора", "Доверия больше нет. Завтра отчисление!");
        addNotification("⚠️ ДОВЕРИЕ НА НУЛЕ! Завтра отчисление!", "alert");
    }
}

function updateDeepseekAdvice() {
    const adviceDiv = document.getElementById('deepseekAdvice');
    if (!adviceDiv) return;
    
    if (gameData.intellect >= 30) {
        gameData.deepseekUnlocked = true;
        const advice = terminalCommands[correctActions[gameData.day]]?.description || "Введите 'help' для списка команд";
        adviceDiv.innerHTML = `<strong>🤖 Совет DeepSeek:</strong><br>Попробуйте команду: ${correctActions[gameData.day] || "help"} - ${advice}`;
        adviceDiv.style.background = "#0a0a1a";
        adviceDiv.style.color = "#00ff00";
    } else {
        gameData.deepseekUnlocked = false;
        adviceDiv.innerHTML = `<strong>🔒 DeepSeek заблокирован</strong><br>Посещайте пары, чтобы повысить интеллект до 30 (сейчас ${gameData.intellect}/30) и получить доступ к подсказкам!`;
        adviceDiv.style.background = "#2a1a1a";
        adviceDiv.style.color = "#ff8888";
    }
}

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

function isTelegramAvailable() {
    if (gameData.day >= 4 && !gameData.completedDays.includes(4)) {
        return gameData.vpnEnabled;
    }
    return true;
}

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
        <div class="telegram-message ${!msg.read ? 'unread' : ''}" data-id="${msg.id}">
            <div class="telegram-sender">📨 ${msg.sender}</div>
            <div class="telegram-text">${msg.text}</div>
            <div class="telegram-time">${msg.time}</div>
        </div>
    `).join('');
    
    gameData.telegramMessages.forEach(m => { m.read = true; });
    saveGame();
    updateTelegramBadge();
}

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
    if (msgs && !gameData.completedDays.includes(gameData.day - 1)) {
        setTimeout(() => {
            msgs.forEach((msg, index) => {
                setTimeout(() => {
                    addTelegramMessage(msg.sender, msg.text);
                }, index * 3000);
            });
        }, 5000);
    }
}

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

function modifyTrust(delta) {
    let newTrust = gameData.trust + delta;
    if (delta === 5 && gameData.rebootCount >= gameData.day) return;
    if (delta === 5) gameData.rebootCount = gameData.day;
    
    gameData.trust = Math.min(100, Math.max(0, newTrust));
    saveGame();
    updateStatsDisplay();
}

function modifyIntellect(delta) {
    gameData.intellect = Math.min(100, Math.max(0, gameData.intellect + delta));
    saveGame();
    updateStatsDisplay();
}

function addClue(clue) {
    if (!gameData.clues.includes(clue)) {
        gameData.clues.push(clue);
        addNotification(`🔍 Улика: ${clue}`, "clue");
        saveGame();
    }
}

function addToErrorLog(action, result, message, day) {
    gameData.errorLog.unshift({
        id: Date.now(),
        day: day || gameData.day,
        action: action,
        result: result,
        message: message,
        timestamp: new Date().toLocaleTimeString()
    });
    saveGame();
}

// ГЛАВНАЯ ФУНКЦИЯ - ВЫПОЛНЕНИЕ КОМАНД ТЕРМИНАЛА
function executeCommand(command) {
    console.log("executeCommand called with:", command);
    const cmd = command.toLowerCase().trim();
    
    const terminal = document.getElementById('terminalOutput');
    if (!terminal) {
        console.error("Terminal output element not found!");
        return;
    }
    
    // Отображаем введённую команду
    const inputLine = document.createElement('div');
    inputLine.className = 'terminal-line';
    inputLine.innerHTML = `<span class="terminal-prompt">$></span> ${command}`;
    terminal.appendChild(inputLine);
    
    if (cmd === "help") {
        const helpLine = document.createElement('div');
        helpLine.className = 'terminal-line';
        helpLine.innerHTML = `<span class="terminal-prompt">$></span> === ДОСТУПНЫЕ КОМАНДЫ ===`;
        terminal.appendChild(helpLine);
        
        for (let cmdName in terminalCommands) {
            if (terminalCommands[cmdName].description) {
                const line = document.createElement('div');
                line.className = 'terminal-line';
                const dayInfo = terminalCommands[cmdName].day ? `[День ${terminalCommands[cmdName].day}]` : '';
                line.innerHTML = `<span class="terminal-prompt">$></span> ${cmdName.padEnd(30)} ${dayInfo.padEnd(10)} - ${terminalCommands[cmdName].description}`;
                terminal.appendChild(line);
            }
        }
        
        const infoLine = document.createElement('div');
        infoLine.className = 'terminal-line';
        infoLine.innerHTML = `<span class="terminal-prompt">$></span> 📅 День ${gameData.day} | ❤️ Доверие: ${gameData.trust} | 🧠 Интеллект: ${gameData.intellect}`;
        terminal.appendChild(infoLine);
        
        inputLine.scrollIntoView({ behavior: 'smooth', block: 'end' });
        return;
    }
    
    if (cmd === "clear") {
        terminal.innerHTML = '';
        const clearLine = document.createElement('div');
        clearLine.className = 'terminal-line';
        clearLine.innerHTML = `<span class="terminal-prompt">$></span> Терминал очищен`;
        terminal.appendChild(clearLine);
        return;
    }
    
    const cmdData = terminalCommands[cmd];
    if (!cmdData) {
        const errorLine = document.createElement('div');
        errorLine.className = 'terminal-line error';
        errorLine.innerHTML = `<span class="terminal-prompt">$></span> ❌ Command not found: ${command}`;
        terminal.appendChild(errorLine);
        
        const hintLine = document.createElement('div');
        hintLine.className = 'terminal-line';
        hintLine.innerHTML = `<span class="terminal-prompt">$></span> 💡 Введите 'help' для списка команд`;
        terminal.appendChild(hintLine);
        
        inputLine.scrollIntoView({ behavior: 'smooth', block: 'end' });
        return;
    }
    
    // Проверка дня
    if (cmdData.day && cmdData.day !== gameData.day) {
        const errorLine = document.createElement('div');
        errorLine.className = 'terminal-line error';
        if (gameData.day > cmdData.day && gameData.completedDays.includes(cmdData.day)) {
            errorLine.innerHTML = `<span class="terminal-prompt">$></span> ⚠️ Эта проблема уже решена в день ${cmdData.day}`;
        } else {
            errorLine.innerHTML = `<span class="terminal-prompt">$></span> ❌ Сейчас день ${gameData.day}. Эта команда не актуальна.`;
        }
        terminal.appendChild(errorLine);
        inputLine.scrollIntoView({ behavior: 'smooth', block: 'end' });
        return;
    }
    
    if (cmdData.day && gameData.completedDays.includes(gameData.day)) {
        const errorLine = document.createElement('div');
        errorLine.className = 'terminal-line error';
        errorLine.innerHTML = `<span class="terminal-prompt">$></span> ⚠️ Проблема дня ${gameData.day} уже решена!`;
        terminal.appendChild(errorLine);
        inputLine.scrollIntoView({ behavior: 'smooth', block: 'end' });
        return;
    }
    
    // Выполнение
    if (cmdData.trust) modifyTrust(cmdData.trust);
    if (cmdData.intellect) modifyIntellect(cmdData.intellect);
    if (cmdData.clue) addClue(cmdData.clue);
    
    addToErrorLog(command, cmdData.success ? 'исправлена' : 'не исправлена', cmdData.message, cmdData.day);
    
    const resultLine = document.createElement('div');
    resultLine.className = `terminal-line ${cmdData.success ? '' : 'error'}`;
    resultLine.innerHTML = `<span class="terminal-prompt">$></span> ${cmdData.success ? '✅' : '❌'} ${cmdData.message}`;
    terminal.appendChild(resultLine);
    
    if (cmdData.success && cmdData.day) {
        if (!gameData.completedDays.includes(cmdData.day)) {
            gameData.completedDays.push(cmdData.day);
            
            if (gameData.day < 5) {
                gameData.day++;
                saveGame();
                updateStatsDisplay();
                addNotification(`📅 День ${gameData.day} начался!`, "info");
                generateTelegramMessages();
                
                const newDayLine = document.createElement('div');
                newDayLine.className = 'terminal-line';
                newDayLine.innerHTML = `<span class="terminal-prompt">$></span> 📅 НОВЫЙ ДЕНЬ! Теперь день ${gameData.day}. Введите "help" для новых команд.`;
                terminal.appendChild(newDayLine);
            } else if (gameData.day === 5 && cmd === "report.generate") {
                gameData.day = 6;
                saveGame();
                showFinalChoice();
            }
        }
    }
    
    inputLine.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

function markAttendance(lessonName, reward) {
    const todaySchedule = scheduleByDay[gameData.day];
    if (!todaySchedule) return false;
    
    const lesson = todaySchedule.find(l => l.name === lessonName);
    if (!lesson || lesson.taken) {
        addNotification("❌ Вы уже отметились на этой паре!", "alert");
        return false;
    }
    
    lesson.taken = true;
    modifyIntellect(reward);
    addNotification(`✅ Отмечено на "${lessonName}"! +${reward} интеллекта`, "success");
    saveGame();
    
    const iframe = document.getElementById('browserIframe');
    if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: 'updateSchedule' }, '*');
    }
    return true;
}

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

function powerOnDesktop() {
    const desktopElem = document.getElementById('desktop');
    if (desktopElem) {
        desktopElem.style.display = 'block';
        updateStatsDisplay();
        
        if (!gameData.hasActiveGame) {
            gameData.hasActiveGame = true;
            initSchedule();
            saveGame();
            addNotification("👋 Ты — Коля, первокурсник и админ.", "character");
            addNotification("📁 Открой Браузер → Панель администратора → Терминал", "system");
            addNotification("💡 Введи 'help' в терминале для списка команд", "system");
            generateTelegramMessages();
        } else {
            addNotification(`📅 День ${gameData.day}. Продолжаем расследование!`, "character");
        }
    }
}

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
            deepseekUnlocked: false
        };
        initSchedule();
        saveGame();
        addNotification("🔄 Прогресс сброшен.", "system");
        
        const desktopElem = document.getElementById('desktop');
        if (desktopElem) desktopElem.style.display = 'none';
        
        const iframe = document.getElementById('browserIframe');
        if (iframe) iframe.src = 'user.html';
    }
}

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

function openApp(appName) {
    const apps = {
        'deepseek': document.getElementById('deepseekChat'),
        'telegram': document.getElementById('telegramChat'),
        'vpn': document.getElementById('vpnApp')
    };
    
    const app = apps[appName];
    if (app) {
        app.style.display = 'flex';
        if (appName === 'telegram') renderTelegramMessages();
    }
}

function addToTerminalOutput(text, isError) {
    const terminal = document.getElementById('terminalOutput');
    if (!terminal) return;
    
    const line = document.createElement('div');
    line.className = `terminal-line ${isError ? 'error' : ''}`;
    line.innerHTML = `<span class="terminal-prompt">$></span> ${text}`;
    terminal.appendChild(line);
    line.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

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
    
    if (deepseek) makeDraggable(deepseek, deepseek.querySelector('.deepseek-header'));
    if (telegram) makeDraggable(telegram, telegram.querySelector('.telegram-header'));
    if (vpn) makeDraggable(vpn, vpn.querySelector('.vpn-header'));
    
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
    
    // Иконки
    document.querySelector('.icon[data-app="browser"]')?.addEventListener('click', () => {
        browserModal?.classList.add('active');
        const iframe = document.getElementById('browserIframe');
        if (iframe && (!iframe.src || iframe.src === 'about:blank')) {
            iframe.src = 'user.html';
        }
    });
    
    document.getElementById('deepseekIcon')?.addEventListener('click', () => openApp('deepseek'));
    document.getElementById('telegramIcon')?.addEventListener('click', () => openApp('telegram'));
    document.getElementById('vpnIcon')?.addEventListener('click', () => openApp('vpn'));
    
    // Панель задач - иконки
    document.querySelector('.taskbar-app-icon[data-app="browser"]')?.addEventListener('click', () => {
        browserModal?.classList.add('active');
    });
    
    document.getElementById('deepseekTaskbarIcon')?.addEventListener('click', () => openApp('deepseek'));
    document.getElementById('telegramTaskbarIcon')?.addEventListener('click', () => openApp('telegram'));
    document.getElementById('vpnTaskbarIcon')?.addEventListener('click', () => openApp('vpn'));
    
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
    
    // Вкладки
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
    
    // Меню пуск
    document.getElementById('startShutdownBtn')?.addEventListener('click', shutdownComputer);
    document.getElementById('startRebootBtn')?.addEventListener('click', rebootComputer);
    
    const startBrowserBtn = document.querySelector('.start-menu-item[data-app="browser"]');
    if (startBrowserBtn) {
        startBrowserBtn.addEventListener('click', () => {
            startMenu?.classList.remove('active');
            browserModal?.classList.add('active');
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
    
    document.addEventListener('click', (e) => {
        if (startMenu && !startMenu.contains(e.target) && !e.target.closest('.start-button')) {
            startMenu.classList.remove('active');
        }
        if (notificationPanel && !notificationPanel.contains(e.target) && !e.target.closest('.notification-area')) {
            notificationPanel.classList.remove('active');
        }
    });
    
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
    }

// Обработка сообщений от iframe (терминал)
window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'terminalCommand') {
        const command = event.data.command;
        console.log("📟 Получена команда из терминала:", command);
        
        // Сохраняем ссылку на источник для ответа
        const source = event.source;
        
        // Временно переопределяем addToTerminalOutput чтобы отправлять ответ в iframe
        const originalAddToTerminal = window.addToTerminalOutput;
        window.addToTerminalOutput = function(text, isError) {
            if (source && source.postMessage) {
                source.postMessage({
                    type: 'terminalResponse',
                    text: text,
                    isError: isError || false
                }, '*');
            }
            if (originalAddToTerminal) originalAddToTerminal(text, isError);
        };
        
        // Выполняем команду
        executeCommand(command);
        
        // Восстанавливаем оригинальную функцию
        setTimeout(() => {
            window.addToTerminalOutput = originalAddToTerminal;
        }, 100);
    }
});
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
window.renderTelegramMessages = renderTelegramMessages;

console.log("Game.js loaded, executeCommand exported:", typeof window.executeCommand);