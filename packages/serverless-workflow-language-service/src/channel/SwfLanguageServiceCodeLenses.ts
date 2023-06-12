/*
 * Copyright 2022 Red Hat, Inc. and/or its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  createCodeLenses,
  createNewFileCodeLens,
  createOpenCompletionItemsCodeLenses,
  EditorLanguageServiceCodeLenses,
  EditorLanguageServiceCodeLensesFunctionsArgs,
  findNodeAtLocation,
  nodeUpUntilType,
  getLineContentFromOffset,
  getLineNumberFromOffset,
  nodeLastDescendent,
} from "@kie-tools/json-yaml-language-service/dist/channel";
import { FileLanguage } from "../api";
import { CodeLens, Position } from "vscode-languageserver-types";
import { SwfLanguageServiceCommandArgs, SwfLanguageServiceCommandTypes } from "../api";
import { SwfLanguageServiceConfig } from "./SwfLanguageService";
import * as swfModelQueries from "./modelQueries";

export type SwfLanguageServiceCodeLensesFunctionsArgs =
  EditorLanguageServiceCodeLensesFunctionsArgs<SwfLanguageServiceCommandTypes> & {
    config: SwfLanguageServiceConfig;
    displayRhhccIntegration?: boolean;
  };

const logInRegistries = (args: SwfLanguageServiceCodeLensesFunctionsArgs, jsonPath: string[]): CodeLens[] =>
  !args.displayRhhccIntegration
    ? []
    : createCodeLenses({
        document: args.document,
        rootNode: args.rootNode,
        jsonPath,
        positionLensAt: "begin",
        commandDelegates: ({ position, node }) => {
          const commandName: SwfLanguageServiceCommandTypes = "swf.ls.commands.LogInServiceRegistries";

          if (
            node.type !== "array" ||
            !args.codeCompletionStrategy.shouldCreateCodelens({ node, commandName, content: args.content }) ||
            args.config.shouldConfigureServiceRegistries() ||
            !args.config.shouldServiceRegistriesLogIn()
          ) {
            return [];
          }

          return [
            {
              name: commandName,
              title: "↪ Log in Service Registries...",
              args: [{ position } as SwfLanguageServiceCommandArgs[typeof commandName]],
            },
          ];
        },
      });

const setUpRegistries = (args: SwfLanguageServiceCodeLensesFunctionsArgs, jsonPath: string[]): CodeLens[] =>
  !args.displayRhhccIntegration
    ? []
    : createCodeLenses({
        document: args.document,
        rootNode: args.rootNode,
        jsonPath,
        positionLensAt: "begin",
        commandDelegates: ({ position, node }) => {
          const commandName: SwfLanguageServiceCommandTypes = "swf.ls.commands.OpenServiceRegistriesConfig";

          if (
            node.type !== "array" ||
            !args.codeCompletionStrategy.shouldCreateCodelens({ node, commandName, content: args.content }) ||
            !args.config.shouldConfigureServiceRegistries()
          ) {
            return [];
          }

          return [
            {
              name: commandName,
              title: "↪ Setup Service Registries...",
              args: [{ position } as SwfLanguageServiceCommandArgs[typeof commandName]],
            },
          ];
        },
      });

const refreshRegistries = (args: SwfLanguageServiceCodeLensesFunctionsArgs, jsonPath: string[]): CodeLens[] =>
  !args.displayRhhccIntegration
    ? []
    : createCodeLenses({
        document: args.document,
        rootNode: args.rootNode,
        jsonPath,
        positionLensAt: "begin",
        commandDelegates: ({ position, node }) => {
          const commandName: SwfLanguageServiceCommandTypes = "swf.ls.commands.RefreshServiceRegistries";

          if (
            node.type !== "array" ||
            !args.codeCompletionStrategy.shouldCreateCodelens({ node, commandName, content: args.content }) ||
            args.config.shouldConfigureServiceRegistries() ||
            !args.config.canRefreshServices()
          ) {
            return [];
          }

          return [
            {
              name: commandName,
              title: "↺ Refresh Service Registries...",
              args: [{ position } as SwfLanguageServiceCommandArgs[typeof commandName]],
            },
          ];
        },
      });

/**
 * Functions to create CodeLenses
 */
