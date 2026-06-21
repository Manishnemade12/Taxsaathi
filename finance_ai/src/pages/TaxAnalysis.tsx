import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getFinancialData, updateFinancialData, getTaxAnalysis, runTaxAnalysis } from "@/lib/api";
import DashboardNav from "@/components/DashboardNav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Loader2, Save, Brain, IndianRupee, TrendingDown, CheckCircle, Sparkles } from "lucide-react";

const incomeFields = [
  { key: "gross_salary", label: "Gross Salary" },
  { key: "hra_received", label: "HRA Received" },
  { key: "lta_received", label: "LTA Received" },
  { key: "other_income", label: "Other Income" },
  { key: "rental_income", label: "Rental Income" },
  { key: "interest_income", label: "Interest Income" },
  { key: "business_income", label: "Business Income" },
];

const deductionFields = [
  { key: "deductions_80c", label: "Section 80C (PPF, ELSS, LIC, etc.)" },
  { key: "deductions_80d", label: "Section 80D (Health Insurance)" },
  { key: "deductions_80e", label: "Section 80E (Education Loan Interest)" },
  { key: "deductions_80g", label: "Section 80G (Donations)" },
  { key: "deductions_nps", label: "NPS Contribution (80CCD)" },
  { key: "deductions_hra", label: "HRA Exemption" },
  { key: "deductions_lta", label: "LTA Exemption" },
  { key: "other_deductions", label: "Other Deductions (incl. Professional Tax)" },
];

const TaxAnalysis = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const [financialData, setFinancialData] = useState<any>({});
  const [analysis, setAnalysis] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const [fin, tax] = await Promise.all([getFinancialData(), getTaxAnalysis()]);
      if (fin) setFinancialData(fin);
      if (tax) setAnalysis(tax);
    } catch {
      // Data not available yet
    }
  };

  const handleFieldChange = (key: string, value: string) => {
    setFinancialData((prev: any) => ({ ...prev, [key]: parseFloat(value) || 0 }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateFinancialData(financialData);
      toast({ title: "Saved!", description: "Financial data saved." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const result = await runTaxAnalysis(financialData, profile || {});
      setAnalysis(result.data);
      toast({ title: "Analysis Complete!", description: "Your tax analysis is ready." });
    } catch (error: any) {
      toast({ title: "Analysis failed", description: error.message, variant: "destructive" });
    }
    setAnalyzing(false);
  };

  if (authLoading) return null;

  const fmt = (n: number) => `₹${(n || 0).toLocaleString("en-IN")}`;

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <div className="container py-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold text-foreground mb-1">Tax Analysis</h1>
          <p className="text-muted-foreground text-lg mb-8">Enter your financial data and get AI-powered tax analysis</p>
          <div className="mb-6 flex gap-3 flex-wrap">
            <Link to="/taxbuddy">
              <Button variant="outline">
                <Sparkles className="h-4 w-4 mr-2" />
                Open TaxBuddy (Autonomous Strategy Flow)
              </Button>
            </Link>
            <Link to="/taxbuddy-live">
              <Button>
                <Sparkles className="h-4 w-4 mr-2" />
                Open TaxBuddy Live (Real-time Filing)
              </Button>
            </Link>
          </div>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Input Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2"><IndianRupee className="h-5 w-5" /> Income Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {incomeFields.map((f) => (
                  <div key={f.key}>
                    <Label htmlFor={f.key} className="text-sm">{f.label}</Label>
                    <Input
                      id={f.key}
                      type="number"
                      value={financialData[f.key] || ""}
                      onChange={(e) => handleFieldChange(f.key, e.target.value)}
                      placeholder="0"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2"><TrendingDown className="h-5 w-5" /> Deductions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {deductionFields.map((f) => (
                  <div key={f.key}>
                    <Label htmlFor={f.key} className="text-sm">{f.label}</Label>
                    <Input
                      id={f.key}
                      type="number"
                      value={financialData[f.key] || ""}
                      onChange={(e) => handleFieldChange(f.key, e.target.value)}
                      placeholder="0"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button onClick={handleSave} disabled={saving} variant="outline">
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Data
              </Button>
              <Button onClick={handleAnalyze} disabled={analyzing}>
                {analyzing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Brain className="h-4 w-4 mr-2" />}
                {analyzing ? "Analyzing..." : "Run AI Analysis"}
              </Button>
            </div>
          </div>

          {/* Analysis Results */}
          <div className="space-y-6">
            {analysis ? (
              <>
                <Card className="border-primary/20">
                  <CardHeader>
                    <CardTitle className="font-display">Tax Comparison</CardTitle>
                    <CardDescription>FY 2025-26 regime comparison</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className={`p-4 rounded-xl border ${analysis.recommended_regime === "old" ? "border-primary bg-primary/5" : "border-border"}`}>
                        <p className="text-sm text-muted-foreground mb-1">Old Regime</p>
                        <p className="text-2xl font-display font-bold">{fmt(analysis.old_regime_tax)}</p>
                        {analysis.recommended_regime === "old" && (
                          <div className="flex items-center gap-1 mt-1 text-primary text-xs"><CheckCircle className="h-3 w-3" /> Recommended</div>
                        )}
                      </div>
                      <div className={`p-4 rounded-xl border ${analysis.recommended_regime === "new" ? "border-primary bg-primary/5" : "border-border"}`}>
                        <p className="text-sm text-muted-foreground mb-1">New Regime</p>
                        <p className="text-2xl font-display font-bold">{fmt(analysis.new_regime_tax)}</p>
                        {analysis.recommended_regime === "new" && (
                          <div className="flex items-center gap-1 mt-1 text-primary text-xs"><CheckCircle className="h-3 w-3" /> Recommended</div>
                        )}
                      </div>
                    </div>
                    {analysis.analysis_summary && (
                      <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">{analysis.analysis_summary}</div>
                    )}
                  </CardContent>
                </Card>

                {analysis.deduction_suggestions?.length > 0 && (
                  <Card>
                    <CardHeader><CardTitle className="font-display">Deduction Suggestions</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      {analysis.deduction_suggestions.map((s: any, i: number) => (
                        <div key={i} className="p-3 rounded-lg border border-border/50">
                          <div className="flex justify-between items-start mb-1">
                            <p className="font-medium text-sm">{s.title}</p>
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">{s.section}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{s.description}</p>
                          {s.potential_saving > 0 && (
                            <p className="text-xs text-green-600 mt-1">Potential saving: {fmt(s.potential_saving)}</p>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="p-10 text-center text-muted-foreground">
                  <Brain className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p className="font-display font-semibold mb-2">No analysis yet</p>
                  <p className="text-sm">Enter your financial details and click "Run AI Analysis" to get your tax breakdown.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaxAnalysis;
