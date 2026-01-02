import { GoogleGenerativeAI } from "@google/generative-ai";

// 1. Der System-Prompt (Konstante)
const WARMUP_SYSTEM_PROMPT = `
Du bist "Coach Andy". Deine Aufgabe: Erstelle basierend auf dem Trainingsplan-JSON ein spezifisches Warm-up (RAMP) und Cool-down.

PHILOSOPHIE:
1. "Warm-up to perform": Fokus auf Leistung.
2. Dynamik vor Statik.
3. Spezifität: Analysiere die Übungen (z.B. Squats -> Hüfte öffnen).

INPUT: Ein JSON-Objekt eines einzelnen Trainingstages.

OUTPUT: Ein valides JSON-Objekt (kein Markdown) mit dieser Struktur:
{
  "warmup": {
    "summary": "Titel",
    "duration": "Zeit",
    "ramp": [
      { "phase": "RAISE", "exercise": "...", "instruction": "..." },
      { "phase": "ACTIVATE", "exercise": "...", "instruction": "..." },
      { "phase": "MOBILIZE", "exercise": "...", "instruction": "..." },
      { "phase": "POTENTIATE", "exercise": "...", "instruction": "..." }
    ]
  },
  "cooldown": {
    "summary": "Titel",
    "exercises": [ { "name": "...", "duration": "...", "instruction": "..." } ]
  }
}
`;

// Hier deinen API Key einsetzen (oder aus Umgebungsvariablen holen)
// In Vite nutzt man meistens import.meta.env.VITE_GEMINI_API_KEY
const API_KEY = "DEIN_API_KEY_HIER_ODER_ENV_VARIABLE"; 
const genAI = new GoogleGenerativeAI(API_KEY);

// 2. Die Funktion (Exportiert, damit die App sie nutzen kann)
export async function generateDailyWarmup(workoutDayJson: any) {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: { responseMimeType: "application/json" },
    systemInstruction: WARMUP_SYSTEM_PROMPT 
  });

  const userPrompt = JSON.stringify(workoutDayJson);

  try {
    const result = await model.generateContent(userPrompt);
    const response = await result.response;
    const text = response.text();
    const warmupData = JSON.parse(text);
    
    return warmupData; 

  } catch (error) {
    console.error("Fehler bei Coach Andy:", error);
    return null;
  }
}