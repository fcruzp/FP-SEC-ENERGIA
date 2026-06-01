---
Task ID: 1
Agent: Main Agent
Task: Fix Serie Histórica chart - tooltip, reference lines, smart X-axis

Work Log:
- Analyzed user's design reference image showing bar chart with colored year labels, reference lines, and tooltip
- Discovered React Fragment (`<>...</>`) in `commonAxisProps` was preventing Recharts from rendering child components (CartesianGrid, XAxis, YAxis, Tooltip, ReferenceLine)
- Fixed by inlining all chart children directly in each chart type (BarChart, LineChart, AreaChart)
- Fixed `ChartContainer` `aspect-video` class overriding explicit height by adding `!aspect-auto` class
- Fixed reference line labels being clipped at chart right edge by changing position from "right" to "insideTopRight" and increasing right margin to 120px
- Implemented 5-second delayed tooltip using pure CSS animations instead of React state (more reliable with Recharts re-rendering)
- Fixed tooltip delay bug where timer callback reset hoverStartRef causing value to flash and disappear
- Updated X-axis interval calculation for better readability with long data series
- Added Y-axis domain padding (18%) so reference lines are clearly visible within chart bounds
- Added YAxis width={60} for proper label spacing

Stage Summary:
- Chart now renders all elements: CartesianGrid, XAxis with year-colored ticks, YAxis, Tooltip with 5-sec delay, ReferenceLines for max/median
- Tooltip shows "Pasa el cursor para ver el valor" with progress bar for 5 seconds, then reveals value with fade-in animation
- Reference lines show "Máx: [value]" in red and "Medio: [value]" in amber with dashed styling
- X-axis shows year labels in different colors (per-year from YEAR_COLORS palette) with month labels below
- Bar charts color bars per year with the same color palette
- Key fix: React Fragments break Recharts child component detection — must inline children directly
---
Task ID: 1
Agent: Main Agent
Task: Visual improvements to observatorio header - green banner from top, home button in banner, remove duplicate

Work Log:
- Analyzed current ObservatorioHeader structure: white sticky header with h-14 top bar containing "Observatorio Energético" link (left) and "Portal" home link (right), plus breadcrumbs and optional title/description
- Redesigned ObservatorioHeader to be a thin dark green strip (h-10, bg-[#0a2e19]) with Home/Portal button on the left and breadcrumbs on the right
- Removed the duplicate "Observatorio Energético" link from the header since it's already shown in the green hero banner
- Removed title/description/icon props from ObservatorioHeader (pages handle their own titles)
- Updated main observatorio page: removed redundant breadcrumb href, removed "Volver al Portal" footer link (now in header)
- Updated category page: removed title/description/icon props from ObservatorioHeader usage
- Indicator detail page: already compatible (only used breadcrumbs prop)
- Verified tooltip delay was already changed from 5s to 1s (done in previous session)
- Build succeeded with no new errors

Stage Summary:
- ObservatorioHeader is now a compact dark green nav strip that seamlessly blends with the hero banner on the main page
- The green banner now starts from the very top of the page (no white header gap)
- Home/Portal button is inside the green header
- Duplicate "Observatorio Energético" text link removed
- Changes applied to all observatorio routes consistently

---
Task ID: 2
Agent: Main Agent
Task: Fix breadcrumbs visibility and reduce hero banner height

Work Log:
- Diagnosed breadcrumb visibility issue: shadcn Breadcrumb component uses `text-muted-foreground` and `text-foreground` CSS vars that resolve to gray/black on dark background, making breadcrumbs invisible
- Replaced shadcn Breadcrumb with custom breadcrumb using plain HTML + Lucide ChevronRight icons, with explicit white color classes that work on dark green background
- Layout: Home/Portal button → ChevronRight separator → breadcrumb items flowing naturally, all in one row at text-sm size
- Reduced hero section vertical padding from `py-12 sm:py-16` to `py-6 sm:py-8`
- Reduced hero heading from `text-3xl/4xl/5xl` to `text-2xl/3xl/4xl`
- Reduced hero paragraph from `text-base/lg` to `text-sm`, margin from `mb-8` to `mb-5`
- Reduced stat icons from w-9/h-9 to w-8/h-8, stat values from `text-xl` to `text-lg`
- Reduced badge icon from w-10/h-10 to w-8/h-8
- Reduced main content padding from `py-10` to `py-6`

Stage Summary:
- Breadcrumbs now visible with white text on dark green header across all routes
- Hero banner is roughly 50% shorter vertically, allowing KPI cards to be visible without scrolling
- Consistent navigation pattern: 🏠 Portal > Observatorio > [Category] > [Indicator]
