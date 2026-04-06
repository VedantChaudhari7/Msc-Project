// Heuristic-based URL phishing classifier
// Extracts features and computes a risk score (0-100)

export interface URLFeatures {
  urlLength: number;
  hasHttps: boolean;
  hasIPAddress: boolean;
  numDots: number;
  numHyphens: number;
  numSubdomains: number;
  hasAtSymbol: boolean;
  hasSuspiciousWords: boolean;
  suspiciousWordsFound: string[];
  hasSuspiciousTLD: boolean;
  hasLongSubdomain: boolean;
  numDigitsInDomain: number;
  hasRedirect: boolean;
  urlEntropy: number;
  hasPunycode: boolean;
  pathDepth: number;
  hasPortNumber: boolean;
  domainAge: string; // "unknown" - would need WHOIS API
}

export interface ScanResult {
  url: string;
  features: URLFeatures;
  riskScore: number;
  riskLevel: "low" | "medium" | "high";
  isPhishing: boolean;
  reasons: string[];
}

const SUSPICIOUS_WORDS = [
  "login", "signin", "sign-in", "verify", "update", "secure", "account",
  "banking", "confirm", "password", "credential", "suspend", "restrict",
  "unlock", "alert", "urgent", "expire", "payment", "paypal", "amazon",
  "apple", "microsoft", "google", "facebook", "netflix", "instagram",
  "whatsapp", "telegram", "wallet", "crypto", "bitcoin", "bonus", "prize",
  "winner", "gift", "free", "claim", "reward", "offer"
];

const SUSPICIOUS_TLDS = [
  ".tk", ".ml", ".ga", ".cf", ".gq", ".xyz", ".top", ".pw",
  ".cc", ".club", ".work", ".buzz", ".surf", ".rest", ".fit"
];

function calculateEntropy(str: string): number {
  const freq: Record<string, number> = {};
  for (const c of str) freq[c] = (freq[c] || 0) + 1;
  const len = str.length;
  return -Object.values(freq).reduce((sum, f) => {
    const p = f / len;
    return sum + p * Math.log2(p);
  }, 0);
}

function extractFeatures(url: string): URLFeatures {
  let parsed: URL;
  try {
    parsed = new URL(url.startsWith("http") ? url : `http://${url}`);
  } catch {
    parsed = new URL("http://invalid.com");
  }

  const hostname = parsed.hostname;
  const fullUrl = parsed.href;
  const path = parsed.pathname;
  const parts = hostname.split(".");

  const suspiciousWordsFound = SUSPICIOUS_WORDS.filter(w =>
    fullUrl.toLowerCase().includes(w)
  );

  return {
    urlLength: fullUrl.length,
    hasHttps: parsed.protocol === "https:",
    hasIPAddress: /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname),
    numDots: (hostname.match(/\./g) || []).length,
    numHyphens: (hostname.match(/-/g) || []).length,
    numSubdomains: Math.max(0, parts.length - 2),
    hasAtSymbol: fullUrl.includes("@"),
    hasSuspiciousWords: suspiciousWordsFound.length > 0,
    suspiciousWordsFound,
    hasSuspiciousTLD: SUSPICIOUS_TLDS.some(tld => hostname.endsWith(tld)),
    hasLongSubdomain: parts.some(p => p.length > 25),
    numDigitsInDomain: (hostname.match(/\d/g) || []).length,
    hasRedirect: fullUrl.includes("//") && fullUrl.indexOf("//", 8) > 0,
    urlEntropy: calculateEntropy(fullUrl),
    hasPunycode: hostname.includes("xn--"),
    pathDepth: path.split("/").filter(Boolean).length,
    hasPortNumber: !!parsed.port && parsed.port !== "80" && parsed.port !== "443",
    domainAge: "unknown",
  };
}

function computeRiskScore(features: URLFeatures): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  if (!features.hasHttps) { score += 15; reasons.push("No HTTPS encryption"); }
  if (features.hasIPAddress) { score += 25; reasons.push("IP address used instead of domain"); }
  if (features.urlLength > 75) { score += 10; reasons.push("Unusually long URL"); }
  if (features.urlLength > 150) { score += 10; reasons.push("Extremely long URL"); }
  if (features.numDots > 4) { score += 10; reasons.push("Excessive dots in hostname"); }
  if (features.numHyphens > 3) { score += 10; reasons.push("Excessive hyphens in domain"); }
  if (features.numSubdomains > 3) { score += 15; reasons.push("Too many subdomains"); }
  if (features.hasAtSymbol) { score += 20; reasons.push("@ symbol in URL (possible redirect)"); }
  if (features.hasSuspiciousWords) {
    const wordScore = Math.min(20, features.suspiciousWordsFound.length * 5);
    score += wordScore;
    reasons.push(`Suspicious keywords: ${features.suspiciousWordsFound.slice(0, 3).join(", ")}`);
  }
  if (features.hasSuspiciousTLD) { score += 15; reasons.push("Suspicious top-level domain"); }
  if (features.hasLongSubdomain) { score += 10; reasons.push("Unusually long subdomain"); }
  if (features.numDigitsInDomain > 4) { score += 10; reasons.push("Many digits in domain name"); }
  if (features.hasRedirect) { score += 15; reasons.push("Embedded redirect detected"); }
  if (features.urlEntropy > 4.5) { score += 5; reasons.push("High URL entropy (randomized)"); }
  if (features.hasPunycode) { score += 20; reasons.push("Punycode domain (possible homograph attack)"); }
  if (features.pathDepth > 5) { score += 5; reasons.push("Deep URL path"); }
  if (features.hasPortNumber) { score += 10; reasons.push("Non-standard port number"); }

  return { score: Math.min(100, score), reasons };
}

export function analyzeURL(url: string): ScanResult {
  const features = extractFeatures(url);
  const { score, reasons } = computeRiskScore(features);

  let riskLevel: "low" | "medium" | "high";
  if (score >= 60) riskLevel = "high";
  else if (score >= 30) riskLevel = "medium";
  else riskLevel = "low";

  return {
    url,
    features,
    riskScore: score,
    riskLevel,
    isPhishing: score >= 60,
    reasons,
  };
}
