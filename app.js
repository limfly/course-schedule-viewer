// 全局变量
let currentWeek = 1;
let currentWeekday = '一';
let semesterStartDate = new Date('2025-09-01');
let currentView = 'day';
let coursesData = [];
let currentScheduleId = 'default';
let importHistory = [];
const AI_PROXY_URL = '';

// DOM元素缓存
const elements = {
    weekSelect: document.getElementById('week-select'),
    coursesDisplay: document.getElementById('courses-display'),
    currentWeek: document.getElementById('current-week'),
    scheduleContainer: document.querySelector('.schedule-container'),
    settingsPanel: document.getElementById('settings-panel'),
    settingsBtn: document.getElementById('settings-btn'),
    closeSettings: document.getElementById('close-settings'),
    weekdayTabs: document.querySelectorAll('.weekday-tab'),
    searchInput: document.getElementById('search-input'),
    searchBtn: document.getElementById('search-btn'),
    clearSearch: document.getElementById('clear-search'),
    importBtn: document.getElementById('import-btn'),
    fileInput: document.getElementById('file-input'),
    compactToggle: document.getElementById('compact-toggle'),
    proxyUrlInput: document.getElementById('proxy-url-input'),
    saveProxyBtn: document.getElementById('save-proxy-btn')
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

// 应用初始化
function initializeApp() {
    loadSettings();
    setupEventListeners();
    initWeekSelector();
    loadScheduleData();
    updateDisplay();
    setupSettingsPanel();
}

// 加载设置
function loadSettings() {
    // 加载学期开始日期
    const savedStartDate = localStorage.getItem('semesterStartDate');
    if (savedStartDate) {
        semesterStartDate = new Date(savedStartDate);
    }

    // 加载代理URL设置
    const savedProxyUrl = localStorage.getItem('aiProxyUrl');
    if (savedProxyUrl && elements.proxyUrlInput) {
        elements.proxyUrlInput.value = savedProxyUrl;
    }

    // 加载移动端视图设置
    const savedViewMode = localStorage.getItem('mobileViewMode') || 'compact';
    if (elements.compactToggle) {
        elements.compactToggle.value = savedViewMode;
    }

    // 根据屏幕尺寸设置默认视图
    const isSmallScreen = window.matchMedia('(max-width: 768px)').matches;
    currentView = isSmallScreen && savedViewMode === 'compact' ? 'week' : 'day';
}

// 设置面板管理
function setupSettingsPanel() {
    if (!elements.settingsBtn || !elements.settingsPanel || !elements.closeSettings) return;

    elements.settingsBtn.addEventListener('click', () => {
        elements.settingsPanel.setAttribute('aria-hidden', 'false');
    });

    elements.closeSettings.addEventListener('click', () => {
        elements.settingsPanel.setAttribute('aria-hidden', 'true');
    });

    // 点击面板外关闭
    document.addEventListener('click', (e) => {
        if (elements.settingsPanel.getAttribute('aria-hidden') === 'false' &&
            !elements.settingsPanel.contains(e.target) &&
            e.target !== elements.settingsBtn) {
            elements.settingsPanel.setAttribute('aria-hidden', 'true');
        }
    });
}

// 事件监听器设置
function setupEventListeners() {
    // 周数选择和导航
    document.getElementById('prev-week')?.addEventListener('click', () => navigateWeek(-1));
    document.getElementById('next-week')?.addEventListener('click', () => navigateWeek(1));
    document.getElementById('current-week-btn')?.addEventListener('click', goToCurrentWeek);
    elements.weekSelect?.addEventListener('change', (e) => setWeek(parseInt(e.value)));

    // 视图切换
    document.getElementById('day-view-btn')?.addEventListener('click', () => switchView('day'));
    document.getElementById('week-view-btn')?.addEventListener('click', () => switchView('week'));

    // 周几标签点击
    elements.weekdayTabs?.forEach(tab => {
        tab.addEventListener('click', () => {
            currentWeekday = tab.dataset.weekday;
            updateDisplay();
            updateActiveTab();
        });
    });

    // 搜索功能
    elements.searchBtn?.addEventListener('click', handleSearch);
    elements.clearSearch?.addEventListener('click', clearSearch);
    elements.searchInput?.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

    // 导入功能
    elements.importBtn?.addEventListener('click', () => elements.fileInput.click());
    elements.fileInput?.addEventListener('change', handleFileImport);

    // 移动端视图切换
    elements.compactToggle?.addEventListener('change', (e) => {
        localStorage.setItem('mobileViewMode', e.target.value);
        updateDisplay();
    });

    // 代理设置
    elements.saveProxyBtn?.addEventListener('click', () => {
        localStorage.setItem('aiProxyUrl', elements.proxyUrlInput.value);
        showMessage('代理设置已保存');
    });
}

// 周数选择器初始化
function initWeekSelector() {
    if (!elements.weekSelect) return;
    elements.weekSelect.innerHTML = Array.from({length: 25}, (_, i) => 
        `<option value="${i + 1}">第 ${i + 1} 周</option>`
    ).join('');
    elements.weekSelect.value = currentWeek;
}

// 导航到上/下一周
function navigateWeek(delta) {
    const newWeek = currentWeek + delta;
    if (newWeek >= 1 && newWeek <= 25) {
        setWeek(newWeek);
    }
}

// 设置当前周
function setWeek(week) {
    currentWeek = week;
    elements.weekSelect.value = week;
    elements.currentWeek.textContent = week;
    updateDisplay();
}

// 返回到当前周
function goToCurrentWeek() {
    const now = new Date();
    const diff = now - semesterStartDate;
    const weeksPassed = Math.floor(diff / (7 * 24 * 60 * 60 * 1000));
    setWeek(Math.min(Math.max(1, weeksPassed + 1), 25));
}

// 切换视图模式
function switchView(view) {
    currentView = view;
    document.getElementById('day-view-btn')?.classList.toggle('active', view === 'day');
    document.getElementById('week-view-btn')?.classList.toggle('active', view === 'week');
    updateDisplay();
}

// 更新显示
function updateDisplay() {
    if (currentView === 'day') {
        displayDaySchedule();
    } else {
        displayWeekSchedule();
    }
    updateActiveTab();
}

// 更新激活的周几标签
function updateActiveTab() {
    elements.weekdayTabs?.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.weekday === currentWeekday);
    });
}