export const SwfLanguageServiceCodeLenses: EditorLanguageServiceCodeLenses = {
  createNewFile: (): CodeLens[] => createNewFileCodeLens("Create a Serverless Workflow"),

  addFunction: (args: SwfLanguageServiceCodeLensesFunctionsArgs): CodeLens[] =>
    createOpenCompletionItemsCodeLenses({
      ...args,
      jsonPath: ["functions"],
      title: "+ Add function...",
      nodeType: "array",
    }),

  addEvent: (args: SwfLanguageServiceCodeLensesFunctionsArgs): CodeLens[] =>
    createOpenCompletionItemsCodeLenses({
      ...args,
      jsonPath: ["events"],
      title: "+ Add event...",
      nodeType: "array",
    }),

  addState: (args: SwfLanguageServiceCodeLensesFunctionsArgs): CodeLens[] =>
    createOpenCompletionItemsCodeLenses({
      ...args,
      jsonPath: ["states"],
      title: "+ Add state...",
      nodeType: "array",
    }),

  addFunctionArguments: (args: { language: FileLanguage } & SwfLanguageServiceCodeLensesFunctionsArgs): CodeLens[] => {
    const restFunctions = swfModelQueries.getFunctions(args.rootNode);
    //.filter((f) => f.type === "rest");

    return createCodeLenses({
      document: args.document,
      rootNode: args.rootNode,
      jsonPath: ["states", "*", "actions", "*", "functionRef", "arguments"],
      positionLensAt: "begin",
      commandDelegates: ({ position, node }) => {
        const commandName: SwfLanguageServiceCommandTypes = "swf.ls.commands.OpenArgumentsForm";
        const startNode = nodeUpUntilType(node.parent, "object");
        if (!startNode) {
          return [];
        }

        const swfFunctionRefName: string = findNodeAtLocation(startNode, ["refName"])?.value;
        const operation = restFunctions.find((f) => f.name === swfFunctionRefName)?.operation;

        if (
          node.type !== "object" ||
          !args.codeCompletionStrategy.shouldCreateCodelens({ node, commandName, content: args.content }) ||
          !swfFunctionRefName ||
          !operation
        ) {
          return [];
        }

        const lastDescendent = nodeLastDescendent(node);
        const lastDescendentLine = getLineContentFromOffset(args.content, lastDescendent.offset);

        let startPosition: Position = {
          line: position.line + 1,
          character: position.character,
        };
        let endPosition: Position = {
          line: getLineNumberFromOffset(args.content, lastDescendent.offset) + 1,
          character: lastDescendentLine.length + 1,
        };

        if (args.language === FileLanguage.JSON) {
          startPosition.character = getLineContentFromOffset(args.content, node.offset).length;

          // if arguments is empty
          if (node.offset === lastDescendent.offset) {
            startPosition.character = position.character;
          }

          if (lastDescendentLine[lastDescendentLine.length - 1] != "}") {
            endPosition.line += 1;
            endPosition.character = 2;
          }
        } else {
          startPosition.character = 1;
        }

        return [
          {
            name: commandName,
            title: "+ Add arguments...",
            args: [
              {
                openApiSchemaLocation: operation.split("#")[0],
                operationId: operation.split("#")[1],
                startPosition,
                endPosition,
              } as SwfLanguageServiceCommandArgs[typeof commandName],
            ],
          },
        ];
      },
    });
  },

  setupServiceRegistriesForFunctions: (args: SwfLanguageServiceCodeLensesFunctionsArgs) =>
    setUpRegistries(args, ["functions"]),

  logInServiceRegistriesForFunctions: (args: SwfLanguageServiceCodeLensesFunctionsArgs) =>
    logInRegistries(args, ["functions"]),

  refreshServiceRegistriesForFunctions: (args: SwfLanguageServiceCodeLensesFunctionsArgs) =>
    refreshRegistries(args, ["functions"]),

  setupServiceRegistriesForEvents: (args: SwfLanguageServiceCodeLensesFunctionsArgs) =>
    setUpRegistries(args, ["events"]),

  logInServiceRegistriesForEvents: (args: SwfLanguageServiceCodeLensesFunctionsArgs) =>
    logInRegistries(args, ["events"]),

  refreshServiceRegistriesForEvents: (args: SwfLanguageServiceCodeLensesFunctionsArgs) =>
    refreshRegistries(args, ["events"]),
};
