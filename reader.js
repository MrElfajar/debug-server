const fs = require("fs");
const cheerio = require("cheerio");
const path = require("path");

const listFilesFromDir = (dirPath) => {
  return fs.readdirSync(dirPath);
};

const readFile = (path) => {
  return new Promise((resolve) => {
    const rf = fs.createReadStream(path, "utf-8");
    rf.on("data", (data) => {
      resolve(data);
    });
  });
};

const moveFilesToTemp = (splitted = [], dirPath, tempPath) => {
  if (splitted.length > 1) {
    for (let i = 0; i < splitted.length; i++) {
      if (i < splitted.length - 1) {
        if (!fs.existsSync(path.join(tempPath, splitted[i])))
          fs.mkdirSync(path.join(tempPath, splitted[i]));
      } else {
        fs.cpSync(
          path.join(dirPath, splitted.join("/")),
          path.join(tempPath, splitted.join("/"))
        );
      }
    }
  } else {
    fs.cpSync(
      path.join(dirPath, splitted.join("/")),
      path.join(tempPath, splitted.join("/"))
    );
  }
};

const reader = (dirPath, tempPath) => {
  return new Promise(async (resolve) => {
    const listFiles = listFilesFromDir(dirPath).filter((f) =>
      f.endsWith(".html")
    );
    if (listFiles.length === 0) {
      throw new Error("No html");
    }

    let html = "";

    const fileName = listFiles[0];
    const pth = path.join(dirPath, listFiles[0]);
    if (fileName.endsWith(".html")) {
      html = await readFile(pth);
    }
    const $ = cheerio.load(html);
    $("script").each((_, script) => {
      if ($(script).is("[src]")) {
        const splitted = $(script).attr("src").split("/");
        moveFilesToTemp(splitted, dirPath, tempPath);
      }
    });

    $("link").each((_, link) => {
      if ($(link).attr("rel") === "stylesheet" || $(link).is("[href]")) {
        const splitted = $(link).attr("href").split("/");
        moveFilesToTemp(splitted, dirPath, tempPath);
      }
    });

    $("head").prepend($("<script>eruda.init({theme:'dark'})</script>"));
    $("head").prepend($("<script src='eruda.min.js'></script>"));
    resolve($.html());
  });
};

module.exports = { reader, moveFilesToTemp };
