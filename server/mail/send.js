import nodemailer from 'nodemailer'
import dotnet from 'dotenv'

dotnet.config()

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.MAIL_EMAIL,
        pass: process.env.MAIL_SECRET
    }
})

export default ({ to, subject, html }) => {
    var options = {
        from: `SignalTech <${process.env.MAIL_EMAIL}>`,
        to,
        subject,
        html
    }

    transporter.sendMail(options, function (err, done) {
        if (err) {
            console.log(err);
        } else {
            console.log('Email sent: ', done?.response);
        }
    });
}