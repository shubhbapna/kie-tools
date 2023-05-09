import {
  SwfCatalogSourceType,
  SwfServiceCatalogFunctionArguments,
  SwfServiceCatalogFunctionArgumentType,
  SwfServiceCatalogService,
} from "@kie-tools/serverless-workflow-service-catalog/dist/api";
import { FormGeneratorApi, FormSchemaBase } from "../api";

export class FormGeneratorApiImpl implements FormGeneratorApi {
  constructor(private readonly catalogStore: SwfServiceCatalogService[]) {}
  generate(openApiSchemaLocation: string, operationId: string): { model: object; schema: object } | undefined {
    const operationArguments = this.locateOperationArguments(openApiSchemaLocation, operationId);
    const required = this.locateOperationRequiredArguments(openApiSchemaLocation, operationId);
    if (!operationArguments) {
      return undefined;
    }
    return {
      model: operationArguments,
      schema: Object.keys(operationArguments).reduce(
        (schema: FormSchemaBase, prev) => {
          this.extractArguments(operationArguments, prev, schema);
          return schema;
        },
        {
          type: "object",
          properties: {},
          required,
        }
      ),
    };
  }

  private locateOperationArguments(openApiSchemaLocation: string, operationId: string) {
    return this.catalogStore
      .find((c) =>
        c.source.type === SwfCatalogSourceType.SERVICE_REGISTRY ? c.source.url === openApiSchemaLocation : false
      )
      ?.functions.find((f) => f.name === operationId)?.arguments;
  }

  private locateOperationRequiredArguments(openApiSchemaLocation: string, operationId: string) {
    return (
      this.catalogStore
        .find((c) =>
          c.source.type === SwfCatalogSourceType.SERVICE_REGISTRY ? c.source.url === openApiSchemaLocation : false
        )
        ?.functions.find((f) => f.name === operationId)?.requiredArguments ?? []
    );
  }

  private extractArguments(
    operationArguments: SwfServiceCatalogFunctionArguments,
    argument: string,
    schema: FormSchemaBase
  ) {
    if (!schema.properties) {
      schema.properties = {};
    }
    if (typeof operationArguments[argument] === "string") {
      if (operationArguments[argument] !== "array") {
        schema.properties[argument] = {
          type: operationArguments[argument] as string,
        };
      }
    } else if (Array.isArray(operationArguments[argument])) {
      const args = (
        operationArguments[argument] as SwfServiceCatalogFunctionArgumentType[] | SwfServiceCatalogFunctionArguments[]
      )[0];
      if (typeof args === "string") {
        schema.properties[argument] = {
          type: "array",
          items: { type: args },
        };
      } else {
        const itemProperties = {
          type: "object",
          properties: {} as FormSchemaBase["properties"],
        };
        Object.keys(args).forEach((key) => this.extractArguments(args, key, itemProperties));
        schema.properties[argument] = {
          type: "array",
          items: itemProperties,
        };
      }
    } else {
      schema.properties[argument] = {
        type: "object",
        properties: {} as FormSchemaBase["properties"],
      };
      Object.keys(operationArguments[argument]).forEach((key) =>
        this.extractArguments(
          operationArguments[argument] as SwfServiceCatalogFunctionArguments,
          key,
          schema.properties![argument] as FormSchemaBase
        )
      );
    }
  }
}
