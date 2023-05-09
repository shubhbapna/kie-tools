import { FormUri } from "./FormUri";

export interface RegistryApi {
  getAll: () => void;
  get: (endpoint: string, openApiSchema: string) => Promise<FormUri | undefined>;
}
