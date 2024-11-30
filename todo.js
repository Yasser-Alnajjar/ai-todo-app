// ثوابت التخزين
const TASKS_STORAGE_KEY = 'tasks';
const THEME_STORAGE_KEY = 'theme';

function initTodoApp() {
    // الحصول على العناصر من DOM
    const taskForm = document.getElementById('task-form');
    const taskInput = document.getElementById('task-input');
    const tasksList = document.getElementById('tasks-list');
    const themeToggle = document.getElementById('theme-toggle');
    const noTasksElement = document.getElementById('no-tasks');
    const taskFilter = document.getElementById('task-filter');
    const deleteOptions = document.getElementById('delete-options');
    const confirmModal = document.getElementById('confirm-modal');
    const confirmBtn = document.getElementById('confirm-delete');
    const cancelBtn = document.getElementById('cancel-delete');

    // تحميل المهام المحفوظة
    let tasks = JSON.parse(localStorage.getItem(TASKS_STORAGE_KEY)) || [];
    let currentFilter = 'all';

    // تحميل الثيم المحفوظ
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);
    }

    // إنشاء عنصر التنبيه
    const alertElement = document.createElement('div');
    alertElement.className = 'alert hidden';
    taskForm.insertAdjacentElement('beforebegin', alertElement);

    // عرض تنبيه للمستخدم
    function showAlert(message, type = 'error') {
        alertElement.textContent = message;
        alertElement.className = `alert alert-${type}`;
        
        // إخفاء التنبيه بعد 3 ثواني
        setTimeout(() => {
            alertElement.className = 'alert hidden';
        }, 3000);
    }

    // التحقق من وجود المهمة
    function isTaskExists(taskText) {
        return tasks.some(task => task.text.toLowerCase() === taskText.toLowerCase());
    }

    // تحديث حالة "لا توجد مهام"
    function updateNoTasksVisibility() {
        const filteredTasks = filterTasks(tasks, currentFilter);
        noTasksElement.classList.toggle('hidden', filteredTasks.length > 0);
    }

    // تصفية المهام
    function filterTasks(tasks, filter) {
        switch (filter) {
            case 'active':
                return tasks.filter(task => !task.completed);
            case 'completed':
                return tasks.filter(task => task.completed);
            default:
                return tasks;
        }
    }

    // تحديث عرض المهام
    function updateTasksDisplay() {
        tasksList.innerHTML = '';
        const filteredTasks = filterTasks(tasks, currentFilter);
        filteredTasks.forEach(task => renderTask(task));
        updateNoTasksVisibility();
    }

    // حذف المهام المحددة
    function deleteTasks(type) {
        const confirmModal = document.getElementById('confirm-modal');
        const confirmBtn = document.getElementById('confirm-delete');
        const cancelBtn = document.getElementById('cancel-delete');
        
        // إظهار مربع الحوار
        confirmModal.classList.add('show');
        
        // مستمع حدث الإلغاء
        const handleCancel = () => {
            confirmModal.classList.remove('show');
            deleteOptions.selectedIndex = 0;
            cleanup();
        };
        
        // مستمع حدث التأكيد
        const handleConfirm = () => {
            switch (type) {
                case 'completed':
                    tasks = tasks.filter(task => !task.completed);
                    break;
                case 'active':
                    tasks = tasks.filter(task => task.completed);
                    break;
                case 'all':
                    tasks = [];
                    break;
            }
            
            saveTasks();
            updateTasksDisplay();
            showAlert(getTranslation('tasksDeleted', document.documentElement.lang), 'success');
            deleteOptions.selectedIndex = 0;
            confirmModal.classList.remove('show');
            cleanup();
        };
        
        // تنظيف مستمعي الأحداث
        const cleanup = () => {
            confirmBtn.removeEventListener('click', handleConfirm);
            cancelBtn.removeEventListener('click', handleCancel);
            document.removeEventListener('keydown', handleKeydown);
        };
        
        // مستمع حدث الضغط على المفاتيح
        const handleKeydown = (e) => {
            if (e.key === 'Escape') {
                handleCancel();
            } else if (e.key === 'Enter') {
                handleConfirm();
            }
        };
        
        // إضافة مستمعي الأحداث
        confirmBtn.addEventListener('click', handleConfirm);
        cancelBtn.addEventListener('click', handleCancel);
        document.addEventListener('keydown', handleKeydown);
    }

    // إضافة مهمة جديدة
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const taskText = taskInput.value.trim();
        if (!taskText) return;

        // التحقق من تكرار المهمة
        if (isTaskExists(taskText)) {
            const currentLang = document.documentElement.lang;
            const message = currentLang === 'ar' 
                ? 'هذه المهمة موجودة بالفعل!'
                : 'This task already exists!';
            showAlert(message);
            taskInput.focus();
            return;
        }

        const task = {
            id: Date.now(),
            text: taskText,
            completed: false
        };

        tasks.push(task);
        saveTasks();
        taskInput.value = '';
        
        if (currentFilter === 'all' || currentFilter === 'active') {
            renderTask(task);
        }
        updateNoTasksVisibility();

        // عرض رسالة نجاح
        const currentLang = document.documentElement.lang;
        const message = currentLang === 'ar'
            ? 'تمت إضافة المهمة بنجاح!'
            : 'Task added successfully!';
        showAlert(message, 'success');
    });

    // عرض المهمة في القائمة
    function renderTask(task) {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.dataset.id = task.id;

        const currentLang = document.documentElement.lang;
        li.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
            <span class="task-text">${task.text}</span>
            <button class="delete-btn" title="${getTranslation('deleteTask', currentLang)}">
                <i class="fas fa-trash"></i>
            </button>
        `;

        // إضافة مستمع لحدث الحذف
        const deleteBtn = li.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => {
            showDeleteConfirmation(task, li);
        });

        // إضافة مستمع لحدث اكتمال المهمة
        const checkbox = li.querySelector('.task-checkbox');
        checkbox.addEventListener('change', () => {
            task.completed = checkbox.checked;
            li.classList.toggle('completed');
            saveTasks();
            if (currentFilter !== 'all') {
                updateTasksDisplay();
            }
        });

        tasksList.appendChild(li);
    }

    // عرض مربع حوار تأكيد حذف مهمة فردية
    function showDeleteConfirmation(task, taskElement) {
        const confirmModal = document.getElementById('confirm-modal');
        const confirmBtn = document.getElementById('confirm-delete');
        const cancelBtn = document.getElementById('cancel-delete');
        const modalText = confirmModal.querySelector('[data-translate="confirmDelete"]');
        
        // تحديث نص التأكيد ليكون خاصاً بالمهمة
        const currentLang = document.documentElement.lang;
        modalText.textContent = currentLang === 'ar' 
            ? `هل أنت متأكد من حذف المهمة "${task.text}"؟`
            : `Are you sure you want to delete "${task.text}"?`;

        // إظهار مربع الحوار
        confirmModal.classList.add('show');
        
        // مستمع حدث الإلغاء
        const handleCancel = () => {
            confirmModal.classList.remove('show');
            cleanup();
        };
        
        // مستمع حدث التأكيد
        const handleConfirm = () => {
            taskElement.remove();
            tasks = tasks.filter(t => t.id !== task.id);
            saveTasks();
            updateNoTasksVisibility();
            showAlert(getTranslation('taskDeleted', currentLang), 'success');
            confirmModal.classList.remove('show');
            cleanup();
        };
        
        // تنظيف مستمعي الأحداث
        const cleanup = () => {
            confirmBtn.removeEventListener('click', handleConfirm);
            cancelBtn.removeEventListener('click', handleCancel);
            document.removeEventListener('keydown', handleKeydown);
        };
        
        // مستمع حدث الضغط على المفاتيح
        const handleKeydown = (e) => {
            if (e.key === 'Escape') {
                handleCancel();
            } else if (e.key === 'Enter') {
                handleConfirm();
            }
        };
        
        // إضافة مستمعي الأحداث
        confirmBtn.addEventListener('click', handleConfirm);
        cancelBtn.addEventListener('click', handleCancel);
        document.addEventListener('keydown', handleKeydown);
    }

    // حفظ المهام في Local Storage
    function saveTasks() {
        localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
    }

    // تحديث أيقونة الثيم
    function updateThemeIcon(theme) {
        const icon = themeToggle.querySelector('i');
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        themeToggle.title = getTranslation(theme === 'dark' ? 'lightMode' : 'darkMode', document.documentElement.lang);
    }

    // تبديل الثيم
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem(THEME_STORAGE_KEY, newTheme);
        updateThemeIcon(newTheme);
    });

    // مستمعو الأحداث للقوائم المنسدلة
    taskFilter.addEventListener('change', (e) => {
        currentFilter = e.target.value;
        updateTasksDisplay();
    });

    deleteOptions.addEventListener('change', (e) => {
        const value = e.target.value;
        if (value) {
            deleteTasks(value);
        }
    });

    // عرض المهام المحفوظة عند تحميل الصفحة
    updateTasksDisplay();
}

// تهيئة التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', initTodoApp);
