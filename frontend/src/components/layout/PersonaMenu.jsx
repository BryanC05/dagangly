import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { X, Home, ShoppingCart, User, MapPin, Wallet, LayoutDashboard, PlusCircle, LogOut } from "lucide-react";
import { useAuthStore, useCartStore } from "@/store/authStore";

const PersonaMenu = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { getTotalItems } = useCartStore();
  const [hoveredIdx, setHoveredIdx] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const cartCount = getTotalItems();
  const isSeller = user?.isSeller || false;

  const menuItems = [
    { label: "HOME", path: "/", icon: Home, color: "bg-primary" },
    { label: "PRODUCTS", path: "/products", icon: ShoppingCart, color: "bg-white text-black" },
    { label: "MAP / NEARBY", path: "/nearby", icon: MapPin, color: "bg-primary" },
    { label: "WALLET", path: "/wallet", icon: Wallet, color: "bg-white text-black" },
    ...(isSeller ? [
      { label: "DASHBOARD", path: "/seller/dashboard", icon: LayoutDashboard, color: "bg-primary" },
      { label: "ADD PRODUCT", path: "/seller/add-product", icon: PlusCircle, color: "bg-white text-black" }
    ] : []),
    { label: "MY CART", path: "/cart", icon: ShoppingCart, badge: cartCount, color: "bg-primary" },
    { label: "PROFILE", path: "/profile", icon: User, color: "bg-white text-black" },
  ];

  const handleNavigate = (path) => {
    navigate(path);
    onClose();
  };

  const handleLogoutClick = () => {
    logout();
    handleNavigate("/");
  };

  return (
    <div className="fixed inset-0 z-[10000] flex flex-col justify-between overflow-hidden bg-black text-white font-mono select-none animate-in fade-in zoom-in-95 duration-200">
      
      {/* Persona 5 Strikers Animated Background Slashes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Dynamic Slanted Theme Bar */}
        <div className="absolute -left-10 top-0 w-[60%] h-full bg-primary -skew-x-[20deg] transform origin-top-left transition-all duration-700 opacity-90 border-r-8 border-white shadow-[10px_0_30px_hsl(var(--primary)/0.5)]" />
        
        {/* Secondary White Sharp Slash */}
        <div className="absolute left-[50%] -top-20 w-[12%] h-[150%] bg-white -skew-x-[20deg] transform opacity-20" />
        
        {/* Shadowed Dark Slash */}
        <div className="absolute left-[40%] -bottom-20 w-[8%] h-[150%] bg-neutral-900 -skew-x-[20deg] transform opacity-80" />

        {/* Floating Star Patterns */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent animate-pulse" />
        
        {/* Grid Overlay */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
            backgroundSize: "20px 20px"
          }}
        />

        {/* Star Elements */}
        <div className="absolute top-[15%] right-[20%] text-primary animate-spin duration-1000">
          <svg className="w-16 h-16 fill-current" viewBox="0 0 24 24">
            <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.786 1.4 8.168L12 18.896l-7.334 3.867 1.4-8.168L.132 9.21l8.2-1.192z"/>
          </svg>
        </div>
        <div className="absolute bottom-[20%] left-[8%] text-white opacity-40 animate-bounce">
          <svg className="w-12 h-12 fill-current" viewBox="0 0 24 24">
            <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.786 1.4 8.168L12 18.896l-7.334 3.867 1.4-8.168L.132 9.21l8.2-1.192z"/>
          </svg>
        </div>
      </div>

      {/* Top Header Row */}
      <div className="relative z-10 flex items-center justify-between p-6 md:p-10">
        <div className="flex items-center gap-4">
          <div className="bg-primary text-white font-extrabold text-2xl md:text-3xl px-6 py-2 -skew-x-12 border-2 border-white shadow-[4px_4px_0px_#000]">
            DAGANGLY
          </div>
          <span className="text-xs tracking-[0.2em] font-semibold text-neutral-400 hidden sm:inline-block">
            SYSTEM // INFILTRATION_MENU
          </span>
        </div>

        {/* Back / Close button in pure Persona style */}
        <button 
          onClick={onClose}
          className="group relative flex items-center justify-center bg-white text-black font-extrabold text-lg px-6 py-3 -skew-x-12 border-2 border-black hover:bg-primary hover:text-white transition-colors duration-200 shadow-[4px_4px_0px_hsl(var(--primary))] cursor-pointer"
        >
          <span className="inline-block skew-x-12">CLOSE [Esc]</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 flex flex-1 flex-col md:flex-row items-center justify-between px-6 md:px-20 py-4 max-h-[80vh] overflow-y-auto">
        {/* Left Side: Dynamic Character & User Profile Info */}
        <div className="w-full md:w-[45%] flex flex-col justify-center mb-10 md:mb-0">
          {isAuthenticated ? (
            <div className="relative border-4 border-white bg-black p-6 -skew-x-6 shadow-[8px_8px_0px_hsl(var(--primary))] max-w-sm">
              <div className="absolute -top-4 -left-4 bg-primary text-white text-xs font-black px-3 py-1 uppercase tracking-widest border border-white">
                Active Phantom
              </div>
              <h2 className="text-3xl font-black tracking-tighter text-white mb-1">
                {user?.name?.toUpperCase() || "PHANTOM"}
              </h2>
              <p className="text-primary font-extrabold tracking-widest text-xs mb-4">
                ROLE // {isSeller ? "SELLER" : "BUYER"}
              </p>
              
              <div className="space-y-2 text-xs font-mono text-neutral-300">
                <div className="flex justify-between border-b border-neutral-800 pb-1">
                  <span>EMAIL:</span>
                  <span className="text-white font-bold">{user?.email}</span>
                </div>
                <div className="flex justify-between border-b border-neutral-800 pb-1">
                  <span>STATUS:</span>
                  <span className="text-green-500 font-black animate-pulse">ONLINE</span>
                </div>
              </div>

              <button
                onClick={handleLogoutClick}
                className="mt-6 w-full flex items-center justify-center gap-2 bg-neutral-900 text-white font-extrabold text-sm py-2 px-4 border border-neutral-700 hover:bg-primary hover:border-white transition-colors duration-150"
              >
                <LogOut className="w-4 h-4" />
                LOGOUT SYSTEM
              </button>
            </div>
          ) : (
            <div className="relative border-4 border-dashed border-primary p-8 -skew-x-6 max-w-sm">
              <h2 className="text-2xl font-black text-primary mb-2">NOT AUTHENTICATED</h2>
              <p className="text-neutral-400 text-xs mb-6 leading-relaxed">
                Connect your account to save products, register as a seller, and access personal phantom dashboards.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => handleNavigate("/")} 
                  className="flex-1 bg-white text-black font-extrabold text-sm py-2 px-4 border-2 border-black -skew-x-6 hover:bg-primary hover:text-white transition-all shadow-[4px_4px_0px_hsl(var(--primary))]"
                >
                  ENTER GATE
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: The Slanted Persona 5 Strikers Nav Menu */}
        <div className="w-full md:w-[50%] flex flex-col items-end justify-center pr-2 md:pr-10">
          <div className="flex flex-col gap-4 w-full max-w-md">
            {menuItems.map((item, idx) => {
              const isHovered = hoveredIdx === idx;
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="relative cursor-pointer transition-transform duration-150"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onClick={() => handleNavigate(item.path)}
                  style={{
                    transform: isHovered 
                      ? `translateX(-16px) scale(1.05) skewX(-12deg)` 
                      : `skewX(-12deg)`,
                  }}
                >
                  {/* Backdrop Slanted Shape when Hovered */}
                  <div 
                    className={`absolute inset-0 transition-opacity duration-150 bg-primary -z-10 ${
                      isHovered ? "opacity-100 scale-105" : "opacity-0"
                    }`}
                    style={{
                      clipPath: "polygon(0 0, 100% 0, 95% 100%, 5% 100%)",
                    }}
                  />

                  {/* Main Menu Button */}
                  <div
                    className={`flex items-center justify-between px-6 py-4 border-2 transition-colors duration-150 ${
                      isHovered 
                        ? "bg-white text-black border-white shadow-[-8px_8px_0px_rgba(0,0,0,0.8)]" 
                        : "bg-black text-white border-white"
                    }`}
                  >
                    <div className="flex items-center gap-4 skew-x-12">
                      <Icon className={`w-5 h-5 ${isHovered ? "text-primary" : "text-white"}`} />
                      <span className="font-extrabold tracking-wider text-lg sm:text-xl">
                        {item.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 skew-x-12">
                      {item.badge > 0 && (
                        <span className="bg-primary text-white font-extrabold text-xs px-2.5 py-0.5 rounded-full animate-bounce">
                          {item.badge}
                        </span>
                      )}
                      <span className="text-xs opacity-50 font-mono">
                        {`0${idx + 1}`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer System Status Banner */}
      <div className="relative z-10 w-full bg-primary text-black py-2 px-6 flex justify-between items-center -skew-y-1 transform origin-bottom border-t-2 border-white shadow-[0_-4px_15px_hsl(var(--primary)/0.3)]">
        <div className="font-extrabold text-xs tracking-[0.3em] text-white flex items-center gap-4">
          <span>COOPERATIVE PHANTOMS // ACTIVE</span>
          <span className="inline-block w-2 h-2 rounded-full bg-white animate-ping" />
        </div>
        <div className="font-extrabold text-xs text-white">
          SYS_STATUS_OK
        </div>
      </div>
    </div>
  );
};

export default PersonaMenu;
