const User = require("../model/user");
const UserVerification = require("../model/userVerification");

//email handler
const nodemailer = require("nodemailer");

//unique string
const { v4: uuidv4 } = require("uuid");
//password handler
const bcrypt = require("bcrypt");
let response = {};

module.exports = {
  verifyEmailAddress: async (userId, uniqueString) => {
    await UserVerification.find({ userId })
      .then(async (result) => {
        if (result.length > 0) {
          //user verification account exist
          const { expiresAt } = result[0];
          const hashedUniqueString = result[0].uniqueString;
          //check if unique string expired
          if (expiresAt < Date.now()) {
            //record has expired so delete it
            await UserVerification.deleteOne({ userId })
              .then(async () => {
                await User.deleteOne({ _id: userId })
                  .then(() => {
                    response.returnMessage =
                      "Link has expired. Please sign up again";
                    response.returnStatus = "failed";
                    return response;
                  })
                  .catch(() => {
                    console.error(error);
                    response.returnMessage =
                      "Clearing user with expired unique string failed";
                    response.returnStatus = "failed";
                    return response;
                  });
              })
              .catch((error) => {
                console.error(error);
                response.returnMessage =
                  "an error occurred while clearing expired user verification record";
                response.returnStatus = "failed";
                return response;
              });
          } else {
            //valid record exists so we validate the user string
            //First comparing the hashed unique string
            bcrypt.compare(uniqueString, hashedUniqueString).then((result) => {
              if (result) {
                //string matches
                User.updateOne({ _id: userId }, { verified: true })
                  .then(() => {
                    UserVerification.deleteOne({ userId })
                      .then(() => {
                        response.returnStatus = "success";
                        response.returnMessage = "Email Verified successfully";
                        return response;
                      })
                      .catch((error) => {
                        response.returnMessage =
                          "IAn error occured while finializing successfull verification";
                        response.returnStatus = "failed";
                        return response;
                      });
                  })
                  .catch((error) => {
                    response.returnMessage =
                      "IAn error occured while updating user record";
                    response.returnStatus = "failed";
                    return response;
                  });
              } else {
                //existing record but incorrect verification passed.
                response.returnMessage = "Invalid verification details passed";
                response.returnStatus = "failed";
                return response;
              }
            });
          }
        } else {
          //user verification account doesn't exist
          console.error(error);
          response.returnMessage =
            "Account record doesn't exist or has been verified already. Please sign up or log in.";
          response.returnStatus = "failed";
          return response;
        }
      })
      .catch((error) => {
        console.error(error);
        response.returnMessage =
          "an error occurred while checking for existing user verification record.";
        response.returnStatus = "failed";
        return response;
      });
  },

  updateUser: async (userDetails, res) => {
    let { name, email, password, country, phonenumber, image, createdIp } =
      userDetails;
    await User.find({ email })
      .then((result) => {
        console.log("result", result);
        if (result.length) {
          // user already exists
          response.returnStatusMessage = "user already existed";
          response.returnStatus = "failed";
          return response;
        } else {
          //create new user
          //password handling
          const saltRounds = 10;
          bcrypt
            .hash(userDetails.password, saltRounds)
            .then(async (hashedPassword) => {
              const newUser = new User({
                name,
                email,
                password: hashedPassword,
                country,
                phonenumber,
                image,
                recordStatusId: 1,
                verified: false,
              });
              await newUser.save().then((result) => {
                //handle account verification
                return sentVerificationMail(result, res);
              });
            });
        }
      })
      .catch((error) => {
        console.error(error);
        return response;
      });
  },
};

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

const sentVerificationMail = ({ _id, email }, res) => {
  //url to be used in mail
  const currentUrl = process.env.CURRENTURL;

  const uniqueString = uuidv4() + _id;

  //mail options
  const mailOptions = {
    from: process.env.AUHT_EMAIL,
    to: email,
    subject: "verify your email",
    html: `<p>Verify your email address to complete the signup and login into your account.</p><p>This link <b>expires in 6 hours</b>.</p>
    <p>Press <a href=${
      currentUrl + "user/verify/" + _id + "/" + uniqueString
    }>here</a> to proceed.</p>`,
  };

  const saltRounds = 10;
  bcrypt
    .hash(uniqueString, saltRounds)
    .then(async (hashedUniqueString) => {
      //set value in user verification collection
      const newVerification = new UserVerification({
        userId: _id,
        uniqueString: hashedUniqueString,
        createdAt: Date.now(),
        expiresAt: Date.now() + 21600000,
        recordStatusId: 1,
      });
      await newVerification
        .save()
        .then(() => {
          transporter.sendMail(mailOptions).then(() => {
            response.returnStatus = "success";
            response.returnMessage = "Email sent successfully";
            console.log("email sent successfully");
            http.get("*", function (req, res) {
              res.redirect(
                process.env.CURRENTURL + "/user/emailConfirmation/verifyEmail"
              );
            });
            return response;
          });
        })
        .catch((err) => {
          console.error(err);
          res.redirect("user/verifyEmail", {
            isFailed: true,
            message: "Something went wrong",
          });
          return response;
        });
    })
    .catch((err) => {
      console.log(err);
    });

  console.log("uniqueString: " + uniqueString);
  console.log("email: " + email);
};
