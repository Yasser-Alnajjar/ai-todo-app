// نظام اللغة
const LANGUAGE_STORAGE_KEY = 'language';

function initLanguageSystem() {
    const langToggle = document.getElementById('lang-toggle');
    const savedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY) || 'ar';
    
    // تطبيق اللغة المحفوظة
    setLanguage(savedLang);
    
    // مستمع حدث تغيير اللغة
    langToggle.addEventListener('click', () => {
        const currentLang = document.documentElement.lang;
        const newLang = currentLang === 'ar' ? 'en' : 'ar';
        setLanguage(newLang);
    });
}

// تطبيق اللغة المحددة
function setLanguage(lang) {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    
    // تحديث نص زر تبديل اللغة
    const langToggle = document.getElementById('lang-toggle');
    langToggle.textContent = lang === 'ar' ? 'English' : 'عربي';
    
    // ترجمة جميع العناصر
    translateElements();
}

// ترجمة العناصر
function translateElements() {
    const currentLang = document.documentElement.lang;
    const elements = document.querySelectorAll('[data-translate]');
    
    elements.forEach(element => {
        const key = element.dataset.translate;
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            element.placeholder = getTranslation(key, currentLang);
        } else {
            element.textContent = getTranslation(key, currentLang);
        }
    });
}

// الحصول على الترجمة
function getTranslation(key, lang) {
    return translations[lang]?.[key] || key;
}
