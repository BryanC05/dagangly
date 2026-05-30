import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/utils/api";
import { useAuthStore, USE_FIREBASE_AUTH } from "@/store/authStore";
import { useAuthModalStore } from "@/store/authModalStore";
import { signInWithGoogle, signInWithFirebaseEmail, registerWithFirebaseEmail } from "@/utils/firebase";

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
    setLoading(true);
    setError("");

    try {
      let token, user;

      if (mode === 'login') {
        if (!email || !password) throw new Error("Please enter email and password.");
        const response = await api.post('/auth/login', { email, password });
        token = response?.data?.token;
        user = response?.data?.user;
      } else {
        if (!email || !password || !name) throw new Error("Please fill all fields.");
        const response = await api.post('/auth/register', { 
          name, email, password, phone: '0000000000', isSeller: false 
        });
        token = response?.data?.token;
        user = response?.data?.user;
      }

      if (!token || typeof token !== "string" || token.split(".").length !== 3) {
        throw new Error("Invalid authentication token received");
      }

      setAuth(user, token);
      handleClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || `${mode === 'login' ? 'Login' : 'Registration'} failed.`);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      const idToken = await signInWithGoogle();
      const response = await api.post('/auth/social-login', { idToken });
      const token = response?.data?.token;
      const user = response?.data?.user;

      if (!token) throw new Error("Invalid authentication token received");

      setAuth(user, token);
      handleClose();
    } catch (err) {
      console.error("Google login error:", err);
      setError(err.response?.data?.message || err.message || 'Google login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="text-center mb-6">
        <h1 className="font-display text-2xl font-bold tracking-wide">
          {mode === 'login' ? 'Login' : 'Register'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {mode === 'login' ? 'Welcome back to Dagangly' : 'Create your Dagangly account'}
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
            <Label htmlFor="name" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Full Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              className="bg-surface"
              required
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
            placeholder="name@example.com"
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
              placeholder="Enter your password"
              required
              className="bg-surface pr-10"
              minLength={mode === 'register' ? 6 : undefined}
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
          {loading ? "Please wait..." : mode === 'login' ? "Login" : "Register"}
          {!loading && <ArrowRight className="h-4 w-4 ml-1" />}
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-muted" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-4 text-muted-foreground">Or connect with</span>
        </div>
      </div>

      <Button 
        variant="outline" 
        type="button" 
        className="w-full h-10 gap-3 bg-surface hover:bg-muted/50 transition-colors border-muted-foreground/20" 
        onClick={handleGoogleLogin}
        disabled={loading}
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.32v2.77h3.57c2.08-3.23 3.28-7.76 3.28-8.1z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        <span className="font-medium text-foreground">Sign {mode === 'login' ? 'in' : 'up'} with Google</span>
      </Button>

      <p className="text-center text-sm text-muted-foreground mt-6">
        {mode === 'login' ? (
          <>
            Don't have an account?{" "}
            <button onClick={() => { setError(""); handleSwitchMode(); }} className="text-primary hover:underline">
              Register
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button onClick={() => { setError(""); handleSwitchMode(); }} className="text-primary hover:underline">
              Login
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

  const handleClose = (e) => {
    if (e && e.preventDefault) e.preventDefault();
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
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-sm p-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={handleClose}
              className="absolute right-6 top-6 z-10 text-muted-foreground hover:text-foreground bg-surface rounded-full p-1 border border-border"
            >
              <X className="w-4 h-4" />
            </button>
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
