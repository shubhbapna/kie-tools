/*
 * Copyright 2020 Red Hat, Inc. and/or its affiliates.
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
import { useImperativeHandle, useState, useMemo, useCallback, useRef } from "react";
import { FormUri, RegistryApi, RegistryStorageApi } from "../api";
import { RegistryStorageApiImpl } from "./RegistryStorageApiImpl";
import { Split, SplitItem, List, ListItem, Button } from "@patternfly/react-core";
import { Uniforms, UniformsApi } from "./uniforms";
import TimesIcon from "@patternfly/react-icons/dist/esm/icons/times-icon";
import {
  SwfServiceCatalogService,
  SwfCatalogSourceType,
} from "@kie-tools/serverless-workflow-service-catalog/dist/api";

interface Props {
  registryStorage?: RegistryStorageApi;
  catalogStore: SwfServiceCatalogService[];
}

export const RegistryForm: React.ForwardRefRenderFunction<RegistryApi, Props> = (props, forwardingRef) => {
  const [operations, setOperations] = useState<Record<string, FormUri[]>>({});
  const formRef = useRef<UniformsApi>(null);

  const registryStorageApiImpl = useMemo(
    () => new RegistryStorageApiImpl(props.registryStorage),
    [props.registryStorage]
  );

  const get = useCallback(
    async (operationId: string, openApiSchemeLocation: string) => {
      return registryStorageApiImpl.get(operationId, openApiSchemeLocation);
    },
    [registryStorageApiImpl]
  );

  const getAll = useCallback(async () => {
    await registryStorageApiImpl.getAll().then(setOperations);
  }, [registryStorageApiImpl]);

  const getFormUri = useCallback(
    async (operationId: string, openApiSchemeLocation: string) => {
      await get(operationId, openApiSchemeLocation).then((formUri) => formRef.current?.setModel(formUri));
    },
    [registryStorageApiImpl]
  );

  const deleteFormUri = useCallback(
    async (operationId: string, openApiSchemeLocation: string) => {
      await registryStorageApiImpl.delete(operationId, openApiSchemeLocation).then(getAll);
    },
    [registryStorageApiImpl]
  );

  const handleSubmit = useCallback(
    async (formUri: FormUri) => {
      await registryStorageApiImpl.add(formUri).then(getAll);
    },
    [registryStorageApiImpl]
  );

  useImperativeHandle(
    forwardingRef,
    () => {
      return {
        getAll,
        get,
      };
    },
    [props]
  );

  return (
    <>
      <Split>
        <SplitItem isFilled>
          <Uniforms
            onSubmit={handleSubmit}
            ref={formRef}
            openApiLocationOptions={props.catalogStore
              .filter((c) => c.source.type === SwfCatalogSourceType.SERVICE_REGISTRY)
              .map((c) => (c.source.type === SwfCatalogSourceType.SERVICE_REGISTRY ? c.source.url : ""))
              .filter((c) => c !== "")}
            operationIdOptions={(openApiLocation) =>
              props.catalogStore
                .find((c) =>
                  c.source.type === SwfCatalogSourceType.SERVICE_REGISTRY ? c.source.url === openApiLocation : false
                )
                ?.functions.map((f) => f.name) ?? []
            }
          />
        </SplitItem>
        <SplitItem isFilled>
          <List>
            {...Object.keys(operations).map((key) => (
              <ListItem key={key}>
                {key}
                <List isPlain isBordered>
                  {operations[key].map((formUri) => (
                    <Split key={formUri.operationId}>
                      <SplitItem isFilled onClick={() => getFormUri(formUri.operationId, key)}>
                        <ListItem>{formUri.operationId}</ListItem>
                      </SplitItem>
                      <SplitItem isFilled>
                        <Button variant="plain" onClick={() => deleteFormUri(formUri.operationId, key)}>
                          <TimesIcon />
                        </Button>
                      </SplitItem>
                    </Split>
                  ))}
                </List>
              </ListItem>
            ))}
          </List>
        </SplitItem>
      </Split>
    </>
  );
};

export const RegistryFormView = React.forwardRef(RegistryForm);
