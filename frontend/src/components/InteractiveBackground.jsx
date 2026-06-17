import { useEffect, useState, useRef } from 'react';
import { useAccessibilityStore } from '../store/accessibilityStore';

// ─── Layer 1: Persona 5 Strikers Animated Background ───
const PersonaBackground = () => (
    <div
        className="absolute inset-0 pointer-events-none z-[-2] overflow-hidden"
        aria-hidden="true"
    >
        <style>{`
            @keyframes floatDiagonal {
                0% { transform: translate(0, 0) rotate(-12deg); }
                50% { transform: translate(15px, -15px) rotate(-10deg); }
                100% { transform: translate(0, 0) rotate(-12deg); }
            }
            @keyframes floatDiagonalOpposite {
                0% { transform: translate(0, 0) rotate(15deg); }
                50% { transform: translate(-20px, 10px) rotate(13deg); }
                100% { transform: translate(0, 0) rotate(15deg); }
            }
            .persona-bg {
                position: absolute;
                inset: 0;
                background-color: #FACC15; /* P4G Yellow */
                background-image: 
                    linear-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(0, 0, 0, 0.05) 1px, transparent 1px),
                    radial-gradient(rgba(0, 0, 0, 0.12) 1.5px, transparent 1.5px);
                background-size: 24px 24px, 24px 24px, 24px 24px;
                background-position: 0 0, 0 0, 12px 12px;
            }
            .dark .persona-bg {
                background-color: #0a0a0c; /* dark charcoal */
                background-image: 
                    linear-gradient(rgba(250, 204, 21, 0.06) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(250, 204, 21, 0.06) 1px, transparent 1px),
                    radial-gradient(rgba(250, 204, 21, 0.15) 1.5px, transparent 1.5px);
                background-size: 24px 24px, 24px 24px, 24px 24px;
                background-position: 0 0, 0 0, 12px 12px;
            }
            .slash-panel-1 {
                position: absolute;
                top: -10%;
                left: -15%;
                width: 50%;
                height: 120%;
                background: #FACC15; /* P4G Yellow */
                transform: rotate(-12deg);
                opacity: 0.75;
                box-shadow: 10px 0px 0px #000;
                animation: floatDiagonal 20s ease-in-out infinite;
            }
            .dark .slash-panel-1 {
                background: #ea580c; /* Orange */
                box-shadow: 10px 0px 0px #000;
                opacity: 0.25;
            }
            .slash-panel-2 {
                position: absolute;
                bottom: -20%;
                right: -10%;
                width: 35%;
                height: 90%;
                background: #F97316; /* P4G Orange */
                transform: rotate(15deg);
                opacity: 0.75;
                box-shadow: -5px -5px 0px #000;
                animation: floatDiagonalOpposite 25s ease-in-out infinite;
            }
            .dark .slash-panel-2 {
                background: #111;
                box-shadow: -5px -5px 0px #ea580c;
                opacity: 0.8;
            }
            .slash-stripe {
                position: absolute;
                top: 30%;
                right: 20%;
                width: 15%;
                height: 150%;
                background: repeating-linear-gradient(
                    45deg,
                    #FACC15,
                    #FACC15 8px,
                    transparent 8px,
                    transparent 16px
                );
                transform: rotate(-15deg);
                opacity: 0.25;
            }
            .dark .slash-stripe {
                background: repeating-linear-gradient(
                    45deg,
                    #ea580c,
                    #ea580c 8px,
                    transparent 8px,
                    transparent 16px
                );
                opacity: 0.12;
            }
        `}</style>
        <div className="persona-bg">
            <div className="slash-panel-1" />
            <div className="slash-panel-2" />
            <div className="slash-stripe" />
        </div>
    </div>
);

// ─── Main: Mouse spotlight + ★ cursor trail + cart/particle burst ───
const InteractiveBackground = () => {
    const [isClient, setIsClient] = useState(false);
    const containerRef = useRef(null);
    const reducedMotion = useAccessibilityStore((state) => state.reducedMotion);

    useEffect(() => {
        setIsClient(true);

        // Disable particle effects on mobile or when reduced motion is preferred
        const isMobile = window.matchMedia('(max-width: 768px)').matches || 'ontouchstart' in window;
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (isMobile || prefersReducedMotion || reducedMotion) return;

        const spawnBurst = (x, y, icons, count = 12, velocityRange = 300) => {
            const colors = ['#FACC15', '#F97316', '#000000', '#FFFFFF'];
            for (let i = 0; i < count; i++) {
                const particle = document.createElement('div');
                const shape = icons[Math.floor(Math.random() * icons.length)];
                const color = colors[Math.floor(Math.random() * colors.length)];
                
                particle.textContent = shape;

                particle.style.cssText = `
                    position: fixed;
                    left: ${x}px;
                    top: ${y}px;
                    color: ${color};
                    font-size: ${24 + Math.random() * 24}px;
                    pointer-events: none;
                    user-select: none;
                    z-index: 9999;
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(0.3);
                    text-shadow: ${color === '#000000' ? '1px 1px 0px #fff, -1px -1px 0px #fff' : '1px 1px 0px #000'};
                    transition: transform 1.4s cubic-bezier(0.1, 0.8, 0.2, 1), opacity 1.4s ease-out;
                `;
                document.body.appendChild(particle);

                const angle = Math.random() * Math.PI * 2;
                const vel = 80 + Math.random() * velocityRange;
                const dx = Math.cos(angle) * vel;
                const dy = Math.sin(angle) * vel - (50 + Math.random() * 100);
                const rot = (Math.random() - 0.5) * 720;

                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        particle.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${rot}deg) scale(1.2)`;
                        particle.style.opacity = '0';
                    });
                });

                setTimeout(() => {
                    if (particle.parentNode === document.body) document.body.removeChild(particle);
                }, 1400);
            }
        };

        const handleCartBurst = (e) => {
            const { x, y } = e.detail || {};
            if (!x || !y) return;
            spawnBurst(x, y, ['★', '◆', '▲', '■', '⚡', '🛒', '🛍️'], 15, 260);
        };

        const handleParticleBurst = (e) => {
            const { type, x, y } = e.detail || {};
            if (!x || !y) return;
            if (type === 'add-to-cart') {
                spawnBurst(x, y, ['★', '◆', '▲', '■', '⚡', '🛒', '🛍️'], 20, 280);
            } else if (type === 'save') {
                spawnBurst(x, y, ['★', '◆', '▲', '■', '⚡', '❤️', '💖'], 18, 240);
            }
        };

        window.addEventListener('trigger-cart-burst', handleCartBurst);
        window.addEventListener('particle-burst', handleParticleBurst);

        return () => {
            window.removeEventListener('trigger-cart-burst', handleCartBurst);
            window.removeEventListener('particle-burst', handleParticleBurst);
        };
    }, [reducedMotion]);

    if (!isClient) return null;

    return (
        <>
            {/* Persona custom background panels */}
            <PersonaBackground />

            {/* Particle container */}
            <div
                ref={containerRef}
                className="interactive-bg-container pointer-events-none fixed inset-0 z-0 overflow-hidden"
                aria-hidden="true"
            />
        </>
    );
};

export default InteractiveBackground;
