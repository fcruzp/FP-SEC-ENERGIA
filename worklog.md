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
