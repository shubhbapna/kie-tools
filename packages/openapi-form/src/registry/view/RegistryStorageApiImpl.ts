import { FormUri, RegistryStorageApi } from "../api";

export class RegistryStorageApiImpl implements RegistryStorageApi {
  constructor(private readonly memory: RegistryStorageApi = new InMemomryStorage()) {}

  async add(formUri: FormUri): Promise<void> {
    return this.memory.add(formUri);
  }

  async get(operationId: string, openApiSchemaLocation: string): Promise<FormUri | undefined> {
    return this.memory.get(operationId, openApiSchemaLocation);
  }

  async getAll(): Promise<Record<string, FormUri[]>> {
    return this.memory.getAll();
  }

  async delete(operationId: string, openApiSchemaLocation: string): Promise<void> {
    return this.memory.delete(operationId, openApiSchemaLocation);
  }
}

class InMemomryStorage implements RegistryStorageApi {
  private memory: Record<string, Record<string, FormUri>>;
  constructor() {
    this.memory = {};
  }

  async add(formUri: FormUri): Promise<void> {
    if (!this.memory[formUri.openApiSchemaLocation]) {
      this.memory[formUri.openApiSchemaLocation] = {};
    }
    this.memory[formUri.openApiSchemaLocation][formUri.operationId] = formUri;
  }

  async get(operationId: string, openApiSchemaLocation: string): Promise<FormUri | undefined> {
    return this.memory[openApiSchemaLocation][operationId];
  }

  async getAll(): Promise<Record<string, FormUri[]>> {
    return Object.keys(this.memory).reduce((prev: Record<string, FormUri[]>, curr) => {
      prev[curr] = Object.values(this.memory[curr]);
      return prev;
    }, {});
  }

  async delete(operationId: string, openApiSchemaLocation: string): Promise<void> {
    delete this.memory[openApiSchemaLocation][operationId];
    if (Object.values(this.memory[openApiSchemaLocation]).length === 0) {
      delete this.memory[openApiSchemaLocation];
    }
  }
}
