import type { Dispatch } from "react";
import { shallow } from "zustand/shallow";

import { useOrgBranding } from "@calcom/ee/organizations/context/provider";
import { WEBAPP_URL } from "@calcom/lib/constants";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { trpc } from "@calcom/trpc/react";
import {
  Avatar,
  Label,
  Loader,
  Sheet,
  SheetContent,
  SheetBody,
  Skeleton,
  SheetHeader,
  SheetDescription,
  SheetTitle,
  SheetFooter,
} from "@calcom/ui";

import type { Action, State } from "../UserListTable";
import { DisplayInfo } from "./DisplayInfo";
import { EditForm } from "./EditUserForm";
import { SheetFooterControls } from "./SheetFooterControls";
import { useEditMode } from "./store";

export function EditUserSheet({ state, dispatch }: { state: State; dispatch: Dispatch<Action> }) {
  const { t } = useLocale();
  const { user: selectedUser } = state.editSheet;
  const orgBranding = useOrgBranding();
  const [editMode, setEditMode] = useEditMode((state) => [state.editMode, state.setEditMode], shallow);
  const { data: loadedUser, isPending } = trpc.viewer.organizations.getUser.useQuery({
    userId: selectedUser?.id,
  });

  const avatarURL = `${orgBranding?.fullDomain ?? WEBAPP_URL}/${loadedUser?.username}/avatar.png`;

  const schedulesNames = loadedUser?.schedules && loadedUser?.schedules.map((s) => s.name);
  const teamNames =
    loadedUser?.teams && loadedUser?.teams.map((t) => `${t.name} ${!t.accepted ? "(pending)" : ""}`);

  return (
    <Sheet
      open={true}
      onOpenChange={() => {
        setEditMode(false);
        dispatch({ type: "CLOSE_MODAL" });
      }}>
      <SheetContent>
        {!isPending && loadedUser ? (
          <>
            {!editMode ? (
              <>
                <SheetHeader>
                  <Avatar
                    asChild
                    className="h-[36px] w-[36px]"
                    alt={`${loadedUser?.name} avatar`}
                    imageSrc={loadedUser.avatarUrl}
                  />
                  <SheetTitle>
                    <Skeleton loading={isPending} as="p" waitForTranslation={false}>
                      <span className="text-emphasis text-lg font-semibold">
                        {loadedUser?.name ?? "Nameless User"}
                      </span>
                    </Skeleton>
                  </SheetTitle>
                  <SheetDescription>
                    <Skeleton loading={isPending} as="p" waitForTranslation={false}>
                      <p className="subtle text-sm font-normal">
                        {orgBranding?.fullDomain ?? WEBAPP_URL}/{loadedUser?.username}
                      </p>
                    </Skeleton>
                  </SheetDescription>
                </SheetHeader>
                <SheetBody className="flex flex-col space-y-5">
                  <DisplayInfo label={t("email")} value={loadedUser?.email ?? ""} displayCopy />
                  <DisplayInfo
                    label={t("bio")}
                    badgeColor="gray"
                    value={loadedUser?.bio ? loadedUser?.bio : t("user_has_no_bio")}
                  />
                  <DisplayInfo label={t("role")} value={loadedUser?.role ?? ""} asBadge badgeColor="blue" />
                  <DisplayInfo label={t("timezone")} value={loadedUser?.timeZone ?? ""} />
                  <div className="flex flex-col">
                    <Label className="text-subtle mb-1 text-xs font-semibold uppercase leading-none">
                      {t("availability_schedules")}
                    </Label>
                    <div className="flex flex-col">
                      {schedulesNames
                        ? schedulesNames.map((scheduleName) => (
                            <span
                              key={scheduleName}
                              className="text-emphasis inline-flex items-center gap-1 text-sm font-normal leading-5">
                              {scheduleName}
                            </span>
                          ))
                        : t("user_has_no_schedules")}
                    </div>
                  </div>

                  <DisplayInfo
                    label={t("teams")}
                    displayCount={teamNames?.length ?? 0}
                    value={
                      teamNames && teamNames?.length === 0 ? [t("user_isnt_in_any_teams")] : teamNames ?? "" // TS wtf
                    }
                    asBadge={teamNames && teamNames?.length > 0}
                  />
                </SheetBody>
                <SheetFooter>
                  <SheetFooterControls />
                </SheetFooter>
              </>
            ) : (
              <>
                <EditForm
                  selectedUser={loadedUser}
                  avatarUrl={loadedUser.avatarUrl ?? avatarURL}
                  domainUrl={orgBranding?.fullDomain ?? WEBAPP_URL}
                  dispatch={dispatch}
                />
              </>
            )}
          </>
        ) : (
          <Loader />
        )}
      </SheetContent>
    </Sheet>
  );
}
