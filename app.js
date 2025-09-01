// 全局变量
let currentWeek = 1;
let totalWeeks = 20;
let config = {
    theme: 'light',
    totalWeeks: 20,
    startWeek: 1,
    timeSlots: [
        {id: 1, name: "第一节", startTime: "08:30", endTime: "09:15"},
        {id: 2, name: "第二节", startTime: "09:25", endTime: "10:10"},
        {id: 3, name: "第三节", startTime: "10:30", endTime: "11:15"},
        {id: 4, name: "第四节", startTime: "11:25", endTime: "12:10"},
        {id: 5, name: "第五节", startTime: "13:30", endTime: "14:15"},
        {id: 6, name: "第六节", startTime: "14:25", endTime: "15:10"},
        {id: 7, name: "第七节", startTime: "15:20", endTime: "16:05"},
        {id: 8, name: "第八节", startTime: "16:25", endTime: "17:10"},
        {id: 9, name: "第九节", startTime: "17:20", endTime: "18:05"},
        {id: 10, name: "第十节", startTime: "19:00", endTime: "19:45"},
        {id: 11, name: "第十一节", startTime: "19:55", endTime: "20:40"},
        {id: 12, name: "第十二节", startTime: "20:50", endTime: "21:35"}
    ]
};

// 默认时间段配置
const defaultTimeSlots = config.timeSlots;

// DOM元素
let scheduleBody, currentWeekSpan, prevWeekBtn, nextWeekBtn, settingsBtn, 
    settingsModal, closeBtn, totalWeeksInput, saveSettingsBtn,
    courseDetailModal, closeDetailBtn, detailCourseName, detailTime,
    detailLocation, detailTeacher, detailWeeks;

// 当前选中的课程
let selectedCourse = null;

// 初始化DOM元素
function initializeElements() {
    console.log('Initializing DOM elements...');
    
    // 课表和设置相关元素
    scheduleBody = document.getElementById('scheduleBody');
    currentWeekSpan = document.getElementById('currentWeek');
    prevWeekBtn = document.getElementById('prevWeek');
    nextWeekBtn = document.getElementById('nextWeek');
    settingsBtn = document.getElementById('settings-btn');
    settingsModal = document.getElementById('settings-modal');
    closeBtn = document.querySelector('.close-btn');
    totalWeeksInput = document.getElementById('total-weeks-input');
    saveSettingsBtn = document.getElementById('save-settings-btn');

    // 课程详情模态框元素
    courseDetailModal = document.getElementById('course-detail-modal');
    closeDetailBtn = document.getElementById('close-detail-btn');
    detailCourseName = document.getElementById('detail-course-name');
    detailTime = document.getElementById('detail-time');
    detailLocation = document.getElementById('detail-location');
    detailTeacher = document.getElementById('detail-teacher');
    detailWeeks = document.getElementById('detail-weeks');

    // 初始化时间段设置
    initializeTimeSlots();

    // 初始化文件上传
    const fileInput = document.getElementById('excel-file');
    const selectFileBtn = document.getElementById('select-file-btn');
    const fileNameSpan = document.getElementById('file-name');

    selectFileBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            fileNameSpan.textContent = file.name;
            handleExcelImport(file);
        }
    });

    // 打印每个元素的状态和位置
    console.log('Elements found:', {
        scheduleBody: !!scheduleBody,
        currentWeekSpan: !!currentWeekSpan,
        prevWeekBtn: !!prevWeekBtn,
        nextWeekBtn: !!nextWeekBtn,
        settingsBtn: !!settingsBtn,
        settingsModal: !!settingsModal,
        closeBtn: !!closeBtn,
        totalWeeksInput: !!totalWeeksInput,
        saveSettingsBtn: !!saveSettingsBtn
    });

    // 打印设置按钮的位置信息
    if (settingsBtn) {
        const rect = settingsBtn.getBoundingClientRect();
        console.log('Settings button position:', JSON.stringify({
            left: Math.round(rect.left),
            top: Math.round(rect.top),
            right: Math.round(rect.right),
            bottom: Math.round(rect.bottom),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
        }, null, 2));
    }
}

