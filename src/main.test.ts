import { formatMarkdown } from "./main";

import type { Bookmark } from "./main";

const bookmark: Bookmark = {
  title: "Test bookmark",
  url: "https://example.com",
  description: "Just an example description",
  addDate: "2021-05-14",
  modifiedDate: "2021-05-14",
  modifiedDateRaw: "1620448276",
  tags: ["hello", "world"],
  categories: ["Unsorted"],
};

describe("formatMarkdown", () => {
  test("converts a simple bookmark", () => {
    expect(formatMarkdown(bookmark)).toEqual(`# Test bookmark
[Link](https://example.com)

Just an example description

Added: [[2021-05-14]]


## Tags
[[hello]] [[world]][[Unsorted]]
`);
  });
});
