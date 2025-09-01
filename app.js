// 全局变量
let currentWeek = 1;
let currentWeekday = '一';
let semesterStartDate = new Date('2025-09-01');
let currentView = 'day'; // 'day' 或 'week'
let coursesData = []; // 将改为动态数据
let currentScheduleId = 'default'; // 当前使用的课表ID
let importHistory = []; // 导入历史

// DOM元素
const elements = {
    weekSelect: document.getElementById('week-select'),
    weekTitle: document.getElementById('week-title'),
    coursesDisplay: document.getElementById('courses-display'),
    currentWeekInfo: document.getElementById('current-week-info'),
    scheduleContainer: document.getElementById('schedule-container'),
    searchResults: document.getElementById('search-results'),
    searchResultsContent: document.getElementById('search-results-content'),
    searchInput: document.getElementById('search-input'),
    dateModal: document.getElementById('date-modal'),
    startDateInput: document.getElementById('start-date-input'),
    importModal: document.getElementById('import-modal'),
    dropZone: document.getElementById('drop-zone'),
    modalFileInput: document.getElementById('modal-file-input'),
    importPreview: document.getElementById('import-preview'),
    previewContent: document.getElementById('preview-content'),
    confirmImport: document.getElementById('confirm-import'),
    importStatus: document.getElementById('import-status')
};

// 临时存储待导入的数据
let pendingImportData = null;

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    initWeekSelector();
    loadSemesterStartDate();
    loadScheduleData();
    updateCurrentWeekInfo();
    displayWeekSchedule(currentWeek);
    setupEventListeners();
    setupImportHandlers();
});

// 加载课表数据
function loadScheduleData() {
    // 优先从localStorage加载数据
    const savedData = localStorage.getItem('coursesData');
    if (savedData) {
        try {
            coursesData = JSON.parse(savedData);
            console.log('从本地存储加载了课表数据');
        } catch (e) {
            console.error('加载本地数据失败', e);
            // 如果本地数据损坏，尝试加载默认数据
            loadDefaultData();
        }
    } else {
        // 如果没有本地数据，加载默认数据（如果存在）
        loadDefaultData();
    }
    
    // 加载导入历史
    const savedHistory = localStorage.getItem('importHistory');
    if (savedHistory) {
        try {
            importHistory = JSON.parse(savedHistory);
        } catch (e) {
            console.error('加载导入历史失败', e);
            importHistory = [];
        }
    }
}

// 加载默认数据（从courses_data.js，如果存在）
function loadDefaultData() {
    if (typeof window.coursesData !== 'undefined' && Array.isArray(window.coursesData)) {
        coursesData = window.coursesData;
        console.log('加载了默认课表数据');
    } else {
        coursesData = [];
        console.log('没有找到默认数据，使用空数据');
    }
}

// 保存课表数据到localStorage
function saveScheduleData() {
    try {
        localStorage.setItem('coursesData', JSON.stringify(coursesData));
        console.log('课表数据已保存到本地存储');
    } catch (e) {
        console.error('保存数据失败', e);
        showMessage('数据保存失败，可能超出存储限制', 'error');
    }
}

// 保存导入历史
function saveImportHistory() {
    try {
        localStorage.setItem('importHistory', JSON.stringify(importHistory));
    } catch (e) {
        console.error('保存导入历史失败', e);
    }
}

// 设置导入相关的事件处理
function setupImportHandlers() {
    // 导入按钮
    document.getElementById('import-btn').addEventListener('click', () => {
        elements.importModal.style.display = 'flex';
        resetImportModal();
    });
    
    // 拖拽区域点击
    elements.dropZone.addEventListener('click', () => {
        elements.modalFileInput.click();
    });
    
    // 文件选择
    elements.modalFileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    });
    
    // 拖拽事件
    elements.dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        elements.dropZone.classList.add('drag-over');
    });
    
    elements.dropZone.addEventListener('dragleave', () => {
        elements.dropZone.classList.remove('drag-over');
    });
    
    elements.dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        elements.dropZone.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files && files[0]) {
            handleFile(files[0]);
        }
    });
    
    // 确认导入按钮
    document.getElementById('confirm-import').addEventListener('click', confirmImport);
    
    // 取消导入按钮
    document.getElementById('cancel-import').addEventListener('click', () => {
        elements.importModal.style.display = 'none';
        resetImportModal();
    });
    
    // 点击模态框外部关闭
    elements.importModal.addEventListener('click', (e) => {
        if (e.target === elements.importModal) {
            elements.importModal.style.display = 'none';
            resetImportModal();
        }
    });
}

