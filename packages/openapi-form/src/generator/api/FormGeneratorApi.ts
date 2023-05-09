export interface FormGeneratorApi {
  generate(openApiSchemaLocation: string, operationId: string): object | undefined;
}
