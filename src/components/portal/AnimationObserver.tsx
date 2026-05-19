'use client';

import { useEffect } from 'react';

export default function AnimationObserver() {
  useEffect(() => {
    // Global Intersection Observer for fade-up animations
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');

          // Animate counters
          (e.target as HTMLElement).querySelectorAll('.counter').forEach(el => {
            const target = parseFloat((el as HTMLElement).dataset.val || '0');
            if ((el as HTMLElement).dataset.animated) return;
            (el as HTMLElement).dataset.animated = '1';
            const isFloat = String(target).includes('.');
            const duration = 1500;
            const start = performance.now();
            function update(now: number) {
              const progress = Math.min((now - start) / duration, 1);
              const ease = 1 - Math.pow(1 - progress, 3);
              const val = target * ease;
              el.textContent = isFloat ? val.toFixed(1) : Math.floor(val).toLocaleString();
              if (progress < 1) requestAnimationFrame(update);
            }
            requestAnimationFrame(update);
          });

          // Animate hero stat counters
          (e.target as HTMLElement).querySelectorAll('[data-count]').forEach(el => {
            if ((el as HTMLElement).dataset.animated) return;
            (el as HTMLElement).dataset.animated = '1';
            const target = parseInt((el as HTMLElement).dataset.count || '0');
            const duration = 2000;
            const start = performance.now();
            function update(now: number) {
              const p = Math.min((now - start) / duration, 1);
              el.textContent = Math.floor(target * (1 - Math.pow(1 - p, 3))).toLocaleString();
              if (p < 1) requestAnimationFrame(update);
            }
            requestAnimationFrame(update);
          });

          // Trigger KPI bars
          (e.target as HTMLElement).querySelectorAll('.kpi-bar-fill').forEach(el => {
            (el as HTMLElement).style.width = (el as HTMLElement).dataset.pct + '%';
          });

          // Trigger chart bars
          if ((e.target as HTMLElement).querySelector('.chart-bar')) {
            document.querySelectorAll('.chart-bar').forEach(bar => {
              setTimeout(() => { (bar as HTMLElement).style.height = (bar as HTMLElement).dataset.h; }, 200);
            });
          }
        }
      });
    }, { threshold: 0.1 });

    // Observe all fade-up elements
    document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));

    // Stagger delays
    document.querySelectorAll('.fade-up').forEach((el, i) => {
      (el as HTMLElement).style.transitionDelay = (i % 4) * 0.08 + 's';
    });

    // Also observe elements added after initial render (for dynamic content)
    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node instanceof HTMLElement) {
            if (node.classList.contains('fade-up')) {
              observer.observe(node);
            }
            node.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
          }
        });
      });
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  return null;
}
