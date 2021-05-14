import fs from "fs";
import path from "path";
import process from "process";

import cheerio from "cheerio";
import dayjs from "dayjs";
import filenamify from "filenamify";

import type { Cheerio, Element } from "cheerio";

const DEFAULT_OUTPUT_DIRECTORY = "build";

type Bookmark = {
  title: string;
  url: string;
  description: string;
  addDate: string;
  modifiedDate: string;
  modifiedDateRaw: string;
  tags: string[];
  coverImage?: string;
  categories: string[];
};

type RunArguments = {
  bookmarksPath: string;
  outputDirectory?: string;
};

function run({ bookmarksPath, outputDirectory }: RunArguments): void {
  const bookmarksData = fs.readFileSync(bookmarksPath, "utf-8");
  const bookmarksParsed = cheerio.load(bookmarksData);

  const bookmarks: Bookmark[] = bookmarksParsed("a")
    .map((_index, a) => {
      const anchorParsed = bookmarksParsed(a);
      const title = anchorParsed.text() || "";
      const url = anchorParsed.attr("href") || "";

      if (title === "" || url === "") {
        return;
      }

      const addDateRaw = anchorParsed.attr("add_date") || "";
      const modifiedDateRaw = anchorParsed.attr("last_modified") || "";
      const tagsRaw = anchorParsed.attr("tags");
      const addDate = formatDateInYYYYMMDD(addDateRaw);
      const modifiedDate = formatDateInYYYYMMDD(modifiedDateRaw);
      const tags = tagsRaw === "" ? [] : tagsRaw?.split(",") || [];
      const coverImage = anchorParsed.attr("cover");
      const categories = getCategories(anchorParsed);
      const description = getDescription(anchorParsed);
      return {
        title,
        url,
        description,
        addDate,
        modifiedDate,
        modifiedDateRaw,
        tags,
        coverImage,
        categories,
      };
    })
    .toArray();

  writeOutFiles(bookmarks, outputDirectory);
}

function writeOutFiles(
  bookmarks: Bookmark[],
  markdownFolder = DEFAULT_OUTPUT_DIRECTORY
) {
  const modifiedFilePath = path.join(markdownFolder, `.modified`);
  const existingModifiedTimestampRaw = fs.existsSync(modifiedFilePath)
    ? fs.readFileSync(modifiedFilePath).toString()
    : "";

  if (bookmarks[0].modifiedDateRaw === existingModifiedTimestampRaw) {
    console.warn("Nothing to do as bookmarks are up to date");
    return;
  }

  if (!fs.existsSync(markdownFolder)) {
    fs.mkdirSync(markdownFolder);
  }

  let importedBookmarksCount = 0;

  bookmarks.forEach((bookmark) => {
    if (
      parseFloat(existingModifiedTimestampRaw) >
      parseFloat(bookmark.modifiedDateRaw)
    ) {
      console.warn(
        `Bookmark with timestamp ${bookmark.modifiedDateRaw} already processed, skipping`
      );
      return;
    }

    const filename = filenamify(bookmark.title);
    const filePath = path.join(markdownFolder, `${filename}.md`);
    fs.writeFileSync(filePath, formatMarkdown(bookmark));

    importedBookmarksCount += 1;
  });

  fs.writeFileSync(modifiedFilePath, bookmarks[0].modifiedDateRaw);
  console.log(`Imported ${importedBookmarksCount} bookmarks`);
}

function formatMarkdown(bookmark: Bookmark): string {
  const { title, url, description, addDate, modifiedDate, tags, categories } =
    bookmark;

  return `# ${title}
[Link](${url})

${description}

${addDate ? `Added: [[${addDate}]]` : ""}
${
  modifiedDate && modifiedDate !== addDate
    ? `Modified: [[${modifiedDate}]]`
    : ""
}

## Tags
${tags.map((tag) => `[[${tag}]]`).join(" ")}${categories
    .map((category) => `[[${category}]]`)
    .join(" ")}
`;
}

function formatDateInYYYYMMDD(timestamp: string) {
  return dayjs.unix(parseFloat(timestamp)).format("YYYY-MM-DD");
}

function getDescription(el: Cheerio<Element>): string {
  const node = el.parent().next();
  const title = node.text();
  if (node.length > 0 && title.length > 0) {
    return title;
  } else {
    return "";
  }
}

function getCategories(el: Cheerio<Element>): string[] {
  const node = el.closest("DL").prev();
  const title = node.text();
  if (node.length > 0 && title.length > 0) {
    return [title].concat(getCategories(node));
  } else {
    return [];
  }
}

export { run, formatMarkdown };
export type { Bookmark };
