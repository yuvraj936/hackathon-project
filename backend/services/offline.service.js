import diseases from "../data/diseases.data.js";

function normalize(s=""){
  return s.toLowerCase().replace(/[^a-z0-9\s]/g," ").replace(/\s+/g," ").trim();
}

export function offlineReply(message=""){
  const q = normalize(message);

  // emergency keywords
  const danger = ["chest pain","breathing difficulty","unconscious","stroke","severe bleeding","fits","seizure"];
  if (danger.some(k => q.includes(k))) {
    return {
      reply:
`⚠️ This sounds urgent.\n\nIf severe symptoms are present, call emergency (102/108) or go to nearest hospital immediately.\n\nTell me: age + main symptom + duration.`,
      mode: "offline"
    };
  }

  // match disease by name
  const match = diseases.find(d => normalize(d.name).includes(q) || q.includes(normalize(d.name)));

  if (match) {
    return {
      reply:
`**${match.name}**\nCategory: ${match.category}\nSeverity: ${match.severity}\nCommon symptoms: ${match.symptoms.join(", ")}\nAntibiotic needed: ${match.antibiotic ? "Sometimes (doctor decides)" : "No"}\nSuggested care: ${match.treatment}\n\nIf symptoms worsen, consult a doctor.`,
      mode: "offline",
      disease: match.name
    };
  }

  // symptom-based rough hint
  if (q.includes("fever")) {
    return { reply: "Fever can be due to viral infection, dengue, malaria, typhoid etc.\n\nTell me: temperature + days + chills/rash/cough?", mode:"offline" };
  }
  if (q.includes("cough")) {
    return { reply: "Cough can be cold/flu/bronchitis/asthma.\n\nTell me: dry or with mucus? fever? breathlessness?", mode:"offline" };
  }

  return {
    reply:
`I can help with disease info (offline mode).\nTry asking like:\n- "Dengue"\n- "Typhoid symptoms"\n- "Fever for 3 days"\n\nOr tell me: main symptom + duration.`,
    mode: "offline"
  };
}