import { Link, useLocation } from "react-router-dom";
import { Store, Facebook, Instagram, Mail, CircleHelp } from "lucide-react";

const footerLinks = {
  Marketplace: [
    { label: "Products", to: "/products" },
    { label: "Nearby Sellers", to: "/nearby" },
    { label: "Cart", to: "/cart" },
  ],
  Community: [
    { label: "Forum", to: "/forums" },
    { label: "Messages", to: "/chat" },
    { label: "Notifications", to: "/notifications" },
  ],
  Seller: [
    { label: "Start Selling", to: "/sell" },
    { label: "Seller Dashboard", to: "/seller/dashboard" },
    { label: "Add Product", to: "/seller/add-product" },
  ],
};

const Footer = () => {
  const location = useLocation();

  if (
    location.pathname.startsWith("/chat") ||
    location.pathname === "/login" ||
    location.pathname === "/register"
  ) {
    return null;
  }

  return (
    <footer className="border-t-4 border-primary bg-black text-white mt-auto persona-slash">
      <div className="container py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-8">
          <div className="col-span-2 md:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-6 group">
              <div className="relative w-10 h-10 bg-primary flex items-center justify-center border-2 border-white shadow-[2px_2px_0_#000] -skew-x-12 transition-transform group-hover:scale-105">
                <Store className="h-5.5 w-5.5 text-white skew-x-12" />
              </div>
              <span className="font-display text-2xl font-black tracking-tighter uppercase italic">
                DAGANG<span className="bg-primary text-white px-1.5 py-0.5 -skew-x-12 inline-block font-black">LY</span>
              </span>
            </Link>
            <p className="text-sm text-neutral-400 leading-relaxed max-w-md">
              Dagangly - Indonesian MSME Marketplace. Connecting local sellers with nearby buyers through a modern shopping experience.
            </p>
            <div className="flex items-center gap-3 mt-4 text-neutral-400">
              <a href="#" className="hover:text-primary transition-colors" aria-label="Facebook">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="#" className="hover:text-primary transition-colors" aria-label="Instagram">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="#" className="hover:text-primary transition-colors" aria-label="Email">
                <Mail className="h-4 w-4" />
              </a>
              <a href="#" className="hover:text-primary transition-colors" aria-label="Help">
                <CircleHelp className="h-4 w-4" />
              </a>
            </div>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-display text-sm font-black tracking-widest uppercase text-primary mb-4">
                {title}
              </h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className="text-sm text-neutral-400 hover:text-white transition-colors hover:underline decoration-primary decoration-2">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-neutral-800 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider">
            © {new Date().getFullYear()} DAGANGLY. ALL RIGHTS RESERVED.
          </p>
          <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 px-3 py-1 -skew-x-6">
            <div className="w-2 h-2 bg-primary animate-pulse skew-x-6" />
            <span className="text-xs text-white font-mono font-black tracking-widest skew-x-6">SYSTEM.ONLINE</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
