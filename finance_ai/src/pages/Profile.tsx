import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { updateProfile, getDocuments } from "@/lib/api";
import DashboardNav from "@/components/DashboardNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Loader2, Save, FileText } from "lucide-react";

const Profile = () => {
  const { user, profile, loading, refetchProfile } = useAuth();
  const [name, setName] = useState("");
  const [employment, setEmployment] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [taxRegime, setTaxRegime] = useState("");
  const [saving, setSaving] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);

  useEffect(() => {
    if (profile) {
      setName(profile.full_name || "");
      setEmployment(profile.employment_type || "");
      setAgeGroup(profile.age_group || "");
      setTaxRegime(profile.tax_regime || "");
    }
  }, [profile]);

  useEffect(() => {
    if (user) {
      getDocuments().then((data) => {
        setDocuments(Array.isArray(data) ? data.slice(0, 5) : []);
      }).catch(() => { });
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({
        full_name: name,
        employment_type: employment,
        age_group: ageGroup,
        tax_regime: taxRegime,
      });
      toast({ title: "Profile updated", description: "Your changes have been saved." });
      refetchProfile();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setSaving(false);
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <div className="container py-8 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold text-foreground mb-1">Profile</h1>
          <p className="text-muted-foreground text-lg mb-8">Manage your account settings</p>
        </motion.div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="font-display">Personal Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={user?.email || ""} disabled className="bg-muted/50" />
              </div>
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="employment">Employment Type</Label>
                <Select value={employment} onValueChange={setEmployment}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="salaried">Salaried</SelectItem>
                    <SelectItem value="self-employed">Self Employed</SelectItem>
                    <SelectItem value="business">Business Owner</SelectItem>
                    <SelectItem value="freelancer">Freelancer</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="age">Age Group</Label>
                <Select value={ageGroup} onValueChange={setAgeGroup}>
                  <SelectTrigger><SelectValue placeholder="Select age group" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="below-60">Below 60 years</SelectItem>
                    <SelectItem value="60-80">60 to 80 years</SelectItem>
                    <SelectItem value="above-80">Above 80 years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="regime">Tax Regime</Label>
                <Select value={taxRegime} onValueChange={setTaxRegime}>
                  <SelectTrigger><SelectValue placeholder="Select regime" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="old">Old Regime</SelectItem>
                    <SelectItem value="new">New Regime</SelectItem>
                    <SelectItem value="not-sure">Not Sure</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Changes
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="font-display">Recent Documents</CardTitle></CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <p className="text-muted-foreground text-sm">No documents uploaded yet.</p>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{doc.file_name}</p>
                        <p className="text-xs text-muted-foreground">{doc.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
