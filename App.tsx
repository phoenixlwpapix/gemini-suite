import React, { useState, useEffect } from 'react';
import { Module } from './types';
import Sidebar from './components/Sidebar';
import Chatbot from './components/Chatbot';
import TextToImage from './components/TextToImage';
import ImageEditor from './components/ImageEditor';
import { LanguageProvider, useLanguage } from './hooks/useLanguage';

type Theme = 'light' | 'dark';

const AppContent: React.FC = () => {
  const [activeModule, setActiveModule] = useState<Module>(Module.CHATBOT);
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    return savedTheme || 'dark';
  });
  const { language } = useLanguage();

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  useEffect(() => {
    const root = window.document.documentElement;
    if (language === 'zh') {
      root.classList.add('lang-zh');
    } else {
      root.classList.remove('lang-zh');
    }
  }, [language]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  const renderModule = () => {
    switch (activeModule) {
      case Module.CHATBOT:
        return <Chatbot />;
      case Module.TEXT_TO_IMAGE:
        return <TextToImage />;
      case Module.IMAGE_EDITOR:
        return <ImageEditor />;
      default:
        return <Chatbot />;
    }
  };

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <Sidebar 
        activeModule={activeModule} 
        setActiveModule={setActiveModule}
        theme={theme}
        toggleTheme={toggleTheme} 
      />
      <main className="flex-1 p-6 sm:p-10 overflow-y-auto">
        {renderModule()}
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
};


export default App;