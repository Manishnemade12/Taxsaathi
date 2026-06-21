import { useState } from "react";
import DashboardNav from "@/components/DashboardNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { startTaxBuddyLive, sendTaxBuddyLiveMessage, type TaxBuddyLiveState } from "@/lib/taxbuddy-live-api";
import { Brain, Loader2, MessageCircleMore, Play, Send } from "lucide-react";

type ChatMessage = {
  role: "assistant" | "user";
  content: string;
};

const TaxBuddyLive = () => {
  const [state, setState] = useState<TaxBuddyLiveState | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldName, setFieldName] = useState("");
  const [fieldHint, setFieldHint] = useState("");
  const [exampleValue, setExampleValue] = useState("");
  const [checklist, setChecklist] = useState<string[]>([]);
  const [startError, setStartError] = useState("");

  const start = async () => {
    setLoading(true);
    setStartError("");
    try {
      const res = await startTaxBuddyLive();
      setState(res.state);
      setMessages([{ role: "assistant", content: res.assistant_text }]);
      setFieldName(res.field_name);
      setFieldHint(res.field_hint);
      setExampleValue(res.example_value);
      setChecklist(res.quick_checklist || []);
      setInput("");
    } catch (error: any) {
      const msg = error?.message || "Unable to start live coach.";
      setStartError(msg);
      toast({ title: "Live coach failed", description: msg, variant: "destructive" });
    }
    setLoading(false);
  };

  const send = async () => {
    if (!state || !input.trim() || loading) return;
    const message = input.trim();
    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setInput("");
    setLoading(true);
    try {
      const res = await sendTaxBuddyLiveMessage(message, state);
      setState(res.state);
      setMessages((prev) => [...prev, { role: "assistant", content: res.assistant_text }]);
      setFieldName(res.field_name);
      setFieldHint(res.field_hint);
      setExampleValue(res.example_value);
      setChecklist(res.quick_checklist || []);
    } catch (error: any) {
      toast({ title: "Message failed", description: error.message, variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <div className="container py-8 max-w-4xl space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-1">TaxBuddy Live ITR Coach</h1>
          <p className="text-muted-foreground text-lg">Real-time field-by-field guidance for first-time ITR filers</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2"><Brain className="h-5 w-5" /> Live Filing Session</CardTitle>
            <CardDescription>Assistant explains what to fill in each portal field before moving ahead.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {state && (
              <div className="rounded-lg border p-3 bg-muted/40 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">Current Portal Field</p>
                  {state.itr_form && <Badge>{state.itr_form}</Badge>}
                </div>
                <p className="text-sm text-foreground">{fieldName || "-"}</p>
                <p className="text-xs text-muted-foreground">{fieldHint || "-"}</p>
                <p className="text-xs text-muted-foreground">Example: {exampleValue || "-"}</p>
              </div>
            )}

            <div className="max-h-[420px] overflow-y-auto space-y-3 pr-1">
              {messages.length === 0 && (
                <div className="text-sm text-muted-foreground border rounded-lg p-3">Start the session to begin live filing guidance.</div>
              )}

              {startError && (
                <div className="text-sm border border-destructive/30 bg-destructive/10 rounded-lg p-3 text-destructive">
                  {startError}
                </div>
              )}
              {messages.map((m, idx) => (
                <div key={idx} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[88%] rounded-xl p-3 text-sm whitespace-pre-wrap ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    {m.role === "assistant" && <MessageCircleMore className="h-3.5 w-3.5 mb-1 opacity-70" />}
                    {m.content}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={state?.completed ? "Session complete" : "Type value for current field..."}
                disabled={loading || !state || state.completed}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    send();
                  }
                }}
              />
              <Button onClick={send} disabled={loading || !state || state.completed || !input.trim()}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>

            <div className="flex gap-2">
              <Button onClick={start} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />} Start Live Coach
              </Button>
            </div>
          </CardContent>
        </Card>

        {checklist.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Filing Completion Checklist</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-1 list-disc pl-5">
                {checklist.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TaxBuddyLive;
