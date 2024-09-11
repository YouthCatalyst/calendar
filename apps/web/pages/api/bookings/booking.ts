import type { NextApiRequest, NextApiResponse } from "next/types";
import { z } from "zod";

import prisma from "@calcom/prisma";
import { BookingStatus } from "@calcom/prisma/enums";

import { schemaBookingReadPublic } from "../../../../api/v1/lib/validations/booking";

const getBookingQueries = z.object({
  userEmail: z.string().optional(),
  page: z
    .preprocess((val) => Number(val), z.number().int().positive())
    .optional()
    .default(1),
  take: z
    .preprocess((val) => Number(val), z.number().int().positive())
    .optional()
    .default(10),
  status: z.nativeEnum(BookingStatus).optional(),
});

const postBookingSchema = z.object({
  mentorEmail: z.string(),
  mentee: z.object({
    email: z.string(),
    name: z.string(),
  }),
  eventTypeId: z.number(),
  start: z.string(),
  end: z.string(),
  timeZone: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  status: z.nativeEnum(BookingStatus).optional(),
});

const patchBookingSchema = z.object({
  bookingId: z.number(),
  title: z.string().optional(),
  start: z.string().optional(),
  end: z.string().optional(),
  status: z.nativeEnum(BookingStatus).optional(),
  description: z.string().optional(),
});

async function GET(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userEmail, page, take, status } = getBookingQueries.parse(req.query);

    const totalBookings = await prisma.booking.count({
      where: {
        user: {
          email: userEmail,
        },
        status: status,
      },
    });

    console.log(totalBookings);

    const bookings = await prisma.booking.findMany({
      where: {
        user: {
          email: userEmail,
        },
        status: status,
      },
      take: take,
      skip: (page - 1) * take,
    });

    const mappedBookings = bookings.map((book) => {
      return schemaBookingReadPublic.parse(book);
    });

    const nextPage = page + 1;
    const previousPage = page === 1 ? null : page - 1;

    res.status(200).json({
      message: "Bookings fetched successfully",
      bookings: mappedBookings,
      take: take,
      page: page,
      nextPage: nextPage,
      previousPage: previousPage,
      totalEntries: totalBookings,
    });
  } catch (error: any) {
    res.status(400).json({ message: error });
  }
}

async function POST(req: NextApiRequest, res: NextApiResponse) {
  try {
    const body = postBookingSchema.parse(req.body);

    // Create new Attendee
    const newAttende = await prisma.attendee.create({
      data: {
        email: body.mentee.email,
        name: body.mentee.name,
        timeZone: body.timeZone,
      },
    });

    const mentor = await prisma.user.findFirst({
      where: {
        email: body.mentorEmail,
      },
    });

    if (!mentor) {
      return res.status(404).json({ error: "Mentor not found" });
    }

    const createdBooking = await prisma.booking.create({
      data: {
        uid: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
        startTime: new Date(body.start),
        endTime: new Date(body.end),
        title: body.title ?? `Meet between ${body.mentorEmail} and ${body.mentee.email}`,
        description: body.description ?? `Meet between ${body.mentorEmail} and ${body.mentee.email}`,
        eventTypeId: body.eventTypeId,
        userId: mentor?.id,
        attendees: {
          connect: {
            id: newAttende.id,
          },
        },
      },
    });

    res.status(200).json({
      booking: schemaBookingReadPublic.parse(createdBooking),
      message: "Booking created successfully",
    });
  } catch (error: any) {
    res.status(400).json({ error: error });
  }
}

async function PATCH(req: NextApiRequest, res: NextApiResponse) {
  try {
    const body = patchBookingSchema.parse(req.body);

    const booking = await prisma.booking.update({
      where: {
        id: body.bookingId,
      },
      data: {
        startTime: body.start,
        endTime: body.end,
        title: body.title,
        description: body.description,
        status: body.status,
      },
    });

    res.status(200).json({
      booking: schemaBookingReadPublic.parse(booking),
      message: "Booking updated successfully",
    });
  } catch (error: any) {
    res.status(400).json({ message: error });
  }
}

async function DELETE(req: NextApiRequest, res: NextApiResponse) {
  try {
    const bookingId = z
      .preprocess((val) => Number(val), z.number().int().positive())
      .parse(req.query.bookingId);

    const booking = await prisma.booking.delete({
      where: {
        id: bookingId,
      },
    });

    res.status(200).json({
      booking: schemaBookingReadPublic.parse(booking),
      message: "Booking deleted successfully",
    });
  } catch (error: any) {
    res.status(400).json({ message: error });
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    return GET(req, res);
  } else if (req.method === "POST") {
    return POST(req, res);
  } else if (req.method === "PATCH") {
    return PATCH(req, res);
  } else if (req.method === "DELETE") {
    return DELETE(req, res);
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
