import base64
import json
import os
import zipfile
from pathlib import Path
from typing import Any

import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

DECOMMISSIONED_GROQ_MODELS = {
    "llama-3.2-11b-vision-preview": "meta-llama/llama-4-scout-17b-16e-instruct",
}

LOCAL_WEIGHT = 0.7
GROQ_WEIGHT = 0.3


def load_dotenv_file(dotenv_path: Path) -> None:
    if not dotenv_path.exists():
        return
    for raw_line in dotenv_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def extract_json_object(text: str) -> dict[str, Any] | None:
    try:
        obj = json.loads(text)
        return obj if isinstance(obj, dict) else None
    except Exception:
        pass
    s, e = text.find("{"), text.rfind("}")
    if s != -1 and e != -1 and e > s:
        try:
            obj = json.loads(text[s : e + 1])
            return obj if isinstance(obj, dict) else None
        except Exception:
            return None
    return None


def normalize_groq_result(raw_text: str, class_names: list[str]) -> dict[str, Any] | None:
    parsed = extract_json_object(raw_text)
    if not parsed:
        return None
    label = str(parsed.get("label", "")).strip()
    if label not in class_names:
        return None
    try:
        conf = float(parsed.get("confidence", 50))
    except Exception:
        conf = 50.0
    conf = max(0.0, min(100.0, conf))
    reason = str(parsed.get("reasoning", "")).strip()
    steps = parsed.get("care_steps", [])
    if not isinstance(steps, list):
        steps = []
    steps = [str(x).strip() for x in steps if str(x).strip()]
    return {"label": label, "confidence": conf, "reasoning": reason, "careSteps": steps}


def fuse(local_probs: np.ndarray, class_names: list[str], groq_label: str, groq_conf: float) -> tuple[int, float]:
    n = len(class_names)
    p_local = np.asarray(local_probs, dtype=np.float64)
    if p_local.sum() > 0:
        p_local = p_local / p_local.sum()
    p_groq = np.zeros(n, dtype=np.float64)
    idx = class_names.index(groq_label)
    c = max(0.0, min(1.0, groq_conf / 100.0))
    if n > 1:
        p_groq.fill((1.0 - c) / (n - 1))
    p_groq[idx] = c
    p = (LOCAL_WEIGHT * p_local) + (GROQ_WEIGHT * p_groq)
    i = int(np.argmax(p))
    return i, float(p[i]) * 100


def is_healthy(label: str) -> bool:
    return "healthy" in label.lower()


def model_base_dir() -> Path:
    # default to workspace root where model files currently exist
    default_dir = Path(__file__).resolve().parents[2]
    return Path(os.environ.get("PLANT_MODEL_DIR", str(default_dir)))


def load_model_and_classes():
    base_dir = model_base_dir()
    model_candidates = [
        base_dir / "plant_disease_model2.keras",
        base_dir / "plant_disease_model.keras",
    ]
    model_path = next((p for p in model_candidates if p.exists()), model_candidates[0])
    class_path = base_dir / "class_names.json"

    missing = []
    if not model_path.exists():
        missing.append("plant_disease_model2.keras (or plant_disease_model.keras)")
    if not class_path.exists():
        missing.append(str(class_path))
    if missing:
        raise FileNotFoundError(", ".join(missing))

    model_keras_version = None
    try:
        with zipfile.ZipFile(model_path, "r") as zf:
            if "metadata.json" in zf.namelist():
                meta = json.loads(zf.read("metadata.json"))
                model_keras_version = meta.get("keras_version")
    except Exception:
        pass

    model = None
    errs = []
    try:
        os.environ.setdefault("KERAS_BACKEND", "tensorflow")
        import keras as k

        k_ver = getattr(k, "__version__", "0")
        if model_keras_version and k_ver.split(".")[0] != model_keras_version.split(".")[0]:
            raise RuntimeError(f"model requires Keras {model_keras_version}, installed {k_ver}")
        model = k.models.load_model(str(model_path), compile=False, safe_mode=False)
    except Exception as e:
        errs.append(f"keras failed: {e}")
    if model is None:
        try:
            import tensorflow as tf

            model = tf.keras.models.load_model(str(model_path), compile=False)
        except Exception as e:
            errs.append(f"tf.keras failed: {e}")

    if model is None:
        raise RuntimeError(" | ".join(errs))

    with open(class_path, "r", encoding="utf-8") as f:
        class_names = json.load(f)

    try:
        output_dim = int(model.output_shape[-1])
    except Exception:
        output_dim = None
    if output_dim is not None and len(class_names) != output_dim:
        raise RuntimeError(
            f"Model/classes mismatch: outputs {output_dim} classes, class_names has {len(class_names)}"
        )
    return model, class_names


