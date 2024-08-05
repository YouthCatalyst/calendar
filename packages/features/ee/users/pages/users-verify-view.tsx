"use client";

import NoSSR from "@calcom/core/components/NoSSR";
import { Meta } from "@calcom/ui";

import { getLayout } from "../../../settings/layouts/SettingsLayout";
import { UsersTable } from "../components/UnverifiedUsersTable";

const DeploymentUsersListPage = () => {
  return (
    <>
      <Meta
        title="Unverified Users"
        description="A list of all the unverfied users in your account including their name, title, email and role."
        CTA={
          <div className="mt-4 space-x-5 sm:ml-16 sm:mt-0 sm:flex-none">
            {/* TODO: Add import users functionality */}
            {/* <Button disabled>Import users</Button> */}
          </div>
        }
      />
      <NoSSR>
        <UsersTable />
      </NoSSR>
    </>
  );
};

DeploymentUsersListPage.getLayout = getLayout;

export default DeploymentUsersListPage;
