import Navbar from "./Navbar";
import Footer from "./Footer";
import AnimatedOutlet from "./AnimatedOutlet";
import AuthModal from "../ui/AuthModal";

const Layout = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground overflow-x-clip">
      <Navbar />
      <main className="flex-1 w-full overflow-hidden pb-16 lg:pb-0">
        <AnimatedOutlet />
      </main>
      <Footer />
      <AuthModal />
    </div>
  );
};

export default Layout;
