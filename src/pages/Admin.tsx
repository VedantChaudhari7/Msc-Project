import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Shield, ArrowLeft, Activity, Users, AlertTriangle, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ScanStat {
  total: number;
  phishing: number;
  safe: number;
  avgScore: number;
}

interface RecentScan {
  id: string;
  url: string;
  risk_score: number;
  risk_level: string;
  is_phishing: boolean;
  created_at: string;
  user_id: string;
}

export default function Admin() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [allScans, setAllScans] = useState<RecentScan[]>([]);
  const [stats, setStats] = useState<ScanStat>({ total: 0, phishing: 0, safe: 0, avgScore: 0 });

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate("/dashboard");
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    const fetchAll = async () => {
      const { data } = await supabase
        .from("scans")
        .select("id, url, risk_score, risk_level, is_phishing, created_at, user_id")
        .order("created_at", { ascending: false })
        .limit(100);

      if (data) {
        setAllScans(data);
        const phishing = data.filter((s) => s.is_phishing).length;
        setStats({
          total: data.length,
          phishing,
          safe: data.length - phishing,
          avgScore: data.length > 0 ? Math.round(data.reduce((s, d) => s + d.risk_score, 0) / data.length) : 0,
        });
      }
    };
    if (isAdmin) fetchAll();
  }, [isAdmin]);

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Shield className="w-8 h-8 text-primary animate-pulse" />
      </div>
    );
  }

  const riskDistribution = {
    high: allScans.filter((s) => s.risk_level === "high").length,
    medium: allScans.filter((s) => s.risk_level === "medium").length,
    low: allScans.filter((s) => s.risk_level === "low").length,
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Shield className="w-6 h-6 text-primary" />
          <h1 className="text-lg font-bold font-display text-foreground">Admin Panel</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Scans", value: stats.total, icon: Activity, color: "text-primary" },
            { label: "Phishing", value: stats.phishing, icon: AlertTriangle, color: "text-destructive" },
            { label: "Safe", value: stats.safe, icon: Shield, color: "text-success" },
            { label: "Avg Score", value: stats.avgScore, icon: BarChart3, color: "text-secondary" },
          ].map((stat) => (
            <div key={stat.label} className="cyber-gradient cyber-border rounded-xl p-4">
              <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
              <div className="text-2xl font-bold font-display text-foreground">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Risk Distribution */}
        <div className="cyber-gradient cyber-border rounded-xl p-6">
          <h2 className="text-lg font-bold font-display text-foreground mb-4">Risk Distribution</h2>
          <div className="flex gap-2 h-8">
            {stats.total > 0 && (
              <>
                <div className="bg-destructive rounded h-full transition-all" style={{ width: `${(riskDistribution.high / stats.total) * 100}%` }} title={`High: ${riskDistribution.high}`} />
                <div className="bg-warning rounded h-full transition-all" style={{ width: `${(riskDistribution.medium / stats.total) * 100}%` }} title={`Medium: ${riskDistribution.medium}`} />
                <div className="bg-success rounded h-full transition-all" style={{ width: `${(riskDistribution.low / stats.total) * 100}%` }} title={`Low: ${riskDistribution.low}`} />
              </>
            )}
          </div>
          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-destructive" /> High ({riskDistribution.high})</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-warning" /> Medium ({riskDistribution.medium})</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-success" /> Low ({riskDistribution.low})</span>
          </div>
        </div>

        {/* All Scans Log */}
        <div className="cyber-gradient cyber-border rounded-xl p-6">
          <h2 className="text-lg font-bold font-display text-foreground mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            All Scan Logs
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-left">
                  <th className="py-2 pr-4 font-display">URL</th>
                  <th className="py-2 pr-4 font-display">Score</th>
                  <th className="py-2 pr-4 font-display">Level</th>
                  <th className="py-2 pr-4 font-display">Date</th>
                  <th className="py-2 font-display">User</th>
                </tr>
              </thead>
              <tbody>
                {allScans.map((scan) => (
                  <tr key={scan.id} className="border-b border-border/50 hover:bg-muted/50">
                    <td className="py-2 pr-4 truncate max-w-xs text-foreground">{scan.url}</td>
                    <td className="py-2 pr-4 font-display text-foreground">{scan.risk_score}</td>
                    <td className="py-2 pr-4">
                      <span className={`text-xs font-display px-2 py-0.5 rounded ${
                        scan.risk_level === "high" ? "bg-destructive/10 text-destructive" :
                        scan.risk_level === "medium" ? "bg-warning/10 text-warning" : "bg-success/10 text-success"
                      }`}>
                        {scan.risk_level}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">{new Date(scan.created_at).toLocaleDateString()}</td>
                    <td className="py-2 text-muted-foreground text-xs font-display">{scan.user_id.slice(0, 8)}...</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
