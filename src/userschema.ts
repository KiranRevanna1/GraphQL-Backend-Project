import SchemaBuilder from "@pothos/core";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

import SimpleObjectsPlugin from "@pothos/plugin-simple-objects";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { APP_SECRET } from "./auth";
import { GraphQLError } from "graphql";
//object types

type AuthPayload = {
  token: string;
  user: User;
};

type Stats = {
  operation: string;
  success: boolean;
  responseTime: number;
};

type Metrics = {
  sucessRate: number;
  failureRate: number;
  avgResponseTime: number;
};

type UserItem = {
  id: number;
  title: string;
  url: string;
  description: string;
};

type User = {
  id: number;
  name: string;
  password: string;
  email: string;
  items?: UserItem[];
};

//schemaBuilder
const builder = new SchemaBuilder<{
  Objects: {
    User: User;
    UserItem: UserItem;
    AuthPayload: AuthPayload;
    Stats: Stats;
    Metrics: Metrics;
  };
}>({ plugins: [SimpleObjectsPlugin] });

//schema authpayload
const AuthPayLoad = builder.simpleObject("AuthPayload", {
  fields: (t) => ({
    token: t.string(),
    user: t.field({
      type: "User",
    }),
  }),
});

//schema stats
const Stats = builder.simpleObject("Stats", {
  fields: (t) => ({
    operation: t.string(),
    success: t.boolean(),
    responseTime: t.int(),
  }),
});

//schema metrics
const Metrics = builder.simpleObject("Metrics", {
  fields: (t) => ({
    sucessRate: t.int(),
    failureRate: t.int(),
    avgResponseTime: t.int(),
  }),
});


//schema useritem
const UserItem = builder.simpleObject("UserItem", {
  fields: (t) => ({
    id: t.id(),
    title: t.string(),
    url: t.string(),
    description: t.string(),
  }),
});

//schema user
builder.objectType("User", {
  fields: (t) => ({
    id: t.exposeID("id"),
    name: t.exposeString("name"),
    password: t.exposeString("password"),
    email: t.exposeString("email"),
    items: t.field({
      type: ["UserItem"],
      resolve: async (User) => {
        return await prisma.userItem.findMany({
          where: {
            postedById: User.id,
          },
        });
      },
    }),
  }),
});

//user input
const UserItemInput = builder.inputType("UserItemInput", {
  fields: (t) => ({
    title: t.string({ required: true }),
    url: t.string({ required: true }),
    description: t.string({ required: true }),
  }),
});

//Query
builder.queryType({
  fields: (t) => ({
    users: t.field({
      type: ["User"],
      resolve: () => prisma.user.findMany(),
    }),

    //getUrl query
    getUrl: t.field({
      type: "String",
      args: {
        title: t.arg.string({ required: true }),
      },
      resolve: async (parent, args, contextValue) => {
        const user = await prisma.user.findUnique({
          where: {
            // @ts-expect-error
            id: contextValue.userId,
          },
        });
        if (!user) {
          throw new Error("User not found");
        }
        const shortcutIsAlive = await prisma.userItem.findFirstOrThrow({
          where: {
            title: args.title,
            postedById: user.id,
          },
        });
        if (!shortcutIsAlive) {
          throw new Error("Shortcut not found");
        }
        return shortcutIsAlive.url;
      },
    }),

    //getUserShortcuts query
    getUserShortcuts: t.field({
      type: ["UserItem"],
      resolve: async (parent, args, contextValue) => {
        const user = await prisma.user.findUnique({
          where: {
            // @ts-expect-error
            id: contextValue.userId,
          },
        });
        if (!user) {
          throw new Error("User not found");
        }
        return await prisma.userItem.findMany({
          where: {
            postedById: user.id,
          },
        });
      },
    }),

    //getMetrics query
    getMetrics: t.field({
      type: "Metrics",
      args: {
        operation: t.arg.string({ required: true }),
      },
      // @ts-expect-error
      resolve: async (parent, args, contextValue) => {
        const operationName = args.operation;
        if (
          ![
            "allUsers",
            "additems",
            "removeitems",
            "updateitems",
            "geturl",
            "alluseritems",
            
          ].includes(operationName)
        ) {
          throw new Error("Invalid operation name");
        }
        const successCount =await prisma.stats.count({
          where: {
            operation: operationName,
            success: true,
          },
        });
        const failureCount =await prisma.stats.count({
          where: {
            operation: operationName,
            success: false,
          },
        });
        const totalCount =await prisma.stats.count({
          where: {
            operation: operationName,
          },
        });
        const avgResponseTime = await prisma.stats.aggregate({

          _avg: {
            resposeTime: true,
          },
          where: {
            operation: operationName,
          },
        });

        return {
          sucessRate: (successCount / totalCount) * 100,
          failureRate : (failureCount / totalCount) * 100,
          avgResponseTime: avgResponseTime._avg.resposeTime,
        };
      },
    }),
  }),
});

