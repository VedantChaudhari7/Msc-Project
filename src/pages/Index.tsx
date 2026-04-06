import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Shield, Search, BarChart3, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export default function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate("/dashboard");
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] rounded-full opacity-[0.03] bg-primary blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] rounded-full opacity-[0.03] bg-secondary blur-3xl" />
        <div className="absolute inset-0 scan-line opacity-30" />
      </div>

      {/* Header */}
      <header className="relative z-10 container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-7 h-7 text-primary" />
          <span className="text-lg font-bold font-display text-foreground">PhishGuard</span>
        </div>
        <Button variant="ghost" onClick={() => navigate("/auth")} className="text-muted-foreground hover:text-foreground font-display">
          Sign In <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </header>

      {/* Hero */}
      <main className="relative z-10 container mx-auto px-4 pt-20 pb-32">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 cyber-border pulse-glow mb-8">
            <Shield className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-display text-foreground mb-4 leading-tight">
            AI-Powered<br />Phishing Detection
          </h1>
          <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
            Scan any URL instantly. Our machine learning model analyzes 15+ features to detect phishing threats in real-time.
          </p>
          <Button
            onClick={() => navigate("/auth")}
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-display text-base px-8"
          >
            Get Started <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-3xl mx-auto">
          {[
            { icon: Search, title: "URL Analysis", desc: "Extract 15+ features from any URL including length, HTTPS, suspicious words, and domain info" },
            { icon: BarChart3, title: "Risk Scoring", desc: "ML-based classification with low, medium, and high risk levels and detailed explanations" },
            { icon: Lock, title: "Scan History", desc: "Track all your scans with a personal dashboard showing stats and detection history" },
          ].map((feat) => (
            <div key={feat.title} className="cyber-gradient cyber-border rounded-xl p-5 text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 mb-3">
                <feat.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-bold font-display text-foreground text-sm mb-1">{feat.title}</h3>
              <p className="text-xs text-muted-foreground">{feat.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
