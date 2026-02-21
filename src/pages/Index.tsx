import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Leaf, Upload as UploadIcon, Cpu, BarChart3, Languages } from "lucide-react";
import LanguageSelect from "@/components/LanguageSelect";
import ImageUpload from "@/components/ImageUpload";
import DiagnosisCard from "@/components/DiagnosisCard";
import { Language, TEXT } from "@/lib/i18n";
import heroLeaves from "@/assets/hero-leaves.jpg";

type DiagnosisResult = {
  label: string;
  confidence: number;
  source: string;
  reasoning?: string;
  careSteps?: string[];
  isHealthy?: boolean;
};

type DiagnoseApiResponse = {
  local: DiagnosisResult;
  enhanced?: DiagnosisResult | null;
  final: DiagnosisResult;
  meta?: {
    groqModel?: string;
    groqAvailable?: boolean;
  };
};

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const Index = () => {
  const [lang, setLang] = useState<Language | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localResult, setLocalResult] = useState<DiagnosisResult | null>(null);
  const [finalResult, setFinalResult] = useState<DiagnosisResult | null>(null);
  const [enhancedResult, setEnhancedResult] = useState<DiagnosisResult | null>(null);

  const handleImageSelect = useCallback((file: File, previewUrl: string) => {
    setImageFile(file);
    setPreview(previewUrl);
    setShowResults(false);
    setError(null);
    setLocalResult(null);
    setFinalResult(null);
    setEnhancedResult(null);
  }, []);

  const handleRemove = useCallback(() => {
    setImageFile(null);
    setPreview(null);
    setShowResults(false);
    setError(null);
    setLocalResult(null);
    setFinalResult(null);
    setEnhancedResult(null);
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!imageFile || !lang) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", imageFile);
      const response = await fetch(`${API_BASE}/api/diagnose?lang=${lang}`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let detail = "Failed to analyze image.";
        try {
          const err = await response.json();
          detail = err?.detail || detail;
        } catch {
          // ignore json parsing errors
        }
        throw new Error(detail);
      }

      const payload: DiagnoseApiResponse = await response.json();
      setLocalResult(payload.local);
      setFinalResult(payload.final);
      setEnhancedResult(payload.enhanced ?? null);
      setShowResults(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg);
      setShowResults(false);
    } finally {
      setIsAnalyzing(false);
    }
  }, [imageFile, lang]);

  if (!lang) {
    return <LanguageSelect onSelect={setLang} />;
  }

  const t = TEXT[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";

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
              {finalResult && (
                <DiagnosisCard
                  title={t.final_title}
                  result={finalResult}
                  t={t}
                  variant="final"
                  delay={0}
                />
              )}
              {enhancedResult && (
                <DiagnosisCard
                  title={t.enh_title}
                  result={enhancedResult}
                  t={t}
                  variant="enhanced"
                  delay={0.3}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 text-destructive px-4 py-3 text-sm">
            {error}
          </div>
        )}
      </section>
    </div>
  );
};

export default Index;
