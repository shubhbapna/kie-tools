import * as React from "react";
import { useRef, useEffect } from "react";
import { RegistryApi, RegistryFormView } from "@kie-tools/openapi-form";
import { Page, PageSection } from "@patternfly/react-core/dist/js/components/Page";
import { Text, TextContent, TextVariants } from "@patternfly/react-core/dist/js/components/Text";
import { useSettings, useSettingsDispatch } from "../SettingsContext";
import { SettingsTabs } from "../SettingsModalBody";
import { useFormRegistryStorageContext } from "../../formRegistryStorage/FormRegistryStorageContext";

export function OpenApiFormSettingsTab() {
  const registryRef = useRef<RegistryApi>(null);
  const settings = useSettings();
  const formRegistryStorageContext = useFormRegistryStorageContext();
  const settingsDispatch = useSettingsDispatch();

  useEffect(() => {
    if (settings.activeTab === SettingsTabs.OPEN_API_FORM) {
      settingsDispatch.serviceRegistry.catalogStore.refresh();
      registryRef.current?.getAll();
    }
  }, [settings.activeTab, settingsDispatch.serviceRegistry]);
  return (
    <Page>
      <PageSection>
        <PageSection variant={"light"} isFilled={true} style={{ height: "100%" }}>
          <TextContent>
            <Text component={TextVariants.h3}>Open API Forms</Text>
          </TextContent>
          <RegistryFormView
            ref={registryRef}
            catalogStore={settingsDispatch.serviceRegistry.catalogStore.services}
            registryStorage={formRegistryStorageContext}
          />
        </PageSection>
      </PageSection>
    </Page>
  );
}
