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
    <footer className="border-t border-border bg-card mt-auto">
      <div className="container py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-sm bg-primary flex items-center justify-center">
                <Store className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-display text-2xl font-bold tracking-wider">
                Dagang<span className="text-primary">ly</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
              Dagangly - Indonesian MSME Marketplace. Connecting local sellers with nearby buyers through a modern shopping experience.
            </p>
            <div className="flex items-center gap-3 mt-4 text-muted-foreground">
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
              <h4 className="font-display text-sm font-semibold tracking-wider uppercase text-foreground mb-4">
                {title}
              </h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Dagangly. All rights reserved.
          </p>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />
            <span className="text-xs text-muted-foreground font-mono">SYSTEM.ONLINE</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
