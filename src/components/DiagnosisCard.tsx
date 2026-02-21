import { motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, Sparkles, Leaf, Footprints } from "lucide-react";

interface DiagnosisResult {
  label: string;
  confidence: number;
  source: string;
  reasoning?: string;
  careSteps?: string[];
  isHealthy?: boolean;
}

interface DiagnosisCardProps {
  title: string;
  result: DiagnosisResult;
  t: Record<string, string>;
  variant: "final" | "enhanced";
  delay?: number;
}

const DiagnosisCard = ({ title, result, t, variant, delay = 0 }: DiagnosisCardProps) => {
  const isFinal = variant === "final";
  const isHealthy = result.isHealthy ?? result.label.toLowerCase().includes("healthy");
  const confPercent = result.confidence;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className={`rounded-xl border-2 overflow-hidden ${
        isFinal
          ? isHealthy
            ? "border-success/30 bg-success/5"
            : "border-warning/30 bg-warning/5"
          : "border-info/30 bg-info/5"
      }`}
    >
      {/* Header */}
      <div
        className={`px-5 py-3 flex items-center gap-2 ${
          isFinal
            ? isHealthy
              ? "bg-success/10"
              : "bg-warning/10"
            : "bg-info/10"
        }`}
      >
        {isFinal ? (
          isHealthy ? (
            <CheckCircle2 className="w-5 h-5 text-success" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-warning" />
          )
        ) : (
          <Sparkles className="w-5 h-5 text-info" />
        )}
        <h3 className="font-bold text-foreground">{title}</h3>
      </div>

      {/* Body */}
      <div className="p-5 space-y-4">
        {/* Diagnosis label */}
        <div className="flex items-center gap-3">
          <Leaf className="w-5 h-5 text-primary shrink-0" />
          <div>
            <p className="text-sm text-muted-foreground">
              {isFinal ? t.final_diag : t.enh_diag}
            </p>
            <p className="font-bold text-lg text-foreground">{prettifyLabel(result.label)}</p>
          </div>
        </div>

        {/* Confidence bar */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">
              {isFinal ? t.final_conf : t.enh_conf}
            </span>
            <span className="font-semibold text-foreground">{confPercent.toFixed(1)}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(confPercent, 100)}%` }}
              transition={{ delay: delay + 0.3, duration: 0.8, ease: "easeOut" }}
              className={`h-full rounded-full ${
                confPercent > 80
                  ? "bg-success"
                  : confPercent > 50
                  ? "bg-warning"
                  : "bg-destructive"
              }`}
            />
          </div>
        </div>

        {/* Source */}
        {isFinal && (
          <p className="text-sm text-muted-foreground">
            {t.final_source}: <span className="font-medium text-foreground">{result.source}</span>
          </p>
        )}

        {/* Reasoning */}
        {result.reasoning && (
          <div className="p-3 rounded-lg bg-surface">
            <p className="text-sm font-medium text-muted-foreground mb-1">{t.enh_reason}</p>
            <p className="text-sm text-surface-foreground">{result.reasoning}</p>
          </div>
        )}

        {/* Care steps */}
        {result.careSteps && result.careSteps.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Footprints className="w-4 h-4 text-primary" />
              <p className="text-sm font-medium text-muted-foreground">{t.enh_steps}</p>
            </div>
            <ul className="space-y-1.5">
              {result.careSteps.map((step, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: delay + 0.5 + i * 0.1 }}
                  className="flex items-start gap-2 text-sm text-foreground"
                >
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  {step}
                </motion.li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </motion.div>
  );
};

function prettifyLabel(label: string): string {
  if (label.includes("___")) {
    const [crop, disease] = label.split("___", 2);
    return `${crop.replace(/_/g, " ")} | ${disease.replace(/_/g, " ")}`;
  }
  return label.replace(/_/g, " ");
}

export default DiagnosisCard;
