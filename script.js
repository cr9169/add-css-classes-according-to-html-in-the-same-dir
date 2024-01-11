const fs = require("fs");
const path = require("path");
const readline = require("readline");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// The path to your HTML file
const htmlFilePath = path.join(__dirname, "index.html");

rl.question(
  "Enter the name of the CSS file you want to append to: ",
  function (cssFileName) {
    const cssFilePath = path.join(__dirname, cssFileName);

    // Read the CSS file first to get existing class names
    fs.readFile(cssFilePath, "utf8", (cssErr, cssData) => {
      if (cssErr && cssErr.code !== "ENOENT") {
        // Ignore error if file doesn't exist (ENOENT)
        console.error("Error reading the CSS file:", cssErr);
        rl.close();
        return;
      }

      // Extract existing class names from the CSS file using a refined regex
      const existingClasses = new Set();
      const regex = /\.([a-zA-Z0-9_-]+)\s*\{/g;
      let match;
      while ((match = regex.exec(cssData)) !== null) {
        existingClasses.add(match[1]); // Add just the class name without the dot
      }

      // Now read the HTML file to extract all class names
      fs.readFile(htmlFilePath, "utf8", (htmlErr, html) => {
        if (htmlErr) {
          console.error("Error reading the HTML file:", htmlErr);
          rl.close();
          return;
        }

        // Parse the HTML file
        const dom = new JSDOM(html);
        const document = dom.window.document;

        // Extract all elements with a class attribute
        const allElements = Array.from(document.querySelectorAll("[class]"));

        // Extract the class names and remove duplicates
        const classNames = new Set();
        allElements.forEach((el) => {
          el.classList.forEach((className) => {
            // Add class name if it doesn't already exist in the CSS file
            if (!existingClasses.has(className)) {
              classNames.add(className);
            }
          });
        });

        // Convert the class names into CSS rules
        const cssContent = Array.from(classNames)
          .map((className) => `.${className} {\n\n}`)
          .join("");

        // Append the new CSS rules to the CSS file
        fs.appendFile(cssFilePath, cssContent, "utf8", (appendErr) => {
          if (appendErr) {
            console.error("Error appending to the CSS file:", appendErr);
          } else if (cssContent) {
            console.log(
              `New CSS content appended successfully to ${cssFileName}.`
            );
          } else {
            console.log(`No new classes to append to ${cssFileName}.`);
          }
          // Close the readline interface
          rl.close();
        });
      });
    });
  }
);

rl.on("close", function () {
  process.exit(0);
});