// 事件监听器
function initializeEventListeners() {
    console.log('Initializing event listeners...');

    // 设置选项卡切换
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            
            // 更新按钮状态
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // 更新内容显示
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`${tabId}-tab`).classList.add('active');

            // 如果切换到时间段设置，初始化时间段列表
            if (tabId === 'time') {
                initializeTimeSlots();
            }
        });
    });

    // 添加时间段按钮点击
    document.getElementById('add-time-slot').addEventListener('click', addTimeSlot);

    // 时间段删除按钮点击（使用事件委托）
    document.getElementById('time-slots-list').addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-time-slot')) {
            const index = parseInt(e.target.getAttribute('data-index'));
            deleteTimeSlot(index);
        }
    });

    // 使用事件委托处理所有按钮点击
    document.body.addEventListener('click', (event) => {
        const target = event.target;
        const rect = target.getBoundingClientRect();
        console.log('Click event details:', JSON.stringify({
            target: target.id || target.className || 'unknown element',
            clickX: Math.round(event.clientX),
            clickY: Math.round(event.clientY),
            elementRect: {
                left: Math.round(rect.left),
                top: Math.round(rect.top),
                right: Math.round(rect.right),
                bottom: Math.round(rect.bottom),
                width: Math.round(rect.width),
                height: Math.round(rect.height)
            }
        }, null, 2));

        // 设置按钮点击
        if (target.id === 'settings-btn' || target.closest('#settings-btn')) {
            console.log('Settings button clicked');
            // 在打开模态框时，更新输入值以反映当前配置
            const themeInputs = document.querySelectorAll('input[name="theme"]');
            themeInputs.forEach(input => {
                if (input.value === (config.theme || 'light')) {
                    input.checked = true;
                }
            });
            totalWeeksInput.value = config.totalWeeks || 20;
            settingsModal.classList.add('visible');
            console.log('Modal visibility class added');
        }

        // 关闭按钮点击
        if (target.classList.contains('close-btn')) {
            if (target.id === 'close-detail-btn') {
                courseDetailModal.classList.remove('visible');
            } else {
                settingsModal.classList.remove('visible');
            }
        }

        // 点击模态框外部关闭
        if (target === settingsModal || target === courseDetailModal) {
            target.classList.remove('visible');
        }

        // 保存按钮点击
        if (target.id === 'save-settings-btn') {
            console.log('Save button clicked');
            // 保存时间段设置
            const timeSlotsList = document.getElementById('time-slots-list');
            const timeSlots = Array.from(timeSlotsList.children).map((slot, index) => {
                const inputs = slot.querySelectorAll('input');
                return {
                    id: index + 1,
                    name: inputs[0].value,
                    startTime: inputs[1].value,
                    endTime: inputs[2].value
                };
            });
            config.timeSlots = timeSlots;

            // 更新其他配置
            const selectedTheme = document.querySelector('input[name="theme"]:checked');
            config.theme = selectedTheme ? selectedTheme.value : 'light';
            config.totalWeeks = parseInt(totalWeeksInput.value, 10);
            totalWeeks = config.totalWeeks;
            
            console.log('New config:', JSON.stringify(config, null, 2));
            saveConfig();
            applyTheme();
            updateSchedule();
            
            settingsModal.classList.remove('visible');
            console.log('Settings saved and applied');
        }

        // 主题选择变更
        if (target.name === 'theme') {
            console.log('Theme changed to:', target.value);
            // 立即应用主题变更
            config.theme = target.value;
            applyTheme();
        }

        // 上一周按钮点击
        if (target.id === 'prevWeek' && currentWeek > 1) {
            currentWeek--;
            updateSchedule();
        }

        // 下一周按钮点击
        if (target.id === 'nextWeek' && currentWeek < totalWeeks) {
            currentWeek++;
            updateSchedule();
        }
    });
}