//Mutation
builder.mutationType({
  fields: (t) => ({
    //signup mutation
    signup: t.field({
      type: "AuthPayload",
      args: {
        name: t.arg.string({ required: true }),
        password: t.arg.string({ required: true }),
        email: t.arg.string({ required: true }),
      },
      resolve: async (parent, args) => {
        const checkUserPresent = await prisma.user.findFirst({
          where: {
            email: args.email,
          },
        });
        if (checkUserPresent) {
          throw new Error("User already exists");
        }
        const { name, email } = args;
        const password = await bcrypt.hash(args.password, 10);
        const newuser = await prisma.user.create({
          data: {
            name,
            password,
            email,
          },
        });
        const token = jwt.sign({ userId: newuser.id }, APP_SECRET);
        return {
          token,
          user: newuser,
        };
      },
    }),

    //login mutation
    login: t.field({
      type: "AuthPayload",
      args: {
        email: t.arg.string({ required: true }),
        password: t.arg.string({ required: true }),
      },
      resolve: async (parent, args) => {
        const user = await prisma.user.findFirst({
          where: {
            email: args.email,
          },
        });
        if (!user) {
          throw new Error("User does not exist");
        }
        const valid = await bcrypt.compare(args.password, user.password);
        if (!valid) {
          throw new Error("Incorrect password");
        }
        const token = jwt.sign({ userId: user.id }, APP_SECRET);
        return {
          token,
          user,
        };
      },
    }),

    //2  adding links to users
    additems: t.field({
      type: "UserItem",
      args: {
        input: t.arg({ type: UserItemInput, required: true }),
      },
      resolve: async (parent, args, contextValue) => {
        const user = await prisma.user.findFirst({
          where: {
            // @ts-expect-error
            id: contextValue.userId,
          },
        });
        if (!user) {
          throw new Error("User does not exist");
        }
        const checkshortcut = await prisma.userItem.findFirst({
          where: {
            title: args.input.title,
            postedById: user.id,
          },
        });
        if (checkshortcut) {
          throw new Error("Shortcut already exists");
        }
        return await prisma.userItem.create({
          data: {
            title: args.input.title,
            url: args.input.url,
            description: args.input.description,
            postedBy: {
              connect: {
                id: user.id,
              },
            },
          },
        });
      },
    }),

    //3 updateLink to user
    updateitems: t.field({
      type: "UserItem",
      args: {
        input: t.arg({ type: UserItemInput, required: true }),
      },
      resolve: async (parent, args, contextValue) => {
        const user = await prisma.user.findFirst({
          where: {
            // @ts-expect-error
            id: contextValue.userId,
          },
        });
        if (!user) {
          throw new Error("User does not exist");
        }
        const checklinkpresent = await prisma.userItem.findFirst({
          where: {
            title: args.input.title,
          },
        });
        if (!checklinkpresent) {
          throw new Error("Link does not exist");
        }
        return await prisma.userItem.update({
          where: {
            id: checklinkpresent.id,
          },
          data: {
            title: args.input.title,
            url: args.input.url,
            description: args.input.description,
          },
        });
      },
    }),

    //4 remove Link to user
    removeitems: t.field({
      type: "UserItem",
      args: {
        title: t.arg.string({ required: true }),
      },
      resolve: async (parent, args, contextValue) => {
        const user = await prisma.user.findFirst({
          where: {
            // @ts-expect-error
            id: contextValue.userId,
          },
        });
        if (!user) {
          throw new Error("User does not exist");
        }
        const checklinkpresent = await prisma.userItem.findFirst({
          where: {
            title: args.title,
          },
        });
        if (!checklinkpresent) {
          throw new Error("Link does not exist");
        }
        return await prisma.userItem.delete({
          where: {
            id: checklinkpresent.id,
          },
        });
      },
    }),
  }),
});

export const schema = builder.toSchema();