// 显示日视图课程
function displayDaySchedule() {
    if (!elements.coursesDisplay) return;
    
    const daySchedule = coursesData.filter(course => 
        course.weekday === currentWeekday && 
        course.weeks.includes(currentWeek)
    );

    elements.coursesDisplay.innerHTML = daySchedule.length ? 
        daySchedule.map(createCourseCard).join('') :
        '<div class="no-courses">当前没有课程</div>';
}

// 显示周视图课程
function displayWeekSchedule() {
    if (!elements.coursesDisplay) return;
    
    const weekdays = ['一', '二', '三', '四', '五', '六', '日'];
    const weekSchedule = weekdays.map(day => {
        const courses = coursesData.filter(course => 
            course.weekday === day && 
            course.weeks.includes(currentWeek)
        );
        return `
            <div class="day-column">
                <h3 class="day-title">周${day}</h3>
                <div class="day-courses">
                    ${courses.length ? 
                        courses.map(createCourseCard).join('') :
                        '<div class="no-courses">没有课程</div>'}
                </div>
            </div>
        `;
    }).join('');

    elements.coursesDisplay.innerHTML = weekSchedule;
}

// 创建课程卡片
function createCourseCard(course) {
    return `
        <div class="course-card" style="background-color: ${getRandomColor(course.name)}">
            <div class="course-name">${course.name}</div>
            <div class="course-details">
                <div class="course-time">${course.time}</div>
                <div class="course-location">${course.location}</div>
                <div class="course-teacher">${course.teacher}</div>
            </div>
        </div>
    `;
}

// 课程卡片随机背景色
function getRandomColor(str) {
    const colors = [
        '#4c6ef5', '#228be6', '#15aabf', '#12b886', '#40c057',
        '#82c91e', '#fab005', '#fd7e14', '#fa5252', '#be4bdb'
    ];
    const index = Array.from(str).reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
}

// 搜索处理
function handleSearch() {
    if (!elements.searchInput?.value) return;
    
    const keyword = elements.searchInput.value.toLowerCase();
    const results = coursesData.filter(course => 
        course.name.toLowerCase().includes(keyword) ||
        course.teacher.toLowerCase().includes(keyword) ||
        course.location.toLowerCase().includes(keyword)
    );

    displaySearchResults(results);
}

// 显示搜索结果
function displaySearchResults(results) {
    const resultsHTML = results.length ? results.map(course => `
        <div class="search-result">
            <div class="result-name">${course.name}</div>
            <div class="result-details">
                <div>教师：${course.teacher}</div>
                <div>地点：${course.location}</div>
                <div>时间：周${course.weekday} ${course.time}</div>
                <div>周次：${course.weeks.join(',')}</div>
            </div>
        </div>
    `).join('') : '<div class="no-results">没有找到匹配的课程</div>';

    // 在设置面板中显示搜索结果
    const searchSection = document.querySelector('.search-results');
    if (searchSection) {
        searchSection.innerHTML = resultsHTML;
    }
}

// 清除搜索
function clearSearch() {
    if (elements.searchInput) {
        elements.searchInput.value = '';
    }
    const searchSection = document.querySelector('.search-results');
    if (searchSection) {
        searchSection.innerHTML = '';
    }
}

// 文件导入处理
function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            // 根据文件类型处理数据
            const data = await parseFileData(file, e.target.result);
            if (data && data.length) {
                coursesData = data;
                saveScheduleData();
                updateDisplay();
                showMessage('课表导入成功');
            }
        } catch (error) {
            showMessage('导入失败：' + error.message, 'error');
        }
    };
    reader.readAsText(file);
}

// 显示消息提示
function showMessage(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// 数据存取
function loadScheduleData() {
    const savedData = localStorage.getItem('coursesData');
    if (savedData) {
        try {
            coursesData = JSON.parse(savedData);
        } catch (e) {
            console.error('加载数据失败', e);
            coursesData = [];
        }
    } else if (window.coursesData) {
        coursesData = window.coursesData;
    }
}

function saveScheduleData() {
    try {
        localStorage.setItem('coursesData', JSON.stringify(coursesData));
    } catch (e) {
        console.error('保存数据失败', e);
        showMessage('保存失败，数据可能过大', 'error');
    }
}