// 更新周数显示
function updateWeekDisplay() {
    currentWeekSpan.textContent = `第${currentWeek}周`;
    prevWeekBtn.disabled = currentWeek === 1;
    nextWeekBtn.disabled = currentWeek === totalWeeks;
}

// 创建课程元素
function createCourseElement(course) {
    const courseDiv = document.createElement('div');
    courseDiv.className = 'course';
    courseDiv.addEventListener('click', () => showCourseDetail(course));
    
    const nameDiv = document.createElement('div');
    nameDiv.className = 'course-name';
    nameDiv.textContent = course.name;
    courseDiv.appendChild(nameDiv);
    
    if (course.location) {
        const locationDiv = document.createElement('div');
        locationDiv.className = 'course-location';
        locationDiv.textContent = course.location;
        courseDiv.appendChild(locationDiv);
    }
    
    return courseDiv;
}

// 显示课程详情
function showCourseDetail(course) {
    selectedCourse = course;
    
    detailCourseName.textContent = course.name;
    
    // 获取时间段信息
    const timeSlot = config.timeSlots[course.time - 1];
    const timeText = timeSlot ? 
        `周${['一','二','三','四','五','六','日'][course.day-1]} ${timeSlot.startTime}-${timeSlot.endTime}` :
        `周${['一','二','三','四','五','六','日'][course.day-1]} 第${course.time}节`;
    detailTime.textContent = timeText;
    
    detailLocation.textContent = course.location || '未指定';
    detailTeacher.textContent = course.teacher || '未指定';
    
    // 生成周次标签
    detailWeeks.innerHTML = '';
    course.weeks.forEach(week => {
        const weekTag = document.createElement('span');
        weekTag.className = 'week-tag';
        weekTag.textContent = `第${week}周`;
        detailWeeks.appendChild(weekTag);
    });
    
    courseDetailModal.classList.add('visible');
}

// 初始化时间段设置
function initializeTimeSlots() {
    const container = document.getElementById('time-slots-list');
    container.innerHTML = '';
    
    config.timeSlots.forEach((slot, index) => {
        const timeSlotDiv = document.createElement('div');
        timeSlotDiv.className = 'time-slot';
        timeSlotDiv.innerHTML = `
            <input type="text" class="slot-name" value="${slot.name}" placeholder="节次名称">
            <input type="time" class="slot-start" value="${slot.startTime}" required>
            <span>-</span>
            <input type="time" class="slot-end" value="${slot.endTime}" required>
            <button class="delete-time-slot" data-index="${index}">删除</button>
        `;
        container.appendChild(timeSlotDiv);
    });
}

// 添加新时间段
function addTimeSlot() {
    const newSlot = {
        id: config.timeSlots.length + 1,
        name: `第${config.timeSlots.length + 1}节`,
        startTime: "08:00",
        endTime: "09:40"
    };
    config.timeSlots.push(newSlot);
    initializeTimeSlots();
}

// 删除时间段
function deleteTimeSlot(index) {
    config.timeSlots.splice(index, 1);
    // 更新剩余时间段的ID和名称
    config.timeSlots.forEach((slot, i) => {
        slot.id = i + 1;
        if (slot.name.startsWith('第') && slot.name.endsWith('节')) {
            slot.name = `第${i + 1}节`;
        }
    });
    initializeTimeSlots();
}

// 清除课程数据
function clearCoursesData() {
    coursesData = [];
    localStorage.removeItem('coursesData');
    updateSchedule();
    console.log('课程数据已清除');
}

