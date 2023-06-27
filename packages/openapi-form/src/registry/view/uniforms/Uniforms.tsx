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
import { useState, useImperativeHandle } from "react";
import { AutoField, AutoForm, SelectField, SubmitField } from "@kie-tools/uniforms-patternfly/dist/esm";
import { JSONSchemaBridge } from "uniforms-bridge-json-schema";
import Ajv from "ajv";
import { FormUri } from "../../api";

// ask if i can upgrade ajv to v8 so that I can have JSONSchemaType to link the FormUri type with the schema
const FormUriSchema = {
  type: "object",
  properties: {
    openApiSchemaLocation: {
      type: "string",
    },
    operationId: {
      type: "string",
    },
    routeTo: {
      type: "string",
    },
  },
  required: ["openApiSchemaLocation", "operationId", "routeTo"],
};

const ajv = new Ajv({ allErrors: true, useDefaults: true });
function createValidator(schema: object) {
  const validator = ajv.compile(schema);

  return (model: object) => {
    validator(model);
    return validator.errors?.length ? { details: validator.errors } : null;
  };
}

interface Props {
  onSubmit: (data: Object) => Promise<void>;
  openApiLocationOptions: string[];
  operationIdOptions: (openApiLocation: string) => string[];
}

export interface UniformsApi {
  setModel: (formUri: FormUri | undefined) => void;
  getModel: () => FormUri;
}

export const UniformsRef: React.ForwardRefRenderFunction<UniformsApi, Props> = (props, forwardingRef) => {
  const bridge = new JSONSchemaBridge(FormUriSchema, createValidator(FormUriSchema));
  const [operationId, setOperationId] = useState(props.operationIdOptions(props.openApiLocationOptions[0])[0]);
  const [openApiSchemaLocation, setOpenApiSchemaLocation] = useState(props.openApiLocationOptions[0]);
  const [routeTo, setRouteTo] = useState("");

  const updateOperationId = (operationId: string) => {
    setOperationId(operationId);
  };

  const updateOpenApiSchemaLocation = (openApiSchemaLocation: string) => {
    setOpenApiSchemaLocation(openApiSchemaLocation);
    setOperationId(props.operationIdOptions(openApiSchemaLocation)[0]);
  };

  const updateRouteTo = (routeTo: string) => {
    setRouteTo(routeTo);
  };

  useImperativeHandle(
    forwardingRef,
    () => {
      return {
        setModel: (formUri) => {
          setOpenApiSchemaLocation(formUri?.openApiSchemaLocation ?? "");
          setOperationId(formUri?.operationId ?? props.operationIdOptions(openApiSchemaLocation)[0]);
          setRouteTo(formUri?.routeTo ?? "");
        },
        getModel: () => ({ openApiSchemaLocation, operationId, routeTo }),
      };
    },
    [props]
  );

  return (
    <>
      <AutoForm
        schema={bridge}
        onSubmit={() => props.onSubmit({ openApiSchemaLocation, operationId, routeTo })}
        model={{ openApiSchemaLocation, operationId, routeTo }}
      >
        <SelectField
          name="openApiSchemaLocation"
          allowedValues={props.openApiLocationOptions}
          onChange={updateOpenApiSchemaLocation}
        />
        <SelectField
          name="operationId"
          allowedValues={props.operationIdOptions(openApiSchemaLocation)}
          onChange={updateOperationId}
        />
        <AutoField name="routeTo" onChange={updateRouteTo} />
        <SubmitField />
      </AutoForm>
    </>
  );
};

export const Uniforms = React.forwardRef(UniformsRef);
