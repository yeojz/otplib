# otplib/apps/docs

Documentation site for otplib, built with [VitePress](https://vitepress.dev/).

## Development

```bash
# Start development server
npm run docs:dev

# Or from root
npm run docs:dev
```

The site will be available at `http://localhost:5173`.

## Build

```bash
# Build for production
npm run docs:build

# Or from root
npm run docs:build
```

Output will be in the `.vitepress/dist/` directory.

## Serve Built Site

```bash
# Serve production build locally
npm run docs:serve

# Or from root
npm run docs:serve
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

[MIT](./LICENSE)
