import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { completeOnboarding } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Loader2, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";

const EMPLOYMENT_TYPES = [
  { value: "salaried", label: "Salaried" },
  { value: "self-employed", label: "Self Employed" },
  { value: "business", label: "Business Owner" },
  { value: "freelancer", label: "Freelancer" },
  { value: "retired", label: "Retired" },
];

const INCOME_SOURCES = ["Salary", "Rental Income", "Interest Income", "Capital Gains", "Business Income", "Other"];

const AGE_GROUPS = [
  { value: "below-60", label: "Below 60 years" },
  { value: "60-80", label: "60 to 80 years" },
  { value: "above-80", label: "Above 80 years" },
];

const TAX_REGIMES = [
  { value: "old", label: "Old Tax Regime", description: "With deductions under sections 80C, 80D, etc." },
  { value: "new", label: "New Tax Regime", description: "Lower tax rates, fewer deductions" },
  { value: "not-sure", label: "Not Sure", description: "We'll help you decide" },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [employment, setEmployment] = useState("");
  const [incomeSources, setIncomeSources] = useState<string[]>([]);
  const [ageGroup, setAgeGroup] = useState("");
  const [taxRegime, setTaxRegime] = useState("");
  const [saving, setSaving] = useState(false);

  const toggleIncomeSource = (src: string) => {
    setIncomeSources((prev) => prev.includes(src) ? prev.filter((s) => s !== src) : [...prev, src]);
  };

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/auth"); return; }

    setSaving(true);
    try {
      await completeOnboarding({
        employment_type: employment,
        income_sources: incomeSources,
        age_group: ageGroup,
        tax_regime: taxRegime,
      });
      toast({ title: "Profile complete!", description: "Let's get started with your tax planning." });
      navigate("/dashboard");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const canProceed = (s: number) => {
    if (s === 1) return !!employment;
    if (s === 2) return incomeSources.length > 0;
    if (s === 3) return !!ageGroup;
    if (s === 4) return !!taxRegime;
    return false;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-display font-bold text-2xl mx-auto mb-3">T</div>
          <h1 className="font-display text-2xl font-bold text-foreground">Set Up Your Profile</h1>
          <p className="text-muted-foreground">Step {step} of 4</p>
          <div className="flex gap-1 mt-3 justify-center">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className={`h-1 w-10 rounded-full ${s <= step ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            {step === 1 && (
              <div>
                <CardHeader className="px-0 pt-0"><CardTitle className="font-display">Employment Type</CardTitle>
                  <CardDescription>What best describes your employment?</CardDescription></CardHeader>
                <RadioGroup value={employment} onValueChange={setEmployment} className="space-y-2">
                  {EMPLOYMENT_TYPES.map((t) => (
                    <div key={t.value} className="flex items-center space-x-2 p-3 rounded-lg border border-border/50 hover:border-primary/30 transition-colors">
                      <RadioGroupItem value={t.value} id={t.value} />
                      <Label htmlFor={t.value} className="cursor-pointer">{t.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {step === 2 && (
              <div>
                <CardHeader className="px-0 pt-0"><CardTitle className="font-display">Income Sources</CardTitle>
                  <CardDescription>Select all sources of income (one or more)</CardDescription></CardHeader>
                <div className="flex flex-wrap gap-2">
                  {INCOME_SOURCES.map((src) => (
                    <Badge
                      key={src}
                      variant={incomeSources.includes(src) ? "default" : "outline"}
                      className="cursor-pointer px-3 py-1.5 text-sm"
                      onClick={() => toggleIncomeSource(src)}
                    >
                      {incomeSources.includes(src) && <CheckCircle className="h-3 w-3 mr-1" />}
                      {src}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <CardHeader className="px-0 pt-0"><CardTitle className="font-display">Age Group</CardTitle>
                  <CardDescription>Your age affects tax slab rates</CardDescription></CardHeader>
                <RadioGroup value={ageGroup} onValueChange={setAgeGroup} className="space-y-2">
                  {AGE_GROUPS.map((g) => (
                    <div key={g.value} className="flex items-center space-x-2 p-3 rounded-lg border border-border/50 hover:border-primary/30 transition-colors">
                      <RadioGroupItem value={g.value} id={g.value} />
                      <Label htmlFor={g.value} className="cursor-pointer">{g.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {step === 4 && (
              <div>
                <CardHeader className="px-0 pt-0"><CardTitle className="font-display">Tax Regime</CardTitle>
                  <CardDescription>Which regime do you want to use?</CardDescription></CardHeader>
                <RadioGroup value={taxRegime} onValueChange={setTaxRegime} className="space-y-2">
                  {TAX_REGIMES.map((r) => (
                    <div key={r.value} className="flex items-center space-x-2 p-3 rounded-lg border border-border/50 hover:border-primary/30 transition-colors">
                      <RadioGroupItem value={r.value} id={r.value} />
                      <div>
                        <Label htmlFor={r.value} className="cursor-pointer">{r.label}</Label>
                        <p className="text-xs text-muted-foreground">{r.description}</p>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            <div className="flex justify-between mt-6">
              {step > 1 ? (
                <Button variant="outline" onClick={() => setStep(step - 1)}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
              ) : <div />}
              {step < 4 ? (
                <Button onClick={() => setStep(step + 1)} disabled={!canProceed(step)}>
                  Next <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={handleSave} disabled={saving || !canProceed(4)}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Complete Setup
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Onboarding;
