# Project Documentation

## Sections
- Hooks: `./hooks/README.md`
- Utils & Validation: `./utils/README.md`
- Components: `./components/README.md`

## Quickstart
- Include the app-level toaster once: `import { Toaster } from "@/components/ui/toaster";` and render `<Toaster />` near your root.
- Use `useSecureAuth()` to gate routes and fetch profile/admin status.
- Use `cn()` from `@/lib/utils` to compose Tailwind classes.

## Contributing
- Keep examples minimal and copy-pastable.
- When adding new public exports, add a subsection under the relevant area and link it here.
