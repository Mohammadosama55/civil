import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import ProtectedRoute from "@/components/ProtectedRoute";

import Home from "@/pages/home";
import About from "@/pages/about";
import Contact from "@/pages/contact";
import Contributors from "@/pages/contributors";
import Feedback from "@/pages/feedback";
import VotingSystem from "@/pages/voting-system";
import IssueMap from "@/pages/issue-map";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Profile from "@/pages/profile";
import SOS from "@/pages/sos";
import AdminDashboard from "@/pages/admin-dashboard";
import HeatmapPage from "@/pages/HeatmapPage";
import ComplaintDetail from "@/pages/ComplaintDetail";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/contributors" component={Contributors} />
      <Route path="/feedback" component={Feedback} />
      <Route path="/voting-system" component={VotingSystem} />
      <Route path="/issue-map" component={IssueMap} />
      <Route path="/heatmap" component={HeatmapPage} />
      <Route path="/complaints/:id" component={ComplaintDetail} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/profile">
        <ProtectedRoute><Profile /></ProtectedRoute>
      </Route>
      <Route path="/sos" component={SOS} />
      <Route path="/admin">
        <ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
