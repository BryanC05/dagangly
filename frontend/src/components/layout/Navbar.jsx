import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Search,
  Menu,
  X,
  ShoppingCart,
  User,
  Moon,
  Sun,
  LogOut,
  Package,
  Heart,
  Store,
  PlusCircle,
  LayoutDashboard,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore, useCartStore } from "@/store/authStore";
import { useAuthModalStore } from "@/store/authModalStore";
import { useThemeStore } from "@/store/themeStore";
import { useLanguageStore } from "@/store/languageStore";
import { useTranslation } from "@/hooks/useTranslation";
import api from "@/utils/api";
import NotificationBell from "@/components/NotificationBell";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeOrderCount, setActiveOrderCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  const { user, isAuthenticated, logout } = useAuthStore();
  const { getTotalItems } = useCartStore();
  const { openLogin, openRegister } = useAuthModalStore();
  const { theme, toggleTheme } = useThemeStore();
  const { language, toggleLanguage } = useLanguageStore();
  const { t } = useTranslation();
  const isSeller = user?.isSeller || false;

  const cartCount = getTotalItems();

  useEffect(() => {
    if (!isAuthenticated || !localStorage.getItem("token")) {
      return;
    }
    let isMounted = true;
    api
      .get("/orders/my-orders")
      .then((res) => {
        if (isMounted) {
          const active = (res.data || []).filter((o) => !["delivered", "cancelled"].includes(o.status));
          setActiveOrderCount(active.length);
        }
      })
      .catch(() => {
        if (isMounted) setActiveOrderCount(0);
      });
    return () => { isMounted = false; };
  }, [isAuthenticated, user]);

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const submitSearch = (e) => {
    e.preventDefault();
    const query = search.trim();
    if (!query) { navigate("/products"); return; }
    navigate(`/products?search=${encodeURIComponent(query)}`);
    setMobileOpen(false);
  };

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    navigate("/");
  };

  const navItems = [
    { to: "/", label: t('nav.home') || "Home" },
    { to: "/products", label: t('nav.products') || "Products" },
    { to: "/nearby", label: t('nav.nearby') || "Nearby" },
  ];

  const userMenuItems = [
    { to: "/profile", label: t("nav.profile") || "Profil", icon: User },
    { to: "/orders", label: t("nav.orders") || "Orders", icon: Package, badge: activeOrderCount },
    { to: "/saved-products", label: t("nav.savedProducts") || "Saved", icon: Heart },
    { to: "/wallet", label: t("wallet.title") || "Wallet", icon: Package },
  ];

  const sellerMenuItems = [
    { to: "/seller/dashboard", label: t("nav.dashboard") || "Dashboard", icon: LayoutDashboard },
    { to: "/seller/add-product", label: t("nav.addProduct") || "Add Product", icon: PlusCircle },
  ];

  return (
    <>
      <header className="sticky top-0 z-[9990] border-b border-border/70 bg-background/88 backdrop-blur-2xl">
        <div className="container flex h-16 items-center gap-3">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-primary to-emerald-400 shadow-[0_8px_20px_-12px_hsl(var(--primary))]">
              <span className="text-primary-foreground font-display font-bold text-base">D</span>
            </div>
            <span className="hidden sm:block font-display text-lg font-bold tracking-wider leading-none">
              Dagang<span className="text-primary">ly</span>
            </span>
          </Link>

          <form onSubmit={submitSearch} className="hidden flex-1 md:block max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("nav.searchPlaceholder") || "Cari produk UMKM..."}
                className="h-9 rounded-full border-border/70 bg-muted/70 pl-9 pr-20 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Button type="submit" size="sm" className="absolute right-1 top-1/2 h-7 -translate-y-1/2 rounded-full px-3 text-xs">
                Cari
              </Button>
            </div>
          </form>

          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  isActive(item.to)
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1 ml-auto">
            <NotificationBell />

            <Button variant="ghost" size="icon" asChild className={`relative ${isActive('/cart') ? 'text-primary' : ''}`}>
              <Link to="/cart">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </Link>
            </Button>

            <Button variant="ghost" size="sm" onClick={toggleLanguage} className="text-xs font-semibold min-w-[36px]">
              {language === 'en' ? 'EN' : 'ID'}
            </Button>

            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>

            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>

            <div className="hidden lg:flex items-center gap-2">
              {isAuthenticated ? (
                <>
                  {isSeller && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                          <Store className="h-3.5 w-3.5" />
                          {t("nav.sellerMenu") || "Seller"}
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuLabel className="text-xs">{t("nav.sellerMenu") || "Seller Tools"}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {sellerMenuItems.map((item) => (
                          <DropdownMenuItem key={item.to} onClick={() => navigate(item.to)}>
                            <item.icon className="h-4 w-4 mr-2" />
                            {item.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" className="gap-1.5 text-xs">
                        <User className="h-3.5 w-3.5" />
                        {user?.name?.split(" ")[0] || t("nav.myAccount")}
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuLabel className="text-xs">{t("nav.myAccount")}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {userMenuItems.map((item) => (
                        <DropdownMenuItem key={item.to} onClick={() => navigate(item.to)}>
                          <item.icon className="h-4 w-4 mr-2" />
                          {item.label}
                          {item.badge > 0 && (
                            <span className="ml-auto text-[10px] bg-primary text-primary-foreground rounded-full h-4 min-w-4 px-1 flex items-center justify-center font-bold">
                              {item.badge > 9 ? "9+" : item.badge}
                            </span>
                          )}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                        <LogOut className="h-4 w-4 mr-2" />
                        {t("nav.logout")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" className="text-xs" onClick={openLogin}>
                    {t("nav.login") || "Login"}
                  </Button>
                  <Button size="sm" className="text-xs" onClick={openRegister}>
                    {t("nav.register") || "Register"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="fixed top-0 bottom-0 right-0 z-[9999] w-72 max-w-[85vw] bg-card border-l border-border p-5 pb-12 overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <span className="font-display text-base font-bold tracking-wider">
                Dagang<span className="text-primary">ly</span>
              </span>
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <form onSubmit={submitSearch} className="relative mb-5">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("nav.searchPlaceholder") || "Cari produk..."}
                className="pl-9 h-9 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </form>

            <nav className="flex flex-col gap-0.5 mb-4">
              {[...navItems, { to: "/cart", label: t("nav.cart") || "Cart" }, { to: "/orders", label: t("nav.orders") || "Orders" }].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={`px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.to)
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {isAuthenticated && (
              <div className="border-t border-border pt-4 mb-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">
                  {t("nav.myAccount")}
                </p>
                <div className="space-y-0.5">
                  {userMenuItems.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                        isActive(item.to)
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  ))}
                </div>
                {isSeller && (
                  <>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-4 px-3">
                      {t("nav.sellerMenu") || "Seller"}
                    </p>
                    <div className="space-y-0.5">
                      {sellerMenuItems.map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                            isActive(item.to)
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          <item.icon className="h-4 w-4" />
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="border-t border-border pt-4">
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={toggleLanguage}>
                  {language.toUpperCase()}
                </Button>
                <Button variant="outline" size="sm" onClick={toggleTheme}>
                  {theme === "light" ? "Dark" : "Light"}
                </Button>
              </div>
              {isAuthenticated ? (
                <Button variant="destructive" size="sm" className="w-full mt-3" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              ) : (
                <div className="flex gap-2 mt-3">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => { openLogin(); setMobileOpen(false); }}>
                    Login
                  </Button>
                  <Button size="sm" className="flex-1" onClick={() => { openRegister(); setMobileOpen(false); }}>
                    Register
                  </Button>
                </div>
              )}
            </div>
          </aside>
        </>
      )}
    </>
  );
};

export default Navbar;
