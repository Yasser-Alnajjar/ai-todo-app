import { initTodoApp } from './todo';
import { initLanguageSystem } from './language';

// تهيئة التطبيق
document.addEventListener('DOMContentLoaded', () => {
    initLanguageSystem();
    initTodoApp();
});
