import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getSchemes, getPersonalizedSchemes } from "@/lib/api";
import DashboardNav from "@/components/DashboardNav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Landmark, Brain, Loader2, ArrowUpRight } from "lucide-react";

const STATIC_SCHEMES = [
  { name: "Public Provident Fund (PPF)", type: "Investment", tax_benefit: "Section 80C - up to ₹1.5L deduction", description: "Long-term savings with guaranteed returns. 15-year lock-in. Current interest: ~7.1% p.a." },
  { name: "Equity Linked Savings Scheme (ELSS)", type: "Investment", tax_benefit: "Section 80C - up to ₹1.5L deduction", description: "Tax-saving mutual funds with the shortest lock-in (3 years) among 80C options." },
  { name: "National Pension System (NPS)", type: "Pension", tax_benefit: "Section 80CCD(1B) - additional ₹50K deduction", description: "Retirement savings with tax benefits over and above 80C limit." },
  { name: "Sukanya Samriddhi Yojana", type: "Savings", tax_benefit: "Section 80C - Triple exempt (EEE)", description: "For girl child education/marriage. High interest rate, government backed." },
  { name: "Senior Citizens Savings Scheme", type: "Savings", tax_benefit: "Section 80C - up to ₹1.5L deduction", description: "For citizens above 60. Quarterly interest payout. 5-year tenure." },
];

const Schemes = () => {
  const { user, loading: authLoading } = useAuth();
  const [personalizedSchemes, setPersonalizedSchemes] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) loadSchemes();
  }, [user]);

  const loadSchemes = async () => {
    try {
      const data = await getSchemes();
      if (data.schemes) {
        setPersonalizedSchemes(data.schemes);
      }
    } catch {
      // No personalized schemes yet
    }
  };

  const handleGetPersonalized = async () => {
    setLoading(true);
    try {
      const data = await getPersonalizedSchemes();
      if (data.schemes) {
        setPersonalizedSchemes(data.schemes);
        toast({ title: "Schemes updated!", description: "Personalized recommendations are ready." });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setLoading(false);
  };

  if (authLoading) return null;

  const schemesToDisplay = personalizedSchemes || STATIC_SCHEMES;

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <div className="container py-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground mb-1">Tax-Saving Schemes</h1>
              <p className="text-muted-foreground text-lg">Explore government schemes to reduce your tax liability</p>
            </div>
            <Button onClick={handleGetPersonalized} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Brain className="h-4 w-4 mr-2" />}
              Get Personalized
            </Button>
          </div>
        </motion.div>

        {personalizedSchemes && (
          <div className="mb-6">
            <Badge variant="secondary" className="text-xs">
              <Brain className="h-3 w-3 mr-1" /> AI-Personalized Recommendations
            </Badge>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {schemesToDisplay.map((scheme: any, i: number) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="h-full hover:border-primary/20 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-primary/10">
                        <Landmark className="h-4 w-4 text-primary" />
                      </div>
                      <CardTitle className="font-display text-base">{scheme.name}</CardTitle>
                    </div>
                    <Badge variant="outline" className="text-xs">{scheme.type}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">{scheme.description}</p>
                  <div className="p-2 rounded-lg bg-green-500/10 text-green-700 dark:text-green-400 text-xs">
                    💰 {scheme.tax_benefit}
                  </div>
                  {scheme.eligibility && (
                    <p className="text-xs text-muted-foreground mt-2">Eligibility: {scheme.eligibility}</p>
                  )}
                  {scheme.how_to_apply && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <ArrowUpRight className="h-3 w-3" /> {scheme.how_to_apply}
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Schemes;