// 处理Excel文件导入
async function handleExcelImport(file) {
    // 显示导入进度提示
    const importPreview = document.getElementById('import-preview');
    importPreview.innerHTML = '<div class="loading">正在导入课表...</div>';
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        // 先清除现有数据
        clearCoursesData();
        
        const response = await fetch('/api/parse-excel', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        if (result.success) {
            // 更新课程数据
            coursesData = result.courses;
            // 保存到localStorage
            localStorage.setItem('coursesData', JSON.stringify(coursesData));
            // 更新显示
            updateSchedule();
            
            // 显示导入成功信息
            importPreview.innerHTML = `
                <div class="success">
                    <p>导入成功！共导入 ${result.courses.length} 门课程</p>
                    <button onclick="clearCoursesData()">清除导入数据</button>
                </div>
            `;
        } else {
            importPreview.innerHTML = `
                <div class="error">
                    <p>导入失败：${result.message}</p>
                    <p>请检查Excel文件格式是否符合要求：</p>
                    <ul>
                        <li>第一行应为表头：课程名称、教学班号、上课时间、上课地点、上课教师</li>
                        <li>时间格式示例：12-15周星期五8-9节</li>
                        <li>确保单元格内容完整且格式正确</li>
                    </ul>
                </div>
            `;
        }
    } catch (error) {
        console.error('导入错误：', error);
        importPreview.innerHTML = `
            <div class="error">
                <p>导入出错：${error.message}</p>
                <p>请检查文件格式是否正确，或稍后重试</p>
            </div>
        `;
    }
}

// 更新课表显示
function updateSchedule() {
    // 清空现有课表
    scheduleBody.innerHTML = '';
    
    // 更新周数显示
    updateWeekDisplay();
    
    // 为每个时间段创建行
    config.timeSlots.forEach((timeSlot, timeIndex) => {
        const row = document.createElement('tr');
        
        // 添加时间列
        const timeCell = document.createElement('td');
        timeCell.textContent = `${timeSlot.name}\n${timeSlot.startTime}-${timeSlot.endTime}`;
        row.appendChild(timeCell);
        
        // 添加每天的课程
        for (let day = 1; day <= 7; day++) {
            const cell = document.createElement('td');
            
            // 查找当前时间段的课程
            const coursesForSlot = coursesData.filter(course => {
                return course.day === day && 
                       course.time === timeIndex + 1 && 
                       course.weeks.includes(currentWeek);
            });
            
            // 添加课程到单元格
            coursesForSlot.forEach(course => {
                cell.appendChild(createCourseElement(course));
            });
            
            row.appendChild(cell);
        }
        
        scheduleBody.appendChild(row);
    });
}

// 配置管理
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

function setCookie(name, value, days = 365) {
    const d = new Date();
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `expires=${d.toUTCString()}`;
    document.cookie = `${name}=${value};${expires};path=/`;
}

function loadConfig() {
    console.log('Loading config...');
    try {
        const savedConfig = getCookie('courseViewerConfig');
        console.log('Saved config from cookie:', savedConfig);
        if (savedConfig) {
            try {
                const parsed = JSON.parse(savedConfig);
                config = {
                    ...config,  // 保留默认值
                    ...parsed  // 使用保存的值覆盖默认值
                };
                console.log('Loaded config:', JSON.stringify(config, null, 2));
            } catch (e) {
                console.error('Error parsing saved config:', e);
            }
        } else {
            console.log('No saved config found in cookie');
        }
    } catch (e) {
        console.error('Error accessing cookie:', e);
    }
}

function saveConfig() {
    console.log('Saving config:', JSON.stringify(config, null, 2));
    try {
        setCookie('courseViewerConfig', JSON.stringify(config));
        console.log('Config saved successfully');
    } catch (e) {
        console.error('Error saving to cookie:', e);
    }
}

function applyTheme() {
    console.log('Applying theme:', config.theme);
    if (config.theme === 'dark') {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
    }
}

// 初始化课表
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded event fired');
    initializeElements();
    initializeEventListeners();
    
    loadConfig();
    
    totalWeeks = config.totalWeeks || 20;
    totalWeeksInput.value = totalWeeks;
    
    // 设置初始主题
    const themeInputs = document.querySelectorAll('input[name="theme"]');
    themeInputs.forEach(input => {
        if (input.value === (config.theme || 'light')) {
            input.checked = true;
        }
    });
    applyTheme();

    // 设置初始周数（可以根据实际日期计算）
    currentWeek = config.startWeek || 1;
    updateSchedule();
    
    console.log('Initialization complete');
});