// 重置导入模态框
function resetImportModal() {
    elements.importPreview.style.display = 'none';
    elements.confirmImport.style.display = 'none';
    elements.importStatus.innerHTML = '';
    elements.previewContent.innerHTML = '';
    pendingImportData = null;
    elements.modalFileInput.value = '';
}

// 处理文件
async function handleFile(file) {
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
        showImportStatus('请选择Excel文件 (.xlsx 或 .xls)', 'error');
        return;
    }
    
    showImportStatus('正在读取文件...', 'info');
    
    try {
        const data = await readExcelFile(file);
        const parseResult = parseScheduleData(data, file.name);
        
        if (parseResult.success) {
            pendingImportData = parseResult;
            showPreview(parseResult);
            showImportStatus(`成功解析 ${parseResult.courses.length} 条课程记录`, 'success');
            elements.confirmImport.style.display = 'block';
        } else {
            showImportStatus(parseResult.message || '文件格式不正确', 'error');
            showDetailedErrors(parseResult.errors || []);
        }
    } catch (error) {
        console.error('处理文件失败', error);
        showImportStatus('文件处理失败：' + error.message, 'error');
    }
}

// 读取Excel文件
function readExcelFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const data = e.target.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                
                // 获取第一个工作表
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                
                // 转换为JSON
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                resolve({
                    sheets: workbook.SheetNames,
                    data: jsonData,
                    rawWorkbook: workbook
                });
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = function(error) {
            reject(error);
        };
        
        reader.readAsBinaryString(file);
    });
}

// 智能解析课表数据
function parseScheduleData(excelData, fileName) {
    const result = {
        success: false,
        courses: [],
        errors: [],
        warnings: [],
        fileName: fileName,
        confidence: 0
    };
    
    if (!excelData.data || excelData.data.length < 2) {
        result.message = '文件中没有足够的数据';
        return result;
    }
    
    // 首先确定文件结构并预处理数据
    const structureInfo = determineFileStructure(excelData.data);
    const processedData = structureInfo.processedData;
    
    // 智能检测列标题位置
    const headerInfo = detectHeaders(processedData, structureInfo.skipRows);
    
    if (!headerInfo.found) {
        result.message = '无法识别课表格式，请确保文件包含必要的列标题';
        result.errors = headerInfo.errors || ['未找到有效的列标题'];
        
        // 添加调试信息
        result.errors.push(`文件结构信息: 跳过行数=${structureInfo.skipRows}, 数据行数=${processedData.length}`);
        if (processedData.length > 0) {
            result.errors.push(`前3行数据预览: ${JSON.stringify(processedData.slice(0, 3))}`);
        }
        
        return result;
    }
    
    // 解析数据
    const parseResult = parseDataRows(processedData, headerInfo);
    
    result.courses = parseResult.courses;
    result.errors = parseResult.errors;
    result.warnings = parseResult.warnings;
    result.confidence = headerInfo.confidence;
    
    if (result.courses.length > 0) {
        result.success = true;
        result.message = `成功解析 ${result.courses.length} 条课程`;
    } else {
        result.message = '未能解析出有效的课程数据';
    }
    
    return result;
}

// 确定文件结构并预处理数据
function determineFileStructure(rawData) {
    if (!rawData || rawData.length === 0) {
        return {
            processedData: rawData,
            skipRows: 0,
            notes: ['文件为空']
        };
    }
    
    let processedData = [...rawData];
    let skipRows = 0;
    const notes = [];
    
    // 检查第一行是否为"课表"标题行
    if (rawData.length > 0 && rawData[0]) {
        const firstRow = rawData[0];
        const titleCount = firstRow.filter(cell => 
            String(cell || '').trim().toLowerCase().includes('课表') ||
            String(cell || '').trim().toLowerCase().includes('schedule')
        ).length;
        
        // 如果第一行大部分是"课表"，认为是标题行
        if (titleCount >= firstRow.length / 2 && titleCount > 0) {
            processedData = rawData.slice(1); // 跳过标题行
            skipRows = 1;
            notes.push(`跳过标题行，检测到 ${titleCount} 个"课表"单元格`);
        }
    }
    
    // 检查处理后的第一行是否全为空
    if (processedData.length > 0 && processedData[0]) {
        const hasData = processedData[0].some(cell => cell && String(cell).trim());
        if (!hasData) {
            processedData = processedData.slice(1);
            skipRows++;
            notes.push('跳过空行');
        }
    }
    
    return {
        processedData: processedData,
        skipRows: skipRows,
        notes: notes
    };
}

