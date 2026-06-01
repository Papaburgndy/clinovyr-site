export interface EscalationResult {
  shouldEscalate: boolean;
  reason?: string;
}

const FRUSTRATION_PATTERNS = [
  /ridiculous/i,
  /waiting\s+\d+\s+weeks?/i,
  /been waiting/i,
  /unacceptable/i,
  /terrible service/i,
  /so frustrated/i,
  /this is insane/i,
];

const EXPLICIT_HUMAN_PATTERNS = [
  /speak to a real person/i,
  /talk to a real person/i,
  /real person/i,
  /speak to someone/i,
  /talk to a human/i,
  /live agent/i,
  /representative/i,
];

const COMPLEX_MEDICAL_PATTERNS = [
  /should i take/i,
  /dosage of/i,
  /diagnose/i,
  /symptoms mean/i,
  /prescribe/i,
  /drug interaction/i,
  /side effects of my medication/i,
  /is it safe to mix/i,
  /chest pain and/i,
];

export function detectEscalation(message: string): EscalationResult {
  const text = message.trim();

  for (const pattern of EXPLICIT_HUMAN_PATTERNS) {
    if (pattern.test(text)) {
      return { shouldEscalate: true, reason: "explicit_human_request" };
    }
  }

  for (const pattern of FRUSTRATION_PATTERNS) {
    if (pattern.test(text)) {
      return { shouldEscalate: true, reason: "customer_frustration" };
    }
  }

  for (const pattern of COMPLEX_MEDICAL_PATTERNS) {
    if (pattern.test(text)) {
      return { shouldEscalate: true, reason: "complex_medical_question" };
    }
  }

  return { shouldEscalate: false };
}

export function medicalDeflectionReply(): string {
  return "I'm not able to provide medical advice. For clinical questions, please speak with our care team or call the office directly. I can connect you with a team member if you'd like.";
}

const HEDGE_PATTERNS = [/\bi think\b/i, /\bi believe\b/i, /\bprobably\b/i];

export function detectLowConfidenceReply(reply: string): EscalationResult {
  for (const pattern of HEDGE_PATTERNS) {
    if (pattern.test(reply)) {
      return { shouldEscalate: true, reason: "low_confidence_reply" };
    }
  }
  return { shouldEscalate: false };
}
