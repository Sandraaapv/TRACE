const KEYWORDS = {
  physical: ['hit', 'punch', 'hurt', 'kill', 'harm', 'beat', 'slap', 'physical', 'abuse', 'force', 'weapon', 'push', 'kick', 'choke', 'throw', 'bruise', 'cut', 'attack', 'violent', 'strangle'],
  surveillance: ['phone', 'location', 'track', 'spy', 'camera', 'hacked', 'password', 'messages', 'device', 'texting', 'gps', 'screen', 'spyware', 'app', 'monitored', 'stalker', 'follow'],
  financial: ['money', 'bank', 'job', 'work', 'funds', 'spend', 'credit', 'wallet', 'pay', 'allowance', 'stole', 'account', 'cash', 'salary', 'card', 'debt', 'rent'],
  coercion: ['control', 'isolate', 'yell', 'shout', 'ignore', 'insult', 'threaten', 'blame', 'screamed', 'angry', 'jealous', 'manipulate', 'gaslight', 'forbid', 'belittle'],
  exit: ['leave', 'escape', 'exit', 'run away', 'plan', 'relocate', 'move out', 'shelter'],
  emotional: ['scared', 'sad', 'help', 'worried', 'fear', 'crying', 'afraid', 'anxious', 'panic', 'hopeless', 'overwhelmed', 'stressed'],
};

const RESPONSES = {
  greeting: [
    'Hello. I am your TRACE threat assessment assistant. Share what is happening — physical harm, tracking, financial control, or emotional abuse — and I will map concrete next steps.',
    'Welcome back. Tell me what changed since we last spoke, or describe a recent incident. I analyze patterns across physical, digital, financial, and coercive dimensions.',
    'Hi. You are in a confidential space. What would you like to assess today — safety at home, device security, exit planning, or evidence preservation?',
  ],
  physical: [
    'Physical danger is the highest priority. Identify two exit routes from your home, keep keys and ID in a hidden go-bag, and use the SOS button if you are in immediate danger. Can you reach a safe room or neighbor right now?',
    'I logged physical violence indicators. Document injuries with photos in the Evidence Vault when safe. Domestic shelters often accept walk-ins — would you like steps to contact one discreetly?',
    'Your physical safety comes first. Avoid confronting alone; plan departure when the abuser is away. What is your nearest 24-hour public place you could reach on foot?',
  ],
  surveillance: [
    'Surveillance abuse is common. Switch to a library or friend\'s device for sensitive searches, audit location sharing, and change passwords from that safe device. Have you noticed unknown apps or shared iCloud/Google accounts?',
    'Digital monitoring detected in your message. Use private browsing only on trusted hardware, disable Find My / location history, and screenshot proof before wiping logs. Want a checklist for a phone security audit?',
    'Tracking and spyware restrict your freedom. Never discuss escape plans on a monitored device. Do you have access to a phone or computer the other person cannot check?',
  ],
  financial: [
    'Financial control is a coercive tactic. Open a separate account with paperless statements, build a small cash reserve, and request a credit freeze. What expenses would you need covered in the first month after leaving?',
    'I noted financial restriction patterns. Save pay stubs and bank screenshots to the vault. Some grants cover relocation — check the Recovery Fund Rail tab when ready.',
    'Economic abuse limits options. List essential costs (housing, transit, food) in the budget planner. Even $20/week hidden adds up. Are your documents accessible without their knowledge?',
  ],
  coercion: [
    'Coercive control — isolation, insults, threats — is abuse. It is not your fault. A safe word with a trusted friend and incident logs strengthen your case. Who is one person you could trust with a signal?',
    'Emotional manipulation erodes confidence by design. Keep a private journal of incidents with dates. Support lines like 181 are confidential. Would writing down recent events help clarify the pattern?',
    'Control tactics often escalate. Document tone, threats, and restrictions without confronting. Are you being prevented from seeing family, working, or leaving the house?',
  ],
  exit: [
    'Exit planning works best in stages: documents, cash, destination, and timing when they are away. Open the Exit Plan Checklist — which item feels hardest to complete right now?',
    'Leaving requires safety timing. Pack medications, IDs, and children\'s essentials first. Have a coded reason ready if questioned. Do you have a destination in mind yet?',
    'A structured exit reduces risk. Practice your route once without luggage. Tell one trusted ally your plan. What is blocking you from taking the first checklist step today?',
  ],
  emotional: [
    'Feeling scared or overwhelmed is a normal response to abuse. Take one small step — one checklist item or one vault upload. What feels most urgent: safety tonight, money, or proof gathering?',
    'You are not alone. TRACE helps organize evidence, budget, and exit steps at your pace. Breathing and reaching a support line are valid actions. What happened most recently that worried you?',
    'Fear is information — your nervous system is alerting you. We can break this into manageable pieces. Would you like to focus on immediate safety, documentation, or planning?',
  ],
  followUp: [
    'Thank you for sharing more. Based on everything so far, I recommend prioritizing {priority}. What detail can you add about timing, location, or who was involved?',
    'I am updating your risk profile. Your highest current vector is {priority}. Have there been any new incidents since your last message?',
    'Noted. To refine your roadmap: is this happening daily, weekly, or was it a one-time escalation? Context helps calibrate urgency.',
  ],
  default: [
    'I hear you. To give useful guidance, tell me whether this involves physical harm, phone tracking, money control, threats, or planning to leave.',
    'Could you describe what happened — who was involved, when, and whether you feel safe right now? That helps me route you to the right safety tools.',
    'I am analyzing your message. Add specifics about physical danger, surveillance, finances, or emotional control so I can tailor recommendations.',
  ],
};

