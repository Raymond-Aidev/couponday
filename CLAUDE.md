# CLAUDE.md - AI Assistant Guide for vite-react

## Project Overview

This is a modern React application built with Vite, TypeScript, and React 18. It's a minimal starter template designed for fast development with Hot Module Replacement (HMR) and strict type checking.

**Project Type:** Frontend Single Page Application (SPA)
**Build Tool:** Vite 5.4.1
**Framework:** React 18.3.1
**Language:** TypeScript 5.5.3
**Package Manager:** npm (assumed from package.json)

## Technology Stack

### Core Dependencies
- **React 18.3.1**: UI library with concurrent features
- **React DOM 18.3.1**: DOM rendering for React

### Development Dependencies
- **Vite 4.3.1**: Fast build tool and dev server
- **TypeScript 5.5.3**: Static type checking
- **ESLint 9.9.0**: Code linting with TypeScript support
- **@vitejs/plugin-react**: Vite plugin for React Fast Refresh

### Linting & Code Quality
- **typescript-eslint**: TypeScript ESLint integration
- **eslint-plugin-react-hooks**: React Hooks rules
- **eslint-plugin-react-refresh**: React Fast Refresh validation
- **@eslint/js**: ESLint JavaScript rules

## Directory Structure

```
vite-react/
├── public/              # Static assets served at root
│   └── vite.svg        # Vite logo
├── src/                # Source code directory
│   ├── assets/         # React component assets
│   │   └── react.svg   # React logo
│   ├── App.tsx         # Main application component
│   ├── App.css         # App component styles
│   ├── main.tsx        # Application entry point
│   ├── index.css       # Global styles
│   └── vite-env.d.ts   # Vite type definitions
├── index.html          # HTML entry point
├── package.json        # Project dependencies and scripts
├── tsconfig.json       # Root TypeScript config (references)
├── tsconfig.app.json   # App TypeScript config
├── tsconfig.node.json  # Node/Vite config TypeScript
├── vite.config.ts      # Vite configuration
├── eslint.config.js    # ESLint configuration
├── .gitignore          # Git ignore patterns
└── README.md           # Project documentation
```

## Key Files and Their Purpose

### Configuration Files

**tsconfig.json** (line 1-7)
- Root TypeScript configuration using project references
- Delegates to `tsconfig.app.json` and `tsconfig.node.json`

**tsconfig.app.json** (lines 1-24)
- TypeScript config for application code
- Target: ES2020 with modern features
- Module resolution: bundler mode
- Strict mode enabled with additional linting checks
- JSX: react-jsx (new JSX transform)
- Includes only `src/` directory

**tsconfig.node.json** (lines 1-22)
- TypeScript config for Node.js tools (Vite config)
- Target: ES2022 with ES2023 libs
- Includes only `vite.config.ts`

**vite.config.ts** (lines 1-7)
- Minimal Vite configuration
- Uses @vitejs/plugin-react for Fast Refresh
- No custom build options or optimizations

**eslint.config.js** (lines 1-28)
- Modern ESLint flat config format
- Extends recommended JS and TypeScript rules
- Ignores `dist/` directory
- Applies to `**/*.{ts,tsx}` files
- Plugins: react-hooks, react-refresh
- ECMAScript version: 2020
- Browser globals enabled

**.gitignore** (lines 1-24)
- Ignores logs, node_modules, dist directories
- Excludes editor files except `.vscode/extensions.json`

### Source Files

**src/main.tsx** (lines 1-10)
- Application entry point
- Renders App component in StrictMode
- Mounts to `#root` element

**src/App.tsx** (lines 1-35)
- Main application component
- Demo counter with useState hook
- Displays Vite and React logos
- Shows HMR instructions

**index.html** (lines 1-13)
- HTML entry point
- Includes root div and module script
- Title: "Vite + React + TS"

## Development Workflows

### Available Scripts

```bash
npm run dev      # Start development server with HMR
npm run build    # Type-check and build for production
npm run lint     # Run ESLint on all files
npm run preview  # Preview production build locally
```

