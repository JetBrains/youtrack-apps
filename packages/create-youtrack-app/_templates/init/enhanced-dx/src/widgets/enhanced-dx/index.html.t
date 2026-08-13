---
to: "<%= backendOnly === 'true' ? '' : 'src/widgets/enhanced-dx/index.html' %>"
---
<!doctype html>
<!-- Sample widget entry. If this app is backend-only (no UI), delete src/widgets/enhanced-dx/
     and its manifest.json "widgets[]" entry, or re-scaffold with `--backend-only`. -->
<html>
  <head>
    <link rel="stylesheet" href="app.css">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="index.tsx"></script>
  </body>
</html>
