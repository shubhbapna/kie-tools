import * as vscode from "vscode";
import { COMMAND_IDS } from "../commandIds";
import { RegistryStorageApi } from "@kie-tools/openapi-form";

export class FormRegistryCommand {
  register(args: { context: vscode.ExtensionContext; store: RegistryStorageApi }) {
    args.context.subscriptions.push(
      vscode.commands.registerCommand(COMMAND_IDS.formRegistryAdd, this.add.bind(this, args.store))
    );

    args.context.subscriptions.push(
      vscode.commands.registerCommand(COMMAND_IDS.formRegistryRemove, this.remove.bind(this, args.store))
    );
  }

  private async add(store: RegistryStorageApi) {
    const openApiSchemaLocation = (await vscode.window.showInputBox({
      prompt: "Location of the open API Schema",
      placeHolder: "Eg: http://localhost:8080/apis/registry/v2/groups/swagger/artifacts/petstore",
      validateInput: (value) => (value === "" ? "open API Schema location cannot be empty" : undefined),
    })) as string;

    const operationId = (await vscode.window.showInputBox({
      prompt: "Operation name from the open API SChema",
      placeHolder: "Eg: addPet",
      validateInput: (value) => (value === "" ? "open API Schema location cannot be empty" : undefined),
    })) as string;

    const routeTo = (await vscode.window.showInputBox({
      prompt: "Location of the custom form",
      placeHolder: "Eg: http://localhost:3030/addPet.html",
      validateInput: (value) => (value === "" ? "open API Schema location cannot be empty" : undefined),
    })) as string;

    await store.add({
      openApiSchemaLocation,
      operationId,
      routeTo,
    });
  }

  private async remove(store: RegistryStorageApi) {
    const openApiSchemaLocation = (await vscode.window.showInputBox({
      prompt: "Location of the open API Schema",
      placeHolder: "Eg: http://localhost:8080/apis/registry/v2/groups/swagger/artifacts/petstore",
      validateInput: (value) => (value === "" ? "open API Schema location cannot be empty" : undefined),
    })) as string;

    const operationId = (await vscode.window.showInputBox({
      prompt: "Operation name from the open API SChema",
      placeHolder: "Eg: addPet",
      validateInput: (value) => (value === "" ? "open API Schema location cannot be empty" : undefined),
    })) as string;

    await store.delete(operationId, openApiSchemaLocation);
  }
}
