import { useCallback, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, Image as ImageIcon } from "lucide-react";

interface ImageUploadProps {
  t: Record<string, string>;
  onImageSelect: (file: File, preview: string) => void;
  onRemove: () => void;
  preview: string | null;
}

const ImageUpload = ({ t, onImageSelect, onRemove, preview }: ImageUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const url = URL.createObjectURL(file);
      onImageSelect(file, url);
    },
    [onImageSelect]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  if (preview) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative rounded-xl overflow-hidden border-2 border-border shadow-md"
      >
        <img src={preview} alt={t.img_caption} className="w-full max-h-80 object-contain bg-surface" />
        <button
          onClick={onRemove}
          className="absolute top-3 right-3 p-2 rounded-full bg-destructive text-destructive-foreground shadow-md hover:opacity-90 transition-opacity"
        >
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      className={`relative cursor-pointer border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200 ${
        isDragging
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50 hover:bg-muted/50"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpg,image/jpeg,image/png"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <motion.div
        animate={isDragging ? { scale: 1.1 } : { scale: 1 }}
        className="flex flex-col items-center gap-3"
      >
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          {isDragging ? (
            <ImageIcon className="w-7 h-7 text-primary" />
          ) : (
            <Upload className="w-7 h-7 text-primary" />
          )}
        </div>
        <p className="font-semibold text-foreground">{t.upload_desc}</p>
        <p className="text-sm text-muted-foreground">{t.upload_formats}</p>
      </motion.div>
    </motion.div>
  );
};

export default ImageUpload;
