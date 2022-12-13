import type { Plugin } from "@envelop/core";
import { APP_SECRET } from "../auth";
import * as jwt from "jsonwebtoken";

const { GraphQLError } = require("graphql");
export const myPlugin: Plugin = {
  onExecute({ args: { contextValue }, setResultAndStopExecution }) {
    
    const opera = contextValue;
    console.log(opera);  
    // @ts-expect-error
    const operation = contextValue.params.operationName;
    // console.log(operation);
    if (operation == "login" || operation == "signup") {
      return;
    }
    // @ts-expect-error
    const token = contextValue.req.headers.auth;

    if (token) {
      const payload = jwt.verify(token, APP_SECRET);
      if (!payload) {
        setResultAndStopExecution(
          new GraphQLError("Not authorized/give valid token")
        );
      }
      // @ts-expect-error
      contextValue.userId = payload.userId;
    } else {
      setResultAndStopExecution({
        errors: [new GraphQLError("No token provided")],
      });
    }
  },
};
