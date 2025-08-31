const fs = require("fs");
const path = require("path");
const archiver = require("archiver");

// Output file
const version = require("./manifest.json").version;
const outputDir = "dist";
const outputFile = path.join(outputDir, `lingua-boost-v${version}.zip`);

// Ensure dist folder exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// Create archive
const output = fs.createWriteStream(outputFile);
const archive = archiver("zip", { zlib: { level: 9 } });

output.on("close", () => {
  console.log(`Built ${outputFile} (${archive.pointer()} bytes)`);
});

archive.on("error", (err) => {
  throw err;
});

archive.pipe(output);

// Only include needed files
archive.file("manifest.json", { name: "manifest.json" });
archive.directory("src/", "src");
archive.directory("icons/", "icons");

archive.finalize();
