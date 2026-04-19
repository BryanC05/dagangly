import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/utils/api";
import { useAuthStore } from "@/store/authStore";
import { useAuthModalStore } from "@/store/authModalStore";

const AuthFormContent = ({ mode, handleClose, handleSwitchMode }) => {
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === 'login') {
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
        handleClose();
      } catch (err) {
        setError(err.response?.data?.message || err.message || "Login failed.");
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(true);
      setTimeout(() => setLoading(false), 1500);
    }
  };

  return (
    <>
      <div className="text-center mb-6">
        <h1 className="font-display text-2xl font-bold tracking-wide">
          {mode === 'login' ? 'Masuk' : 'Daftar'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {mode === 'login' ? 'Selamat datang kembali' : 'Buat akun baru'}
        </p>
      </div>

      {error && (
        <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md mb-6 border border-destructive/20 text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'register' && (
          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Nama Lengkap</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama lengkap"
              className="bg-surface"
            />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Email</Label>
          <Input
            id="email"
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
          {loading ? "Memproses..." : mode === 'login' ? "Masuk" : "Daftar"}
          {!loading && <ArrowRight className="h-4 w-4 ml-1" />}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        {mode === 'login' ? (
          <>
            Belum punya akun?{" "}
            <button onClick={() => { setError(""); handleSwitchMode(); }} className="text-primary hover:underline">
              Daftar
            </button>
          </>
        ) : (
          <>
            Sudah punya akun?{" "}
            <button onClick={() => { setError(""); handleSwitchMode(); }} className="text-primary hover:underline">
              Masuk
            </button>
          </>
        )}
      </p>
    </>
  );
};

export default function AuthModal() {
  const navigate = useNavigate();
  const { isOpen, mode, closeModal, switchMode, redirectTo } = useAuthModalStore();

  const handleClose = () => {
    closeModal();
    if (redirectTo) {
      navigate(redirectTo);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="w-full max-w-sm p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="endfield-card bg-card p-8">

              <AuthFormContent mode={mode} handleClose={handleClose} handleSwitchMode={switchMode} />
            </div>

            <div className="flex justify-center mt-4 gap-1">
              <div className="w-1 h-1 rounded-full bg-primary/40" />
              <div className="w-1 h-1 rounded-full bg-primary/20" />
              <div className="w-1 h-1 rounded-full bg-primary/10" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
