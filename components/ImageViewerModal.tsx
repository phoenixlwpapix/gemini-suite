import React, { useEffect } from 'react';
import { X, Download } from 'lucide-react';

interface ImageViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  altText?: string;
}

const ImageViewerModal: React.FC<ImageViewerModalProps> = ({ isOpen, onClose, imageSrc, altText }) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = imageSrc;
    link.download = `gemini-image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div 
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md opacity-0 animate-fade-in"
        onClick={onClose}
    >
      {/* Controls */}
      <div className="absolute top-4 right-4 flex items-center space-x-4 z-20">
        <button
          onClick={handleDownload}
          className="p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200"
          title="Download"
        >
          <Download className="w-6 h-6" />
        </button>
        <button
          onClick={onClose}
          className="p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200"
          title="Close"
        >
          <X className="w-8 h-8" />
        </button>
      </div>

      {/* Image Container */}
      <div 
        className="relative w-full h-full p-4 md:p-10 flex items-center justify-center opacity-0 animate-zoom-in"
      >
        <img
          src={imageSrc}
          alt={altText || 'Full view'}
          className="max-w-full max-h-full object-contain rounded-sm shadow-2xl drop-shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes zoomIn {
          from { transform: scale(0.92); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in { animation: fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
        .animate-zoom-in { animation: zoomIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
};

export default ImageViewerModal;