// 检测列标题
function detectHeaders(data, skipRows = 0) {
    const headerPatterns = {
        courseName: ['课程名称', '课程', '科目', '课程名', '学科', 'course', 'subject'],
        classId: ['教学班号', '班号', '教学班', '班级号', '班级', 'class', 'class_id'],
        time: ['上课时间', '时间', '上课时刻', '课程时间', 'time', 'schedule'],
        location: ['上课地点', '地点', '教室', '场所', '位置', 'location', 'room'],
        teacher: ['上课教师', '教师', '老师', '任课教师', '授课教师', 'teacher', 'instructor']
    };
    
    // 尝试在前5行查找标题行
    for (let rowIndex = 0; rowIndex < Math.min(5, data.length); rowIndex++) {
        const row = data[rowIndex];
        if (!row || row.length < 3) continue;
        
        const mapping = {};
        let matchCount = 0;
        const debugInfo = [];
        
        // 检查每个单元格是否匹配已知的列标题
        for (let colIndex = 0; colIndex < row.length; colIndex++) {
            const cellValue = String(row[colIndex] || '').trim();
            if (!cellValue) continue;
            
            const cellValueLower = cellValue.toLowerCase();
            debugInfo.push(`列${colIndex}: "${cellValue}"`);
            
            for (const [field, patterns] of Object.entries(headerPatterns)) {
                for (const pattern of patterns) {
                    // 完全匹配或包含匹配
                    if (cellValueLower === pattern.toLowerCase() || cellValueLower.includes(pattern.toLowerCase())) {
                        if (!mapping[field]) { // 避免重复匹配
                            mapping[field] = colIndex;
                            matchCount++;
                            debugInfo[debugInfo.length - 1] += ` -> 匹配${field}(${pattern})`;
                            break;
                        }
                    }
                }
                if (mapping[field] !== undefined) break;
            }
        }
        
        // 如果找到至少3个必要字段，认为找到了标题行
        if (matchCount >= 3 && mapping.courseName !== undefined && mapping.time !== undefined) {
            const confidence = (matchCount / 5) * 100;
            console.log(`找到标题行(行${rowIndex}):`, debugInfo);
            console.log('列映射:', mapping);
            return {
                found: true,
                headerRow: rowIndex,
                dataStartRow: rowIndex + 1,
                mapping: mapping,
                confidence: confidence
            };
        }
    }
    
    // 如果没找到，返回详细的调试信息
    const debugData = data.slice(0, 3).map((row, i) => `行${i}: ${row.map(cell => `"${cell}"`).join(', ')}`);
    
    return {
        found: false,
        errors: [
            '无法识别列标题，请确保文件包含：课程名称、上课时间等必要信息',
            `已跳过${skipRows}行`,
            `前3行数据: ${debugData.join(' | ')}`
        ]
    };
}

// 解析数据行
function parseDataRows(data, headerInfo) {
    const courses = [];
    const errors = [];
    const warnings = [];
    const { dataStartRow, mapping } = headerInfo;
    
    for (let i = dataStartRow; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length === 0) continue;
        
        // 跳过空行
        const hasData = row.some(cell => cell && String(cell).trim());
        if (!hasData) continue;
        
        try {
            const course = extractCourseFromRow(row, mapping, i);
            if (course) {
                courses.push(...course);
            }
        } catch (error) {
            errors.push(`第${i + 1}行解析失败: ${error.message}`);
        }
    }
    
    return { courses, errors, warnings };
}

