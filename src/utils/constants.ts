// src/utils/constants.ts

export const DEFAULT_SYSTEM_PROMPT = `Du bist Coach Andy, ein erfahrener Hyrox- und Fitness-Coach.
Deine Philosophie:
1. Hyrox besteht zu 50% aus Laufen und zu 50% aus funktionaler Kraft.
2. Konsistenz schlägt Intensität.
3. Form geht immer vor Gewicht.

Deine Aufgaben:
- Erstelle progressive Trainingspläne (Kraft, Ausdauer, Hyrox-Sim).
- Motiviere den Athleten, aber achte auf Verletzungsprävention.
- Nutze RPE (Rate of Perceived Exertion) zur Steuerung der Intensität.
- Wenn der Athlet Equipment-Einschränkungen hat (z.B. nur Kettlebells), passe den Plan kreativ an.`;

export const DEFAULT_WARMUP_PROMPT = `Du bist Coach Andy. Deine Aufgabe ist es, ein spezifisches Warm-up (5-10 Minuten) für das anstehende Workout zu erstellen.

Deine Philosophie fürs Aufwärmen:
1. "Warm-up to perform": Wir wärmen uns auf, um Leistung zu bringen.
2. Dynamik vor Statik: Keine langen Halteübungen.
3. Spezifität: Bereite genau die Gelenke und Muskeln vor.

Struktur (RAMP): Raise, Activate, Mobilize, Potentiate.`;

export const DEFAULT_COOLDOWN_PROMPT = `Du bist Coach Andy. Deine Aufgabe ist es, ein Cool Down (5-10 Minuten) zu erstellen, um den Körper herunterzufahren.

Deine Philosophie fürs Cool Down:
1. Parasympathikus aktivieren: Atmung beruhigen, Stress abbauen.
2. Statisches Dehnen: Jetzt ist die Zeit für längere Dehnübungen (30-60sek halten).
3. Mobility: Fokus auf die Muskelgruppen, die gerade trainiert wurden.`;

export const DEFAULT_PLAN_PROMPT = `Erstelle einen neuen 4-Wochen-Trainingsplan (3-4 Einheiten pro Woche) für Hyrox/Functional Fitness.

WICHTIGE ANWEISUNG FÜR DAS OUTPUT-FORMAT:
Bitte verpacke die Antwort IMMER in einen Markdown-Code-Block (Start mit \`\`\`json und Ende mit \`\`\`).
Dadurch erhalte ich einen "Kopieren"-Button.

Der Inhalt des Code-Blocks muss ein valides JSON-Array sein mit exakt dieser Struktur:
[
  {
    "id": 1,
    "week": 1,
    "title": "Titel des Workouts",
    "type": "strength" | "circuit" | "endurance",
    "duration": "60 Min",
    "focus": "Kurze Beschreibung",
    "color": "border-blue-500 text-blue-600",
    "badgeColor": "bg-blue-100 text-blue-700",
    "exercises": [
      { "name": "Übungsname", "sets": 3, "reps": "10-12", "rpe": "8", "note": "Hinweis" }
    ]
  }
]

ANWEISUNG ZUR PROGRESSION:
Analysiere meinen Trainingsverlauf der letzten 4 Wochen (siehe unten).
- Wenn ich mich bei Übungen gesteigert habe, erhöhe leicht das Volumen oder die Intensität.
- Wenn ich stagniert habe, variiere den Reiz.
- Berücksichtige strikt mein verfügbares Equipment (siehe unten).`;

export const DEFAULT_EQUIPMENT = [
  { category: 'Langhantel', items: ['Olympia-Stange', 'Gewichte bis 100kg', 'Power Rack'] },
  { category: 'Kettlebells', items: ['4 kg', '6 kg', '8 kg', '12 kg'] },
  { category: 'Bodyweight & Sonstiges', items: ['Klimmzugstange', 'Therabänder (div. Stärken)', 'Laufschuhe'] }
];

export const rawWorkouts = [
  {
    id: 1,
    week: 1,
    title: 'Tag 1: KB Kraft',
    type: 'strength',
    duration: '45-60 Min',
    focus: 'Ganzkörper & Basis',
    color: 'border-blue-500 text-blue-600',
    badgeColor: 'bg-blue-100 text-blue-700',
    exercises: [
      { name: 'Goblet Squats (KB)', sets: 3, reps: '10-12', rpe: '8', note: 'Nimm die 8er oder 12er' },
      { name: 'Schulterdrücken', sets: 3, reps: '8-10', rpe: '8', note: 'Pro Seite (4er oder 6er)' },
      { name: 'Einarmiges Rudern', sets: 3, reps: '10-12', rpe: '8', note: 'Abstützen auf Stuhl' },
      { name: 'Rumanian Deadlift', sets: 3, reps: '12-15', rpe: '7', note: 'Beide Hände an die 12er' },
      { name: 'Floor Press', sets: 3, reps: '10-12', rpe: '8', note: 'Rückenlage am Boden' },
    ],
  },
  {
    id: 2,
    week: 1,
    title: 'Tag 2: Ausdauer Zirkel',
    type: 'circuit',
    duration: '30-40 Min',
    focus: 'Herz-Kreislauf',
    color: 'border-orange-500 text-orange-600',
    badgeColor: 'bg-orange-100 text-orange-700',
    exercises: [
      { name: 'KB Swings', sets: 3, reps: '20', rpe: 'Explosiv', note: 'Hüft-Einsatz! (12er)' },
      { name: 'Thruster', sets: 3, reps: '10', rpe: 'Hoch', note: 'Squat + Drücken' },
      { name: 'Burpees', sets: 3, reps: '10', rpe: 'Pace', note: 'Ohne Gewicht' },
      { name: 'Mountain Climbers', sets: 3, reps: '30sek', rpe: 'Schnell', note: 'Am Boden' },
    ],
  },
  {
    id: 3,
    week: 1,
    title: 'Tag 3: Core & Grip',
    type: 'assistance',
    duration: '30 Min',
    focus: 'Stabilität',
    color: 'border-teal-500 text-teal-600',
    badgeColor: 'bg-teal-100 text-teal-700',
    exercises: [
      { name: 'Farmers Carry', sets: 3, reps: '40m', rpe: '7', note: 'Pro Seite laufen' },
      { name: 'Russian Twists', sets: 3, reps: '20', rpe: '9', note: 'Füße hoch wenn möglich' },
      { name: 'Plank Pull-Through', sets: 3, reps: '12', rpe: '8', note: 'KB durchziehen' },
      { name: 'Halo', sets: 3, reps: '10', rpe: '7', note: 'Um den Kopf kreisen' },
    ],
  },
  {
    id: 4,
    week: 2,
    title: 'Tag 1: Kraft Steigerung',
    type: 'strength',
    duration: '50-60 Min',
    focus: 'Mehr Gewicht',
    color: 'border-red-500 text-red-600',
    badgeColor: 'bg-red-100 text-red-700',
    exercises: [
      { name: 'Goblet Squats (Schwer)', sets: 4, reps: '8', rpe: '9', note: 'Versuch die 16er!' },
      { name: 'Push Press', sets: 4, reps: '6-8', rpe: '9', note: 'Mit Beinschwung' },
    ],
  }
];
