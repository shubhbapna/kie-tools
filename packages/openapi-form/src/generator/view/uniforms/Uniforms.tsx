import * as React from "react";
import { AutoForm } from "@kie-tools/uniforms-patternfly/dist/esm";
import { JSONSchemaBridge } from "uniforms-bridge-json-schema";
import Ajv from "ajv";

interface Props {
  onSubmit: (data: object) => Promise<void>;
  schema: object;
}

export const Uniforms = (props: Props) => {
  const ajv = new Ajv({ allErrors: true, useDefaults: true });
  function createValidator(schemaTemplate: object) {
    const validator = ajv.compile(schemaTemplate);

    return (modelTemplate: object) => {
      validator(modelTemplate);
      return validator.errors?.length ? { details: validator.errors } : null;
    };
  }

  const bridge = new JSONSchemaBridge(props.schema, createValidator(props.schema));

  return (
    <>
      <AutoForm schema={bridge} onSubmit={props.onSubmit} />
    </>
  );
};
