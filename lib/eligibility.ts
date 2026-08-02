import { Profile, Scheme, Document } from '@/types';
import { supabase } from './supabase';

export interface MatchResult {
  scheme: Scheme;
  score: number;          // 0-100 eligibility score
  reasons: string[];      // why eligible
  gaps: string[];         // missing criteria
  missingDocs: string[];  // documents the user doesn't have yet
}

function getAge(dateOfBirth: string | null): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) return null;
  const diff = Date.now() - dob.getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
}

export function calculateEligibility(
  scheme: Scheme,
  profile: Profile | null,
  documents: Document[]
): MatchResult {
  let score = 50;
  const reasons: string[] = [];
  const gaps: string[] = [];
  const e = scheme.eligibility || {};

  if (!profile) {
    return { scheme, score: 0, reasons: [], gaps: ['Complete your profile to check eligibility'], missingDocs: scheme.documents_required || [] };
  }

  const age = getAge(profile.date_of_birth);

  // Age checks
  if (e.age_min != null && age != null) {
    if (age >= e.age_min) {
      score += 15;
      reasons.push(`Age ${age} meets minimum ${e.age_min}`);
    } else {
      score -= 25;
      gaps.push(`Must be at least ${e.age_min} years old (you are ${age})`);
    }
  }
  if (e.age_max != null && age != null) {
    if (age <= e.age_max) {
      score += 10;
    } else {
      score -= 25;
      gaps.push(`Must be under ${e.age_max} years old (you are ${age})`);
    }
  }

  // Income check
  if (e.income_max != null && e.income_max > 0) {
    if (profile.annual_income <= e.income_max) {
      score += 15;
      reasons.push(`Income within limit (₹${profile.annual_income} ≤ ₹${e.income_max})`);
    } else {
      score -= 20;
      gaps.push(`Income exceeds limit (₹${profile.annual_income} > ₹${e.income_max})`);
    }
  }

  // Category check
  if (e.categories && Array.isArray(e.categories) && e.categories.length > 0) {
    const cat = profile.community_category?.toUpperCase();
    if (cat && e.categories.includes(cat)) {
      score += 15;
      reasons.push(`Category ${cat} qualifies`);
    } else {
      score -= 30;
      gaps.push(`Requires category: ${e.categories.join(' / ')}`);
    }
  }

  // Gender check
  if (e.gender && Array.isArray(e.gender) && e.gender.length > 0) {
    if (e.gender.includes(profile.gender)) {
      score += 15;
      reasons.push(`Gender qualifies`);
    } else {
      score -= 30;
      gaps.push(`For: ${e.gender.join(' / ')}`);
    }
  }

  // Occupation check
  if (e.occupation && Array.isArray(e.occupation) && e.occupation.length > 0) {
    if (e.occupation.includes(profile.occupation)) {
      score += 15;
      reasons.push(`Occupation ${profile.occupation} qualifies`);
    } else {
      score -= 25;
      gaps.push(`For occupation: ${e.occupation.join(' / ')}`);
    }
  }

  // Education check
  if (e.education && Array.isArray(e.education) && e.education.length > 0) {
    if (e.education.includes(profile.education)) {
      score += 10;
      reasons.push(`Education level qualifies`);
    } else {
      score -= 15;
      gaps.push(`Requires education: ${e.education.join(' / ')}`);
    }
  }

  // Disability check
  if (e.disability === true) {
    if (profile.disability_status) {
      score += 20;
      reasons.push('Disability status qualifies');
    } else {
      score -= 30;
      gaps.push('For persons with disabilities');
    }
  }

  // State check
  if (e.state) {
    if (profile.state === e.state) {
      score += 10;
      reasons.push(`Resident of ${e.state}`);
    } else {
      score -= 20;
      gaps.push(`For residents of ${e.state}`);
    }
  }

  // Tags check (looser matching)
  if (e.tags && Array.isArray(e.tags)) {
    const profileTags: string[] = [];
    if (profile.occupation) profileTags.push(profile.occupation);
    if (profile.disability_status) profileTags.push('disability');
    if (profile.community_category) profileTags.push(profile.community_category.toLowerCase());
    const matched = e.tags.filter(t => profileTags.some(p => p.toLowerCase().includes(t.toLowerCase())));
    if (matched.length > 0) {
      score += 5 * matched.length;
    }
  }

  // Document readiness
  const userDocTypes = new Set(documents.map(d => d.title));
  const required = scheme.documents_required || [];
  const missingDocs = required.filter(d => !userDocTypes.has(d));
  if (missingDocs.length === 0 && required.length > 0) {
    score += 10;
    reasons.push('All required documents available');
  } else if (missingDocs.length > 0) {
    score -= missingDocs.length * 3;
  }

  score = Math.max(0, Math.min(100, score));

  return { scheme, score, reasons, gaps, missingDocs };
}

