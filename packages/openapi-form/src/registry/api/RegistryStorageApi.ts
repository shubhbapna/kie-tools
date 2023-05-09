import { FormUri } from "./FormUri";

export interface RegistryStorageApi {
  get(endpoint: string, openApiSchema: string): Promise<FormUri | undefined>;
  getAll(): Promise<Record<string, FormUri[]>>;
  add(formUri: FormUri): Promise<void>;
  delete(endpoint: string, openApiSchema: string): Promise<void>;
}
