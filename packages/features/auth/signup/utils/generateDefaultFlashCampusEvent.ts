import type { Prisma } from "@calcom/prisma/client";

export const generateDefaultFlashCampusEvent = (userId: number): Prisma.EventTypeCreateInput => {
  return {
    title: "FC Mentoring 45 Minutes",
    slug: "fc-mentoring-45",
    length: 45,
    owner: { connect: { id: userId } },
    minimumBookingNotice: 2880,
    bookingLimits: {
      PER_WEEK: 5,
    },
    periodDays: 14,
    bookingFields: [
      {
        name: "name",
        type: "name",
        label: "Nama",
        required: true,
        placeholder: "Nama anda",
        defaultLabel: "your_name",
      },
      {
        name: "email",
        type: "email",
        label: "Email",
        required: true,
        placeholder: "example@example.com",
        defaultLabel: "email_address",
      },
      {
        name: "university",
        type: "text",
        label: "Universitas/Institusi",
        required: true,
      },
      {
        name: "whatsapp",
        type: "text",
        label: "No. Whatsapp",
        required: true,
      },
      {
        name: "discussion",
        type: "textarea",
        label: "Hal yang ingin dibahas",
        required: true,
      },
      {
        name: "notes",
        type: "textarea",
        label: "Catatan tambahan",
        required: false,
      },
    ],
    requiresConfirmation: true,
    metadata: {
      managedEventConfig: {
        unlockedFields: {
          locations: true,
          scheduleId: true,
          destinationCalendar: true,
          minimumBookingNotice: true,
        },
      },
    },
    users: { connect: { id: userId } },
  };
};
