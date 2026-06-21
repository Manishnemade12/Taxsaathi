import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getFinancialData, getTaxAnalysis } from "@/lib/api";
import DashboardNav from "@/components/DashboardNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { IndianRupee, TrendingUp, TrendingDown, FileText, CheckCircle } from "lucide-react";

const TaxSummary = () => {
  const { user, loading: authLoading } = useAuth();
  const [financialData, setFinancialData] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const [fin, tax] = await Promise.all([getFinancialData(), getTaxAnalysis()]);
      if (fin) setFinancialData(fin);
      if (tax) setAnalysis(tax);
    } catch {
      // Not available yet
    }
  };

  if (authLoading) return null;

  const fmt = (n: number) => `₹${(n || 0).toLocaleString("en-IN")}`;

  const totalIncome = financialData
    ? (financialData.gross_salary || 0) +
    (financialData.other_income || 0) +
    (financialData.rental_income || 0) +
    (financialData.interest_income || 0) +
    (financialData.business_income || 0)
    : 0;

  const totalDeductions = financialData
    ? (financialData.deductions_80c || 0) +
    (financialData.deductions_80d || 0) +
    (financialData.deductions_80e || 0) +
    (financialData.deductions_80g || 0) +
    (financialData.deductions_nps || 0) +
    (financialData.deductions_hra || 0) +
    (financialData.deductions_lta || 0) +
    (financialData.other_deductions || 0)
    : 0;

  const incomeItems = [
    { label: "Gross Salary", value: financialData?.gross_salary || 0 },
    { label: "Rental Income", value: financialData?.rental_income || 0 },
    { label: "Interest Income", value: financialData?.interest_income || 0 },
    { label: "Other Income", value: financialData?.other_income || 0 },
    { label: "Business Income", value: financialData?.business_income || 0 },
  ].filter((i) => i.value > 0);

  const deductionItems = [
    { label: "Section 80C", value: financialData?.deductions_80c || 0 },
    { label: "Section 80D (Health)", value: financialData?.deductions_80d || 0 },
    { label: "Section 80E (Education)", value: financialData?.deductions_80e || 0 },
    { label: "Section 80G (Donations)", value: financialData?.deductions_80g || 0 },
    { label: "NPS (80CCD)", value: financialData?.deductions_nps || 0 },
    { label: "HRA Exemption", value: financialData?.deductions_hra || 0 },
    { label: "LTA Exemption", value: financialData?.deductions_lta || 0 },
    { label: "Other Deductions", value: financialData?.other_deductions || 0 },
  ].filter((i) => i.value > 0);

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <div className="container py-8 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold text-foreground mb-1">Tax Summary</h1>
          <p className="text-muted-foreground text-lg mb-8">FY 2025-26 overview</p>
        </motion.div>

        {!financialData && !analysis ? (
          <Card>
            <CardContent className="p-10 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="font-display font-semibold mb-2">No data yet</p>
              <p className="text-sm">Go to Tax Analysis to enter your financial data.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Total summary */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <TrendingUp className="h-5 w-5 text-secondary mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Total Income</p>
                  <p className="text-xl font-display font-bold">{fmt(totalIncome)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <TrendingDown className="h-5 w-5 text-primary mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Total Deductions</p>
                  <p className="text-xl font-display font-bold">{fmt(totalDeductions)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <IndianRupee className="h-5 w-5 text-accent mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Est. Tax</p>
                  <p className="text-xl font-display font-bold">
                    {analysis ? fmt(Math.min(analysis.old_regime_tax || 0, analysis.new_regime_tax || 0)) : "—"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Income breakdown */}
            {incomeItems.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="font-display">Income Breakdown</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {incomeItems.map((item) => (
                      <div key={item.label} className="flex justify-between items-center py-1 border-b border-border/30 last:border-0">
                        <span className="text-sm text-muted-foreground">{item.label}</span>
                        <span className="text-sm font-medium">{fmt(item.value)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-2 font-semibold">
                      <span>Total</span>
                      <span>{fmt(totalIncome)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Deductions breakdown */}
            {deductionItems.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="font-display">Deductions Claimed</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {deductionItems.map((item) => (
                      <div key={item.label} className="flex justify-between items-center py-1 border-b border-border/30 last:border-0">
                        <span className="text-sm text-muted-foreground">{item.label}</span>
                        <span className="text-sm font-medium">{fmt(item.value)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-2 font-semibold">
                      <span>Total</span>
                      <span>{fmt(totalDeductions)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Regime comparison */}
            {analysis && (
              <Card className="border-primary/20">
                <CardHeader><CardTitle className="font-display">Regime Comparison</CardTitle></CardHeader>
                <CardContent>
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
                    <div className="mt-4 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">{analysis.analysis_summary}</div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaxSummary;
