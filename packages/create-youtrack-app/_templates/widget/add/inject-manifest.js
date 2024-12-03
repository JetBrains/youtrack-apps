const fs = require("node:fs");
const path = require("node:path");

console.log('inject manifest')


function injectWidget(newWidget, cwd) {
  const fileName = "manifest.json";
  const filePath = path.join(process.cwd(), cwd, fileName);

  const manifest = JSON.parse(fs.readFileSync(filePath));

  manifest.widgets.push(newWidget);

  fs.writeFileSync(filePath, JSON.stringify(manifest, null, 2));
}

module.exports.injectWidget = injectWidget;
