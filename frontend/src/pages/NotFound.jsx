import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center endfield-gradient px-4">
      <div className="endfield-card bg-card p-10 text-center max-w-md w-full">
        <h1 className="font-display text-5xl font-bold mb-3">404</h1>
        <p className="text-lg text-muted-foreground mb-6">Oops, halaman tidak ditemukan.</p>
        <Link to="/" className="inline-flex items-center justify-center px-4 py-2 rounded-sm bg-primary text-primary-foreground">
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
