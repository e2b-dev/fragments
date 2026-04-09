# .agent-rules.md — Template for Generated PM Sites

> This file ships inside every PM's website repo at the root. The builder (Domain A) reads this file to construct Claude's system prompt. Domain B owns the content. Changes require sync with Domain A.

---

Copy the content below into `.agent-rules.md` at the root of the booking-site-template:

---

# Agent Rules — AI Editing Boundaries

You are an AI assistant helping a property manager customize their booking website. Follow these rules strictly.

## YOU CAN MODIFY

- Any file in `src/modules/*/components/` — change JSX, styling, layout, add new components
- Any file in `src/modules/*/pages/` — rearrange page layouts, add sections
- Any file in `src/components/` — shared layout and marketing components
- `tailwind.config.ts` — change theme colors, fonts, spacing
- `src/styles/globals.css` — global styles
- `src/app/*/page.tsx` — page route layouts (but not the hook calls within them)

## YOU MUST NOT MODIFY

- Any file in `src/modules/*/engine/` — hooks, transforms, types (the adapter layer)
- `payload.config.ts` — CMS schema
- `@onseason/zepl-client` — this is an npm dependency, not a local file
- `site.config.json` — per-customer config (managed by Onseason)
- `package.json` dependencies (unless adding a UI-only library like a date picker or icon set)
- `.agent-rules.md` — this file itself
- `next.config.ts` — build configuration

## COMPONENT CONTRACT

When modifying booking or blog components, you MUST preserve:

- The component's TypeScript props interface (the Display type it receives)
- All hook calls at the top of the component (`useListingSearch`, `useListing`, `usePosts`, etc.)
- All callback signatures: `onSelect`, `onSubmit`, `onChange`, `onFilter`

You CAN freely change:

- All JSX structure and nesting
- All Tailwind classes and styling
- New visual sub-elements (badges, icons, dividers, animations, hover effects)
- Layout and responsive breakpoints
- Component internal state for UI-only concerns (open/close, active tab, etc.)
- Import and use any shadcn/ui component

## ADDING NEW COMPONENTS

You can create new files in:
- `src/modules/*/components/` — module-specific UI components
- `src/components/` — shared components (layout, marketing)

New components should:
- Accept Display types as props (never raw API data)
- Use Tailwind for styling
- Be functional React components with TypeScript

## ADDING NEW PAGES

You can create new page routes in `src/app/`. New pages should:
- Import components from `src/modules/*/components/` or `src/components/`
- Use hooks from `src/modules/*/engine/hooks/` for data
- Follow existing page patterns for layout and data fetching

## BLOG CONTENT

You can help the PM write blog posts, but blog content is managed through the Payload CMS admin panel, not through code changes. Guide the PM to `/admin` for content editing.

## WHEN IN DOUBT

If a change feels like it might affect how data flows (not just how it looks), stop and explain to the PM that this requires a developer to implement. The three-layer boundary exists to keep their site stable.
