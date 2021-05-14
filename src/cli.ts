#!/usr/bin/env node

import { version } from "../package.json";

import { Command } from "commander";

import { run } from "./main";

const program = new Command();
program
  .name("bookmarks-to-obsidian")
  .version(version)
  .option(
    "-o, --output <outputDirectory>",
    "a directory to output markdown files to, defaults to build/"
  )
  .arguments("<bookmarksPath>")
  .description("convert", {
    filePath: "path to bookmarks.html",
  })
  .action((bookmarksPath, options) => {
    run({ bookmarksPath });
  })
  .parse();
