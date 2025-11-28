import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

type Language = 'en' | 'zh';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    sidebar_title_short: "GS",
    sidebar_title_long: "Gemini Suite",
    sidebar_chatbot: "Chatbot",
    sidebar_text_to_image: "Text-to-Image",
    sidebar_image_editor: "Image Editor",
    sidebar_light_mode: "Light Mode",
    sidebar_dark_mode: "Dark Mode",
    sidebar_language_switch: "切换到中文",
    theme_switcher_title_light: "Switch to light mode",
    theme_switcher_title_dark: "Switch to dark mode",
    chatbot_title: "Chatbot Module",
    chatbot_placeholder: "Enter your prompt here...",
    chatbot_initial_message: "Hello! How can I help you today?",
    chatbot_start_over: "Start Over",
    chatbot_start_over_title: "Start a new conversation",
    text_to_image_title: "Text-to-Image",
    text_to_image_placeholder: "Enter a detailed image description...",
    text_to_image_initial_message: "Your generated image will appear here...",
    text_to_image_aspect_ratio: "Aspect Ratio",
    image_editor_title: "Image Editor",
    image_editor_upload_prompt: "Upload an image to start",
    image_editor_select_file: "Select File",
    image_editor_placeholder: "Describe your edits...",
    image_editor_history: "History",
    image_editor_clear_history: "Clear history and start over",
    modal_cancel: "Cancel",
    modal_confirm: "Confirm",
    modal_clear_history_title: "Confirm Clear History",
    modal_clear_history_content: "Are you sure you want to clear the history? This will remove all images and you will have to upload a new one.",
    auth_title: "Gemini 3 Powered",
    auth_desc: "To use the advanced Gemini 3 models for Chat and Image generation, please select a paid API key.",
    auth_button: "Connect API Key",
    auth_billing: "View Billing Documentation",
    error_generate_text: "Failed to generate text. Please try again.",
    error_generate_text_stream: "Failed to generate text stream. Please try again.",
    error_generate_image: "Failed to generate image. Please try again.",
    error_edit_image: "Failed to edit image. Please try again.",
    error_no_image_generated: "No image was generated.",
    error_no_edited_image: "No edited image was returned.",
    error_upload_first: "Please upload an image first."
  },
  zh: {
    sidebar_title_short: "GS",
    sidebar_title_long: "Gemini工坊",
    sidebar_chatbot: "聊天机器人",
    sidebar_text_to_image: "文生图",
    sidebar_image_editor: "图像编辑器",
    sidebar_light_mode: "浅色模式",
    sidebar_dark_mode: "深色模式",
    sidebar_language_switch: "Switch to English",
    theme_switcher_title_light: "切换到浅色模式",
    theme_switcher_title_dark: "切换到深色模式",
    chatbot_title: "聊天机器人",
    chatbot_placeholder: "你想知道什么？",
    chatbot_initial_message: "你好！今天我能为您做些什么？",
    chatbot_start_over: "重新开始",
    chatbot_start_over_title: "开始新对话",
    text_to_image_title: "文生图",
    text_to_image_placeholder: "输入详细的图像描述...",
    text_to_image_initial_message: "您生成的图像将显示在此处...",
    text_to_image_aspect_ratio: "图片比例",
    image_editor_title: "图像编辑器",
    image_editor_upload_prompt: "上传图像以开始",
    image_editor_select_file: "选择文件",
    image_editor_placeholder: "描述您的编辑...",
    image_editor_history: "历史记录",
    image_editor_clear_history: "清除历史记录并重新开始",
    modal_cancel: "取消",
    modal_confirm: "确认",
    modal_clear_history_title: "确认清除历史记录",
    modal_clear_history_content: "您确定要清除历史记录吗？这将删除所有图像，您需要上传一个新的。",
    auth_title: "Gemini 3 驱动",
    auth_desc: "要使用先进的 Gemini 3 模型进行聊天和图像生成，请选择付费 API 密钥。",
    auth_button: "连接 API 密钥",
    auth_billing: "查看计费文档",
    error_generate_text: "生成文本失败。请重试。",
    error_generate_text_stream: "生成文本流失败。请重试。",
    error_generate_image: "生成图像失败。请重试。",
    error_edit_image: "编辑图像失败。请重试。",
    error_no_image_generated: "没有生成图像。",
    error_no_edited_image: "没有返回编辑过的图像。",
    error_upload_first: "请先上传一张图片。"
  }
};


const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const savedLang = localStorage.getItem('language') as Language | null;
    return savedLang || 'zh'; // Default to Chinese
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};