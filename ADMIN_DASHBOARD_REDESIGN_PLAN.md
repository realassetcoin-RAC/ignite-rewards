## Admin Dashboard Redesign Plan

### Objectives
- Improve visual clarity and hierarchy
- Make tabs clearly visible and accessible
- Reduce motion/flicker and prevent duplicate notifications
- Establish a consistent design system for admin surfaces

### Immediate Fixes (Done or In-Progress)
- Strengthen tab visibility: contrast, hover, active state borders, and font weight
- Guard stats load and toasts to prevent duplicate warnings
- Prevent repeated verification cycles causing flicker

### UI System
- Colors: elevate `background`, `muted`, and `border` for better contrast
- Typography: use clear sizes and consistent weights (600 for active states)
- Spacing: standardized paddings/margins across cards, tabs, and lists
- Components: reinforce `Tabs`, `Card`, `Alert`, and `Badge` variants

### Navigation and Information Architecture
- Primary tabs: Cards, Merchants, Referrals, Users, Analytics, Health, Settings
- Secondary inline filters/search within each tab to reduce tab sprawl

### Accessibility
- Keyboard navigation: ensure focus outlines and `aria-selected` states
- Contrast ratio: active/inactive tabs >= 4.5:1
- Motion: reduce non-essential animations; keep subtle transitions only

### Empty/Error States
- Clear empty states with actions
- Error boundaries within each tab with retry

### Responsiveness
- Tabs grid responsive: 2/3/7 columns with truncation and icons
- Cards stack on small screens, 2-4 grid on larger screens

### Technical Work Items
- Refactor `ui/tabs.tsx` with improved styles (done)
- Normalize toast usage to prevent duplicates (done in AdminPanel)
- Stabilize `AdminDashboardWrapper` verification triggers (done)
- Extract shared admin layout container and header styles

### Follow-ups
- Convert ad-hoc gradients to standardized decorative style tokens
- Create `AdminLayout` and `AdminHeader` components
- Add visual regression snapshots for tabs and alerts

