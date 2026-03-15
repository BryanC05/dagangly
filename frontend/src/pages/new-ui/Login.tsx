import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import api from "@/utils/api";
import { useAuthStore } from "@/store/authStore";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const handleClose = () => navigate("/");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!email || !password) {
        throw new Error("Tolong isi email dan password.");
      }

      const response = await api.post('/auth/login', { email, password });
      const token = response?.data?.token;
      const user = response?.data?.user;

      if (!token || typeof token !== "string" || token.split(".").length !== 3) {
        throw new Error("Invalid authentication token received");
      }

      setAuth(user, token);
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
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
          <div className="text-center mb-6">
            <h1 className="font-display text-2xl font-bold tracking-wide">Masuk</h1>
            <p className="text-sm text-muted-foreground mt-1">Selamat datang kembali</p>
          </div>

          {error && (
            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md mb-6 border border-destructive/20 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                required
                className="bg-surface"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="bg-surface pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full font-display tracking-wide" disabled={loading}>
              {loading ? "Memproses..." : "Masuk"}
              {!loading && <ArrowRight className="h-4 w-4 ml-1" />}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Belum punya akun?{" "}
            <Link to="/register" className="text-primary hover:underline">
              Daftar
            </Link>
          </p>
        </div>

        {/* Decorative */}
        <div className="flex justify-center mt-4 gap-1">
          <div className="w-1 h-1 rounded-full bg-primary/40" />
          <div className="w-1 h-1 rounded-full bg-primary/20" />
          <div className="w-1 h-1 rounded-full bg-primary/10" />
        </div>
      </motion.div>
    </div>
  );
}
