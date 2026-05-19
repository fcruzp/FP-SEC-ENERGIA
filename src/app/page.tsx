'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import SiteHeader from '@/components/portal/SiteHeader';
import MobileNav from '@/components/portal/MobileNav';
import About from '@/components/portal/About';
import Leadership from '@/components/portal/Leadership';
import Areas from '@/components/portal/Areas';
import Observatory from '@/components/portal/Observatory';
import News from '@/components/portal/News';
import Documents from '@/components/portal/Documents';
import Events from '@/components/portal/Events';
import Multimedia from '@/components/portal/Multimedia';
import Subscribe from '@/components/portal/Subscribe';
import SiteFooter from '@/components/portal/SiteFooter';
import AnimationObserver from '@/components/portal/AnimationObserver';

// Dynamic import for Hero since it uses Three.js (loaded from CDN)
const Hero = dynamic(() => import('@/components/portal/Hero'), { ssr: false });

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  return (
    <>
      <AnimationObserver />
      <MobileNav isOpen={isMenuOpen} onClose={closeMenu} />
      <SiteHeader onMenuToggle={toggleMenu} isMenuOpen={isMenuOpen} />
      <Hero />
      <About />
      <Leadership />
      <Areas />
      <Observatory />
      <News />
      <Documents />
      <Events />
      <Multimedia />
      <Subscribe />
      <SiteFooter />
    </>
  );
}
