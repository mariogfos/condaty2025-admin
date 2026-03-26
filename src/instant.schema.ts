// Docs: https://www.instantdb.com/docs/modeling-data

import { i } from "@instantdb/react";

const _schema = i.schema({
  // We inferred 29 attributes!
  // Take a look at this schema, and if everything looks good,
  // run `push schema` again to enforce the types.
  entities: {
    $files: i.entity({
      path: i.string().unique().indexed(),
      url: i.string(),
    }),
    $users: i.entity({
      email: i.string().unique().indexed().optional(),
      imageURL: i.string().optional(),
      type: i.string().optional(),
    }),
    chatbot: i.entity({
      asignatedAt: i.any().optional(),
      chatbot: i.any().optional(),
      client_id: i.string().optional(),
      created_at: i.number().optional(),
      msgId: i.string().optional(),
      reply: i.any().optional(),
      roomId: i.string().optional(),
      sender: i.string().optional(),
      status: i.string().optional(),
      text: i.string().optional(),
    }),
    messages: i.entity({
      client_id: i.string().optional(),
      created_at: i.number().optional(),
      emoticon: i.any().optional(),
      read_at: i.number().optional(),
      received_at: i.number().optional(),
      roomId: i.string().indexed().optional(),
      sender: i.string().optional(),
      text: i.string().optional(),
    }),
    notif: i.entity({
      channel: i.string().indexed().optional(),
      client_id: i.string().optional(),
      created_at: i.date().indexed().optional(),
      event: i.string().optional(),
      from: i.string().optional(),
      payload: i.json().optional(),
    }),
    usersapp: i.entity({
      address: i.string().optional(),
      ci: i.string().optional(),
      condominio: i.string().optional(),
      condominio_id: i.string().optional(),
      created_at: i.string().optional(),
      email: i.string().optional(),
      has_image: i.any().optional(),
      last_login_at: i.string().optional(),
      name: i.string().optional(),
      permisos: i.string().optional(),
      phone: i.string().optional(),
      rol: i.string().optional(),
      type: i.string().optional(),
    }),
  },
  links: {
    $usersLinkedPrimaryUser: {
      forward: {
        on: "$users",
        has: "one",
        label: "linkedPrimaryUser",
        onDelete: "cascade",
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "linkedGuestUsers",
      },
    },
    messages$files: {
      forward: {
        on: "messages",
        has: "one",
        label: "$files",
      },
      reverse: {
        on: "$files",
        has: "one",
        label: "messages",
        onDelete: "cascade",
      },
    },
  },
  rooms: {},
});

// This helps Typescript display nicer intellisense
type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
