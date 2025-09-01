// 全局变量
let currentWeek = 1;
const totalWeeks = 20;
let config = {};
const timeSlots = [
    "第一节 8:00-8:45",
    "第二节 8:55-9:40",
    "第三节 10:00-10:45",
    "第四节 10:55-11:40",
    "第五节 14:00-14:45",
    "第六节 14:55-15:40",
    "第七节 16:00-16:45",
    "第八节 16:55-17:40",
    "第九节 19:00-19:45",
    "第十节 19:55-20:40"
];

// DOM元素
const scheduleBody = document.getElementById('scheduleBody');
const currentWeekSpan = document.getElementById('currentWeek');
const prevWeekBtn = document.getElementById('prevWeek');
const nextWeekBtn = document.getElementById('nextWeek');
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeBtn = document.querySelector('.close-btn');

// 事件监听器
settingsBtn.addEventListener('click', () => {
    settingsModal.classList.remove('hidden');
});

closeBtn.addEventListener('click', () => {
    settingsModal.classList.add('hidden');
});

window.addEventListener('click', (event) => {
    if (event.target == settingsModal) {
        settingsModal.classList.add('hidden');
    }
});

prevWeekBtn.addEventListener('click', () => {
    if (currentWeek > 1) {
        currentWeek--;
        updateSchedule();
    }
});

nextWeekBtn.addEventListener('click', () => {
    if (currentWeek < totalWeeks) {
        currentWeek++;
        updateSchedule();
    }
});

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

// 更新课表显示
function updateSchedule() {
    // 清空现有课表
    scheduleBody.innerHTML = '';
    
    // 更新周数显示
    updateWeekDisplay();
    
    // 为每个时间段创建行
    timeSlots.forEach((timeSlot, timeIndex) => {
        const row = document.createElement('tr');
        
        // 添加时间列
        const timeCell = document.createElement('td');
        timeCell.textContent = timeSlot;
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
function loadConfig() {
    const savedConfig = localStorage.getItem('courseViewerConfig');
    if (savedConfig) {
        config = JSON.parse(savedConfig);
    } else {
        // 默认配置
        config = {
            startWeek: 1,
            totalWeeks: 20,
        };
    }
}

function saveConfig() {
    localStorage.setItem('courseViewerConfig', JSON.stringify(config));
}

// 初始化课表
document.addEventListener('DOMContentLoaded', () => {
    loadConfig();
    // 设置初始周数（可以根据实际日期计算）
    currentWeek = config.startWeek || 1;
    updateSchedule();
});
