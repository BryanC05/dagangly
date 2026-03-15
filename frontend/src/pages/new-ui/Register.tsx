import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";

export default function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"buyer" | "seller">("buyer");
  const [loading, setLoading] = useState(false);

  const handleClose = () => navigate("/");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    // TODO: wire to Go backend api.auth.register()
    setTimeout(() => setLoading(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <button onClick={handleClose} className="absolute top-4 right-4 text-white hover:text-gray-300 p-2">
        <X className="h-6 w-6" />
      </button>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm p-4"
      >
        <div className="endfield-card bg-card p-8">
          <div className="text-center mb-8">
            <h1 className="font-display text-2xl font-bold tracking-wide">Daftar</h1>
            <p className="text-sm text-muted-foreground mt-1">Buat akun baru</p>
          </div>

          {/* Role toggle */}
          <div className="flex rounded-sm overflow-hidden border border-border mb-6">
            {(["buyer", "seller"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`flex-1 py-2 text-sm font-display tracking-wide transition-colors
                  ${role === r ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`}
              >
                {r === "buyer" ? "Pembeli" : "Penjual"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Nama Lengkap</Label>
              <Input id="name" placeholder="Nama lengkap" required className="bg-surface" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Email</Label>
              <Input id="email" type="email" placeholder="nama@email.com" required className="bg-surface" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Password</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" required className="bg-surface pr-10" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {role === "seller" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 pt-2 border-t border-border"
              >
                <div className="space-y-2">
                  <Label htmlFor="business" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Nama Usaha</Label>
                  <Input id="business" placeholder="Nama toko / usaha" className="bg-surface" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">No. Telepon</Label>
                  <Input id="phone" type="tel" placeholder="08xxxxxxxxxx" className="bg-surface" />
                </div>
              </motion.div>
            )}

            <Button type="submit" className="w-full font-display tracking-wide" disabled={loading}>
              {loading ? "Memproses..." : "Daftar"}
              {!loading && <ArrowRight className="h-4 w-4 ml-1" />}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Sudah punya akun?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Masuk
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
