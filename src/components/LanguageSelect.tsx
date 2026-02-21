import { motion } from "framer-motion";
import { Globe } from "lucide-react";
import heroLeaves from "@/assets/hero-leaves.jpg";

interface LanguageSelectProps {
  onSelect: (lang: "ar" | "en") => void;
}

const LanguageSelect = ({ onSelect }: LanguageSelectProps) => {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src={heroLeaves}
          alt="Plant leaves background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-foreground/60" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative z-10 text-center px-6"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mx-auto mb-6 w-20 h-20 rounded-full bg-primary/20 backdrop-blur-sm flex items-center justify-center"
        >
          <span className="text-4xl">🌿</span>
        </motion.div>

        <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-3 font-heading">
          Plant Disease Detection
        </h1>
        <p className="text-primary-foreground/70 text-lg mb-2 font-cairo">
          نظام اكتشاف أمراض النباتات
        </p>

        <div className="flex items-center justify-center gap-2 mb-10 text-primary-foreground/50">
          <Globe className="w-4 h-4" />
          <span className="text-sm">اختر اللغة / Choose language</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect("ar")}
            className="px-10 py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg font-cairo shadow-lg hover:shadow-xl transition-shadow"
          >
            العربية
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect("en")}
            className="px-10 py-4 rounded-xl bg-card text-card-foreground font-bold text-lg shadow-lg hover:shadow-xl transition-shadow"
          >
            English
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default LanguageSelect;
