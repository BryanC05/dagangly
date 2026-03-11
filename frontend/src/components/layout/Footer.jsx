import { Link, useLocation } from "react-router-dom";
import { Store, Facebook, Instagram, Mail, CircleHelp } from "lucide-react";

const footerLinks = {
  Marketplace: [
    { label: "Produk", to: "/products" },
    { label: "Penjual Terdekat", to: "/nearby" },
    { label: "Keranjang", to: "/cart" },
  ],
  Komunitas: [
    { label: "Forum", to: "/forums" },
    { label: "Chat", to: "/chat" },
    { label: "Notifikasi", to: "/notifications" },
  ],
  Penjual: [
    { label: "Mulai Berjualan", to: "/sell" },
    { label: "Dashboard Penjual", to: "/seller/dashboard" },
    { label: "Tambah Produk", to: "/seller/add-product" },
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
                MART<span className="text-primary">KU</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
              Marketplace UMKM Indonesia. Menghubungkan penjual lokal dengan pembeli terdekat melalui pengalaman belanja modern.
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
