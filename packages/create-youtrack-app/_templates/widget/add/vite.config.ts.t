---
to: vite.config.ts
inject: true
after: '// List every widget entry point here'
---
        <%= h.changeCase.camel(key) %>: resolve(__dirname, 'src/widgets/<%= indexPath %>'),
