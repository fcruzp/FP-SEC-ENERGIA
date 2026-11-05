'use client';

import { useCallback, useState } from 'react';
import SiteHeader from '@/components/portal/SiteHeader';
import SiteFooter from '@/components/portal/SiteFooter';
import MobileNav from '@/components/portal/MobileNav';

/** Encabezado, menú móvil y pie del portal para páginas internas. */
export default function PortalShell({ children }: { children: React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const toggleMenu = useCallback(() => setIsMenuOpen((p) => !p), []);
  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  return (
    <>
      <MobileNav isOpen={isMenuOpen} onClose={closeMenu} />
      <SiteHeader onMenuToggle={toggleMenu} isMenuOpen={isMenuOpen} />
      {children}
      <SiteFooter />
    </>
  );
}
