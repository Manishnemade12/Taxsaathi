import { useState } from "react";
import DashboardNav from "@/components/DashboardNav";
import { useAuth } from "@/hooks/useAuth";
import { getTaxBuddyStrategy } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/hooks/use-toast";
import { Brain, Loader2, ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

type TaxBuddyForm = {
  age: number;
  res_status: "Resident" | "NRI" | "RNOR";
  has_business: boolean;
  has_cap_gains: boolean;
  est_income: number;
  has_agri: boolean;
  is_director: boolean;
};

const steps = [
  { key: "age", label: "What is your age?", kind: "number" as const },
  { key: "res_status", label: "Residential Status?", kind: "choice" as const, options: ["Resident", "NRI", "RNOR"] },
  { key: "has_business", label: "Do you earn from Business/Freelancing?", kind: "choice" as const, options: ["Yes", "No"] },
  { key: "has_cap_gains", label: "Did you sell Stocks, MF, or Property?", kind: "choice" as const, options: ["Yes", "No"] },
  { key: "est_income", label: "Total Annual Income (Rough Est.)", kind: "number" as const },
  { key: "has_agri", label: "Do you have Agriculture Income?", kind: "choice" as const, options: ["Yes", "No"] },
  { key: "is_director", label: "Are you a Director in any company?", kind: "choice" as const, options: ["Yes", "No"] },
];

const TaxBuddy = () => {
  const { loading } = useAuth(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [strategy, setStrategy] = useState<string>("");

  const [form, setForm] = useState<TaxBuddyForm>({
    age: 0,
    res_status: "Resident",
    has_business: false,
    has_cap_gains: false,
    est_income: 0,
    has_agri: false,
    is_director: false,
  });

  if (loading) return null;

  const current = steps[stepIndex];

  const setBool = (key: "has_business" | "has_cap_gains" | "has_agri" | "is_director", value: string) => {
    setForm((prev) => ({ ...prev, [key]: value === "Yes" }));
  };

  const canGoNext = () => {
    switch (current.key) {
      case "age":
        return form.age > 0;
      case "est_income":
        return form.est_income >= 0;
      default:
        return true;
    }
  };

  const handleGenerate = async () => {
    setSubmitting(true);
    try {
      const res = await getTaxBuddyStrategy(form);
      setStrategy(res.data.strategy);
      toast({ title: "TaxBuddy Strategy Ready", description: "Generated your personalized strategy." });
    } catch (error: any) {
      toast({ title: "TaxBuddy failed", description: error.message, variant: "destructive" });
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <div className="container py-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground mb-1">TaxBuddy Assistant</h1>
          <p className="text-muted-foreground text-lg">Answer step-by-step and get a personalized FY 2025-26 strategy</p>
          <div className="mt-4">
            <Link to="/taxbuddy-live">
              <Button variant="outline" className="gap-2">
                <Brain className="h-4 w-4" /> Open Real-time ITR Live Coach
              </Button>
            </Link>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2"><Brain className="h-5 w-5" /> Autonomous TaxBuddy Flow</CardTitle>
            <CardDescription>Step {stepIndex + 1} of {steps.length}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-base">{current.label}</Label>

              {current.kind === "number" && current.key === "age" && (
                <Input
                  type="number"
                  min={0}
                  value={form.age || ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, age: Number(e.target.value) || 0 }))}
                  placeholder="Enter age"
                />
              )}

              {current.kind === "number" && current.key === "est_income" && (
                <Input
                  type="number"
                  min={0}
                  value={form.est_income || ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, est_income: Number(e.target.value) || 0 }))}
                  placeholder="Enter estimated annual income"
                />
              )}

              {current.kind === "choice" && current.key === "res_status" && (
                <RadioGroup value={form.res_status} onValueChange={(v) => setForm((prev) => ({ ...prev, res_status: v as TaxBuddyForm["res_status"] }))}>
                  {current.options?.map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <RadioGroupItem id={option} value={option} />
                      <Label htmlFor={option}>{option}</Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {current.kind === "choice" && ["has_business", "has_cap_gains", "has_agri", "is_director"].includes(current.key) && (
                <RadioGroup
                  value={(form[current.key as keyof TaxBuddyForm] as boolean) ? "Yes" : "No"}
                  onValueChange={(v) => setBool(current.key as "has_business" | "has_cap_gains" | "has_agri" | "is_director", v)}
                >
                  {["Yes", "No"].map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <RadioGroupItem id={`${current.key}-${option}`} value={option} />
                      <Label htmlFor={`${current.key}-${option}`}>{option}</Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" disabled={stepIndex === 0 || submitting} onClick={() => setStepIndex((s) => s - 1)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>

              {stepIndex < steps.length - 1 ? (
                <Button disabled={!canGoNext() || submitting} onClick={() => setStepIndex((s) => s + 1)}>
                  Next <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={handleGenerate} disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Brain className="h-4 w-4 mr-2" />}
                  Generate Strategy
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {strategy && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="font-display">📝 Your Personalized Tax Strategy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap text-sm leading-6 text-foreground">{strategy}</div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TaxBuddy;
