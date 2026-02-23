# Secret Markdown Reader

## Project Overview
Password-protected markdown sharing app. Users upload/paste markdown, get a shareable URL + generated password. Readers decrypt with the password to view rendered markdown. Server never stores plaintext.

## Stack
- **Framework:** Next.js (App Router) + TypeScript (strict)
- **Styling:** Tailwind CSS
- **Crypto:** Node.js `crypto` (AES-256-GCM, PBKDF2)
- **Storage:** File-based JSON or SQLite (MVP)

## Frontend Design Skill
This project uses the `/design-taste-frontend` skill for all UI work. Key settings:
- DESIGN_VARIANCE: 8 (asymmetric layouts, fractional grids)
- MOTION_INTENSITY: 2 (static, CSS hover/active states only, no auto-animations)
- VISUAL_DENSITY: 2 (art gallery mode, generous white space, expensive feel)
- Fonts: Geist + Geist Mono (no Inter, no Serif)
- Colors: Zinc/Slate neutrals + single desaturated accent (no purple/neon)
- Icons: @phosphor-icons/react or @radix-ui/react-icons (no emojis)
- No h-screen (use min-h-[100dvh]), no 3-column card rows, no centered heroes

## Key Conventions
- All interactive components must be isolated `'use client'` leaf components
- Server Components for static layouts only
- Animate only `transform` and `opacity` (never top/left/width/height)
- Always implement loading, empty, and error states
- Use CSS Grid over flexbox percentage math
- Check package.json before importing any 3rd party library