// 从行数据提取课程信息
function extractCourseFromRow(row, mapping, rowIndex) {
    const getValue = (field) => {
        const index = mapping[field];
        return index !== undefined ? String(row[index] || '').trim() : '';
    };
    
    const courseName = getValue('courseName');
    const timeStr = getValue('time');
    
    // 跳过没有课程名称或时间的行
    if (!courseName || !timeStr) {
        return null;
    }
    
    const classId = getValue('classId') || `CLASS-${rowIndex}`;
    const location = getValue('location') || '';
    const teacher = getValue('teacher') || '';
    
    // 解析时间字符串
    const timeSlots = parseTimeString(timeStr);
    
    if (timeSlots.length === 0) {
        // 如果无法解析具体时间，创建一个默认条目
        return [{
            name: courseName,
            classId: classId,
            time: timeStr,
            location: location,
            teacher: teacher,
            weeks: [],
            weekday: '',
            periods: '',
            originalTime: timeStr
        }];
    }
    
    // 为每个时间段创建一个课程条目
    return timeSlots.map(slot => ({
        name: courseName,
        classId: classId,
        time: timeStr,
        location: location,
        teacher: teacher,
        weeks: slot.weeks,
        weekday: slot.weekday,
        periods: slot.periods,
        originalTime: timeStr
    }));
}

// 解析时间字符串
function parseTimeString(timeStr) {
    const results = [];
    
    // 移除多余空格
    timeStr = timeStr.replace(/\s+/g, '');
    
    // 匹配模式：如 "1-16周星期一3-4节"
    const pattern = /(\d+(?:-\d+)?(?:,\d+(?:-\d+)?)*)周?(?:星期|周)([一二三四五六日])(\d+-?\d*)节?/g;
    
    let match;
    while ((match = pattern.exec(timeStr)) !== null) {
        const weeksStr = match[1];
        const weekday = match[2];
        const periods = match[3] + '节';
        
        const weeks = parseWeeks(weeksStr);
        
        if (weeks.length > 0) {
            results.push({
                weeks: weeks,
                weekday: weekday,
                periods: periods
            });
        }
    }
    
    // 如果没有匹配到标准格式，尝试其他格式
    if (results.length === 0) {
        // 尝试匹配简单的周次，如 "10周"
        const simpleWeekPattern = /(\d+(?:-\d+)?(?:,\d+(?:-\d+)?)*)周/;
        const simpleMatch = timeStr.match(simpleWeekPattern);
        
        if (simpleMatch) {
            const weeks = parseWeeks(simpleMatch[1]);
            if (weeks.length > 0) {
                results.push({
                    weeks: weeks,
                    weekday: '',
                    periods: ''
                });
            }
        }
    }
    
    return results;
}

// 解析周次字符串
function parseWeeks(weeksStr) {
    const weeks = [];
    
    // 分割逗号分隔的部分
    const parts = weeksStr.split(',');
    
    for (const part of parts) {
        const trimmed = part.trim();
        
        if (trimmed.includes('-')) {
            // 范围形式，如 "1-16"
            const [start, end] = trimmed.split('-').map(s => parseInt(s.trim()));
            if (!isNaN(start) && !isNaN(end)) {
                for (let i = start; i <= end; i++) {
                    if (i >= 1 && i <= 25) {
                        weeks.push(i);
                    }
                }
            }
        } else {
            // 单个周次
            const week = parseInt(trimmed);
            if (!isNaN(week) && week >= 1 && week <= 25) {
                weeks.push(week);
            }
        }
    }
    
    // 去重并排序
    return [...new Set(weeks)].sort((a, b) => a - b);
}

// 显示预览
function showPreview(parseResult) {
    elements.importPreview.style.display = 'block';
    
    // 按周和星期分组统计
    const stats = {};
    const courseNames = new Set();
    
    parseResult.courses.forEach(course => {
        courseNames.add(course.name);
        const key = course.weekday || '其他';
        stats[key] = (stats[key] || 0) + 1;
    });
    
    let html = `
        <div class="preview-stats">
            <p><strong>文件名：</strong>${parseResult.fileName}</p>
            <p><strong>识别置信度：</strong>${parseResult.confidence.toFixed(1)}%</p>
            <p><strong>课程数量：</strong>${courseNames.size} 门</p>
            <p><strong>总记录数：</strong>${parseResult.courses.length} 条</p>
        </div>
        <div class="preview-courses">
            <h5>课程列表：</h5>
            <ul style="max-height: 150px; overflow-y: auto;">
    `;
    
    courseNames.forEach(name => {
        html += `<li>${name}</li>`;
    });
    
    html += `
            </ul>
        </div>
    `;
    
    if (parseResult.warnings && parseResult.warnings.length > 0) {
        html += `
            <div class="preview-warnings">
                <h5>警告：</h5>
                <ul>
        `;
        parseResult.warnings.forEach(warning => {
            html += `<li style="color: orange;">${warning}</li>`;
        });
        html += `</ul></div>`;
    }
    
    elements.previewContent.innerHTML = html;
}

