import { i } from "@instantdb/react";

const _schema = i.schema({
  entities: {
    $files: i.entity({
      path: i.string().unique().indexed(),
      url: i.string(),
    }),
    $users: i.entity({
      email: i.string().unique().indexed(),
    }),
  },
  links: {},
  rooms: {
    // 1. `chat` is the `roomType`
    chat: {
      // 2. Choose what presence looks like here
      presence: i.entity({
        name: i.string(),
        status: i.string(),
      }),
      topics: {
        // 3. You can define payloads for different topics here
        sendEmoji: i.entity({
          emoji: i.string(),
        }),
      },
    },
  },
});

// This helps Typescript display nicer intellisense
type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
