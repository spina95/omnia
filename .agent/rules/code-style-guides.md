---
trigger: always_on
---

- Write clean, idiomatic Angular + TypeScript code using the latest best practices.
- Use standalone components and avoid deprecated Angular APIs.
- Use strict typing everywhere (no implicit any, avoid type assertions unless strictly necessary).
- Organize the project with a clear and scalable folder structure (core, features, shared).
- Use Spartan NG components where appropriate for UI elements (buttons, forms, layout, navigation).
- Use Tailwind CSS utility classes for spacing, layout, and responsive design.
- Implement a consistent dark, minimalist theme (avoid hard-coded colors scattered in many files; centralize theme tokens as much as possible).
- Make all authenticated routes protected with Angular route guards that check Supabase auth state.
- Keep all Supabase configuration in environment/config files and never hard-code secrets in components.
- Add concise comments and/or JSDoc for services and non-trivial logic to explain intent.
- Prefer small, focused components over large, monolithic ones.
- Ensure the UI is responsive and works on both desktop and mobile (test at common breakpoints).
- Follow accessibility best practices (semantic HTML, sensible aria attributes, keyboard navigation where relevant).
- Handle errors gracefully (e.g. show user-friendly error messages on login failure).
- Keep dependencies minimal and avoid unnecessary libraries beyond Angular, Spartan NG, Tailwind, and Supabase.