export function rankSchemes(
  schemes: Scheme[],
  profile: Profile | null,
  documents: Document[]
): MatchResult[] {
  return schemes
    .map(s => calculateEligibility(s, profile, documents))
    .sort((a, b) => b.score - a.score);
}

// Predict approval probability for an application, combining eligibility score
// and document readiness. Returns 0-100.
export function predictApproval(
  scheme: Scheme,
  profile: Profile | null,
  documents: Document[]
): { probability: number; missingDocs: string[] } {
  const match = calculateEligibility(scheme, profile, documents);
  const docFactor = match.missingDocs.length === 0 ? 1 : Math.max(0.3, 1 - match.missingDocs.length * 0.15);
  const probability = Math.round(Math.max(0, Math.min(100, match.score * docFactor)));
  return { probability, missingDocs: match.missingDocs };
}

// Auto-route a complaint category to the right government department.
export function routeComplaint(category: string): string {
  const routing: Record<string, string> = {
    road: 'Public Works Department',
    streetlight: 'Electricity Board',
    water: 'Water Supply Board',
    sanitation: 'Municipal Corporation',
    electricity: 'Electricity Board',
    corruption: 'Anti-Corruption Bureau',
    other: 'Municipal Corporation',
  };
  return routing[category] || 'Municipal Corporation';
}

