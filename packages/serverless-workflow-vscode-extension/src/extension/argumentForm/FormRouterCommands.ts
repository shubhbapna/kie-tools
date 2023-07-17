/*
 * Copyright 2023 Red Hat, Inc. and/or its affiliates.
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

import * as vscode from "vscode";
import { SwfVsCodeExtensionConfiguration } from "../configuration";
import { COMMAND_IDS } from "../commandIds";
import {
  FileLanguage,
  getFileLanguageOrThrow,
  SwfLanguageServiceCommandArgs,
} from "@kie-tools/serverless-workflow-language-service/dist/api";
import { FormRouterEnvelopeApi, RegistryStorageApi } from "@kie-tools/openapi-form";
import { FormRouterWebview } from "@kie-tools/openapi-form/dist/vscode";
import { MessageBusClientApi } from "@kie-tools-core/envelope-bus/dist/api";
import { VsCodeKieEditorStore } from "@kie-tools-core/vscode-extension";
import { SwfServiceCatalogService } from "@kie-tools/serverless-workflow-service-catalog/dist/api";
import * as YAML from "yaml";
import { indentText } from "@kie-tools/json-yaml-language-service/dist/channel";

export class FormRouterCommands {
  private envelopeApiImpl: MessageBusClientApi<FormRouterEnvelopeApi> | undefined;
  private formRouterWebview: FormRouterWebview | undefined;

  private onCloseWebview() {
    this.formRouterWebview?.close();
  }

  private createNewWebview(
    context: vscode.ExtensionContext,
    cmdArgs: SwfLanguageServiceCommandArgs["swf.ls.commands.OpenArgumentsForm"],
    textEditor: vscode.TextEditor
  ) {
    return new FormRouterWebview(
      context,
      {
        envelopePath: "./dist/webview/editors/serverless-workflow/serverless-workflow-form-envelope.js",
        title: cmdArgs.operationId,
        targetOrigin: "vscode",
        name: "vscode-embedded-form",
      },
      {
        form__submit: (data) => {
          console.log(data);
          console.log(cmdArgs.startPosition, cmdArgs.endPosition);
          textEditor.edit((editBuilder) => {
            const fileType = getFileLanguageOrThrow(textEditor.document.fileName);

            const stringifier = (data: JSON) => {
              return fileType === FileLanguage.YAML
                ? indentText(YAML.stringify(data), 12, " ", false)
                : JSON.stringify(data);
            };

            const startLinePad = fileType === FileLanguage.YAML ? 1 : 0;

            const startPosition = new vscode.Position(
              cmdArgs.startPosition.line - 1,
              cmdArgs.startPosition.character - startLinePad
            );
            const endPosition = new vscode.Position(cmdArgs.endPosition.line - 1, cmdArgs.endPosition.character);

            editBuilder.replace(new vscode.Range(startPosition, endPosition), stringifier(data));
            this.onCloseWebview();
          });
        },
        form__ready: () => {},
      }
    );
  }

  public async setupFormRouterCommands(args: {
    context: vscode.ExtensionContext;
    configuration: SwfVsCodeExtensionConfiguration;
    kieEditorsStore: VsCodeKieEditorStore;
    catalogStore: SwfServiceCatalogService[];
    formRegistryStore: RegistryStorageApi;
  }) {
    args.context.subscriptions.push(
      vscode.commands.registerCommand(
        COMMAND_IDS.openArgumentForm,
        async (
          cmdArgs: SwfLanguageServiceCommandArgs["swf.ls.commands.OpenArgumentsForm"],
          textEditor: vscode.TextEditor
        ) => {
          if (!this.formRouterWebview) {
            this.formRouterWebview = this.createNewWebview(args.context, cmdArgs, textEditor);
            // rearrange into 1x2 layout
            await vscode.commands.executeCommand("vscode.setEditorLayout", {
              orientation: 0,
              groups: [{ size: 1 }, { size: 1, groups: [{ size: 0.5 }, { size: 0.5 }] }],
            });

            this.envelopeApiImpl = this.formRouterWebview.open("form-router-view", {
              onClose: () => {
                this.formRouterWebview = undefined;
                this.envelopeApiImpl = undefined;
              },
              col: vscode.ViewColumn.Three,
            });
          }

          this.formRouterWebview.updateTitle(cmdArgs.operationId);

          console.log("form data", {
            catalogStore: args.catalogStore,
            openApiSchemaLocation: cmdArgs.openApiSchemaLocation,
            operationId: cmdArgs.operationId,
            formUri: await args.formRegistryStore.get(cmdArgs.operationId, cmdArgs.openApiSchemaLocation),
          });

          this.envelopeApiImpl?.requests.form__setData({
            catalogStore: args.catalogStore,
            openApiSchemaLocation: cmdArgs.openApiSchemaLocation,
            operationId: cmdArgs.operationId,
            formUri: await args.formRegistryStore.get(cmdArgs.operationId, cmdArgs.openApiSchemaLocation),
          });
        }
      )
    );
  }
}
