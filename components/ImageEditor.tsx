import React, { useState, useRef } from 'react';
import { editImage } from '../services/geminiService';
import { Send, LoaderCircle, Trash2 } from 'lucide-react';
import Modal from './Modal';

const ImageEditor: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [imageHistory, setImageHistory] = useState<string[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const promptInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImageHistory([result]);
        setActiveImageIndex(0);
        setError('');
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || imageHistory.length === 0 || isLoading) {
      if(imageHistory.length === 0) setError("Please upload an image first.");
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const currentImage = imageHistory[activeImageIndex];
      const base64Image = currentImage.split(',')[1];
      
      const currentFileMimeType = file?.type || 'image/png';

      const resultUrl = await editImage(prompt, base64Image, currentFileMimeType);
      
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
  }

  const activeImage = imageHistory[activeImageIndex];

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-cyan-600 dark:text-cyan-400 mb-4">Image Editor Module</h2>
      
      <div className="flex-grow p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg flex flex-col items-center justify-center mb-4 min-h-[350px]">
        {isLoading && <LoaderCircle className="animate-spin h-8 w-8 text-cyan-400" />}
        {error && !isLoading && <p className="text-red-500 dark:text-red-400 text-center">{error}</p>}
        {activeImage && !isLoading && <img src={activeImage} alt={`Version ${activeImageIndex + 1}`} className="max-h-full max-w-full object-contain rounded-md shadow-lg" />}
        {!activeImage && !isLoading && !error && (
            <div className="text-center text-gray-400 dark:text-gray-500">
                <p>Upload an image to start</p>
                <button onClick={() => fileInputRef.current?.click()} className="mt-2 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors">
                Select File
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
          placeholder="Describe your edits..."
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
                <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400">History</h3>
                <button onClick={handleClearHistory} title="Clear history and start over" className="p-1 text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors">
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
        title="Confirm Clear History"
      >
        <p>Are you sure you want to clear the history? This will remove all images and you will have to upload a new one.</p>
      </Modal>
    </div>
  );
};

export default ImageEditor;