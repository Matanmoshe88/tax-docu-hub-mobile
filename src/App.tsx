import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { ContractPage } from "./pages/ContractPage";
import { PromisoaryNotePage } from "./pages/PromisoaryNotePage";
import { SignaturePage } from "./pages/SignaturePage";
import { DocumentsPage } from "./pages/DocumentsPage";
import { FinishPage } from "./pages/FinishPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/:leadId" element={<HomePage />} />
          <Route path="/contract/:leadId" element={<ContractPage />} />
          <Route path="/promissory/:leadId" element={<PromisoaryNotePage />} />
          <Route path="/signature/:leadId" element={<SignaturePage />} />
          <Route path="/documents/:leadId" element={<DocumentsPage />} />
          <Route path="/finish/:leadId" element={<FinishPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
