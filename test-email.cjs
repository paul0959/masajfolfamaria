const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'terapeutmaria@gmail.com',
    pass: 'qsrg zqii khgx bfyk'
  }
});
transporter.verify().then(() => console.log("SMTP OK")).catch(e => console.error("SMTP ERROR:", e));