// 显示详细错误信息
function showDetailedErrors(errors) {
    if (errors.length === 0) return;
    
    let html = '<div class="import-errors"><h5>错误详情：</h5><ul>';
    errors.forEach(error => {
        html += `<li style="color: red;">${error}</li>`;
    });
    html += '</ul></div>';
    
    elements.importStatus.innerHTML += html;
}

// 确认导入
function confirmImport() {
    if (!pendingImportData || !pendingImportData.courses) {
        showImportStatus('没有待导入的数据', 'error');
        return;
    }
    
    // 询问是否覆盖或追加
    const action = confirm('是否追加到现有课表？\n\n点击"确定"追加，点击"取消"覆盖现有数据');
    
    if (action) {
        // 追加模式
        coursesData = [...coursesData, ...pendingImportData.courses];
        showImportStatus(`已追加 ${pendingImportData.courses.length} 条课程记录`, 'success');
    } else {
        // 覆盖模式
        coursesData = pendingImportData.courses;
        showImportStatus(`已导入 ${pendingImportData.courses.length} 条课程记录（覆盖原有数据）`, 'success');
    }
    
    // 保存数据
    saveScheduleData();
    
    // 记录导入历史
    const historyEntry = {
        fileName: pendingImportData.fileName,
        coursesCount: pendingImportData.courses.length,
        timestamp: new Date().toISOString(),
        action: action ? 'append' : 'replace'
    };
    importHistory.unshift(historyEntry);
    if (importHistory.length > 10) {
        importHistory = importHistory.slice(0, 10); // 只保留最近10条
    }
    saveImportHistory();
    
    // 刷新显示
    displayWeekSchedule(currentWeek);
    
    // 延迟关闭模态框
    setTimeout(() => {
        elements.importModal.style.display = 'none';
        resetImportModal();
    }, 2000);
}

// 显示导入状态信息
function showImportStatus(message, type) {
    const colors = {
        info: '#2196F3',
        success: '#4CAF50',
        error: '#f44336',
        warning: '#ff9800'
    };
    
    elements.importStatus.innerHTML = `
        <div style="color: ${colors[type] || '#333'}; padding: 10px; border-radius: 4px; background: ${colors[type]}20;">
            ${message}
        </div>
    `;
}

// 显示消息（通用提示）
function showMessage(message, type = 'info') {
    // 创建或更新消息元素
    let messageEl = document.getElementById('global-message');
    if (!messageEl) {
        messageEl = document.createElement('div');
        messageEl.id = 'global-message';
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 4px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        document.body.appendChild(messageEl);
    }
    
    const colors = {
        info: '#2196F3',
        success: '#4CAF50',
        error: '#f44336',
        warning: '#ff9800'
    };
    
    messageEl.style.background = colors[type] || colors.info;
    messageEl.style.color = 'white';
    messageEl.textContent = message;
    messageEl.style.display = 'block';
    
    // 3秒后自动隐藏
    setTimeout(() => {
        messageEl.style.display = 'none';
    }, 3000);
}

// 初始化周次选择器
function initWeekSelector() {
    for (let i = 1; i <= 25; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `第 ${i} 周`;
        elements.weekSelect.appendChild(option);
    }
    elements.weekSelect.value = currentWeek;
}

