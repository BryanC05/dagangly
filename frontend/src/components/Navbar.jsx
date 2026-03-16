import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore, useCartStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { useLanguageStore } from '../store/languageStore';
import { useAccessibilityStore } from '../store/accessibilityStore';
import { useTranslation } from '../hooks/useTranslation';
import { useNotifications } from '../hooks/useNotifications';
import { getBackendUrl } from '../config';
import { MapPin, ShoppingBag, Store, User, LogOut, Sun, Moon, Globe, MessageCircle, Accessibility } from 'lucide-react';
import NotificationBell from './NotificationBell';
import './Navbar.css';
import { useState } from 'react';

function Navbar() {
  const { user, logout } = useAuthStore();
  const { getTotalItems } = useCartStore();
  const { theme, toggleTheme } = useThemeStore();
  const { language, toggleLanguage } = useLanguageStore();
  const { fontSize, setFontSize, reducedMotion, setReducedMotion } = useAccessibilityStore();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const cartItemCount = getTotalItems();
  const [showAccessibilityMenu, setShowAccessibilityMenu] = useState(false);

  useNotifications();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleFontSizeChange = (size) => {
    setFontSize(size);
    const scale = { small: 0.85, medium: 1, large: 1.15, 'extra-large': 1.3 }[size] || 1;
    document.documentElement.style.setProperty('--font-size-scale', scale);
  };

  const handleReducedMotionToggle = () => {
    const newValue = !reducedMotion;
    setReducedMotion(newValue);
    if (newValue) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
  };

  return (
    <>
      <a href="#main-content" className="skip-link">
        {t('accessibility.skipLink')}
      </a>
      <nav className="navbar" role="navigation" aria-label="Main navigation">
        <div className="navbar-brand">
          <Link to="/" aria-label="Dagangly Home">
            <img 
              src={`${getBackendUrl()}/uploads/DaganglyLogo.png`} 
              alt="Dagangly" 
              className="logo-image"
            />
          </Link>
        </div>

        <div className="navbar-links" role="menubar">
          <Link to="/" className="nav-link" role="menuitem">{t('nav.home')}</Link>
          <Link to="/products" className="nav-link" role="menuitem">{t('nav.products')}</Link>
          <Link to="/nearby" className="nav-link" role="menuitem">
            <MapPin size={18} aria-hidden="true" />
            {t('nav.nearby')}
          </Link>
          <Link to="/cart" className="nav-link cart-link" role="menuitem">
            <div className="cart-icon-wrapper">
              <ShoppingBag size={20} aria-hidden="true" />
              {cartItemCount > 0 && <span className="cart-badge" aria-label={`${cartItemCount} items in cart`}>{cartItemCount}</span>}
            </div>
            {t('nav.cart')}
          </Link>
          <Link to="/forum" className="nav-link" role="menuitem">
            <MessageCircle size={18} aria-hidden="true" />
            Forum
          </Link>
        </div>

        <div className="navbar-actions">
          <button 
            onClick={toggleLanguage} 
            className="btn-lang-toggle" 
            aria-label={`Toggle Language. Current: ${language === 'en' ? 'English' : 'Indonesian'}`}
          >
            <Globe size={18} aria-hidden="true" />
            <span>{language.toUpperCase()}</span>
          </button>

          <button onClick={toggleTheme} className="btn-theme-toggle" aria-label={theme === 'light' ? t('nav.darkMode') : t('nav.lightMode')}>
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          <div className="accessibility-menu-wrapper" style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowAccessibilityMenu(!showAccessibilityMenu)} 
              className="btn-accessibility"
              aria-label={t('accessibility.title')}
              aria-expanded={showAccessibilityMenu}
              aria-haspopup="true"
            >
              <Accessibility size={20} aria-hidden="true" />
            </button>
            
            {showAccessibilityMenu && (
              <div 
                className="accessibility-menu" 
                role="menu" 
                aria-label={t('accessibility.title')}
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  padding: '12px',
                  minWidth: '200px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  zIndex: 100,
                }}
              >
                <div style={{ marginBottom: '12px' }}>
                  <label 
                    id="font-size-label" 
                    style={{ 
                      display: 'block', 
                      marginBottom: '8px', 
                      fontWeight: 600,
                      fontSize: '0.875rem'
                    }}
                  >
                    {t('accessibility.fontSize')}
                  </label>
                  <div role="radiogroup" aria-labelledby="font-size-label" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {[
                      { value: 'small', label: t('accessibility.small') },
                      { value: 'medium', label: t('accessibility.medium') },
                      { value: 'large', label: t('accessibility.large') },
                      { value: 'extra-large', label: t('accessibility.extraLarge') },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleFontSizeChange(option.value)}
                        role="radio"
                        aria-checked={fontSize === option.value}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '4px',
                          border: fontSize === option.value 
                            ? '2px solid hsl(var(--primary))' 
                            : '1px solid hsl(var(--border))',
                          background: fontSize === option.value 
                            ? 'hsl(var(--primary) / 0.1)' 
                            : 'transparent',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={reducedMotion}
                      onChange={handleReducedMotionToggle}
                      style={{ width: '16px', height: '16px' }}
                      aria-describedby="reduced-motion-desc"
                    />
                    {t('accessibility.reducedMotion')}
                  </label>
                  <span id="reduced-motion-desc" className="sr-only">
                    {t('accessibility.reducedMotionDesc')}
                  </span>
                </div>
              </div>
            )}
          </div>

          {user ? (
            <>
              {user.role === 'seller' && (
                <Link to="/seller/dashboard" className="btn-seller" role="menuitem">
                  <Store size={18} aria-hidden="true" />
                  {t('nav.dashboard')}
                </Link>
              )}
              <Link to="/orders" className="nav-link" role="menuitem">
                <ShoppingBag size={18} aria-hidden="true" />
                {t('nav.myOrders')}
              </Link>
              <Link to="/chat" className="nav-link" role="menuitem">
                <MessageCircle size={18} aria-hidden="true" />
                Messages
              </Link>
              <NotificationBell />
              <Link to="/profile" className="nav-link" role="menuitem">
                <User size={18} aria-hidden="true" />
                {user.name}
              </Link>
              <button onClick={handleLogout} className="btn-logout" aria-label="Log out">
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-secondary">{t('nav.login')}</Link>
              <Link to="/register" className="btn-primary">{t('nav.register')}</Link>
            </>
          )}
        </div>
      </nav>
    </>
  );
}

export default Navbar;