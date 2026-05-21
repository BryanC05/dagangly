import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BarcodeScanner = ({ onClose, onScan }) => {
  const scannerRef = useRef(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Ensure the container element is ready before mounting the scanner
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scanner.render(
      (decodedText) => {
        scanner.clear();
        if (onScan) {
          onScan(decodedText);
        } else {
          // Default behavior: navigate to products page and execute search
          navigate(`/products?search=${encodeURIComponent(decodedText)}`);
          onClose();
        }
      },
      (err) => {
        // Ignore continuous empty/failed scan errors as they are expected while focusing
      }
    );

    scannerRef.current = scanner;

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(e => console.error("Failed to clear scanner", e));
      }
    };
  }, [onClose, onScan, navigate]);

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
          <h3 className="font-semibold text-lg">Scan Barcode</h3>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-muted text-muted-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4">
          <div id="qr-reader" className="w-full overflow-hidden rounded-lg [&_video]:w-full [&_video]:rounded-lg"></div>
          <p className="text-center text-sm text-muted-foreground mt-4">
            Point your device camera at a barcode or QR code to find the product.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;