BASE_DIR = Path(__file__).resolve().parents[2]
load_dotenv_file(BASE_DIR / ".env")
model, class_names = load_model_and_classes()

app = FastAPI(title="Plant Disease API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FRONTEND_DIST_DIR = BASE_DIR / "frontend_dist"
if FRONTEND_DIST_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST_DIR / "assets")), name="assets")


@app.get("/health")
def health():
    return {"ok": True, "classes": len(class_names)}


@app.post("/api/diagnose")
async def diagnose(file: UploadFile = File(...), lang: str = "en"):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid image file.")

    image_bytes = await file.read()
    try:
        from io import BytesIO

        image = Image.open(BytesIO(image_bytes))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Cannot read image: {e}") from e

    if image.mode != "RGB":
        image = image.convert("RGB")

    img_array = np.expand_dims(np.array(image.resize((224, 224)), dtype=np.float32), 0)
    predictions = model.predict(img_array, verbose=0)[0]
    local_idx = int(np.argmax(predictions))
    local_label = class_names[local_idx]
    local_conf = float(np.max(predictions)) * 100

    local_result = {
        "label": local_label,
        "confidence": local_conf,
        "source": "Local model",
        "isHealthy": is_healthy(local_label),
    }

    final_result = dict(local_result)
    final_result["source"] = "Local model"
    enhanced_result = None

    groq_key = os.environ.get("GROQ_API_KEY", "").strip()
    groq_model = os.environ.get("GROQ_VISION_MODEL", "meta-llama/llama-4-scout-17b-16e-instruct").strip()
    groq_model = DECOMMISSIONED_GROQ_MODELS.get(groq_model, groq_model)

    if groq_key:
        try:
            from groq import Groq

            client = Groq(api_key=groq_key)
            mime = file.content_type or "image/jpeg"
            b64 = base64.b64encode(image_bytes).decode("utf-8")
            top_indices = np.argsort(predictions)[::-1][:3]
            top3_text = ", ".join(f"{class_names[i]} ({float(predictions[i])*100:.2f}%)" for i in top_indices)
            extra_prompt = os.environ.get("GROQ_EXTRA_PROMPT", "").strip()
            prompt = (
                "[ROLE]\nYou are an expert plant disease diagnosis assistant.\n\n"
                "[TASK]\nClassify the leaf image into exactly one label from allowed labels.\n\n"
                f"[CONTEXT]\nAllowed labels: {', '.join(class_names)}\nLocal top-3: {top3_text}\n\n"
                "[RULES]\n"
                "Return JSON only with schema:\n"
                '{"label":"<one_allowed_label>","confidence":<0-100>,"reasoning":"short text","care_steps":["step1","step2","step3"]}\n'
                f"Respond in {'Arabic' if lang == 'ar' else 'English'}.\n"
            )
            if extra_prompt:
                prompt += f"\n[EXTRA]\n{extra_prompt}\n"

            completion = client.chat.completions.create(
                model=groq_model,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {"type": "image_url", "image_url": {"url": f"data:{mime};base64,{b64}"}},
                        ],
                    }
                ],
                temperature=0.2,
                max_completion_tokens=500,
            )
            groq_raw = completion.choices[0].message.content or ""
            groq = normalize_groq_result(groq_raw, class_names)
            if groq:
                enhanced_result = {
                    "label": groq["label"],
                    "confidence": groq["confidence"],
                    "source": "Groq",
                    "reasoning": groq["reasoning"],
                    "careSteps": groq["careSteps"],
                    "isHealthy": is_healthy(groq["label"]),
                }
                fused_idx, fused_conf = fuse(predictions, class_names, groq["label"], groq["confidence"])
                fused_label = class_names[fused_idx]
                final_result = {
                    "label": fused_label,
                    "confidence": fused_conf,
                    "source": "Fusion (Local + Groq)",
                    "isHealthy": is_healthy(fused_label),
                }
        except Exception:
            # keep local result if Groq fails
            pass

    return {
        "local": local_result,
        "enhanced": enhanced_result,
        "final": final_result,
        "meta": {"groqModel": groq_model, "groqAvailable": bool(groq_key)},
    }


@app.get("/")
def serve_spa_root():
    index_file = FRONTEND_DIST_DIR / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))
    raise HTTPException(status_code=404, detail="Frontend build not found.")


@app.get("/{full_path:path}")
def serve_spa_fallback(full_path: str):
    if full_path.startswith("api/") or full_path.startswith("health"):
        raise HTTPException(status_code=404, detail="Not found")
    index_file = FRONTEND_DIST_DIR / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))
    raise HTTPException(status_code=404, detail="Frontend build not found.")
