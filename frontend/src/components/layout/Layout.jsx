import Navbar from "./Navbar";
import Footer from "./Footer";
import AnimatedOutlet from "./AnimatedOutlet";
import AuthModal from "../ui/AuthModal";
import { Toaster } from "@/components/ui/sonner";

const Layout = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground overflow-x-clip">
      <Toaster richColors position="top-center" />
      <Navbar />
      <main id="main-content" className="flex-1 w-full overflow-hidden pb-16 lg:pb-0" role="main" aria-label="Main content">
        <AnimatedOutlet />
      </main>
      <Footer />
      <AuthModal />
    </div>
  );
};

export default Layout;
