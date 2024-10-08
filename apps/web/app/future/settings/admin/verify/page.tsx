import { _generateMetadata } from "app/_utils";
import { WithLayout } from "app/layoutHOC";

import Page from "@calcom/features/ee/users/pages/users-verify-view";
import { getLayout } from "@calcom/features/settings/layouts/SettingsLayoutAppDir";

export const generateMetadata = async () =>
  await _generateMetadata(
    () => "Users",
    () =>
      "A list of all the unactivated/unverified users in your account. Press the activate button to activate and send the activation mail to them"
  );

export default WithLayout({ getLayout, Page })<"P">;
