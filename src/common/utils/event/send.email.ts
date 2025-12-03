// import { Injectable } from '@nestjs/common';
// import * as nodemailer from 'nodemailer';
// import SMTPTransport from 'nodemailer/lib/smtp-transport';
// import { Transporter } from 'nodemailer';
// @Injectable()
// export class EmailService {

import { BadRequestException } from "@nestjs/common";
import { createTransport } from "nodemailer";
import Mail from "nodemailer/lib/mailer";

//     private transporter: Transporter<SMTPTransport.SentMessageInfo, SMTPTransport.Options>;

//     constructor() {
//         console.log({
//             user: process.env.APP_EMAIL,
//             pass: process.env.APP_PASSWORD,
//         });

//         this.transporter = nodemailer.createTransport({
//             service: 'gmail',
//             auth: {
//                 user: process.env.APP_EMAIL,
//                 pass: process.env.APP_PASSWORD,
//             },
//         });
//     }

//     async sendMail(to: string, subject: string, text: string, html?: string) {
//         const mailOptions = {
//             from: `"My App" <${process.env.APP_EMAIL as string}>`,
//             to,
//             subject,
//             text,
//             html,
//         };

//         try {
//             const info = await this.transporter.sendMail(mailOptions);
//             console.log('Email sent:', info.messageId);
//             return info;
//         } catch (error) {
//             console.error('Error sending email:', error);
//             throw error;
//         }
//     }
// }


export const sendEmail = async (data: Mail.Options): Promise<void> => {
    if (!data.html && !data.attachments?.length && !data.text){
        throw new BadRequestException("missing email content")
    }

    const transporter = createTransport({
        service:"gmail",
        auth:{
            user:process.env.APP_EMAIL,
            pass:process.env.APP_PASSWORD
        }
    });

    const info = await transporter.sendMail({
        ...data,
        from:`"${process.env.APPLICATION_NAME}❤️ " <${process.env.APP_EMAIL}>`
    })

    console.log("Message send:",info.messageId);
    
}