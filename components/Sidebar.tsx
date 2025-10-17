import React from 'react';
import { Module } from '../types';
import { MessageSquare, Image, PenSquare, Sun, Moon } from 'lucide-react';

interface SidebarProps {
  activeModule: Module;
  setActiveModule: (module: Module) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeModule, setActiveModule, theme, toggleTheme }) => {
  const navItems = [
    { id: Module.CHATBOT, label: 'Chatbot', icon: <MessageSquare className="w-6 h-6" /> },
    { id: Module.TEXT_TO_IMAGE, label: 'Text-to-Image', icon: <Image className="w-6 h-6" /> },
    { id: Module.IMAGE_EDITOR, label: 'Image Editor', icon: <PenSquare className="w-6 h-6" /> },
  ];

  return (
    <aside className="w-16 sm:w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="h-16 flex items-center justify-center sm:justify-start sm:px-6 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-bold text-cyan-500 dark:text-cyan-400">
          <span className="sm:hidden">GS</span>
          <span className="hidden sm:inline">Gemini Suite</span>
        </h1>
      </div>
      <nav className="flex-1 py-6 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveModule(item.id)}
            className={`flex items-center w-full px-4 sm:px-6 py-3 text-sm font-medium transition-colors duration-200 ${
              activeModule === item.id
                ? 'bg-gray-200 dark:bg-gray-800 text-cyan-500 dark:text-cyan-400 border-l-4 border-cyan-500 dark:border-cyan-400'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <span className="w-6 h-6 mr-0 sm:mr-4">{item.icon}</span>
            <span className="hidden sm:inline">{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="mt-auto p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={toggleTheme}
          className="flex items-center justify-center sm:justify-start w-full p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          <span className="hidden sm:inline ml-4 text-sm font-medium">
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;