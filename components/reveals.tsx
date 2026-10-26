'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
export function Reveals() {
  const path = usePathname();
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const animations = new Set<Animation>();
    const observed = new WeakSet<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            if (!motion.matches && entry.target.animate) {
              const siblings = Array.from(entry.target.parentElement?.children ?? []);
              const index = siblings.indexOf(entry.target);
              const stagger = entry.target.matches(
                '.dish-card,.category,.gallery-tile,.gallery-grid>a',
              )
                ? Math.min(Math.max(index, 0) % 3, 2) * 65
                : 0;
              const animation = entry.target.animate(
                [
                  { opacity: 0.15, transform: 'translateY(22px)' },
                  { opacity: 1, transform: 'translateY(0)' },
                ],
                {
                  duration: 420,
                  delay: stagger,
                  easing: 'cubic-bezier(.2,.7,.2,1)',
                  fill: 'backwards',
                },
              );
              animations.add(animation);
              animation.finished.then(() => animations.delete(animation)).catch(() => {});
            }
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.04, rootMargin: '0px 0px -24px 0px' },
    );
    const scan = () =>
      document
        .querySelectorAll(
          '.section-heading,.story-art,.story-copy,.contact-card,.page-intro,.hero-copy,.hero-visual,.dish-card,.category,.gallery-tile,.gallery-grid>a,.visit>div,[data-scroll-reveal]',
        )
        .forEach((el) => {
          if (!observed.has(el)) {
            observed.add(el);
            observer.observe(el);
          }
        });
    scan();
    const mutations = new MutationObserver(scan);
    const main = document.getElementById('main');
    if (main) mutations.observe(main, { childList: true, subtree: true });
    const stopMotion = () => {
      if (motion.matches) for (const animation of animations) animation.cancel();
    };
    motion.addEventListener('change', stopMotion);
    return () => {
      observer.disconnect();
      mutations.disconnect();
      motion.removeEventListener('change', stopMotion);
      for (const animation of animations) animation.cancel();
    };
  }, [path]);
  return null;
}
