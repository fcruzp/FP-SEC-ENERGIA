---
Task ID: 1
Agent: main
Task: Refactor header with logo and mobile-friendly navigation

Work Log:
- Copied fp-logo.png from /upload/ to /public/ for Next.js serving
- Rewrote SiteHeader.tsx: replaced "FP" badge with actual logo image, added active section tracking, centered nav layout, animated hamburger button
- Rewrote MobileNav.tsx: converted from DOM manipulation to React props (isOpen/onClose), implemented slide-in drawer with overlay, added icons to nav links, active section indicators, CTA buttons section, body scroll lock, Escape key close
- Updated page.tsx: moved mobile nav state management to page level, passed toggle/close callbacks to both SiteHeader and MobileNav
- Updated SiteFooter.tsx: replaced logo-badge with logo image
- Updated globals.css: new header styles (centered nav, animated hamburger X transform, overlay + drawer pattern), responsive breakpoints (1200px for nav hide, 768px for compact header), removed old .mobile-nav full-screen takeover
- Verified build succeeds (next build - compiled successfully)
- Verified dev server returns HTTP 200
- Verified fp-logo.png is accessible at /fp-logo.png

Stage Summary:
- Header now shows real fp-logo.png image in upper-left corner
- Mobile nav uses modern slide-in drawer pattern with overlay backdrop
- Hamburger button animates to X when menu is open
- All nav links show active section highlighting
- Mobile drawer includes icons, CTA buttons, and active indicators
- Body scroll is locked when mobile menu is open
- Escape key closes the mobile menu
- Footer also updated with the real logo image
