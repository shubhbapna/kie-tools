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

import * as React from "react";
import { AutoForm } from "@kie-tools/uniforms-patternfly/dist/esm";
import { JSONSchemaBridge } from "uniforms-bridge-json-schema";
import Ajv from "ajv";

interface Props {
  onSubmit: (data: object) => void;
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