// A lightweight rule-based AI assistant that answers government questions
// using the schemes catalog and profile context. Returns a conversational reply.
export async function generateAssistantReply(
  userMessage: string,
  profile: Profile | null,
  lang: string
): Promise<string> {
  const msg = userMessage.toLowerCase();

  // Fetch schemes to answer questions about them
  const { data: schemes } = await supabase.from('schemes').select('*').eq('is_active', true);

  const hello = ['hello', 'hi', 'hey', 'namaste', 'வணக்கம்', 'नमस्ते'];
  if (hello.some(h => msg.includes(h))) {
    const greetings: Record<string, string> = {
      en: "Hello! I can help you find government schemes, track documents, or answer questions about government services. What do you need help with?",
      hi: "नमस्ते! मैं आपको सरकारी योजनाएं खोजने, दस्तावेज़ ट्रैक करने या सरकारी सेवाओं के बारे में जानकारी देने में मदद कर सकता हूं। आपको किसमें मदद चाहिए?",
      ta: "வணக்கம்! அரசாங்க திட்டங்களைக் கண்டுபிடிக்க, ஆவணங்களைக் கண்காணிக்க, அல்லது அரசாங்க சேவைகள் பற்றி உதவ நான் இருக்கிறேன். எதில் உதவி வேண்டும்?",
    };
    return greetings[lang] || greetings.en;
  }

  // Scholarship queries
  if (msg.includes('scholar') || msg.includes('छात्रवृत्ति') || msg.includes('உதவித்தொகை')) {
    const scholarships = (schemes || []).filter(s => s.category === 'scholarship');
    if (scholarships.length === 0) return lang === 'hi' ? 'वर्तमान में कोई छात्रवृत्ति योजना उपलब्ध नहीं है।' : lang === 'ta' ? 'தற்போது உதவித்தொகை திட்டங்கள் இல்லை.' : 'No scholarship schemes are currently available.';
    const names = scholarships.map(s => `• ${s.name}`).join('\n');
    const prefixes: Record<string, string> = {
      en: `Here are the scholarship schemes I found for you:\n\n${names}\n\nVisit the Schemes tab to check your eligibility.`,
      hi: `ये रही आपके लिए छात्रवृत्ति योजनाएं:\n\n${names}\n\nपात्रता जांचने के लिए योजनाएं टैब पर जाएं।`,
      ta: `உங்களுக்கான உதவித்தொகை திட்டங்கள் இவை:\n\n${names}\n\nதகுதி சரிபார்க்க திட்டங்கள் பக்கத்திற்குச் செல்லவும்.`,
    };
    return prefixes[lang] || prefixes.en;
  }

  // Pension queries
  if (msg.includes('pension') || msg.includes('पेंशन') || msg.includes('ஓய்வூதிய')) {
    const pensions = (schemes || []).filter(s => s.category === 'pension' || s.category === 'senior');
    if (pensions.length === 0) return 'No pension schemes currently available.';
    const names = pensions.map(s => `• ${s.name} — ${s.benefits}`).join('\n');
    const prefixes: Record<string, string> = {
      en: `Here are pension and senior citizen schemes:\n\n${names}`,
      hi: `ये रही पेंशन और वरिष्ठ नागरिक योजनाएं:\n\n${names}`,
      ta: `ஓய்வூதிய மற்றும் மூத்த குடிமக்கள் திட்டங்கள்:\n\n${names}`,
    };
    return prefixes[lang] || prefixes.en;
  }

  // Farmer queries
  if (msg.includes('farmer') || msg.includes('kisan') || msg.includes('किसान') || msg.includes('விவசாயி') || msg.includes('agriculture')) {
    const farmer = (schemes || []).filter(s => s.category === 'farmer');
    const names = farmer.map(s => `• ${s.name} — ${s.benefits}`).join('\n');
    const prefixes: Record<string, string> = {
      en: `Farmer schemes available:\n\n${names}`,
      hi: `किसान योजनाएं:\n\n${names}`,
      ta: `விவசாயி திட்டங்கள்:\n\n${names}`,
    };
    return prefixes[lang] || prefixes.en;
  }

  // Eligibility / what can I get
  if (msg.includes('eligib') || msg.includes('what can i') || msg.includes('पात्र') || msg.includes('தகுதி')) {
    if (!profile || !profile.onboarded) {
      const prefixes: Record<string, string> = {
        en: "Please complete your profile first so I can find schemes you're eligible for. Go to the Profile tab to fill in your details.",
        hi: 'कृपया पहले अपनी प्रोफ़ाइल पूरी करें ताकि मैं पात्र योजनाएं खोज सकूं। विवरण भरने के लिए प्रोफ़ाइल टैब पर जाएं।',
        ta: 'தயவுசெய்து முதலில் உங்கள் சுயவிவரத்தை முடிக்கவும், அதன்பிறகு தகுதியான திட்டங்களைக் கண்டுபிடிப்பேன்.',
      };
      return prefixes[lang] || prefixes.en;
    }
    const top = (schemes || []).slice(0, 5).map(s => `• ${s.name}`).join('\n');
    const prefixes: Record<string, string> = {
      en: `Based on your profile, here are some schemes to explore:\n\n${top}\n\nVisit the Schemes tab for your full eligibility ranking.`,
      hi: `आपकी प्रोफ़ाइल के आधार पर कुछ योजनाएं:\n\n${top}\n\nपूरी पात्रता के लिए योजनाएं टैब देखें।`,
      ta: `உங்கள் சுயவிவரத்தின் அடிப்படையில் சில திட்டங்கள்:\n\n${top}\n\nமுழு தகுதி பட்டியலுக்கு திட்டங்கள் பக்கத்திற்குச் செல்லவும்.`,
    };
    return prefixes[lang] || prefixes.en;
  }

  // Document queries
  if (msg.includes('document') || msg.includes('दस्तावेज़') || msg.includes('आधार') || msg.includes('ஆவண') || msg.includes('ஆதார்')) {
    const prefixes: Record<string, string> = {
      en: "You can manage all your government documents in the Documents tab — Aadhaar, PAN, Voter ID, passport, certificates and more. I'll track expiry dates and remind you to renew.",
      hi: 'दस्तावेज़ टैब में अपने सभी सरकारी दस्तावेज़ प्रबंधित करें — आधार, पैन, वोटर आईडी, पासपोर्ट और अधिक। मैं समाप्ति तिथि ट्रैक करूंगा।',
      ta: 'ஆவணங்கள் பக்கத்தில் அனைத்து அரசாங்க ஆவணங்களையும் நிர்வகிக்கலாம் — ஆதார், பான், வாக்காளர் அடையாள அட்டை மற்றும் பல.',
    };
    return prefixes[lang] || prefixes.en;
  }

  // Complaint queries
  if (msg.includes('complaint') || msg.includes('grievance') || msg.includes('शिकायत') || msg.includes('புகார்')) {
    const prefixes: Record<string, string> = {
      en: "You can file complaints about roads, streetlights, water, sanitation, electricity, or corruption. Go to the Home tab and tap 'File Complaint'. Each complaint gets a tracking ID.",
      hi: 'सड़क, स्ट्रीटलाइट, पानी, सफाई, बिजली या भ्रष्टाचार की शिकायत दर्ज करें। होम टैब में "शिकायत दर्ज करें" दबाएं।',
      ta: 'சாலை, வீதி விளக்கு, தண்ணீர், சுகாதாரம், மின்சாரம் பற்றிய புகார்களைப் பதிவு செய்யலாம். முகப்பு பக்கத்தில் "புகார் செய்" ஐ அழுத்தவும்.',
    };
    return prefixes[lang] || prefixes.en;
  }

  // Default: try matching scheme names
  const matched = (schemes || []).filter((s: Scheme) =>
    msg.includes(s.name.toLowerCase().split(' ')[0].toLowerCase()) ||
    (s.tags || []).some((tag: string) => msg.includes(tag.toLowerCase()))
  );
  if (matched.length > 0) {
    const s = matched[0];
    const prefixes: Record<string, string> = {
      en: `${s.name}: ${s.description}\n\nBenefits: ${s.benefits}\n\nVisit the Schemes tab to check your eligibility and apply.`,
      hi: `${s.name_hi || s.name}: ${s.description_hi || s.description}\n\nलाभ: ${s.benefits}`,
      ta: `${s.name_ta || s.name}: ${s.description_ta || s.description}\n\nநன்மைகள்: ${s.benefits}`,
    };
    return prefixes[lang] || prefixes.en;
  }

  const defaults: Record<string, string> = {
    en: "I can help you with government schemes, documents, applications, complaints, and office locations. Try asking 'What scholarships am I eligible for?' or 'How do I apply for PM-KISAN?'",
    hi: 'मैं सरकारी योजनाओं, दस्तावेज़ों, आवेदन, शिकायतों और कार्यालय स्थानों में मदद कर सकता हूं। "मैं किन छात्रवृत्तियों के लिए पात्र हूं?" पूछें।',
    ta: 'அரசாங்க திட்டங்கள், ஆவணங்கள், விண்ணப்பங்கள், புகார்கள் மற்றும் அலுவலக இடங்களில் நான் உதவுவேன். "நான் எந்த உதவித்தொகைக்கு தகுதியானவன்?" என்று கேளுங்கள்.',
  };
  return defaults[lang] || defaults.en;
}
