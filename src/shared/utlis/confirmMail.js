const bcrypt = require("bcrypt");

let response = {};
const sendVerifiedEmail = ({ email, id }, createdUniqueString) => {
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.AUHT_EMAIL,
      pass: process.env.AUHT_PASSWORD,
    },
  });

  transporter.verify((error, success) => {
    if (error) {
      console.log(error);
    } else {
      console.log("ready for messages");
      console.log(success);
    }
  });

  //url to be used in mail
  const currentUrl = process.env.CURRENTURL;

  const uniqueString = createdUniqueString + id;

  //mail options
  const mailOptions = {
    from: process.env.AUHT_EMAIL,
    to: email,
    subject: "verify your email",
    html: `<p>Verify your email address to complete the signup and login into your account.</p><p>This link <b>expires in 6 hours</b>.</p>
    <p>Press <a href=${
      currentUrl + "user/verify/" + id + "/" + uniqueString
    }>here</a> to proceed.</p>`,
  };

  console.log("uniqueString: " + uniqueString);
  console.log("email: " + email);
  transporter.sendMail(mailOptions);
};

module.exports = sendVerifiedEmail;
