/*
 * Copyright 2023 Red Hat, Inc. and/or its affiliates.
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
import { FormRouterApi, FormRouterChannelApi, FormRouterInitArgs } from "../api";
import { MessageBusClientApi } from "@kie-tools-core/envelope-bus/dist/api";
import { FormRouterView, FormRouterViewProps } from "../router/FormRouterView";
import "@patternfly/react-core/dist/styles/base.css";

interface Props {
  initArgs: FormRouterInitArgs;
  channelApi: MessageBusClientApi<FormRouterChannelApi>;
}

export const FormRouterViewer = React.forwardRef<FormRouterApi, Props>((props, forwardedRef) => {
  const [data, setData] = React.useState<FormRouterViewProps>();
  React.useImperativeHandle(
    forwardedRef,
    () => ({
      setData: async (data: any) => {
        setData(data);
      },
    }),
    []
  );

  const onSubmit = React.useCallback(
    (data) => {
      props.channelApi.notifications.form__submit.send(data);
    },
    [props.channelApi]
  );

  return data ? (
    <FormRouterView
      onSubmit={onSubmit}
      catalogStore={data.catalogStore}
      formUri={data.formUri}
      openApiSchemaLocation={data.openApiSchemaLocation}
      operationId={data.operationId}
    />
  ) : (
    <div>Loading...</div>
  );
});
