#!/usr/bin/env node
const { reader } = require("./reader");
const express = require("express");
const fs = require("fs");
const os = require("os");

const npath = require("path");
const args = process.argv;
const currentPath = process.cwd();
let path = currentPath;
if (args.length > 2) {
  if (args[2] !== ".") {
    path += "/" + args[2];
  }
}
const appName = "debug-server";
let tmpPath;
let htmlFile = "";
const app = express();
try {
  const listFiles = fs.readdirSync(path).filter((el) => el === "index.html");
  if (listFiles.length === 0) {
    throw new Error("No html found");
  }
  tmpPath = fs.mkdtempSync(npath.join(os.tmpdir(), appName));
  fs.copyFileSync(
    npath.join(__dirname, "injectjs", "eruda.min.js"),
    npath.join(tmpPath, "eruda.min.js")
  );

  app.use(express.static(tmpPath));
} catch (error) {}
process.on("SIGINT", () => {
  try {
    if (tmpPath) {
      fs.rmSync(tmpPath, { recursive: true });
    }
  } catch (error) {}
  console.log("server closed");
  server.close();
  process.exit();
});

process.on("uncaughtException", (err) => {
  console.log(err);
  try {
    if (tmpPath) {
      fs.rmSync(tmpPath, { recursive: true });
    }
  } catch (error) {}
  console.log("server closed");

  process.exit();
});
app.get("/", async (req, res) => {
  htmlFile = await reader(path, tmpPath);

  res.send(htmlFile);
});

const server = app.listen(3000, () =>
  console.log("server running on port 3000")
);