// 设置事件监听器
function setupEventListeners() {
    // 周次选择
    elements.weekSelect.addEventListener('change', (e) => {
        currentWeek = parseInt(e.target.value);
        displayWeekSchedule(currentWeek);
    });
    
    // 前一周/后一周按钮
    document.getElementById('prev-week').addEventListener('click', () => {
        if (currentWeek > 1) {
            currentWeek--;
            elements.weekSelect.value = currentWeek;
            displayWeekSchedule(currentWeek);
        }
    });
    
    document.getElementById('next-week').addEventListener('click', () => {
        if (currentWeek < 25) {
            currentWeek++;
            elements.weekSelect.value = currentWeek;
            displayWeekSchedule(currentWeek);
        }
    });
    
    // 本周按钮
    document.getElementById('current-week-btn').addEventListener('click', () => {
        const calculatedWeek = calculateCurrentWeek();
        if (calculatedWeek >= 1 && calculatedWeek <= 25) {
            currentWeek = calculatedWeek;
            elements.weekSelect.value = currentWeek;
            displayWeekSchedule(currentWeek);
        }
    });
    
    // 星期标签页
    document.querySelectorAll('.weekday-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.weekday-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentWeekday = tab.dataset.weekday;
            displayCoursesForWeekday(currentWeek, currentWeekday);
        });
    });
    
    // 搜索功能
    document.getElementById('search-btn').addEventListener('click', performSearch);
    elements.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });
    
    document.getElementById('clear-search').addEventListener('click', () => {
        elements.searchInput.value = '';
        showScheduleView();
    });
    
    document.getElementById('back-to-schedule').addEventListener('click', showScheduleView);
    
    // 日期设置
    document.getElementById('set-start-date').addEventListener('click', () => {
        elements.startDateInput.value = formatDateForInput(semesterStartDate);
        elements.dateModal.style.display = 'flex';
    });
    
    document.getElementById('save-date').addEventListener('click', () => {
        const newDate = new Date(elements.startDateInput.value);
        if (!isNaN(newDate)) {
            semesterStartDate = newDate;
            localStorage.setItem('semesterStartDate', semesterStartDate.toISOString());
            updateCurrentWeekInfo();
            elements.dateModal.style.display = 'none';
        }
    });
    
    document.getElementById('cancel-date').addEventListener('click', () => {
        elements.dateModal.style.display = 'none';
    });
    
    // 点击模态框外部关闭
    elements.dateModal.addEventListener('click', (e) => {
        if (e.target === elements.dateModal) {
            elements.dateModal.style.display = 'none';
        }
    });
    
    // 视图切换按钮
    document.getElementById('day-view-btn').addEventListener('click', () => {
        currentView = 'day';
        document.getElementById('day-view-btn').classList.add('active');
        document.getElementById('week-view-btn').classList.remove('active');
        document.getElementById('weekday-tabs').style.display = 'flex';
        displayWeekSchedule(currentWeek);
    });
    
    document.getElementById('week-view-btn').addEventListener('click', () => {
        currentView = 'week';
        document.getElementById('week-view-btn').classList.add('active');
        document.getElementById('day-view-btn').classList.remove('active');
        document.getElementById('weekday-tabs').style.display = 'none';
        displayWeekView(currentWeek);
    });
}

// 显示指定周的课表
function displayWeekSchedule(week) {
    currentWeek = week;
    elements.weekTitle.textContent = `第 ${week} 周 课程安排`;
    
    if (currentView === 'day') {
        // 日视图模式
        document.querySelectorAll('.weekday-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.weekday === '一') {
                tab.classList.add('active');
            }
        });
        
        currentWeekday = '一';
        displayCoursesForWeekday(week, currentWeekday);
    } else {
        // 周视图模式
        displayWeekView(week);
    }
}

// 显示周视图
function displayWeekView(week) {
    const weekdays = ['一', '二', '三', '四', '五', '六', '日'];
    const weekdayNames = {
        '一': '星期一',
        '二': '星期二',
        '三': '星期三',
        '四': '星期四',
        '五': '星期五',
        '六': '星期六',
        '日': '星期日'
    };
    
    let html = '<div class="week-view-container">';
    
    weekdays.forEach(weekday => {
        const courses = getCoursesForWeekday(week, weekday);
        
        // 按节次排序
        courses.sort((a, b) => {
            const aStart = extractPeriodStart(a.periods);
            const bStart = extractPeriodStart(b.periods);
            return aStart - bStart;
        });
        
        html += `
            <div class="weekday-column">
                <div class="weekday-header">${weekdayNames[weekday]}</div>
                ${courses.length > 0 ? 
                    courses.map(course => `
                        <div class="course-card">
                            <div class="course-time">${course.periods || '时间未定'}</div>
                            <div class="course-name">${course.name}</div>
                            <div class="course-details">
                                <div class="course-location">📍 ${course.location || '地点待定'}</div>
                                <div class="course-teacher">👤 ${course.teacher}</div>
                            </div>
                        </div>
                    `).join('') :
                    '<div class="no-courses" style="padding: 20px;">无课程</div>'
                }
            </div>
        `;
    });
    
    html += '</div>';
    elements.coursesDisplay.innerHTML = html;
}

