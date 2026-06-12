import { useState, useEffect } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import BottomNav from "./BottomNav";
import AnimatedOutlet from "./AnimatedOutlet";
import AuthModal from "../ui/AuthModal";
import { Toaster } from "@/components/ui/sonner";
import OnboardingTour from "../ui/OnboardingTour";
import InteractiveBackground from "@/components/InteractiveBackground";
import PersonaMenu from "./PersonaMenu";

const Layout = () => {
  const [personaMenuOpen, setPersonaMenuOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Toggle when hitting P (case-insensitive) when not typing in input/textarea/select
      if ((e.key === "p" || e.key === "P") && 
          document.activeElement.tagName !== "INPUT" && 
          document.activeElement.tagName !== "TEXTAREA" &&
          document.activeElement.tagName !== "SELECT" &&
          !document.activeElement.isContentEditable) {
        setPersonaMenuOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground overflow-x-clip">
      <InteractiveBackground />
      <Toaster richColors position="top-center" />
      <Navbar onOpenPersonaMenu={() => setPersonaMenuOpen(true)} />
      <main id="main-content" className="flex-1 w-full overflow-hidden pb-16 lg:pb-0" role="main" aria-label="Main content">
        <AnimatedOutlet />
      </main>
      <Footer />
      <BottomNav />
      <AuthModal />
      <OnboardingTour />
      <PersonaMenu isOpen={personaMenuOpen} onClose={() => setPersonaMenuOpen(false)} />
    </div>
  );
};

export default Layout;
