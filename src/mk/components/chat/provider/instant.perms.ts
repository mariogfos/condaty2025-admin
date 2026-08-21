import type { InstantRules } from "@instantdb/react";

// Not recommended for production since this allows anyone to
// upload/delete, but good for getting started
const rules = {
  $files: {
    allow: {
      view: "true",
      create: "true",
      delete: "true",
    },
  },
} satisfies InstantRules;

export default rules;