// 显示指定星期的课程
function displayCoursesForWeekday(week, weekday) {
    const courses = getCoursesForWeekday(week, weekday);
    
    if (courses.length === 0) {
        elements.coursesDisplay.innerHTML = '<div class="no-courses">今天没有课程安排</div>';
        return;
    }
    
    // 按节次排序
    courses.sort((a, b) => {
        const aStart = extractPeriodStart(a.periods);
        const bStart = extractPeriodStart(b.periods);
        return aStart - bStart;
    });
    
    // 生成课程卡片HTML
    const html = courses.map(course => `
        <div class="course-card">
            <div class="course-time">${course.periods || '时间未定'}</div>
            <div class="course-name">${course.name}</div>
            <div class="course-details">
                <div class="course-location">📍 ${course.location || '地点待定'}</div>
                <div class="course-teacher">👤 ${course.teacher}</div>
                <div class="course-class">班号：${course.classId}</div>
            </div>
        </div>
    `).join('');
    
    elements.coursesDisplay.innerHTML = html;
}

// 获取指定周和星期的课程
function getCoursesForWeekday(week, weekday) {
    return coursesData.filter(course => 
        course.weeks.includes(week) && course.weekday === weekday
    );
}

// 提取节次开始数字
function extractPeriodStart(periodStr) {
    if (!periodStr) return 999;
    const match = periodStr.match(/(\d+)/);
    return match ? parseInt(match[1]) : 999;
}

// 搜索功能
function performSearch() {
    const keyword = elements.searchInput.value.trim();
    if (!keyword) return;
    
    const results = coursesData.filter(course => 
        course.name.toLowerCase().includes(keyword.toLowerCase())
    );
    
    // 去重（按课程名称）
    const uniqueResults = [];
    const seenNames = new Set();
    
    results.forEach(course => {
        if (!seenNames.has(course.name)) {
            seenNames.add(course.name);
            uniqueResults.push(course);
        }
    });
    
    displaySearchResults(uniqueResults, keyword);
}

// 显示搜索结果
function displaySearchResults(results, keyword) {
    if (results.length === 0) {
        elements.searchResultsContent.innerHTML = 
            `<div class="no-courses">未找到包含"${keyword}"的课程</div>`;
    } else {
        const html = results.map(course => {
            // 获取所有相同课程的周次
            const allWeeks = coursesData
                .filter(c => c.name === course.name)
                .flatMap(c => c.weeks);
            const uniqueWeeks = [...new Set(allWeeks)].sort((a, b) => a - b);
            
            return `
                <div class="search-result-item">
                    <div class="search-result-name">${course.name}</div>
                    <div class="search-result-details">
                        <div>📍 ${course.location || '地点待定'}</div>
                        <div>👤 ${course.teacher}</div>
                        <div>📅 ${course.time}</div>
                    </div>
                    <div class="search-result-weeks">
                        上课周次：${formatWeeks(uniqueWeeks)}
                    </div>
                </div>
            `;
        }).join('');
        
        elements.searchResultsContent.innerHTML = html;
    }
    
    showSearchView();
}

// 格式化周次显示
function formatWeeks(weeks) {
    if (weeks.length === 0) return '无';
    
    const ranges = [];
    let start = weeks[0];
    let end = weeks[0];
    
    for (let i = 1; i < weeks.length; i++) {
        if (weeks[i] === end + 1) {
            end = weeks[i];
        } else {
            ranges.push(start === end ? `${start}` : `${start}-${end}`);
            start = weeks[i];
            end = weeks[i];
        }
    }
    ranges.push(start === end ? `${start}` : `${start}-${end}`);
    
    return ranges.join(', ') + ' 周';
}

