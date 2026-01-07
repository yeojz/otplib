# otplib/apps/docs

Documentation site for otplib, built with [VitePress](https://vitepress.dev/).

## Development

```bash
# Start development server
pnpm dev

# Or from root
pnpm docs:dev
```

The site will be available at `http://localhost:5173`.

## Build

```bash
# Build for production
pnpm build

# Or from root
pnpm docs:build
```

Output will be in the `.vitepress/dist/` directory.

## Serve Built Site

```bash
# Serve production build locally
pnpm serve

# Or from root
pnpm docs:serve
```

## Structure

```
packages/docs/
├── .vitepress/           # VitePress configuration
├── guide/               # User guide
├── api/                 # API reference
├── index.md             # Home page
└── package.json
```

## License

[MIT](./LICENSE) © 2026 Gerald Yeo