function scoreCategories(text) {
  const lower = text.toLowerCase();
  const scores = {};
  for (const [cat, words] of Object.entries(KEYWORDS)) {
    scores[cat] = words.reduce((n, w) => (lower.includes(w) ? n + 1 : n), 0);
  }
  return scores;
}

function isGreeting(text) {
  const t = text.trim().toLowerCase();
  if (t.length > 40) return false;
  return /^(hi|hello|hey|hola|yo|good\s+(morning|afternoon|evening)|greetings)\b/.test(t);
}

function pickRotating(pool, key, counters) {
  const idx = counters[key] ?? 0;
  counters[key] = idx + 1;
  return pool[idx % pool.length];
}

const ROADMAP_BY_CATEGORY = {
  physical: [
    { id: 10, text: 'Identify 2 escape routes from your home and memorize shelter contacts.', severity: 'high' },
    { id: 11, text: 'Hide an emergency bag (ID, cash, clothes, keys) at a trusted location.', severity: 'high' },
  ],
  surveillance: [
    { id: 12, text: 'Audit phone location sharing and remove unknown devices from accounts.', severity: 'high' },
    { id: 13, text: 'Create new secure credentials from a public or trusted device.', severity: 'medium' },
  ],
  financial: [
    { id: 14, text: 'Open a confidential bank account with paperless statements.', severity: 'medium' },
    { id: 15, text: 'Request a credit freeze to block unauthorized accounts.', severity: 'low' },
  ],
  coercion: [
    { id: 16, text: 'Set a safe word with a trusted friend to signal you need help.', severity: 'medium' },
    { id: 17, text: 'Log control incidents with dates in the Evidence Vault.', severity: 'low' },
  ],
  exit: [
    { id: 18, text: 'Prepare and hide identity documents before departure day.', severity: 'high' },
  ],
  emotional: [],
  greeting: [],
};

const METRIC_INCREMENTS = {
  physical: { physical: 40 },
  surveillance: { surveillance: 50 },
  financial: { financial: 45 },
  coercion: { coercion: 35 },
  exit: { coercion: 10, physical: 5 },
  emotional: { coercion: 15 },
};

/**
 * @param {string} text - user message
 * @param {{ counters: Record<string, number>, lastCategory: string|null }} session
 */
export function generateChatResponse(text, session = { counters: {}, lastCategory: null }) {
  const trimmed = text.trim();
  if (!trimmed) {
    return { text: 'Please enter a message so I can help assess your situation.', increments: {}, roadmap: [], category: null };
  }

  if (!session.counters) session.counters = {};

  if (isGreeting(trimmed)) {
    return {
      text: pickRotating(RESPONSES.greeting, 'greeting', session.counters),
      increments: {},
      roadmap: [],
      category: 'greeting',
    };
  }

  const scores = scoreCategories(trimmed);
  const ranked = Object.entries(scores)
    .filter(([, s]) => s > 0)
    .sort((a, b) => b[1] - a[1]);

  let category = ranked[0]?.[0] ?? null;
  let increments = {};
  let roadmap = [];
  let responseText;

  if (category) {
    increments = METRIC_INCREMENTS[category] || {};
    roadmap = ROADMAP_BY_CATEGORY[category] || [];
    responseText = pickRotating(RESPONSES[category], category, session.counters);
    session.lastCategory = category;
  } else if (session.lastCategory && trimmed.length < 80) {
    const priorityLabels = {
      physical: 'physical safety',
      surveillance: 'digital security',
      financial: 'financial independence',
      coercion: 'coercive control',
      exit: 'exit planning',
      emotional: 'emotional support',
    };
    const label = priorityLabels[session.lastCategory] || 'your safety plan';
    responseText = pickRotating(RESPONSES.followUp, 'followUp', session.counters).replace('{priority}', label);
    increments = METRIC_INCREMENTS[session.lastCategory] ? { ...METRIC_INCREMENTS[session.lastCategory], ...(Object.fromEntries(Object.entries(METRIC_INCREMENTS[session.lastCategory]).map(([k, v]) => [k, Math.round(v * 0.25)]))) } : {};
    category = session.lastCategory;
  } else {
    responseText = pickRotating(RESPONSES.default, 'default', session.counters);
    roadmap = [{ id: 19, text: 'Document incidents with dates in the Evidence Vault.', severity: 'low' }];
  }

  return { text: responseText, increments, roadmap, category };
}

export function computeThreatLevel(metrics) {
  const maxScore = Math.max(metrics.physical, metrics.coercion, metrics.financial, metrics.surveillance);
  if (maxScore > 70 || metrics.physical > 40) return 'SEVERE DANGER';
  if (maxScore > 35) return 'MODERATE RISK';
  return 'LOW RISK';
}
