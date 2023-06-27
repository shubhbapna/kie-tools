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

import {
  ChannelType,
  EditorEnvelopeLocator,
  EditorTheme,
  EnvelopeContent,
  EnvelopeContentType,
  EnvelopeMapping,
  useKogitoEditorEnvelopeContext,
} from "@kie-tools-core/editor/dist/api";
import { EmbeddedEditorFile } from "@kie-tools-core/editor/dist/channel";
import { EmbeddedEditor, useEditorRef, useStateControlSubscription } from "@kie-tools-core/editor/dist/embedded";
import { LoadingScreen } from "@kie-tools-core/editor/dist/envelope";
import { MessageBusClientApi } from "@kie-tools-core/envelope-bus/dist/api";
import { useSharedValue, useSubscription } from "@kie-tools-core/envelope-bus/dist/hooks";
import { Notification } from "@kie-tools-core/notifications/dist/api";
import { WorkspaceEdit } from "@kie-tools-core/workspace/dist/api";
import {
  ServerlessWorkflowDiagramEditorChannelApi,
  ServerlessWorkflowDiagramEditorEnvelopeApi,
} from "@kie-tools/serverless-workflow-diagram-editor-envelope/dist/api";
import { SwfStunnerEditorAPI } from "@kie-tools/serverless-workflow-diagram-editor-envelope/dist/api/SwfStunnerEditorAPI";
import { SwfStunnerEditor } from "@kie-tools/serverless-workflow-diagram-editor-envelope/dist/envelope/ServerlessWorkflowStunnerEditor";
import {
  ServerlessWorkflowTextEditorChannelApi,
  ServerlessWorkflowTextEditorEnvelopeApi,
} from "@kie-tools/serverless-workflow-text-editor/dist/api";
import {
  Drawer,
  DrawerContent,
  DrawerContentBody,
  DrawerPanelBody,
  DrawerPanelContent,
} from "@patternfly/react-core/dist/js/components/Drawer";
import { basename, extname } from "path";
import * as React from "react";
import {
  forwardRef,
  ForwardRefRenderFunction,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { Position } from "monaco-editor";
import { ServerlessWorkflowCombinedEditorChannelApi, SwfFeatureToggle, SwfPreviewOptions } from "../api";
import { useSwfDiagramEditorChannelApi } from "./hooks/useSwfDiagramEditorChannelApi";
import { useSwfTextEditorChannelApi } from "./hooks/useSwfTextEditorChannelApi";
import { Modal, ModalVariant } from "@patternfly/react-core";
import { EmbeddedFormRouter, FormRouterApi, FormUri } from "@kie-tools/openapi-form";
import { SwfLanguageServiceCommandArgs } from "@kie-tools/serverless-workflow-language-service/dist/api";
import { colorNodes } from "./helpers/ColorNodes";

interface Props {
  locale: string;
  isReadOnly: boolean;
  channelType: ChannelType;
  resourcesPathPrefix: string;
  onNewEdit: (edit: WorkspaceEdit) => void;
}

export type ServerlessWorkflowCombinedEditorRef = {
  setContent(path: string, content: string): Promise<void>;
  colorNodes(nodeNames: string[], color: string, colorConnectedEnds: boolean): void;
};

interface File {
  path: string;
  content: string;
}

const ENVELOPE_LOCATOR_TYPE = "swf";

declare global {
  interface Window {
    editor: SwfStunnerEditorAPI;
  }
}

const RefForwardingServerlessWorkflowCombinedEditor: ForwardRefRenderFunction<
  ServerlessWorkflowCombinedEditorRef | undefined,
  Props
> = (props, forwardedRef) => {
  const [file, setFile] = useState<File | undefined>(undefined);

  const [operationId, setOperationId] = useState<string | undefined>(undefined);
  const [openApiSchemaLocation, setOpenApiSchemaLocation] = useState<string | undefined>(undefined);
  const [startPosition, setStartPosition] =
    useState<SwfLanguageServiceCommandArgs["swf.ls.commands.OpenArgumentsForm"]["startPosition"] | undefined>(
      undefined
    );
  const [endPosition, setEndPosition] =
    useState<SwfLanguageServiceCommandArgs["swf.ls.commands.OpenArgumentsForm"]["endPosition"] | undefined>(undefined);
  const [registryStorage, setRegistryStorage] = useState<Record<string, FormUri[]>>({});
  const formRef = useRef<FormRouterApi>(null);
  const [isFormModalOpen, setFormModalOpen] = useState(false);

  const [embeddedTextEditorFile, setEmbeddedTextEditorFile] = useState<EmbeddedEditorFile>();
  const [embeddedDiagramEditorFile, setEmbeddedDiagramEditorFile] = useState<EmbeddedEditorFile>();
  const editorEnvelopeCtx = useKogitoEditorEnvelopeContext<ServerlessWorkflowCombinedEditorChannelApi>();
  const [diagramEditorEnvelopeContent] = useSharedValue<string>(
    editorEnvelopeCtx.channelApi.shared.kogitoSwfGetDiagramEditorEnvelopeContent
  );
  const [mermaidEnvelopeContent] = useSharedValue<string>(
    editorEnvelopeCtx.channelApi.shared.kogitoSwfGetMermaidEnvelopeContent
  );
  const [textEditorEnvelopeContent] = useSharedValue<string>(
    editorEnvelopeCtx.channelApi.shared.kogitoSwfGetTextEditorEnvelopeContent
  );

  const { editor: textEditor, editorRef: textEditorRef } = useEditorRef();
  const { editor: diagramEditor, editorRef: diagramEditorRef } = useEditorRef();

  const [featureToggle] = useSharedValue<SwfFeatureToggle>(
    editorEnvelopeCtx.channelApi?.shared.kogitoSwfFeatureToggle_get
  );
  const [previewOptions] = useSharedValue<SwfPreviewOptions>(
    editorEnvelopeCtx.channelApi?.shared.kogitoSwfPreviewOptions_get
  );
  const lastContent = useRef<string>();

  const [isTextEditorReady, setTextEditorReady] = useState(false);
  const [isDiagramEditorReady, setDiagramEditorReady] = useState(false);
  const [isFormReady, setFormReady] = useState(false);

  const isVscode = useMemo(
    () => props.channelType === ChannelType.VSCODE_DESKTOP || props.channelType === ChannelType.VSCODE_WEB,
    [props.channelType]
  );
  const isStandalone = useMemo(() => props.channelType === ChannelType.STANDALONE, [props.channelType]);

  const targetOrigin = useMemo(() => (isVscode ? "vscode" : window.location.origin), [isVscode]);

  const isCombinedEditorReady = useMemo(() => {
    if (previewOptions?.editorMode === "diagram") {
      return isDiagramEditorReady;
    } else if (previewOptions?.editorMode === "text") {
      return isTextEditorReady;
    } else {
      return isTextEditorReady && isDiagramEditorReady;
    }
  }, [isDiagramEditorReady, isTextEditorReady]);

  const buildEnvelopeContent = (content: string, path: string): EnvelopeContent => {
    if (isStandalone) {
      return {
        type: EnvelopeContentType.CONTENT,
        content: content,
      };
    } else {
      return {
        type: EnvelopeContentType.PATH,
        path,
      };
    }
  };

  const textEditorEnvelopeLocator = useMemo(
    () =>
      new EditorEnvelopeLocator(targetOrigin, [
        new EnvelopeMapping({
          type: ENVELOPE_LOCATOR_TYPE,
          filePathGlob: "**/*.sw.+(json|yml|yaml)",
          resourcesPathPrefix: props.resourcesPathPrefix + "/text",
          envelopeContent: buildEnvelopeContent(
            textEditorEnvelopeContent ?? "",
            props.resourcesPathPrefix + "/serverless-workflow-text-editor-envelope.html"
          ),
        }),
      ]),
    [props.resourcesPathPrefix, targetOrigin, textEditorEnvelopeContent]
  );

  const diagramEditorEnvelopeLocator = useMemo(() => {
    const diagramEnvelopeMappingConfig =
      featureToggle && !featureToggle.stunnerEnabled
        ? {
            resourcesPathPrefix: props.resourcesPathPrefix + "/mermaid",
            envelopeContent: buildEnvelopeContent(
              mermaidEnvelopeContent ?? "",
              props.resourcesPathPrefix + "/serverless-workflow-mermaid-viewer-envelope.html"
            ),
          }
        : {
            resourcesPathPrefix: props.resourcesPathPrefix + "/diagram",
            envelopeContent: buildEnvelopeContent(
              diagramEditorEnvelopeContent ?? "",
              props.resourcesPathPrefix + "/serverless-workflow-diagram-editor-envelope.html"
            ),
          };

    return new EditorEnvelopeLocator(targetOrigin, [
      new EnvelopeMapping({
        type: ENVELOPE_LOCATOR_TYPE,
        filePathGlob: "**/*.sw.+(json|yml|yaml)",
        resourcesPathPrefix: diagramEnvelopeMappingConfig.resourcesPathPrefix,
        envelopeContent: diagramEnvelopeMappingConfig.envelopeContent,
      }),
    ]);
  }, [featureToggle, props.resourcesPathPrefix, targetOrigin, mermaidEnvelopeContent, diagramEditorEnvelopeContent]);

  useImperativeHandle(
    forwardedRef,
    () => {
      return {
        setContent: async (path: string, content: string) => {
          try {
            const match = /\.sw\.(json|yml|yaml)$/.exec(path.toLowerCase());
            const dotExtension = match ? match[0] : extname(path);
            const extension = dotExtension.slice(1);
            const fileName = basename(path);
            const getFileContentsFn = async () => content;

            setFile({ content, path });
            setEmbeddedTextEditorFile({
              path: path,
              getFileContents: getFileContentsFn,
              isReadOnly: props.isReadOnly,
              fileExtension: extension,
              fileName: fileName,
            });

            setEmbeddedDiagramEditorFile({
              path: path,
              getFileContents: getFileContentsFn,
              isReadOnly: true,
              fileExtension: extension,
              fileName: fileName,
            });
          } catch (e) {
            console.error(e);
            throw e;
          }
        },
        getContent: async () => file?.content ?? "",
        getPreview: async () => diagramEditor?.getPreview() ?? "",
        undo: async () => {
          textEditor?.undo();
          diagramEditor?.undo();
        },
        redo: async () => {
          textEditor?.redo();
          diagramEditor?.redo();
        },
        validate: async (): Promise<Notification[]> => textEditor?.validate() ?? [],
        setTheme: async (theme: EditorTheme) => {
          textEditor?.setTheme(theme);
          diagramEditor?.setTheme(theme);
        },
        colorNodes: (nodeNames: string[], color: string, colorConnectedEnds: boolean) => {
          colorNodes(nodeNames, color, colorConnectedEnds);
        },
      };
    },
    [diagramEditor, file, props.isReadOnly, textEditor]
  );

  useStateControlSubscription(
    textEditor,
    useCallback(
      async (_isDirty) => {
        if (!textEditor) {
          return;
        }

        const content = await textEditor.getContent();
        props.onNewEdit(new WorkspaceEdit(content));
        setFile((prevState) => ({
          ...prevState!,
          content,
        }));
      },
      [props, textEditor]
    )
  );

  useStateControlSubscription(
    diagramEditor,
    useCallback(
      async (_isDirty) => {
        if (!diagramEditor) {
          return;
        }

        const content = await diagramEditor.getContent();
        props.onNewEdit(new WorkspaceEdit(content));
        setFile((prevState) => ({
          ...prevState!,
          content,
        }));
      },
      [props, diagramEditor]
    )
  );

  const updateEditors = useCallback(
    async (f: File) => {
      if (!textEditor || !diagramEditor) {
        return;
      }

      // No need to update textEditor as long as diagramEditor is readonly
      // await textEditor.setContent(f.path, f.content);
      await diagramEditor.setContent(f.path, f.content);
    },
    [diagramEditor, textEditor]
  );

  useEffect(() => {
    if (file?.content === undefined || file.content === lastContent.current) {
      return;
    }

    lastContent.current = file.content;
    updateEditors(file);
  }, [file, props, updateEditors]);

  const onTextEditorReady = useCallback(() => {
    setTextEditorReady(true);
  }, []);

  const onTextEditorSetContentError = useCallback(() => {
    console.error("Error setting content on text editor");
  }, []);

  const onDiagramEditorReady = useCallback(() => {
    setDiagramEditorReady(true);
  }, []);

  const onDiagramEditorSetContentError = useCallback(() => {
    console.error("Error setting content on diagram editor");
  }, []);

  const onFormReady = useCallback(() => {
    setFormReady(true);
  }, []);

  const onOpenForm = useCallback(
    (args: SwfLanguageServiceCommandArgs["swf.ls.commands.OpenArgumentsForm"]) => {
      editorEnvelopeCtx.channelApi.requests.kogitoSwfFormRegistryStorage_get().then((registry) => {
        setRegistryStorage(registry);
        setOperationId(args.operationId);
        setOpenApiSchemaLocation(args.openApiSchemaLocation);
        setStartPosition(args.startPosition);
        setEndPosition(args.endPosition);
        setFormModalOpen(true);
      });
    },
    [editorEnvelopeCtx, formRef]
  );

  const onCloseForm = useCallback(() => {
    setFormReady(false);
    setFormModalOpen(false);
  }, []);

  const onFormSubmit = useCallback(
    (data: any) => {
      if (startPosition && endPosition) {
        const swfTextEditorEnvelopeApi = textEditor?.getEnvelopeServer()
          .envelopeApi as unknown as MessageBusClientApi<ServerlessWorkflowTextEditorEnvelopeApi>;

        swfTextEditorEnvelopeApi.notifications.kogitoSwfTextEditor__executeEdit.send(
          JSON.stringify(data),
          {
            startLineNumber: startPosition.line,
            endLineNumber: endPosition.line,
            startColumn: startPosition.character,
            endColumn: endPosition.character,
          },
          `submit-form${startPosition.line}`
        );
        setOperationId(undefined);
        setOpenApiSchemaLocation(undefined);
        setStartPosition(undefined);
        setEndPosition(undefined);
        setFormModalOpen(false);
        setFormReady(false);
      }
    },
    [startPosition, endPosition]
  );

  const formRouterApiImpl = useMemo(
    () => ({
      form__submit: onFormSubmit,
      form__ready: onFormReady,
    }),
    [startPosition, endPosition]
  );

  const useSwfDiagramEditorChannelApiArgs = useMemo(
    () => ({
      channelApi:
        editorEnvelopeCtx.channelApi as unknown as MessageBusClientApi<ServerlessWorkflowDiagramEditorChannelApi>,
      locale: props.locale,
      embeddedEditorFile: embeddedDiagramEditorFile,
      onEditorReady: onDiagramEditorReady,
      swfTextEditorEnvelopeApi: textEditor?.getEnvelopeServer()
        .envelopeApi as unknown as MessageBusClientApi<ServerlessWorkflowTextEditorEnvelopeApi>,
    }),
    [editorEnvelopeCtx, embeddedDiagramEditorFile, onDiagramEditorReady, textEditor, props.locale]
  );

  const useSwfTextEditorChannelApiArgs = useMemo(
    () => ({
      channelApi:
        editorEnvelopeCtx.channelApi as unknown as MessageBusClientApi<ServerlessWorkflowTextEditorChannelApi>,
      locale: props.locale,
      embeddedEditorFile: embeddedTextEditorFile,
      onEditorReady: onTextEditorReady,
      onOpenForm,
      swfDiagramEditorEnvelopeApi: diagramEditor?.getEnvelopeServer()
        .envelopeApi as unknown as MessageBusClientApi<ServerlessWorkflowDiagramEditorEnvelopeApi>,
    }),
    [editorEnvelopeCtx, onTextEditorReady, diagramEditor, embeddedTextEditorFile, props.locale]
  );

  const { stateControl: diagramEditorStateControl, channelApi: diagramEditorChannelApi } =
    useSwfDiagramEditorChannelApi(useSwfDiagramEditorChannelApiArgs);

  const { stateControl: textEditorStateControl, channelApi: textEditorChannelApi } =
    useSwfTextEditorChannelApi(useSwfTextEditorChannelApiArgs);

  const renderTextEditor = () => {
    return (
      embeddedTextEditorFile && (
        <EmbeddedEditor
          ref={textEditorRef}
          file={embeddedTextEditorFile}
          channelType={props.channelType}
          kogitoEditor_ready={onTextEditorReady}
          kogitoEditor_setContentError={onTextEditorSetContentError}
          editorEnvelopeLocator={textEditorEnvelopeLocator}
          locale={props.locale}
          customChannelApiImpl={textEditorChannelApi}
          stateControl={textEditorStateControl}
          isReady={isTextEditorReady}
        />
      )
    );
  };

  const renderDiagramEditor = () => {
    return (
      embeddedDiagramEditorFile && (
        <EmbeddedEditor
          ref={diagramEditorRef}
          file={embeddedDiagramEditorFile}
          channelType={props.channelType}
          kogitoEditor_ready={onDiagramEditorReady}
          kogitoEditor_setContentError={onDiagramEditorSetContentError}
          editorEnvelopeLocator={diagramEditorEnvelopeLocator}
          locale={props.locale}
          customChannelApiImpl={diagramEditorChannelApi}
          stateControl={diagramEditorStateControl}
        />
      )
    );
  };

  window.editor = useMemo(
    () =>
      new SwfStunnerEditor(
        diagramEditor?.getEnvelopeServer()
          .envelopeApi as unknown as MessageBusClientApi<ServerlessWorkflowDiagramEditorEnvelopeApi>
      ),
    [diagramEditor]
  );

  useEffect(() => {
    if (isCombinedEditorReady) {
      editorEnvelopeCtx.channelApi.notifications.kogitoSwfCombinedEditor_combinedEditorReady.send();
    }
  }, [isCombinedEditorReady]);

  useEffect(() => {
    if (isFormModalOpen && isFormReady) {
      formRef.current!.setData({
        catalogStore: textEditorChannelApi?.kogitoSwfServiceCatalog_services().defaultValue ?? [],
        openApiSchemaLocation: openApiSchemaLocation!,
        operationId: operationId!,
        formUri: registryStorage[openApiSchemaLocation!]?.find((r) => r.operationId === operationId),
      });
    }
  }, [isFormModalOpen, textEditorChannelApi, isFormReady]);

  useSubscription(
    editorEnvelopeCtx.channelApi.notifications.kogitoSwfCombinedEditor_moveCursorToPosition,
    useCallback(
      (position: Position) => {
        const swfTextEditorEnvelopeApi = textEditor?.getEnvelopeServer()
          .envelopeApi as unknown as MessageBusClientApi<ServerlessWorkflowTextEditorEnvelopeApi>;

        swfTextEditorEnvelopeApi.notifications.kogitoSwfTextEditor__moveCursorToPosition.send(position);
      },
      [textEditor]
    )
  );

  return (
    <div style={{ height: "100%" }}>
      <LoadingScreen loading={!isCombinedEditorReady} />
      <Modal isOpen={isFormModalOpen} onClose={onCloseForm} style={{ height: "50vh" }} variant={ModalVariant.small}>
        <EmbeddedFormRouter
          apiImpl={formRouterApiImpl}
          name={"EmbeddedForm"}
          ref={formRef}
          targetOrigin={targetOrigin}
          envelopePath={"serverless-workflow-form-envelope.html"}
        />
      </Modal>
      {previewOptions?.editorMode === "diagram" ? (
        renderDiagramEditor()
      ) : previewOptions?.editorMode === "text" ? (
        renderTextEditor()
      ) : (
        <Drawer isExpanded={true} isInline={true}>
          <DrawerContent
            panelContent={
              <DrawerPanelContent isResizable={true} defaultSize={previewOptions?.defaultWidth ?? "50%"}>
                <DrawerPanelBody style={{ padding: 0 }}>{renderDiagramEditor()}</DrawerPanelBody>
              </DrawerPanelContent>
            }
          >
            <DrawerContentBody>{renderTextEditor()}</DrawerContentBody>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  );
};

export const ServerlessWorkflowCombinedEditor = forwardRef(RefForwardingServerlessWorkflowCombinedEditor);
