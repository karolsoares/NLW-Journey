import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { request } from "http";
import z from "zod";
import { prisma } from "../lib/prisma";
import dayjs, { Dayjs } from "dayjs";
import { getMailClient } from "../lib/mail";
import nodemailer from 'nodemailer';

export  async function createTrip (app: FastifyInstance){
    app.withTypeProvider<ZodTypeProvider>().post('/trips', {
        schema:{
            body: z.object({
                destination: z.string().min(4),
                start_at: z.coerce.date(),
                ends_at: z.coerce.date(),
                owner_name: z.string(),
                owner_email: z. string(),

            })
        }
    }, async (request) => {

        const  { destination, start_at, ends_at, owner_name, owner_email } = request.body

        if (dayjs(start_at).isBefore(new Date())){
            throw new Error('Invalid trip start date')
        }

        if (dayjs(ends_at).isBefore(start_at)){
            throw new Error('Invalid trip end date')
        }

        const trip = await prisma.trip.create({
            data: {
                destination,
                start_at,
                ends_at,
                owner_name,
                owner_email,
            }
        })

        const mail = await getMailClient()
        
        const message = await mail.sendMail({
            from: {
                name: 'Equip Planner',
                address: 'oi@planner.er',
            },
            to: {
               name: owner_name,
               address: owner_email,
            },
            subject: 'Testando envio de e-mail',
            html: '<p> Teste do envio de e-mail <p>'
        })

        console.log(nodemailer.getTestMessageUrl(message))

        return { tripId: trip.id}
    } )

}