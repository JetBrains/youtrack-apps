const fs = require("node:fs");
const path = require("node:path");

console.log('inject manifest')


function injectWidget(newWidget, cwd) {
  const fileName = "manifest.json";
  // path.resolve handles both absolute cwd (tests/CI) and relative cwd (npm scripts)
  const filePath = path.resolve(process.cwd(), cwd || '', fileName);

  const manifest = JSON.parse(fs.readFileSync(filePath));

  if (manifest.widgets && manifest.widgets.some(w => w.key === newWidget.key)) {
    throw new Error(`Widget with key "${newWidget.key}" already exists in manifest.json`);
  }

  manifest.widgets.push(newWidget);

  fs.writeFileSync(filePath, JSON.stringify(manifest, null, 2));
}

module.exports.injectWidget = injectWidget;
