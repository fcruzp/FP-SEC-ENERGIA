'use client';

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

// Dynamic import for Hero since it uses Three.js (loaded from CDN)
const Hero = dynamic(() => import('@/components/portal/Hero'), { ssr: false });

export default function Home() {
  return (
    <>
      <MobileNav />
      <SiteHeader />
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
