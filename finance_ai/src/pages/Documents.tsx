import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getDocuments, uploadDocument, deleteDocument, analyzeDocument } from "@/lib/api";
import DashboardNav from "@/components/DashboardNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Trash2, FileText, Brain, Loader2, CheckCircle, AlertCircle, ChevronDown, ChevronUp, Eye } from "lucide-react";

const Documents = () => {
  const { user, loading: authLoading } = useAuth();
  const [documents, setDocuments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchDocuments();
  }, [user]);

  const fetchDocuments = async () => {
    try {
      const data = await getDocuments();
      setDocuments(Array.isArray(data) ? data : []);
    } catch {
      toast({ title: "Error", description: "Failed to fetch documents", variant: "destructive" });
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const allowedTypes = [
      "application/pdf", "image/jpeg", "image/png", "image/webp",
      "text/csv", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel", "text/plain",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({ title: "Invalid file type", description: "Please upload PDF, image, CSV, Excel, or text files.", variant: "destructive" });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 10MB.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      await uploadDocument(file);
      toast({ title: "Uploaded!", description: `${file.name} has been uploaded successfully.` });
      fetchDocuments();
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    }
    setUploading(false);
    e.target.value = "";
  };

  const handleAnalyze = async (doc: any) => {
    setAnalyzing(doc.id);
    try {
      await analyzeDocument(doc.id);
      toast({ title: "Analysis complete!", description: `${doc.file_name} has been analyzed.` });
      fetchDocuments();
    } catch (error: any) {
      toast({ title: "Analysis failed", description: error.message, variant: "destructive" });
    }
    setAnalyzing(null);
  };

  const handleDelete = async (doc: any) => {
    try {
      await deleteDocument(doc.id);
      toast({ title: "Deleted", description: `${doc.file_name} has been removed.` });
      fetchDocuments();
    } catch (error: any) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    }
  };

  const toggleExpanded = (docId: string) => {
    setExpandedDoc((prev) => (prev === docId ? null : docId));
  };

  if (authLoading) return null;

  const statusIcon = (status: string) => {
    switch (status) {
      case "analyzed": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "analyzing": return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      case "error": return <AlertCircle className="h-4 w-4 text-destructive" />;
      default: return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const renderExtractedData = (doc: any) => {
    const data = doc.extracted_data;
    if (!data) return <p className="text-sm text-muted-foreground">No analysis data available.</p>;

    const fmt = (n: number) => `₹${(n || 0).toLocaleString("en-IN")}`;

    // Income fields
    const incomeFields = [
      { key: "gross_salary", label: "Gross Salary" },
      { key: "hra_received", label: "HRA Received" },
      { key: "lta_received", label: "LTA Received" },
      { key: "other_income", label: "Other Income" },
    ].filter((f) => data[f.key] && data[f.key] > 0);

    // Deduction fields
    const deductionFields = [
      { key: "deductions_80c", label: "Section 80C" },
      { key: "deductions_80d", label: "Section 80D (Health)" },
      { key: "deductions_80e", label: "Section 80E (Education)" },
      { key: "deductions_80g", label: "Section 80G (Donations)" },
      { key: "deductions_nps", label: "NPS (80CCD)" },
      { key: "professional_tax", label: "Professional Tax" },
    ].filter((f) => data[f.key] && data[f.key] > 0);

    // TDS
    const tdsDeducted = data.tds_deducted || 0;

    return (
      <div className="space-y-4">
        {/* Document Info */}
        <div className="flex flex-wrap gap-2 items-center">
          {data.document_type && (
            <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-md">{data.document_type}</span>
          )}
          {data.financial_year && (
            <span className="text-xs font-medium bg-secondary/10 text-secondary px-2 py-1 rounded-md">FY {data.financial_year}</span>
          )}
          {data.employer_name && (
            <span className="text-xs text-muted-foreground">Employer: <strong>{data.employer_name}</strong></span>
          )}
        </div>

        {/* Income Breakdown */}
        {incomeFields.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Income</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {incomeFields.map((f) => (
                <div key={f.key} className="p-2 rounded-lg bg-green-500/5 border border-green-200/30">
                  <p className="text-xs text-muted-foreground">{f.label}</p>
                  <p className="text-sm font-bold text-green-700 dark:text-green-400">{fmt(data[f.key])}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Deductions Breakdown */}
        {deductionFields.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Deductions</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {deductionFields.map((f) => (
                <div key={f.key} className="p-2 rounded-lg bg-blue-500/5 border border-blue-200/30">
                  <p className="text-xs text-muted-foreground">{f.label}</p>
                  <p className="text-sm font-bold text-blue-700 dark:text-blue-400">{fmt(data[f.key])}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TDS */}
        {tdsDeducted > 0 && (
          <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-200/30">
            <p className="text-xs text-muted-foreground">TDS Already Deducted</p>
            <p className="text-lg font-bold text-amber-700 dark:text-amber-400">{fmt(tdsDeducted)}</p>
          </div>
        )}

        {/* Key Findings */}
        {data.key_findings && data.key_findings.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Key Findings</p>
            <ul className="space-y-1">
              {data.key_findings.map((finding: string, i: number) => (
                <li key={i} className="text-sm text-foreground flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{finding}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <div className="container py-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold text-foreground mb-1">Documents</h1>
          <p className="text-muted-foreground text-lg mb-8">Upload and analyze your tax documents</p>
        </motion.div>

        {/* Upload area */}
        <Card className="mb-8">
          <CardContent className="p-8 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-display font-semibold text-lg mb-2">Upload a Document</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Upload Form 16, salary slips, investment proofs, or other tax documents.
            </p>
            <label className="cursor-pointer">
              <Input
                type="file"
                className="hidden"
                onChange={handleUpload}
                disabled={uploading}
                accept=".pdf,.jpg,.jpeg,.png,.webp,.csv,.xlsx,.xls,.txt"
              />
              <Button disabled={uploading} asChild>
                <span>
                  {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                  {uploading ? "Uploading..." : "Choose File"}
                </span>
              </Button>
            </label>
          </CardContent>
        </Card>

        {/* Document list */}
        <div className="grid gap-4">
          {documents.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No documents uploaded yet. Upload your first tax document to get started.
              </CardContent>
            </Card>
          ) : (
            documents.map((doc) => (
              <motion.div key={doc.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
                <Card className={expandedDoc === doc.id ? "border-primary/30" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {statusIcon(doc.status)}
                        <div>
                          <p className="font-medium text-foreground text-sm">{doc.file_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(doc.file_size / 1024).toFixed(1)} KB · {doc.status}
                            {doc.extracted_data?.document_type && ` · ${doc.extracted_data.document_type}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {doc.status === "analyzed" && doc.extracted_data && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleExpanded(doc.id)}
                            className="gap-1"
                          >
                            <Eye className="h-4 w-4" />
                            {expandedDoc === doc.id ? "Hide" : "View Summary"}
                            {expandedDoc === doc.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </Button>
                        )}
                        {doc.status === "uploaded" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAnalyze(doc)}
                            disabled={analyzing === doc.id}
                          >
                            {analyzing === doc.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <><Brain className="h-4 w-4 mr-1" /> Analyze</>
                            )}
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(doc)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    {/* Expandable analysis summary */}
                    <AnimatePresence>
                      {expandedDoc === doc.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-4 pt-4 border-t border-border/50">
                            {renderExtractedData(doc)}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Documents;