// 视图切换
function showScheduleView() {
    elements.scheduleContainer.style.display = 'block';
    elements.searchResults.style.display = 'none';
}

function showSearchView() {
    elements.scheduleContainer.style.display = 'none';
    elements.searchResults.style.display = 'block';
}

// 计算当前周次
function calculateCurrentWeek() {
    const today = new Date();
    const diffTime = today - semesterStartDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const week = Math.floor(diffDays / 7) + 1;
    return week;
}

// 更新当前周次信息
function updateCurrentWeekInfo() {
    const week = calculateCurrentWeek();
    if (week > 0 && week <= 25) {
        elements.currentWeekInfo.textContent = `当前是第 ${week} 周`;
    } else if (week <= 0) {
        elements.currentWeekInfo.textContent = '学期尚未开始';
    } else {
        elements.currentWeekInfo.textContent = '学期已结束';
    }
}

// 加载学期开始日期
function loadSemesterStartDate() {
    const saved = localStorage.getItem('semesterStartDate');
    if (saved) {
        semesterStartDate = new Date(saved);
    }
}

// 格式化日期为input[type="date"]格式
function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 添加导出功能
function exportSchedule(format = 'json') {
    if (format === 'json') {
        const dataStr = JSON.stringify(coursesData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `课表_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showMessage('课表已导出为JSON格式', 'success');
    } else if (format === 'excel') {
        // 创建工作簿
        const wb = XLSX.utils.book_new();
        
        // 转换数据为工作表格式
        const wsData = coursesData.map(course => ({
            '课程名称': course.name,
            '教学班号': course.classId,
            '上课时间': course.time,
            '上课地点': course.location || '',
            '上课教师': course.teacher,
            '周次': course.weeks.join(','),
            '星期': course.weekday,
            '节次': course.periods
        }));
        
        const ws = XLSX.utils.json_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, '课表');
        
        // 导出文件
        XLSX.writeFile(wb, `课表_${new Date().toISOString().split('T')[0]}.xlsx`);
        showMessage('课表已导出为Excel格式', 'success');
    }
}

// 清除所有数据
function clearAllData() {
    if (confirm('确定要清除所有课表数据吗？此操作不可恢复！')) {
        coursesData = [];
        importHistory = [];
        localStorage.removeItem('coursesData');
        localStorage.removeItem('importHistory');
        displayWeekSchedule(currentWeek);
        showMessage('所有数据已清除', 'info');
    }
}

// 添加键盘快捷键
document.addEventListener('keydown', (e) => {
    // 左右箭头切换周次
    if (e.key === 'ArrowLeft' && !e.target.matches('input')) {
        document.getElementById('prev-week').click();
    } else if (e.key === 'ArrowRight' && !e.target.matches('input')) {
        document.getElementById('next-week').click();
    }
    // Ctrl+F 聚焦搜索框
    else if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        elements.searchInput.focus();
    }
    // Ctrl+I 导入文件
    else if (e.ctrlKey && e.key === 'i') {
        e.preventDefault();
        document.getElementById('import-btn').click();
    }
    // Ctrl+E 导出文件
    else if (e.ctrlKey && e.key === 'e') {
        e.preventDefault();
        exportSchedule('excel');
    }
});

// 添加更多功能按钮的监听器（在页面加载后添加）
document.addEventListener('DOMContentLoaded', function() {
    // 如果需要添加导出按钮，可以在这里动态创建
    const controlsDiv = document.querySelector('.controls');
    if (controlsDiv) {
        // 添加导出按钮组
        const exportGroup = document.createElement('div');
        exportGroup.className = 'export-group';
        exportGroup.innerHTML = `
            <button id="export-json" class="btn btn-secondary">导出JSON</button>
            <button id="export-excel" class="btn btn-secondary">导出Excel</button>
            <button id="clear-data" class="btn btn-danger">清除数据</button>
        `;
        controlsDiv.appendChild(exportGroup);
        
        // 绑定事件
        document.getElementById('export-json').addEventListener('click', () => exportSchedule('json'));
        document.getElementById('export-excel').addEventListener('click', () => exportSchedule('excel'));
        document.getElementById('clear-data').addEventListener('click', clearAllData);
    }
});