### Development Server
- Command: `npm run dev`
- Vite dev server with Hot Module Replacement
- Fast rebuild times (sub-second)
- Automatic port selection (default 5173)

### Production Build
- Command: `npm run build`
- First runs TypeScript compiler: `tsc -b`
- Then runs Vite build
- Output directory: `dist/`
- Build artifacts are gitignored

### Linting
- Command: `npm run lint`
- Runs ESLint on all TypeScript/TSX files
- Uses flat config format (eslint.config.js)
- Checks React Hooks rules and refresh patterns

## Code Conventions

### TypeScript
- **Strict mode enabled**: All strict checks are on
- **No unused variables**: `noUnusedLocals` and `noUnusedParameters` enabled
- **Explicit types preferred**: Leverages type inference but be explicit when unclear
- **Module resolution**: Uses bundler mode (modern)
- **No emit**: TypeScript is for type-checking only, Vite handles transpilation

### React
- **Functional components only**: Use function components, not class components
- **Hooks**: Use React Hooks for state and side effects
- **JSX**: New JSX transform (no need to import React)
- **StrictMode**: App wrapped in StrictMode for additional checks
- **Component exports**: Default exports for components (see App.tsx:35)

### File Naming
- **Components**: PascalCase with .tsx extension (App.tsx)
- **Styles**: Component-name.css (App.css)
- **Types**: kebab-case with .d.ts extension (vite-env.d.ts)
- **Entry point**: main.tsx

### Styling
- **CSS Modules**: Not configured, uses plain CSS imports
- **Global styles**: index.css for global styles
- **Component styles**: Component-specific CSS files imported directly

### Import Conventions
- **Absolute imports from src**: Not configured, use relative imports
- **Asset imports**: Direct imports for SVGs and images
- **Public assets**: Reference with `/` prefix (e.g., `/vite.svg`)

## ESLint Rules and Warnings

### Active Rules
- All recommended JavaScript and TypeScript rules
- React Hooks rules (exhaustive-deps, rules-of-hooks)
- React Refresh: Only export components (warning level)
  - Allows constant exports with `allowConstantExport: true`

### Common Warnings to Avoid
- Exporting non-component functions from component files
- Missing dependencies in useEffect/useMemo/useCallback
- Incorrect Hook usage (conditional/loop hooks)
- Unused variables or parameters

## Build Output and Deployment

### Build Output
- Directory: `dist/`
- Contains: Minified JS, CSS, HTML, and assets
- Assets are content-hashed for caching

### Deployment Options
- **Vercel**: Recommended (see README.md)
- **Static hosting**: Any static host (Netlify, GitHub Pages, etc.)
- **Preview command**: Test production build locally with `npm run preview`

### Deployment Checklist
1. Run `npm run lint` - Fix any linting errors
2. Run `npm run build` - Ensure clean build
3. Test with `npm run preview` - Verify production build
4. Deploy `dist/` directory

## Common Development Tasks

### Adding a New Component
1. Create `src/ComponentName.tsx`
2. Use functional component with TypeScript types
3. Create `src/ComponentName.css` if needed
4. Import and use in parent component

### Adding Dependencies
```bash
npm install package-name          # Runtime dependency
npm install -D package-name       # Dev dependency
```

