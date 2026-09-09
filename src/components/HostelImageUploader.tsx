import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, Trash2, RefreshCw, CheckCircle, Sparkles } from 'lucide-react';

interface HostelImageUploaderProps {
  currentImageUrl: string;
  imagePreviewUrl?: string;
  onImageSelected: (payload: { file: File | null; previewUrl: string; base64Data: string; fileName: string; fileType: string }) => void;
  onImageRemoved: () => void;
}

const PRESET_HOSTEL_IMAGES = [
  {
    title: 'Modern Architecture',
    url: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80',
    tag: 'Executive'
  },
  {
    title: 'Academic Heights',
    url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
    tag: 'High-Rise'
  },
  {
    title: 'Garden Courtyard',
    url: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80',
    tag: 'Serene'
  },
  {
    title: 'Contemporary Suites',
    url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80',
    tag: 'Luxury'
  }
];

export default function HostelImageUploader({
  currentImageUrl,
  imagePreviewUrl,
  onImageSelected,
  onImageRemoved
}: HostelImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileDetails, setFileDetails] = useState<{ name: string; size: string; dimensions?: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const displayImage = imagePreviewUrl || currentImageUrl;

  const processFile = (file: File) => {
    setErrorMsg(null);

    // Validate mime type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setErrorMsg('Please upload a valid image file (JPEG, PNG, or WebP).');
      return;
    }

    // Validate size (max 10MB)
    const maxSizeBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setErrorMsg('The selected image exceeds the 10MB maximum limit.');
      return;
    }

    const readableSize = (file.size / (1024 * 1024)).toFixed(2) + ' MB';

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;

      // Extract image dimensions
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        setFileDetails({
          name: file.name,
          size: readableSize,
          dimensions: `${img.naturalWidth} × ${img.naturalHeight} px`
        });

        onImageSelected({
          file,
          previewUrl: base64,
          base64Data: base64,
          fileName: file.name,
          fileType: file.type
        });
      };
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const selectPresetImage = (url: string, title: string) => {
    setErrorMsg(null);
    setFileDetails({
      name: `${title}.jpg`,
      size: '1.8 MB (Curated)',
      dimensions: '1920 × 1080 px'
    });
    onImageSelected({
      file: null,
      previewUrl: url,
      base64Data: url,
      fileName: `${(title || 'hostel-photo').toLowerCase().replace(/\s+/g, '-')}.jpg`,
      fileType: 'image/jpeg'
    });
  };

  return (
    <div className="space-y-4 text-left">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {displayImage ? (
        /* Image Preview & Details Card */
        <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm">
          <div className="relative aspect-video sm:aspect-21/9 max-h-72 w-full bg-slate-900 overflow-hidden group">
            <img
              src={displayImage}
              alt="Hostel Preview"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />

            {/* Status Pills */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500 text-white text-[11px] font-bold shadow-sm">
                <CheckCircle size={13} />
                Image Attached (Ready for Atomic Upload)
              </span>
            </div>

            {/* Floating Action Buttons */}
            <div className="absolute bottom-4 right-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/90 hover:bg-white text-slate-800 text-xs font-bold shadow-md backdrop-blur-md transition-all hover:scale-105"
              >
                <RefreshCw size={14} />
                Replace Image
              </button>
              <button
                type="button"
                onClick={() => {
                  setFileDetails(null);
                  onImageRemoved();
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-bold shadow-md backdrop-blur-md transition-all hover:scale-105"
              >
                <Trash2 size={14} />
                Remove
              </button>
            </div>

            {/* File Info Overlay */}
            {fileDetails && (
              <div className="absolute bottom-4 left-4 text-white text-xs space-y-0.5">
                <p className="font-extrabold truncate max-w-xs">{fileDetails.name}</p>
                <p className="text-slate-300 text-[11px] font-mono">
                  {fileDetails.dimensions} • {fileDetails.size}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Drag & Drop Upload Zone */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-blue-600 bg-blue-50/60 scale-[1.01]'
              : 'border-slate-300 bg-slate-50/50 hover:bg-slate-100/60 hover:border-slate-400'
          }`}
        >
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-100 text-blue-900 flex items-center justify-center shadow-xs">
              <UploadCloud size={28} />
            </div>

            <div>
              <h4 className="text-sm font-black text-slate-800">
                Click to select or drag and drop hostel photograph
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                High-resolution exterior front facade or entrance view recommended.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-[11px] font-semibold text-slate-600 shadow-2xs">
              <ImageIcon size={13} className="text-blue-600" />
              <span>Supports PNG, JPG, JPEG, WebP • Max 10MB</span>
            </div>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      {/* Preset Curated Property Images */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles size={13} className="text-amber-500" />
            Or Choose from Curated Campus Photography
          </span>
          <span className="text-[10px] text-slate-400">High-res samples</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {PRESET_HOSTEL_IMAGES.map((preset) => (
            <button
              key={preset.title}
              type="button"
              onClick={() => selectPresetImage(preset.url, preset.title)}
              className="group relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-16/10 focus:outline-none focus:ring-2 focus:ring-blue-900 transition-all text-left"
            >
              <img
                src={preset.url}
                alt={preset.title}
                className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-2 left-2 right-2 text-white">
                <span className="text-[9px] font-black uppercase bg-white/20 backdrop-blur-xs px-1.5 py-0.5 rounded text-white">
                  {preset.tag}
                </span>
                <p className="text-[11px] font-bold truncate mt-0.5">{preset.title}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
