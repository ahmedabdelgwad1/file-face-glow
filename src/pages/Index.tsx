import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Leaf, Upload as UploadIcon, Cpu, BarChart3, Languages } from "lucide-react";
import LanguageSelect from "@/components/LanguageSelect";
import ImageUpload from "@/components/ImageUpload";
import DiagnosisCard from "@/components/DiagnosisCard";
import { Language, TEXT } from "@/lib/i18n";
import heroLeaves from "@/assets/hero-leaves.jpg";

// Simulated results for demo
const MOCK_LOCAL_RESULT = {
  label: "Tomato___Late_blight",
  confidence: 87.4,
  source: "",
  isHealthy: false,
};

const MOCK_GROQ_RESULT = {
  label: "Tomato___Late_blight",
  confidence: 92.1,
  source: "",
  reasoning: "The leaf shows irregular dark brown lesions with a water-soaked appearance and white fuzzy growth on the undersides, characteristic of Phytophthora infestans infection.",
  careSteps: [
    "Remove and destroy all infected leaves immediately",
    "Apply copper-based fungicide as a preventive measure",
    "Ensure proper air circulation between plants",
  ],
  isHealthy: false,
};

const Index = () => {
  const [lang, setLang] = useState<Language | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleImageSelect = useCallback((file: File, previewUrl: string) => {
    setImageFile(file);
    setPreview(previewUrl);
    setShowResults(false);
  }, []);

  const handleRemove = useCallback(() => {
    setImageFile(null);
    setPreview(null);
    setShowResults(false);
  }, []);

  const handleAnalyze = useCallback(() => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setShowResults(true);
    }, 2000);
  }, []);

  if (!lang) {
    return <LanguageSelect onSelect={setLang} />;
  }

  const t = TEXT[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";

  const localResult = { ...MOCK_LOCAL_RESULT, source: t.source_local };
  const fusedResult = {
    ...MOCK_GROQ_RESULT,
    source: t.source_fused,
    confidence: 89.3,
  };

  return (
    <div dir={dir} className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="container max-w-4xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Leaf className="w-6 h-6 text-primary" />
            <h1 className="text-lg font-bold font-heading text-foreground">
              {lang === "ar" ? "اكتشاف الأمراض" : "Plant Disease"}
            </h1>
          </div>
          <button
            onClick={() => setLang(null)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
          >
            <Languages className="w-4 h-4" />
            {t.change_lang}
          </button>
        </div>
      </header>

      {/* Hero section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroLeaves} alt="" className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 to-background" />
        </div>
        <div className="relative container max-w-4xl mx-auto px-4 py-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-extrabold font-heading text-foreground mb-3">
              {t.title}
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">{t.desc}</p>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="container max-w-4xl mx-auto px-4 py-8">
        <h3 className="text-center text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-6">
          {t.how_it_works}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: UploadIcon, title: t.step1_title, desc: t.step1_desc },
            { icon: Cpu, title: t.step2_title, desc: t.step2_desc },
            { icon: BarChart3, title: t.step3_title, desc: t.step3_desc },
          ].map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i + 0.3 }}
              className="flex flex-col items-center text-center p-5 rounded-xl bg-card border border-border"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <step.icon className="w-5 h-5 text-primary" />
              </div>
              <h4 className="font-bold text-foreground mb-1">{step.title}</h4>
              <p className="text-sm text-muted-foreground">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Upload & Results */}
      <section className="container max-w-2xl mx-auto px-4 pb-16 space-y-6">
        <ImageUpload
          t={t}
          onImageSelect={handleImageSelect}
          onRemove={handleRemove}
          preview={preview}
        />

        {/* Analyze button */}
        <AnimatePresence>
          {imageFile && !showResults && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex justify-center"
            >
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="px-8 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-lg shadow-lg hover:shadow-xl disabled:opacity-70 transition-all flex items-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                    />
                    {t.analyzing}
                  </>
                ) : (
                  <>
                    <Cpu className="w-5 h-5" />
                    {t.analyze}
                  </>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {showResults && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-5"
            >
              <DiagnosisCard
                title={t.final_title}
                result={fusedResult}
                t={t}
                variant="final"
                delay={0}
              />
              <DiagnosisCard
                title={t.enh_title}
                result={MOCK_GROQ_RESULT}
                t={t}
                variant="enhanced"
                delay={0.3}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
};

export default Index;