### Working with Assets
- **Images/SVGs in src/assets/**: Import directly
- **Static assets in public/**: Reference with `/` prefix
- **Vite processes**: Assets in src/ get hashed, public/ served as-is

### Environment Variables
- Create `.env` files (not present in project)
- Prefix with `VITE_` to expose to client
- Access via `import.meta.env.VITE_*`

## TypeScript Guidelines

### Type Definitions
- Prefer interfaces for object shapes
- Use type for unions, intersections, primitives
- Avoid `any` - use `unknown` if type is truly unknown
- Enable strict null checks (already enabled)

### Component Props
```tsx
interface Props {
  title: string;
  count?: number;  // Optional prop
  onClick: () => void;
}

function Component({ title, count = 0, onClick }: Props) {
  // Implementation
}
```

### Hooks with TypeScript
```tsx
const [state, setState] = useState<Type>(initialValue);
const ref = useRef<HTMLDivElement>(null);
```

## AI Assistant Guidelines

### When Making Changes

1. **Read before editing**: Always read files before making changes
2. **Preserve structure**: Maintain existing file organization
3. **Follow conventions**: Match existing code style and patterns
4. **Type safety**: Ensure all TypeScript changes pass type checking
5. **Lint compliance**: Changes should pass ESLint rules
6. **Test changes**: Run `npm run dev` to verify HMR works
7. **Build verification**: Run `npm run build` for significant changes

### Common Pitfalls to Avoid

- **Don't add unused imports**: ESLint will flag them
- **Don't export non-components from component files**: React Refresh warning
- **Don't use relative imports for public assets**: Use `/` prefix
- **Don't modify tsconfig without understanding**: Project references are intentional
- **Don't add `any` types**: Use proper typing or `unknown`
- **Don't break HMR**: Keep component exports simple for Fast Refresh

### Testing Checklist Before Committing

1. `npm run lint` - Passes without errors
2. `npm run build` - Builds successfully
3. `npm run dev` - Dev server starts and HMR works
4. Browser console - No TypeScript errors
5. Visual check - UI renders correctly

### Preferred Patterns

**State Management**: useState for local state (no global state library yet)
**Side Effects**: useEffect with proper dependency arrays
**Event Handlers**: Inline arrow functions or useCallback for optimization
**Styling**: Direct CSS imports, no CSS-in-JS library
**Testing**: No testing framework configured yet

### Project Maturity Level

This is a **starter template** with:
- ✅ Development tooling (Vite, TypeScript, ESLint)
- ✅ Hot Module Replacement
- ✅ Production build configuration
- ❌ No routing (add react-router-dom if needed)
- ❌ No state management (add zustand/redux if needed)
- ❌ No testing framework (add vitest/jest if needed)
- ❌ No UI component library (add if needed)
- ❌ No API client (add axios/fetch wrapper if needed)

### When to Add Dependencies

Ask the user before adding:
- State management libraries (zustand, redux, jotai)
- Routing libraries (react-router-dom)
- UI component libraries (MUI, Chakra, shadcn/ui)
- Form libraries (react-hook-form, formik)
- Testing frameworks (vitest, jest, testing-library)
- API clients (axios, tanstack-query)

### Git Workflow

- Current branch: `claude/claude-md-micn9cxuj7r3o1xg-016E6LP81ch7jmcx6f3G8WHb`
- Main branch: Not specified (likely `main` or `master`)
- Always develop on the designated Claude branch
- Commit with clear, descriptive messages
- Push with `git push -u origin <branch-name>`

## Project Health Indicators

### Good Signs
- Clean builds with no TypeScript errors
- Lint passes with no warnings
- Fast HMR updates (<1 second)
- Small bundle size (starter is ~150KB)

### Warning Signs
- TypeScript errors in build
- ESLint warnings accumulating
- Slow HMR (check for circular dependencies)
- Large bundle size increase (analyze imports)

## Quick Reference

### File Locations
- Components: `src/*.tsx`
- Styles: `src/*.css`
- Static assets: `public/`
- Component assets: `src/assets/`
- Config: Root directory

### Port Numbers
- Dev server: 5173 (default)
- Preview server: 4173 (default)

### Important URLs (when running)
- Dev: http://localhost:5173
- Preview: http://localhost:4173

## Version Information

Last updated: 2025-11-24
Node version requirement: Not specified (recommend Node 18+)
Package manager: npm
React version: 18.3.1
TypeScript version: 5.5.3
Vite version: 5.4.1

---

**Note for AI Assistants**: This document should be updated when significant architectural changes occur, new dependencies are added, or conventions change. Always verify against actual code when in doubt.
