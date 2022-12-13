import type { Plugin } from "@envelop/core";
import { APP_SECRET } from "../auth";
import * as jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const { GraphQLError } = require("graphql");

const createStats = async (
  operation: string,
  success: boolean,
  responseTime: number
) => {
  await prisma.stats.create({
    data: {
      operation: operation,
      success: success,
      resposeTime: responseTime,
    },
  });
};

export const metricsPlugin: Plugin = {
  onExecute({ args: { contextValue }, setResultAndStopExecution }) {
    // @ts-expect-error
    if (!["additems","removeitems","updateitems","geturl","alluseritems","allUsers",].includes(contextValue.params.operationName)) {
      return;
    }
    const start = Date.now();
    return {
        onExecuteDone() {
          const end = Date.now();
          const responseTime = end - start;
          createStats(
            // @ts-expect-error
            contextValue.params.operationName,
            true,
            responseTime
          );
          // console.log(contextValue.params.operationName, responseTime,'ms');
        },
    }
  },
};
