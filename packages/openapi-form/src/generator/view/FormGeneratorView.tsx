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
import { useState, useEffect, useMemo } from "react";
import { SwfServiceCatalogService } from "@kie-tools/serverless-workflow-service-catalog/dist/api";
import { FormGeneratorApiImpl } from "./FormGeneratorApiImpl";
import { Uniforms } from "./uniforms";

interface Props {
  onSubmit: (data: object) => void;
  catalogStore: SwfServiceCatalogService[];
  openApiSchemaLocation: string;
  operationId: string;
}

export const FormGeneratorView = (props: Props) => {
  const formGeneratorApi = useMemo(() => new FormGeneratorApiImpl(props.catalogStore), props.catalogStore);
  const formSchema = formGeneratorApi.generate(props.openApiSchemaLocation, props.operationId);
  const [schema, setSchema] = useState(formSchema?.schema);

  useEffect(() => {
    setSchema(formGeneratorApi.generate(props.openApiSchemaLocation, props.operationId)?.schema);
  }, [props.openApiSchemaLocation, props.operationId]);
  return schema ? <Uniforms schema={schema} onSubmit={props.onSubmit} /> : <div>Operation not found</div>;
};
