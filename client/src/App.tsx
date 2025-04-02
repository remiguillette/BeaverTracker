import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import DocumentView from "@/pages/DocumentView";
import Header from "@/components/layout/Header";
import AuditLogModal from "@/components/modals/AuditLogModal";
import ImportDocumentModal from "@/components/modals/ImportDocumentModal";
import ShareDocumentModal from "@/components/modals/ShareDocumentModal";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/document/:id" component={DocumentView} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1">
          <Router />
        </main>
        <div className="token-watermark text-gray-400 text-opacity-50 text-xs fixed bottom-5 left-0 w-full text-center z-10 pointer-events-none">
          TOKEN: DOC-20230615-142532-f8e2c74a9b3d1e5f
        </div>
      </div>
      <Toaster />
      <AuditLogModal />
      <ImportDocumentModal />
      <ShareDocumentModal />
    </QueryClientProvider>
  );
}

export default App;
