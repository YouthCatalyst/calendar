import type { TFunction } from "next-i18next";

import { BaseEmailHtml, CallToAction } from "../components";

export type ActivateMentor = {
  language: TFunction;
  user: {
    name?: string | null;
    email: string;
  };
  activateLink: string;
};
export const InviteMentorEmail = (
  props: ActivateMentor & Partial<React.ComponentProps<typeof BaseEmailHtml>>
) => {
  return (
    <BaseEmailHtml subject="Selamat datang, Mentor FlashCampus!">
      <p>
        <>Halo, {props.user.name ?? props.user.email}!</>
      </p>
      <p style={{ fontWeight: 400, lineHeight: "24px" }}>
        <>
          {
            "Anda telah resmi terdaftar sebagai salah satu Mentor kami! \nSilahkan cek dashboard untuk mengatur sesi mentoring! "
          }
        </>
      </p>

      <CallToAction label="Cek Dashboard Anda!" href={props.activateLink} />

      <div style={{ lineHeight: "6px" }}>
        <p style={{ fontWeight: 400, lineHeight: "24px" }}>
          <>Terima kasih telah menjadi mentor. Mari bantu pelajar Indonesia untuk menjadi semakin maju!</>
        </p>
      </div>
    </BaseEmailHtml>
  );
};
