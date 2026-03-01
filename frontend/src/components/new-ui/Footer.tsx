import { Link } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";

export default function Footer() {
  const { t } = useTranslation();

  const footerLinks = {
    [t("footer.marketplace")]: [
      { label: t("nav.products"), to: "/products" },
      { label: t("nav.nearby"), to: "/nearby" },
      { label: t("footer.categories"), to: "/products" },
    ],
    [t("footer.community")]: [
      { label: t("nav.forums"), to: "/forums" },
      { label: t("footer.chat"), to: "/chat" },
    ],
    [t("footer.sellerSection")]: [
      { label: t("footer.startSelling"), to: "/sell" },
      { label: t("footer.sellerDashboard"), to: "/seller/dashboard" },
    ],
    [t("footer.helpSection")]: [
      { label: t("footer.aboutUs"), to: "#" },
      { label: t("footer.contactUs"), to: "#" },
      { label: t("footer.faq"), to: "#" },
    ],
  };

  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="container py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-sm bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-display font-bold text-lg">M</span>
              </div>
              <span className="font-display text-xl font-bold tracking-wider">
                MART<span className="text-primary">KU</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("footer.tagline")}
            </p>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-display text-sm font-semibold tracking-wider uppercase text-foreground mb-4">
                {title}
              </h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            © 2026 MartKu. All rights reserved.
          </p>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />
            <span className="text-xs text-muted-foreground font-mono">SYSTEM.ONLINE</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
