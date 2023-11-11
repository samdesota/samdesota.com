const fs = require("fs");
const path = require("path");
const showdown = require("showdown");

const fp = (...relative) => path.join(__dirname, ...relative);

const outDir = "dist";
const indexTemplate = fs.readFileSync(fp("template", "index.html"), "utf-8");
const postTemplate = fs.readFileSync(fp("template", "post.html"), "utf-8");
const posts = fs.readdirSync(fp("posts")).sort((a, b) => a.localeCompare(b));

const postNamePattern = /^([^\.]+)\.([0-9]{4})-([0-9]{2})-([0-9]{2})\.md$/;

const write = (path, content) => {
  fs.writeFileSync(path, content);
  console.log(`wrote ${path.replace(`${__dirname}/`, "")}`);
};

const postData = posts.map((fileName) => {
  const [, title, year, month, date] = fileName.match(postNamePattern);

  if (title && year && month && date) {
    return {
      title,
      date: `${year}-${month}-${date}`,
      content: fs.readFileSync(fp("posts", fileName), "utf-8"),
    };
  } else {
    throw new Error("invalid post format");
  }
});

const postLinks = postData
  .map((data) => {
    return `<li><a href="/posts/${data.title}.html">${data.title}</a> - ${data.date}</li>`;
  })
  .join("\n");

const indexHTML = indexTemplate.replace(
  "{{links}}",
  () => `<ul>${postLinks}</ul>`
);

try {
  fs.rmSync(fp(outDir), { recursive: true });
} catch (e) {
  console.log("info: no existing dist directory");
}

fs.mkdirSync(fp(outDir));

write(fp(outDir, "index.html"), indexHTML);

fs.mkdirSync(fp(outDir, "posts"));

const converter = new showdown.Converter();

for (const post of postData) {
  const postContent = converter.makeHtml(post.content);
  const postHTML = postTemplate
    .replace("{{headTitle}}", () => post.title)
    .replace("{{htmlTitle}}", () => post.title)
    .replace("{{content}}", () => postContent);

  write(fp(outDir, "posts", `${post.title}.html`), postHTML)
}

write(fp(outDir, 'index.css'), fs.readFileSync(fp('template', 'index.css')))