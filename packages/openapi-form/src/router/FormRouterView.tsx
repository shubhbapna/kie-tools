/*
 * Copyright 2022 Red Hat, Inc. and/or its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import * as React from "react";
import { FormUri } from "../registry";
import { SwfServiceCatalogService } from "@kie-tools/serverless-workflow-service-catalog/dist/api";
import { FormGeneratorView } from "../generator";

interface Props {
  onSubmit: (data: object) => Promise<void>;
  catalogStore: SwfServiceCatalogService[];
  openApiSchemaLocation: string;
  operationId: string;
  formUri?: FormUri;
}

export const FormRouterView = (props: Props) => {
  return (
    <>
      {props.formUri?.routeTo ? (
        <iframe src={props.formUri.routeTo} width="100%"></iframe>
      ) : (
        <FormGeneratorView
          onSubmit={props.onSubmit}
          catalogStore={props.catalogStore}
          openApiSchemaLocation={props.openApiSchemaLocation}
          operationId={props.operationId}
        />
      )}
    </>
  );
};
