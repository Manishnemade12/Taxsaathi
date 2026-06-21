import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Onboarding from "./pages/Onboarding";
import Documents from "./pages/Documents";
import TaxAnalysis from "./pages/TaxAnalysis";
import TaxBuddy from "./pages/TaxBuddy";
import TaxBuddyLive from "./pages/TaxBuddyLive";
import Schemes from "./pages/Schemes";
import TaxSummary from "./pages/TaxSummary";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/tax-analysis" element={<TaxAnalysis />} />
          <Route path="/taxbuddy" element={<TaxBuddy />} />
          <Route path="/taxbuddy-live" element={<TaxBuddyLive />} />
          <Route path="/schemes" element={<Schemes />} />
          <Route path="/tax-summary" element={<TaxSummary />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
