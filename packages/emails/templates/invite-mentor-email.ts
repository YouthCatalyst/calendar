import type { TFunction } from "next-i18next";

import { APP_NAME, EMAIL_FROM_NAME } from "@calcom/lib/constants";

import { renderEmail } from "../";
import BaseEmail from "./_base-email";

export type ActivateMentor = {
  language: TFunction;
  user: {
    name?: string | null;
    email: string;
  };
  activateLink: string;
};

export default class InviteMentorEmail extends BaseEmail {
  activateEvent: ActivateMentor;

  constructor(activateEvent: ActivateMentor) {
    super();
    this.name = "INVITE_MENTOR_EMAIL";
    this.activateEvent = activateEvent;
  }

  protected async getNodeMailerPayload(): Promise<Record<string, unknown>> {
    return {
      to: `${this.activateEvent.user.name} <${this.activateEvent.user.email}>`,
      from: `${EMAIL_FROM_NAME} <${this.getMailerOptions().from}>`,
      subject: `Welcome to FlashCampus, Mentor!`,
      html: await renderEmail("InviteMentorEmail", this.activateEvent),
      text: this.getTextBody(),
    };
  }

  protected getTextBody(): string {
    return `
${this.activateEvent.language("reset_password_subject", { appName: APP_NAME })}
${this.activateEvent.language("hi_user_name", { name: this.activateEvent.user.name })},
${this.activateEvent.language("someone_requested_password_reset")}
${this.activateEvent.language("change_password")}: ${this.activateEvent.activateLink}
${this.activateEvent.language("password_reset_instructions")}
${this.activateEvent.language("have_any_questions")} ${this.activateEvent.language(
      "contact_our_support_team"
    )}
`.replace(/(<([^>]+)>)/gi, "");
  }
}
