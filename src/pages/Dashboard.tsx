import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import URLScanner from "@/components/URLScanner";
import { Shield, Activity, AlertTriangle, Clock, LogOut, Settings, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Scan {
  id: string;
  url: string;
  risk_score: number;
  risk_level: string;
  is_phishing: boolean;
  created_at: string;
}

export default function Dashboard() {
  const { user, signOut, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [scans, setScans] = useState<Scan[]>([]);
  const [stats, setStats] = useState({ total: 0, phishing: 0, safe: 0 });

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  const fetchScans = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("scans")
      .select("id, url, risk_score, risk_level, is_phishing, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (data) {
      setScans(data);
      setStats({
        total: data.length,
        phishing: data.filter((s) => s.is_phishing).length,
        safe: data.filter((s) => !s.is_phishing).length,
      });
    }
  };

  useEffect(() => { fetchScans(); }, [user]);

  const deleteScan = async (id: string) => {
    await supabase.from("scans").delete().eq("id", id);
    toast.success("Scan deleted");
    fetchScans();
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Shield className="w-8 h-8 text-primary animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="text-lg font-bold font-display text-foreground">PhishGuard</h1>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button variant="ghost" size="sm" onClick={() => navigate("/admin")} className="text-muted-foreground hover:text-foreground">
                <Settings className="w-4 h-4 mr-1" /> Admin
              </Button>
            )}
            <span className="text-xs text-muted-foreground hidden sm:block">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-muted-foreground hover:text-foreground">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Total Scans", value: stats.total, icon: Activity, color: "text-primary" },
            { label: "Phishing Detected", value: stats.phishing, icon: AlertTriangle, color: "text-destructive" },
            { label: "Safe URLs", value: stats.safe, icon: Shield, color: "text-success" },
          ].map((stat) => (
            <div key={stat.label} className="cyber-gradient cyber-border rounded-xl p-4 flex items-center gap-4">
              <div className="p-2 rounded-lg bg-muted">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <div className="text-2xl font-bold font-display text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Scanner */}
        <div className="cyber-gradient cyber-border rounded-xl p-6">
          <h2 className="text-lg font-bold font-display text-foreground mb-4 flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" />
            URL Scanner
          </h2>
          <URLScanner onScanComplete={fetchScans} />
        </div>

        {/* Scan History */}
        <div className="cyber-gradient cyber-border rounded-xl p-6">
          <h2 className="text-lg font-bold font-display text-foreground mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Scan History
          </h2>
          {scans.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No scans yet. Start by scanning a URL above.</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {scans.map((scan) => (
                <div key={scan.id} className="flex items-center justify-between bg-muted rounded-lg p-3 group">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      scan.risk_level === "high" ? "bg-destructive" :
                      scan.risk_level === "medium" ? "bg-warning" : "bg-success"
                    }`} />
                    <div className="min-w-0">
                      <p className="text-sm font-display text-foreground truncate">{scan.url}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(scan.created_at).toLocaleString()} · Score: {scan.risk_score}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-display px-2 py-1 rounded ${
                      scan.risk_level === "high" ? "bg-destructive/10 text-destructive" :
                      scan.risk_level === "medium" ? "bg-warning/10 text-warning" : "bg-success/10 text-success"
                    }`}>
                      {scan.risk_level}
                    </span>
                    <button
                      onClick={() => deleteScan(scan.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function Search(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
    </svg>
  );
}
