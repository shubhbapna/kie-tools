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
import { useCallback } from "react";
import { EnvelopeServer } from "@kie-tools-core/envelope-bus/dist/channel";
import { EmbeddedEnvelopeProps, RefForwardingEmbeddedEnvelope } from "@kie-tools-core/envelope/dist/embedded";
import { ContainerType } from "@kie-tools-core/envelope/dist/api";
import { FormRouterApi, FormRouterChannelApi, FormRouterEnvelopeApi } from "../api";
import { FormRouterViewProps } from "../router";

export type Props = {
  apiImpl: FormRouterChannelApi;
  targetOrigin: string;
  name: string;
  envelopePath: string;
};

const EmbeddedFormRouterEnvelope =
  React.forwardRef<FormRouterApi, EmbeddedEnvelopeProps<FormRouterChannelApi, FormRouterEnvelopeApi, FormRouterApi>>(
    RefForwardingEmbeddedEnvelope
  );

export const EmbeddedFormRouter = React.forwardRef<FormRouterApi, Props>((props, forwardedRef) => {
  const refDelegate = useCallback(
    (envelopeServer: EnvelopeServer<FormRouterChannelApi, FormRouterEnvelopeApi>): FormRouterApi => ({
      setData: (data: FormRouterViewProps) => {
        return envelopeServer.envelopeApi.requests.form__setData(data);
      },
    }),
    []
  );

  const pollInit = useCallback(
    (
      envelopeServer: EnvelopeServer<FormRouterChannelApi, FormRouterEnvelopeApi>,
      container: () => HTMLIFrameElement
    ) => {
      return envelopeServer.envelopeApi.requests.form__init(
        { origin: envelopeServer.origin, envelopeServerId: envelopeServer.id },
        { name: props.name }
      );
    },
    [props.name]
  );

  return (
    <EmbeddedFormRouterEnvelope
      ref={forwardedRef}
      apiImpl={props.apiImpl}
      origin={props.targetOrigin}
      refDelegate={refDelegate}
      pollInit={pollInit}
      config={{
        containerType: ContainerType.IFRAME,
        envelopePath: props.envelopePath,
      }}
    />
  );
});
