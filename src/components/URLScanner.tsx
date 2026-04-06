import { useState } from "react";
import { analyzeURL, ScanResult } from "@/lib/url-analyzer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Shield, AlertTriangle, XCircle, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  onScanComplete?: () => void;
}

export default function URLScanner({ onScanComplete }: Props) {
  const [url, setUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const { user } = useAuth();

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setScanning(true);
    setResult(null);

    // Simulate ML processing delay
    await new Promise((r) => setTimeout(r, 1500));

    const scanResult = analyzeURL(url.trim());
    setResult(scanResult);

    if (user) {
      const { error } = await supabase.from("scans").insert({
        user_id: user.id,
        url: scanResult.url,
        risk_score: scanResult.riskScore,
        risk_level: scanResult.riskLevel,
        is_phishing: scanResult.isPhishing,
        features: scanResult.features as any,
      });
      if (error) toast.error("Failed to save scan");
      else onScanComplete?.();
    }

    setScanning(false);
  };

  const riskConfig = {
    low: { icon: CheckCircle, color: "text-success", bg: "bg-success/10", border: "border-success/30", label: "Safe" },
    medium: { icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10", border: "border-warning/30", label: "Suspicious" },
    high: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30", label: "Phishing Detected" },
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleScan} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter URL to scan (e.g., https://suspicious-site.xyz/login)"
            className="pl-10 bg-muted border-border font-display text-sm"
          />
        </div>
        <Button type="submit" disabled={scanning || !url.trim()} className="bg-primary text-primary-foreground font-display">
          {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
          <span className="ml-2">{scanning ? "Scanning..." : "Scan"}</span>
        </Button>
      </form>

      {scanning && (
        <div className="cyber-gradient cyber-border rounded-xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 pulse-glow mb-4">
            <Shield className="w-8 h-8 text-primary animate-pulse" />
          </div>
          <p className="text-foreground font-display text-sm">Analyzing URL features...</p>
          <p className="text-muted-foreground text-xs mt-1">Running ML classification model</p>
        </div>
      )}

      {result && !scanning && (
        <div className="space-y-4">
          {/* Risk Score Card */}
          <div className={`rounded-xl p-6 border ${riskConfig[result.riskLevel].bg} ${riskConfig[result.riskLevel].border}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {(() => {
                  const Icon = riskConfig[result.riskLevel].icon;
                  return <Icon className={`w-8 h-8 ${riskConfig[result.riskLevel].color}`} />;
                })()}
                <div>
                  <h3 className={`text-lg font-bold font-display ${riskConfig[result.riskLevel].color}`}>
                    {riskConfig[result.riskLevel].label}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate max-w-xs">{result.url}</p>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-3xl font-bold font-display ${riskConfig[result.riskLevel].color}`}>
                  {result.riskScore}
                </div>
                <div className="text-xs text-muted-foreground">Risk Score</div>
              </div>
            </div>

            {/* Risk Bar */}
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  result.riskLevel === "low" ? "bg-success" :
                  result.riskLevel === "medium" ? "bg-warning" : "bg-destructive"
                }`}
                style={{ width: `${result.riskScore}%` }}
              />
            </div>
          </div>

          {/* Reasons */}
          {result.reasons.length > 0 && (
            <div className="cyber-gradient cyber-border rounded-xl p-4">
              <h4 className="text-sm font-bold font-display text-foreground mb-3">Risk Factors</h4>
              <div className="space-y-2">
                {result.reasons.map((reason, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="w-3 h-3 text-warning flex-shrink-0" />
                    <span className="text-muted-foreground">{reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Feature Grid */}
          <div className="cyber-gradient cyber-border rounded-xl p-4">
            <h4 className="text-sm font-bold font-display text-foreground mb-3">Extracted Features</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { label: "URL Length", value: result.features.urlLength },
                { label: "HTTPS", value: result.features.hasHttps ? "Yes" : "No" },
                { label: "IP Address", value: result.features.hasIPAddress ? "Yes" : "No" },
                { label: "Subdomains", value: result.features.numSubdomains },
                { label: "Path Depth", value: result.features.pathDepth },
                { label: "Entropy", value: result.features.urlEntropy.toFixed(2) },
                { label: "Dots", value: result.features.numDots },
                { label: "Hyphens", value: result.features.numHyphens },
                { label: "Digits in Domain", value: result.features.numDigitsInDomain },
              ].map((feat) => (
                <div key={feat.label} className="bg-muted rounded-lg p-2">
                  <div className="text-xs text-muted-foreground">{feat.label}</div>
                  <div className="text-sm font-bold font-display text-foreground">{feat.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
