import { useEffect, useRef, useState } from 'react';

/**
 * useAnimatedCounter — Animates a number from 0 to target using RAF.
 * Only starts when element is in viewport (via IntersectionObserver).
 * Uses easeOutExpo for natural deceleration feel.
 * Respects prefers-reduced-motion.
 */
export function useAnimatedCounter(target, options = {}) {
  const { duration = 1500, delay = 0 } = options;
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setCount(target);
      return;
    }

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          observer.unobserve(element);

          const timeout = setTimeout(() => {
            const startTime = performance.now();
            const animate = (currentTime) => {
              const elapsed = currentTime - startTime;
              const progress = Math.min(elapsed / duration, 1);
              // easeOutExpo: fast start, smooth deceleration
              const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
              setCount(Math.round(eased * target));

              if (progress < 1) {
                requestAnimationFrame(animate);
              }
            };
            requestAnimationFrame(animate);
          }, delay);

          return () => clearTimeout(timeout);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [target, duration, delay]);

  return { ref, count };
}
