import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Search, Menu, X, ShoppingCart, User, MapPin, Bell,
  Moon, Sun, Languages, Store, LogOut, Package, Heart,
  BarChart3, PlusCircle, ChevronDown,
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
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore, useCartStore } from "@/store/authStore";
import { useThemeStore } from "@/store/themeStore";
import { useLanguageStore } from "@/store/languageStore";
import { useTranslation } from "@/hooks/useTranslation";
import api from "@/utils/api";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeOrderCount, setActiveOrderCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  const { user, isAuthenticated, logout } = useAuthStore();
  const { getTotalItems } = useCartStore();
  const { theme, toggleTheme } = useThemeStore();
  const { language, toggleLanguage } = useLanguageStore();
  const { t } = useTranslation();

  const isSeller = true;
  const cartCount = getTotalItems();

  const navLinks = [
    { to: "/", label: t("nav.home") },
    { to: "/products", label: t("nav.products") },
    { to: "/nearby", label: t("nav.nearby"), icon: MapPin },
    { to: "/forums", label: t("nav.forums") },
  ];

  useEffect(() => {
    if (isAuthenticated && localStorage.getItem("token")) {
      api
        .get("/orders/my-orders")
        .then((res) => {
          const active = (res.data || []).filter(
            (o: any) => !["delivered", "cancelled"].includes(o.status)
          );
          setActiveOrderCount(active.length);
        })
        .catch(() => setActiveOrderCount(0));
    } else {
      setActiveOrderCount(0);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = search.trim();
    if (!query) {
      navigate("/products");
      return;
    }
    navigate(`/products?search=${encodeURIComponent(query)}`);
    setMobileOpen(false);
  };

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    navigate("/");
  };

  const handleNavigate = (to: string) => {
    navigate(to);
  };

  const accountLinks = [
    { to: "/profile", label: t("nav.profile"), icon: User },
    { to: "/orders", label: t("nav.orders"), icon: Package, badge: activeOrderCount },
    { to: "/saved-products", label: t("nav.savedProducts"), icon: Heart },
    ...(isSeller
      ? [
        { to: "/seller/dashboard", label: t("nav.dashboard"), icon: Store },
        { to: "/seller/product-tracking", label: t("nav.tracking"), icon: BarChart3 },
        { to: "/seller/add-product", label: t("seller.addProduct"), icon: PlusCircle },
      ]
      : []),
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-sm bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-display font-bold text-lg">M</span>
          </div>
          <span className="font-display text-xl font-bold tracking-wider hidden sm:block">
            MART<span className="text-primary">KU</span>
          </span>
        </Link>

        {/* Search */}
        <form onSubmit={submitSearch} className="flex-1 max-w-md hidden lg:block">
          <div className={`relative transition-all duration-300 ${searchFocused ? "scale-105" : ""}`}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("nav.searchPlaceholder")}
              className="pl-9 bg-card border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
            {searchFocused && (
              <div className="absolute inset-0 -z-10 rounded-md endfield-glow opacity-50" />
            )}
          </div>
        </form>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => {
            const active = isActive(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`relative px-3 py-2 text-sm font-medium transition-colors rounded-sm
                  ${active ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                {link.label}
                {active && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute bottom-0 left-1 right-1 h-0.5 bg-primary"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1 ml-auto">
          {/* Theme toggle (desktop) */}
          <Button variant="ghost" size="icon" className="hidden lg:inline-flex text-muted-foreground hover:text-primary" onClick={toggleTheme} title={theme === "light" ? t("nav.darkMode") : t("nav.lightMode")}>
            {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>

          {/* Language toggle (desktop) */}
          <Button variant="ghost" size="icon" className="hidden lg:inline-flex text-muted-foreground hover:text-primary" onClick={toggleLanguage} title={t("nav.language")}>
            <Languages className="h-4 w-4" />
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" asChild>
            <Link to="/notifications"><Bell className="h-5 w-5" /></Link>
          </Button>

          {/* Cart */}
          <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-primary" asChild>
            <Link to="/cart">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </Link>
          </Button>

          {/* Mobile hamburger */}
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary lg:hidden" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>

          {/* Desktop auth area */}
          <div className="hidden lg:flex items-center gap-2 ml-2">
            {isAuthenticated ? (
              <>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/orders" className="relative">
                    {t("nav.orders")}
                    {activeOrderCount > 0 && (
                      <span className="ml-1 inline-flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">
                        {activeOrderCount > 9 ? "9+" : activeOrderCount}
                      </span>
                    )}
                  </Link>
                </Button>

                {isSeller && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="gap-1.5">
                        <Store className="h-4 w-4" />
                        {t("nav.sellerMenu")}
                        <ChevronDown className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      <DropdownMenuLabel>{t("nav.sellerMenu")}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => handleNavigate("/seller/dashboard")}>
                        <Store className="h-4 w-4 mr-2" />
                        {t("nav.dashboard")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => handleNavigate("/seller/product-tracking")}>
                        <BarChart3 className="h-4 w-4 mr-2" />
                        {t("nav.tracking")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => handleNavigate("/seller/add-product")}>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        {t("seller.addProduct")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" className="font-display tracking-wide gap-1.5">
                      <User className="h-4 w-4" />
                      {user?.name?.split(" ")[0] || t("nav.profile")}
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuLabel>{t("nav.profile")}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => handleNavigate("/profile")}>
                      <User className="h-4 w-4 mr-2" />
                      {t("nav.profile")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleNavigate("/saved-products")}>
                      <Heart className="h-4 w-4 mr-2" />
                      {t("nav.savedProducts")}
                    </DropdownMenuItem>
                    {isSeller && (
                      <DropdownMenuItem onSelect={() => handleNavigate("/seller/add-product")}>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        {t("seller.addProduct")}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={handleLogout} className="text-destructive focus:text-destructive">
                      <LogOut className="h-4 w-4 mr-2" />
                      {t("nav.logout")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" className="text-foreground hover:text-primary" asChild>
                  <Link to="/login">{t("nav.login")}</Link>
                </Button>
                <Button size="sm" className="font-display tracking-wide bg-primary hover:bg-primary/90 text-primary-foreground" asChild>
                  <Link to="/register">{t("nav.register")}</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-0 right-0 z-50 h-full w-80 max-w-[90vw] bg-card border-l border-border p-6 overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <span className="font-display text-lg font-bold tracking-wider">
                  MART<span className="text-primary">KU</span>
                </span>
                <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Mobile search */}
              <form onSubmit={submitSearch} className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("nav.searchPlaceholder")}
                  className="pl-9 bg-surface"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </form>

              {/* Nav links */}
              <nav className="flex flex-col gap-1">
                {navLinks.map((link) => {
                  const active = isActive(link.to);
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-3 rounded-sm text-sm font-medium transition-colors
                        ${active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                    >
                      {link.icon && <link.icon className="h-4 w-4" />}
                      {link.label}
                    </Link>
                  );
                })}
              </nav>

              {/* Authenticated account links */}
              {isAuthenticated && (
                <>
                  <div className="my-4 border-t border-border" />
                  <div className="space-y-1">
                    {accountLinks.map((link) => (
                      <Link
                        key={link.to}
                        to={link.to}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center justify-between px-3 py-3 rounded-sm text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        <span className="flex items-center gap-3">
                          <link.icon className="h-4 w-4" />
                          {link.label}
                        </span>
                        {!!(link as any).badge && (
                          <span className="inline-flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">
                            {(link as any).badge > 9 ? "9+" : (link as any).badge}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                </>
              )}

              {/* Theme / Language toggles */}
              <div className="my-4 border-t border-border" />
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={toggleLanguage} className="gap-2">
                  <Languages className="h-4 w-4" />
                  {language.toUpperCase()}
                </Button>
                <Button variant="outline" onClick={toggleTheme} className="gap-2">
                  {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  {theme === "light" ? t("nav.darkMode") : t("nav.lightMode")}
                </Button>
              </div>

              {/* Auth buttons */}
              <div className="mt-6 flex flex-col gap-2">
                {isAuthenticated ? (
                  <Button variant="destructive" className="w-full gap-2" onClick={handleLogout}>
                    <LogOut className="h-4 w-4" />
                    {t("nav.logout")}
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" className="w-full" asChild>
                      <Link to="/login" onClick={() => setMobileOpen(false)}>{t("nav.login")}</Link>
                    </Button>
                    <Button className="w-full font-display tracking-wide" asChild>
                      <Link to="/register" onClick={() => setMobileOpen(false)}>{t("nav.register")}</Link>
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* Mobile Bottom Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-t border-border pb-safe">
        <div className="flex items-center justify-around h-16 px-2">
          <Link
            to="/"
            onClick={() => setMobileOpen(false)}
            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${isActive("/") ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
          >
            <Store className="h-5 w-5" />
            <span className="text-[10px] font-medium">{t("nav.home")}</span>
          </Link>

          <Link
            to="/products"
            onClick={() => setMobileOpen(false)}
            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${isActive("/products") ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
          >
            <Search className="h-5 w-5" />
            <span className="text-[10px] font-medium">{t("nav.products")}</span>
          </Link>

          <Link
            to="/cart"
            onClick={() => setMobileOpen(false)}
            className={`relative flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${isActive("/cart") ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
          >
            <div className="relative">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">{t("Products.Cart") || "Cart"}</span>
          </Link>

          <button
            onClick={() => {
              if (isAuthenticated) {
                navigate("/profile");
              } else {
                setMobileOpen(true);
              }
            }}
            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${isActive("/profile") ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
          >
            <User className="h-5 w-5" />
            <span className="text-[10px] font-medium">{t("nav.profile")}</span>
          </button>

          {/* Hamburger toggle for extra options (Settings/Language) */}
          <button
            onClick={() => setMobileOpen(true)}
            className="flex flex-col items-center justify-center w-full h-full gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Menu className="h-5 w-5" />
            <span className="text-[10px] font-medium">Menu</span>
          </button>
        </div>
      </div>
    </header >
  );
}
