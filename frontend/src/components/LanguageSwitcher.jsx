import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { t, i18n } = useTranslation();
  
  // 切换语言的函数
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng); // 保存语言偏好到localStorage
  };

  return (
    <div className="language-switcher">
      <button
        className={`language-button ${i18n.language === 'zh' ? 'active' : ''}`}
        onClick={() => changeLanguage('zh')}
      >
        {t('languageSwitcher.chinese')}
      </button>
      <span className="language-separator">|</span>
      <button
        className={`language-button ${i18n.language === 'en' ? 'active' : ''}`}
        onClick={() => changeLanguage('en')}
      >
        {t('languageSwitcher.english')}
      </button>
    </div>
  );
};

export default LanguageSwitcher;