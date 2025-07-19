import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import Representatives from "@/pages/representatives";
import Settings from "@/pages/settings";
import Demo from "@/pages/demo";
import RemindersPage from "./pages/RemindersPage";
import InvoiceTemplatesPage from "./pages/InvoiceTemplatesPage";
import TelegramInterface from "@/components/telegram-interface";
import RepresentativePortal from "@/pages/representative-portal";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={TelegramInterface} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/representatives" component={Representatives} />
      <Route path="/reminders" component={RemindersPage} />
      <Route path="/invoice-templates" component={InvoiceTemplatesPage} />
      <Route path="/settings" component={Settings} />
      <Route path="/demo" component={Demo} />
      <Route path="/representatives/portal/:username" component={RepresentativePortal} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
