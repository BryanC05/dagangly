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
      <header className="sticky top-0 z-[9990] border-b-4 border-black bg-primary text-black shadow-[0_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="container flex h-16 items-center gap-3">
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <div className="relative h-9 w-9 bg-black -skew-x-12 flex items-center justify-center border-2 border-white shadow-[2px_2px_0_#000]">
              <span className="text-white font-display font-black text-lg skew-x-12">D</span>
            </div>
            <span className="hidden sm:inline-flex items-center font-display text-2xl font-black uppercase tracking-tighter leading-none italic text-black">
              <span>DAGANG</span>
              <span className="bg-black text-primary px-1.5 py-0.5 -skew-x-12 inline-block font-black ml-1">
                <span className="skew-x-12 inline-block">LY</span>
              </span>
            </span>
          </Link>

          <form onSubmit={submitSearch} className="hidden flex-1 md:block max-w-sm">
            <div className="relative -skew-x-6 border-2 border-black bg-white shadow-[2px_2px_0_#000] overflow-hidden">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/50 skew-x-6" />
              <input
                type="text"
                placeholder={t("nav.searchPlaceholder") || "Cari produk UMKM..."}
                className="w-full h-9 bg-transparent pl-10 pr-20 text-sm text-black focus:outline-none focus:ring-0 skew-x-6 font-black italic"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="submit" className="absolute right-0 top-0 bottom-0 px-4 text-xs bg-black text-white font-black uppercase hover:bg-neutral-800 transition-colors skew-x-6 flex items-center justify-center">
                CARI
              </button>
            </div>
          </form>

          <nav className="hidden lg:flex items-center gap-2">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`px-4 py-1 text-sm font-black tracking-wider uppercase transition-all -skew-x-12 ${
                  isActive(item.to)
                    ? "text-white bg-black border border-black shadow-[2px_2px_0_#fff]"
                    : "text-black hover:bg-black/10"
                }`}
              >
                <span className="skew-x-12 block">{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 ml-auto">
            <NotificationBell />

            <Button variant="ghost" size="icon" asChild className={`relative text-black hover:bg-black/10 rounded-none ${isActive('/cart') ? 'text-black' : ''}`}>
              <Link to="/cart">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-none bg-black text-[10px] text-primary font-black border border-white">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </Link>
            </Button>

            <Button variant="ghost" size="sm" onClick={toggleLanguage} className="text-black hover:bg-black/10 rounded-none text-xs font-black min-w-[36px]">
              {language === 'en' ? 'EN' : 'ID'}
            </Button>

            <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-black hover:bg-black/10 rounded-none">
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>

            <Button variant="ghost" size="icon" className="lg:hidden text-black hover:bg-black/10 rounded-none" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>

            <div className="hidden lg:flex items-center gap-2">
              {isAuthenticated ? (
                <>
                  {isSeller && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" className="h-9 text-xs font-black italic uppercase border-3 border-black dark:border-[#FACC15] rounded-lg px-4 py-2 bg-transparent text-black hover:bg-black/10 transform -skew-x-12 cursor-pointer transition-all shadow-[2px_2px_0px_0px_#F97316]">
                          <span className="transform skew-x-12 flex items-center gap-1.5">
                            <Store className="h-3.5 w-3.5" />
                            {t("nav.sellerMenu") || "Seller"}
                            <ChevronDown className="h-3.5 w-3.5" />
                          </span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="p-0 bg-transparent border-0 shadow-none overflow-visible">
                        <div className="w-44 bg-white dark:bg-[#1a1505] border-3 border-black dark:border-[#FACC15] rounded-lg shadow-[5px_5px_0px_0px_#F97316] p-1.5 space-y-1 transform -skew-x-6">
                          <DropdownMenuLabel className="text-[10px] font-black text-primary tracking-wider uppercase transform skew-x-6 ml-2">{t("nav.sellerMenu") || "Seller Tools"}</DropdownMenuLabel>
                          <DropdownMenuSeparator className="bg-border/20" />
                          {sellerMenuItems.map((item) => (
                            <DropdownMenuItem 
                              key={item.to} 
                              onClick={() => navigate(item.to)} 
                              className="group cursor-pointer px-2.5 py-2 text-xs font-black italic uppercase rounded-md flex items-center gap-1.5 transition-all transform hover:-translate-x-1 border-2 border-transparent hover:border-black text-black dark:text-foreground hover:bg-[#FACC15] hover:text-black focus:bg-[#FACC15] focus:text-black focus:border-black"
                            >
                              <span className="transform skew-x-6 flex items-center gap-1.5 w-full">
                                <span className="hidden group-hover:inline text-[#F97316] dark:text-black animate-pulse">★</span>
                                <item.icon className="h-4 w-4 shrink-0" />
                                {item.label}
                              </span>
                            </DropdownMenuItem>
                          ))}
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" className="h-9 text-xs font-black italic uppercase border-3 border-black dark:border-[#FACC15] rounded-lg px-4 py-2 bg-black dark:bg-[#F97316] text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-[#EA580C] transform -skew-x-12 cursor-pointer transition-all shadow-[2px_2px_0px_0px_#F97316] dark:shadow-[2px_2px_0px_0px_#FACC15]">
                        <span className="transform skew-x-12 flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5" />
                          {user?.name?.split(" ")[0] || t("nav.myAccount")}
                          <ChevronDown className="h-3.5 w-3.5" />
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="p-0 bg-transparent border-0 shadow-none overflow-visible">
                      <div className="w-44 bg-white dark:bg-[#1a1505] border-3 border-black dark:border-[#FACC15] rounded-lg shadow-[5px_5px_0px_0px_#F97316] p-1.5 space-y-1 transform -skew-x-6">
                        <DropdownMenuLabel className="text-[10px] font-black text-primary tracking-wider uppercase transform skew-x-6 ml-2">{t("nav.myAccount")}</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-border/20" />
                        {userMenuItems.map((item) => (
                          <DropdownMenuItem 
                            key={item.to} 
                            onClick={() => navigate(item.to)} 
                            className="group cursor-pointer px-2.5 py-2 text-xs font-black italic uppercase rounded-md flex items-center gap-1.5 transition-all transform hover:-translate-x-1 border-2 border-transparent hover:border-black text-black dark:text-foreground hover:bg-[#FACC15] hover:text-black focus:bg-[#FACC15] focus:text-black focus:border-black"
                          >
                            <span className="transform skew-x-6 flex items-center gap-1.5 w-full">
                              <span className="hidden group-hover:inline text-[#F97316] dark:text-black animate-pulse">★</span>
                              <item.icon className="h-4 w-4 shrink-0" />
                              {item.label}
                              {item.badge > 0 && (
                                <span className="ml-auto text-[10px] bg-[#FACC15] text-black rounded h-4 min-w-4 px-1.5 flex items-center justify-center font-black border border-black">
                                  {item.badge > 9 ? "9+" : item.badge}
                                </span>
                              )}
                            </span>
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator className="bg-border/20" />
                        <DropdownMenuItem 
                          onClick={handleLogout} 
                          className="group cursor-pointer px-2.5 py-2 text-xs font-black italic uppercase rounded-md flex items-center gap-1.5 transition-all transform hover:-translate-x-1 border-2 border-transparent hover:border-black text-primary hover:bg-[#FACC15] hover:text-black focus:bg-[#FACC15] focus:text-black focus:border-black"
                        >
                          <span className="transform skew-x-6 flex items-center gap-1.5 w-full">
                            <span className="hidden group-hover:inline text-[#F97316] dark:text-black animate-pulse">★</span>
                            <LogOut className="h-4 w-4 shrink-0" />
                            {t("nav.logout")}
                          </span>
                        </DropdownMenuItem>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" className="text-xs text-black hover:bg-black/10 rounded-none font-bold uppercase" onClick={openLogin}>
                    {t("nav.login") || "Login"}
                  </Button>
                  <Button size="sm" className="text-xs bg-black text-white hover:bg-neutral-800 rounded-none border border-black font-bold uppercase shadow-[2px_2px_0px_#fff]" onClick={openRegister}>
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
          <div className="fixed inset-0 z-[9998] bg-black/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="fixed top-0 bottom-0 right-0 z-[9999] w-72 max-w-[85vw] bg-black text-white border-l-4 border-primary p-5 pb-12 overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <span className="font-display text-xl font-black uppercase tracking-wider">
                DAGANG<span className="text-primary">LY</span>
              </span>
              <Button variant="ghost" size="icon" className="text-white hover:bg-neutral-900 rounded-none" onClick={() => setMobileOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <form onSubmit={submitSearch} className="relative mb-6">
              <div className="relative -skew-x-6 border-2 border-white bg-neutral-900">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50 skew-x-6" />
                <input
                  type="text"
                  placeholder={t("nav.searchPlaceholder") || "Cari produk..."}
                  className="w-full pl-9 h-9 bg-transparent text-sm text-white focus:outline-none skew-x-6"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </form>

            <nav className="flex flex-col gap-1.5 mb-6">
              {[...navItems, { to: "/cart", label: t("nav.cart") || "Cart" }, { to: "/orders", label: t("nav.orders") || "Orders" }].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={`px-3 py-2 text-sm font-black uppercase tracking-wider transition-all -skew-x-6 ${
                    isActive(item.to)
                      ? "bg-white text-black shadow-[2px_2px_0_hsl(var(--primary))] border border-black"
                      : "text-white hover:bg-neutral-900 hover:text-primary"
                  }`}
                >
                  <span className="skew-x-6 block">{item.label}</span>
                </Link>
              ))}
            </nav>

            {isAuthenticated && (
              <div className="border-t-2 border-neutral-800 pt-4 mb-6">
                <p className="text-xs font-black text-primary uppercase tracking-widest mb-3 px-3">
                  {t("nav.myAccount")}
                </p>
                <div className="space-y-1.5">
                  {userMenuItems.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-none text-sm font-bold uppercase transition-all -skew-x-6 ${
                        isActive(item.to)
                          ? "bg-primary text-white shadow-[2px_2px_0_#000]"
                          : "text-white hover:bg-neutral-900 hover:text-primary"
                      }`}
                    >
                      <span className="skew-x-6 flex items-center gap-3">
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </span>
                    </Link>
                  ))}
                </div>
                {isSeller && (
                  <>
                    <p className="text-xs font-black text-primary uppercase tracking-widest mb-3 mt-6 px-3">
                      {t("nav.sellerMenu") || "Seller"}
                    </p>
                    <div className="space-y-1.5">
                      {sellerMenuItems.map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2 rounded-none text-sm font-bold uppercase transition-all -skew-x-6 ${
                            isActive(item.to)
                              ? "bg-primary text-white shadow-[2px_2px_0_#000]"
                              : "text-white hover:bg-neutral-900 hover:text-primary"
                          }`}
                        >
                          <span className="skew-x-6 flex items-center gap-3">
                            <item.icon className="h-4 w-4" />
                            {item.label}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="border-t-2 border-neutral-800 pt-4 mt-auto">
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={toggleLanguage} className="border-white text-white hover:bg-white hover:text-black rounded-none -skew-x-6 font-bold">
                  <span className="skew-x-6">{language.toUpperCase()}</span>
                </Button>
                <Button variant="outline" size="sm" onClick={toggleTheme} className="border-white text-white hover:bg-white hover:text-black rounded-none -skew-x-6 font-bold">
                  <span className="skew-x-6">{theme === "light" ? "DARK" : "LIGHT"}</span>
                </Button>
              </div>
              {isAuthenticated ? (
                <Button variant="destructive" size="sm" className="w-full mt-4 bg-primary text-white hover:bg-white hover:text-black rounded-none border border-black font-black uppercase" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              ) : (
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="flex-1 border-white text-white hover:bg-white hover:text-black rounded-none -skew-x-6 font-bold" onClick={() => { openLogin(); setMobileOpen(false); }}>
                    <span className="skew-x-6">LOGIN</span>
                  </Button>
                  <Button size="sm" className="flex-1 bg-primary text-white hover:bg-white hover:text-black rounded-none -skew-x-6 font-bold border border-black shadow-[2px_2px_0_#000]" onClick={() => { openRegister(); setMobileOpen(false); }}>
                    <span className="skew-x-6">REGISTER</span>
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
