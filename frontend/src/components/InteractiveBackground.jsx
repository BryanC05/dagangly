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
                background-color: #f7f7f7;
                background-image: radial-gradient(rgba(0,102,255,0.1) 1px, transparent 1px);
                background-size: 24px 24px;
            }
            .dark .persona-bg {
                background-color: #050505;
                background-image: radial-gradient(rgba(230,0,18,0.15) 1px, transparent 1px);
                background-size: 24px 24px;
            }
            .slash-panel-1 {
                position: absolute;
                top: -10%;
                left: -15%;
                width: 50%;
                height: 120%;
                background: #0066FF;
                transform: rotate(-12deg);
                opacity: 0.85;
                box-shadow: 10px 0px 0px #000;
                animation: floatDiagonal 20s ease-in-out infinite;
            }
            .dark .slash-panel-1 {
                background: #E60012;
                box-shadow: 10px 0px 0px #fff;
                opacity: 0.35;
            }
            .slash-panel-2 {
                position: absolute;
                bottom: -20%;
                right: -10%;
                width: 35%;
                height: 90%;
                background: #000;
                transform: rotate(15deg);
                opacity: 0.9;
                box-shadow: -5px -5px 0px #0066FF;
                animation: floatDiagonalOpposite 25s ease-in-out infinite;
            }
            .dark .slash-panel-2 {
                background: #111;
                box-shadow: -5px -5px 0px #E60012;
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
                    #0066FF,
                    #0066FF 8px,
                    transparent 8px,
                    transparent 16px
                );
                transform: rotate(-15deg);
                opacity: 0.15;
            }
            .dark .slash-stripe {
                background: repeating-linear-gradient(
                    45deg,
                    #E60012,
                    #E60012 8px,
                    transparent 8px,
                    transparent 16px
                );
                opacity: 0.08;
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

        let rafId;
        let lastSpawnTime = 0;

        const handleMouseMove = (e) => {
            if (rafId) cancelAnimationFrame(rafId);

            rafId = requestAnimationFrame(() => {
                const now = Date.now();
                // Spawn a particle every ~100ms
                if (now - lastSpawnTime > 100 && containerRef.current) {
                    lastSpawnTime = now;

                    const particle = document.createElement('div');
                    
                    const shapes = ['★', '◆', '▲', '■', '⚡', '★', '◆'];
                    const isDark = document.documentElement.classList.contains('dark');
                    const colors = [isDark ? '#E60012' : '#0066FF', '#000000', '#FFFFFF'];
                    const shape = shapes[Math.floor(Math.random() * shapes.length)];
                    const color = colors[Math.floor(Math.random() * colors.length)];
                    
                    particle.textContent = shape;
                    particle.style.position = 'absolute';
                    particle.style.left = `${e.clientX}px`;
                    particle.style.top = `${e.clientY}px`;
                    particle.style.fontSize = `${14 + Math.random() * 18}px`;
                    particle.style.pointerEvents = 'none';
                    particle.style.userSelect = 'none';
                    particle.style.zIndex = '50';
                    particle.style.color = color;
                    
                    // Style with outline to ensure visibility
                    particle.style.textShadow = color === '#000000'
                        ? '1px 1px 0px #fff, -1px -1px 0px #fff'
                        : '1px 1px 0px #000';

                    const angle = Math.random() * Math.PI * 2;
                    const velocity = 40 + Math.random() * 100;
                    const dx = Math.cos(angle) * velocity;
                    const dy = Math.sin(angle) * velocity + Math.random() * 60;
                    const rotation = (Math.random() - 0.5) * 360;

                    particle.style.transition = 'transform 1s cubic-bezier(0.1, 0.8, 0.3, 1), opacity 1s ease-out';
                    particle.style.transform = 'translate(-50%, -50%) scale(0.5)';
                    particle.style.opacity = '0.75';

                    containerRef.current.appendChild(particle);

                    requestAnimationFrame(() => {
                        particle.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${rotation}deg) scale(1.2)`;
                        particle.style.opacity = '0';
                    });

                    setTimeout(() => {
                        if (particle.parentNode === containerRef.current) {
                            containerRef.current.removeChild(particle);
                        }
                    }, 1000);
                }
            });
        };

        const spawnBurst = (x, y, icons, count = 12, velocityRange = 300) => {
            const isDark = document.documentElement.classList.contains('dark');
            const colors = [isDark ? '#E60012' : '#0066FF', '#000000', '#FFFFFF'];
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

        window.addEventListener('mousemove', handleMouseMove, { passive: true });
        window.addEventListener('trigger-cart-burst', handleCartBurst);
        window.addEventListener('particle-burst', handleParticleBurst);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('trigger-cart-burst', handleCartBurst);
            window.removeEventListener('particle-burst', handleParticleBurst);
            if (rafId) cancelAnimationFrame(rafId);
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
