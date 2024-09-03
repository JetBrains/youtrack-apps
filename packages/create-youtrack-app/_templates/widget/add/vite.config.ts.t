---
to: vite.config.ts
inject: true
after: '// List every widget entry point here'
---
        <%= h.inflection.camelize(key, true) %>: resolve(__dirname, 'src/widgets/<%= indexPath %>'),
