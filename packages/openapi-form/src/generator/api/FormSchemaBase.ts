export interface FormSchemaBase {
  type: string;
  properties?: {
    [key: string]: {
      type: string;
      properties?: FormSchemaBase["properties"];
      items?: FormSchemaBase["items"];
    };
  };
  items?: {
    type: string;
    properties?: FormSchemaBase["properties"];
  };
  required?: string[];
}
