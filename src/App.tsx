import React, { useState, useEffect } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";

// ---------------------------------------------------------
// KONFIGURATION
// ---------------------------------------------------------
// Hier deinen API Key einfügen (oder via process.env nutzen)
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

// Definition der Benutzereinstellungen
type UserSettings = {
  equipment: string;
  philosophy: string;
  daysPerWeek: number;
};

const App = () => {
  // -------------------------------------------------------
  // 1. STATE MANAGEMENT (Das Gedächtnis der App)
  // -------------------------------------------------------
  
  // Der Name in der Überschrift (Standard: "Team")
  const [userName, setUserName] = useState("Team");
  
  // Die Einstellungen des Nutzers
  const [settings, setSettings] = useState<UserSettings>({
    equipment: "Fitnessstudio (Volles Equipment)",
    philosophy: "Muskelaufbau & Hypertrophie",
    daysPerWeek: 3
  });

  // Der Text, der an die KI geschickt wird (User kann ihn editieren)
  const [promptInput, setPromptInput] = useState("");
  
  // Die Antwort der KI
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // -------------------------------------------------------
  // 2. EFFEKTE (Was beim Laden passiert)
  // -------------------------------------------------------

  // A. Beim Start: URL checken (?name=Mary) & Gespeicherte Daten laden
  useEffect(() => {
    // 1. URL Parameter auslesen
    const params = new URLSearchParams(window.location.search);
    const urlName = params.get("name");
    if (urlName) {
      setUserName(urlName);
    }

    // 2. LocalStorage prüfen (hat der Nutzer schon Einstellungen?)
    const savedSettings = localStorage.getItem('coach_andy_settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  // B. Wenn sich Einstellungen ändern: Speichern & Prompt aktualisieren
  useEffect(() => {
    // Speichern im Browser des Nutzers
    localStorage.setItem('coach_andy_settings', JSON.stringify(settings));

    // Automatischen Prompt bauen
    const newPrompt = `Du bist Coach Andy. Erstelle einen detaillierten Trainingsplan für mich.
--------------------------------
👤 MEIN PROFIL:
- Name: ${userName}
- Ziel/Philosophie: ${settings.philosophy}
- Verfügbares Equipment: ${settings.equipment}
- Zeitbudget: ${settings.daysPerWeek} Tage pro Woche
--------------------------------
Bitte erstelle den Plan basierend auf diesen Daten. Sei motivierend aber streng.`;

    setPromptInput(newPrompt);
  }, [settings, userName]);

  // -------------------------------------------------------
  // 3. LOGIK (Die Verbindung zur KI)
  // -------------------------------------------------------

  const handleGenerate = async () => {
    if (!API_KEY || API_KEY === "DEIN_API_KEY_HIER") {
      alert("Bitte trage erst deinen API Key im Code ein!");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      
      const response = await model.generateContent(promptInput);
      const text = response.response.text();
      
      setResult(text);
      
      // Optional: Ergebnis auch speichern (History)
      localStorage.setItem('coach_andy_last_plan', text);
      
    } catch (error) {
      console.error("Fehler:", error);
      setResult("Fehler beim Generieren. Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  };

  // Helper für Einstellungs-Änderungen
  const updateSetting = (field: keyof UserSettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  // -------------------------------------------------------
  // 4. UI (Das Aussehen)
  // -------------------------------------------------------
  return (
    <div style={styles.container}>
      {/* HEADER */}
      <header style={styles.header}>
        <h1 style={styles.title}>Coach Andy & {userName} 2026 🚀</h1>
        <p>Dein personalisierter KI-Trainer</p>
      </header>

      <main style={styles.main}>
        
        {/* SECTION: EINSTELLUNGEN */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>⚙️ Deine Einstellungen</h3>
          
          <div style={styles.inputGroup}>
            <label>Equipment:</label>
            <select 
              style={styles.select}
              value={settings.equipment}
              onChange={(e) => updateSetting('equipment', e.target.value)}
            >
              <option>Fitnessstudio (Volles Equipment)</option>
              <option>Homegym (Kurzhanteln & Bank)</option>
              <option>Homegym (Nur Kettlebell)</option>
              <option>Bodyweight (Kein Equipment)</option>
            </select>
          </div>

          <div style={styles.inputGroup}>
            <label>Philosophie / Ziel:</label>
            <select 
              style={styles.select}
              value={settings.philosophy}
              onChange={(e) => updateSetting('philosophy', e.target.value)}
            >
              <option>Muskelaufbau (Hypertrophie)</option>
              <option>Kraftaufbau (Powerlifting 5x5)</option>
              <option>Fettabbau (HIIT & Cardio Mix)</option>
              <option>Athletik & Beweglichkeit</option>
              <option>Rücken & Gesundheit (Reha)</option>
            </select>
          </div>

          <div style={styles.inputGroup}>
            <label>Tage pro Woche: {settings.daysPerWeek}</label>
            <input 
              type="range" min="1" max="7" 
              value={settings.daysPerWeek}
              onChange={(e) => updateSetting('daysPerWeek', Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {/* SECTION: PROMPT CHECK */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>📝 Dein Auftrag an den Coach</h3>
          <p style={{fontSize: '0.8rem', color: '#666'}}>
            Dies ist der Text, der an die KI gesendet wird. Du kannst ihn anpassen, 
            falls du z.B. eine Verletzung hast.
          </p>
          <textarea 
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            style={styles.textarea}
            rows={6}
          />
          <button 
            onClick={handleGenerate} 
            disabled={loading}
            style={loading ? styles.buttonDisabled : styles.button}
          >
            {loading ? "Coach Andy denkt nach..." : "💪 Training erstellen"}
          </button>
        </div>

        {/* SECTION: ERGEBNIS */}
        {result && (
          <div style={styles.resultCard}>
            <h3>Dein Plan:</h3>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
              {result}
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

// ---------------------------------------------------------
// STYLES (Einfaches CSS in JS für schnelles Design)
// ---------------------------------------------------------
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: '#f4f4f9',
    minHeight: '100vh',
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
  },
  title: {
    color: '#2d3748',
    margin: '0',
  },
  main: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  card: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  },
  cardTitle: {
    marginTop: 0,
    color: '#4a5568',
    borderBottom: '2px solid #e2e8f0',
    paddingBottom: '10px',
  },
  inputGroup: {
    marginBottom: '15px',
  },
  select: {
    width: '100%',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #cbd5e0',
    marginTop: '5px',
    fontSize: '1rem',
  },
  textarea: {
    width: '100%',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #cbd5e0',
    marginTop: '10px',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  button: {
    width: '100%',
    padding: '15px',
    backgroundColor: '#48bb78',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1.1rem',
    cursor: 'pointer',
    fontWeight: 'bold',
    marginTop: '15px',
    transition: 'background 0.2s',
  },
  buttonDisabled: {
    width: '100%',
    padding: '15px',
    backgroundColor: '#cbd5e0',
    color: '#718096',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1.1rem',
    cursor: 'not-allowed',
    marginTop: '15px',
  },
  resultCard: {
    backgroundColor: 'white',
    padding: '25px',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    borderLeft: '5px solid #48bb78',
  }
};

export default App;
