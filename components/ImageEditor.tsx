import React, { useState, useRef, useEffect } from 'react';
import { editImage } from '../services/geminiService';
import { Send, LoaderCircle, Trash2 } from 'lucide-react';
import Modal from './Modal';
import { useLanguage } from '../hooks/useLanguage';

interface ImageEditorProps {
    sharedImage: string | null;
    onConsumeSharedImage: () => void;
}

const ImageEditor: React.FC<ImageEditorProps> = ({ sharedImage, onConsumeSharedImage }) => {
  const { t } = useLanguage();
  const [prompt, setPrompt] = useState('');
  const [imageHistory, setImageHistory] = useState<string[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // New state to track the aspect ratio of the current image
  const [currentAspectRatio, setCurrentAspectRatio] = useState<string>("1:1");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const promptInputRef = useRef<HTMLInputElement>(null);

  // Helper to find closest supported aspect ratio
  const getClosestAspectRatio = (width: number, height: number): string => {
      const ratio = width / height;
      const ratios: Record<string, number> = {
        "1:1": 1,
        "4:3": 4/3,
        "3:4": 3/4,
        "16:9": 16/9,
        "9:16": 9/16,
      };
      
      let closest = "1:1";
      let minDiff = Number.MAX_VALUE;
      
      for (const [key, val] of Object.entries(ratios)) {
          const diff = Math.abs(val - ratio);
          if (diff < minDiff) {
              minDiff = diff;
              closest = key;
          }
      }
      return closest;
  };

  const processImage = (imageUrl: string) => {
      const img = new Image();
      img.onload = () => {
          const ratio = getClosestAspectRatio(img.naturalWidth, img.naturalHeight);
          setCurrentAspectRatio(ratio);
          setImageHistory([imageUrl]);
          setActiveImageIndex(0);
          setError('');
      };
      img.src = imageUrl;
  };

  useEffect(() => {
      if (sharedImage) {
          processImage(sharedImage);
          // Clear shared image so it doesn't reload on every render
          onConsumeSharedImage();
          setFile(null); // Clear any previous file selection
      }
  }, [sharedImage, onConsumeSharedImage]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        processImage(result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || imageHistory.length === 0 || isLoading) {
      if(imageHistory.length === 0) setError("error_upload_first");
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const currentImage = imageHistory[activeImageIndex];
      // Extract base64 and mime type
      const parts = currentImage.split(',');
      const base64Image = parts[1];
      
      // Try to get mime type from data URL, otherwise fallback
      let mimeType = 'image/png';
      const match = currentImage.match(/:(.*?);/);
      if (match) {
          mimeType = match[1];
      } else if (file) {
          mimeType = file.type;
      }

      const resultUrl = await editImage(prompt, base64Image, mimeType, currentAspectRatio);
      
      const newHistory = imageHistory.slice(0, activeImageIndex + 1);
      newHistory.push(resultUrl);
      
      setImageHistory(newHistory);
      setActiveImageIndex(newHistory.length - 1);

    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputFocus = () => {
    if (promptInputRef.current) {
      promptInputRef.current.value = "";
      setPrompt("");
    }
  };
  
  const handleClearHistory = () => {
      setIsModalOpen(true);
  }

  const handleConfirmClear = () => {
    setImageHistory([]);
    setActiveImageIndex(0);
    setFile(null);
    setError('');
    setPrompt('');
    setIsModalOpen(false);
    setCurrentAspectRatio("1:1"); // Reset aspect ratio
  }

  const activeImage = imageHistory[activeImageIndex];

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-cyan-600 dark:text-cyan-400 mb-4">{t('image_editor_title')}</h2>
      
      <div className="flex-grow p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg flex flex-col items-center justify-center mb-4 min-h-[350px]">
        {isLoading && <LoaderCircle className="animate-spin h-8 w-8 text-cyan-400" />}
        {error && !isLoading && <p className="text-red-500 dark:text-red-400 text-center">{t(error)}</p>}
        {activeImage && !isLoading && <img src={activeImage} alt={`Version ${activeImageIndex + 1}`} className="max-h-full max-w-full object-contain rounded-md shadow-lg" />}
        {!activeImage && !isLoading && !error && (
            <div className="text-center text-gray-400 dark:text-gray-500">
                <p>{t('image_editor_upload_prompt')}</p>
                <button onClick={() => fileInputRef.current?.click()} className="mt-2 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors">
                {t('image_editor_select_file')}
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex items-center space-x-2 mb-4">
        <input
          ref={promptInputRef}
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onFocus={handleInputFocus}
          placeholder={t('image_editor_placeholder')}
          className="flex-grow p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          disabled={isLoading || imageHistory.length === 0}
        />
        <button
          type="submit"
          disabled={isLoading || !prompt.trim() || imageHistory.length === 0}
          className="p-3 bg-cyan-500 text-white rounded-lg disabled:bg-gray-400 dark:disabled:bg-gray-600 hover:bg-cyan-600 transition-colors flex items-center justify-center"
        >
          {isLoading ? <LoaderCircle className="animate-spin h-6 w-6" /> : <Send className="w-6 h-6" />}
        </button>
      </form>
      
      {imageHistory.length > 0 && (
          <div className="w-full">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400">{t('image_editor_history')}</h3>
                <button onClick={handleClearHistory} title={t('image_editor_clear_history')} className="p-1 text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                    <Trash2 className="w-5 h-5" />
                </button>
              </div>
              <div className="flex overflow-x-auto space-x-2 p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                  {imageHistory.map((imgSrc, index) => (
                      <button key={index} onClick={() => setActiveImageIndex(index)} className={`flex-shrink-0 w-24 h-24 rounded-md overflow-hidden border-2 transition-colors ${activeImageIndex === index ? 'border-cyan-500 dark:border-cyan-400' : 'border-transparent hover:border-gray-400 dark:hover:border-gray-500'}`}>
                          <img src={imgSrc} alt={`History ${index + 1}`} className="w-full h-full object-cover" />
                      </button>
                  ))}
              </div>
          </div>
      )}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmClear}
        title={t('modal_clear_history_title')}
      >
        <p>{t('modal_clear_history_content')}</p>
      </Modal>
    </div>
  );
};

export default ImageEditor;