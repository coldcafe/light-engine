import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import translationEN from './locales/en.json';
import translationZH from './locales/zh.json';

// 翻译资源
const resources = {
  en: {
    translation: translationEN
  },
  zh: {
    translation: translationZH
  }
};

// 初始化i18n
i18n
  .use(initReactI18next) // 将i18next传递给react-i18next
  .init({
    resources,
    lng: localStorage.getItem('language') || 'zh', // 默认使用中文，如果localStorage中有保存的语言则使用保存的语言
    fallbackLng: 'zh', // 如果当前语言的某些键没有翻译，回退到中文
    interpolation: {
      escapeValue: false // 不需要转义React组件
    },
    detection: {
      order: ['localStorage', 'navigator']
    }
  });

export default i18n;