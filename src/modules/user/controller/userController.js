const userService = require("../bussinessLogic/userService");
const User = require("../repository/model/user");
const UserVerification = require("../repository/model/userVerification");
const nodemailer = require("nodemailer");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");

module.exports = {
  getSignUpPage: async (req, res) => {
    try {
      if (req.session.user) {
        res.redirect("/dashboard");
      } else {
        res.render("user/signup");
      }
    } catch (error) {
      console.log(error);
    }
  },

  homePage: async (req, res) => {
    try {
      if (req.session.user) {
        res.render("user/dashboard");
      } else {
        res.redirect("/");
      }
    } catch (error) {}
  },

  logout: async (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/");
      }
    });
  },

  updateUser: async (req, res) => {
    let response = {};
    try {
      const user = req.body;
      console.log(user);
      user.name = user.name.trim();
      user.email = user.email.trim();
      user.password = user.password.trim();
      user.image = req.file.filename;

      if (
        user.name == "" ||
        user.email == "" ||
        user.password == "" ||
        user.phonenumber == "" ||
        user.country == ""
      ) {
        res.render("user/signup", { message: "empty input fields!" });
      } else {
        let { name, email, password, country, phonenumber, image, createdIp } =
          req.body;
        await User.find({ email })
          .then((result) => {
            console.log("result", result);
            if (result.length) {
              // user already exists
              res.redirect("user/verifyEmail", {
                isFailed: true,
                message: "user already existed",
              });
            } else {
              //create new user
              //password handling
              const saltRounds = 10;
              bcrypt.hash(password, saltRounds).then(async (hashedPassword) => {
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
                  sentVerificationMail(result, res);
                });
              });
            }
          })
          .catch((error) => {
            console.error(error);
            return response;
          });

        const sentVerificationMail = ({ _id, email }) => {
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
                    res.render("emailConfirmation/verifyEmail");
                  });
                })
                .catch((err) => {
                  console.error(err);
                  res.redirect("user/verifyEmail", {
                    isFailed: true,
                    message: "Something went wrong",
                  });
                });
            })
            .catch((err) => {
              console.log(err);
            });

          console.log("uniqueString: " + uniqueString);
          console.log("email: " + email);
        };
      }
      // res.redirect("/admin/colorDetails");
    } catch (err) {
      console.log(err);
    }
  },

  verifyEmailPage: async (req, res) => {
    res.render("emailConfirmation/verifyEmail");
  },

  verifyEmailAddress: async (req, res) => {
    try {
      let response = {};
      let { userId, uniqueString } = req.params;

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
                      res.render("emailConfirmation/emailVerificationFailed", {
                        message: response.returnMessage,
                      });
                    })
                    .catch(() => {
                      console.error(error);
                      response.returnMessage =
                        "Clearing user with expired unique string failed";
                      res.render("emailConfirmation/emailVerificationFailed", {
                        message: response.returnMessage,
                      });
                    });
                })
                .catch((error) => {
                  console.error(error);
                  response.returnMessage =
                    "an error occurred while clearing expired user verification record";
                  res.render("emailConfirmation/emailVerificationFailed", {
                    message: response.returnMessage,
                  });
                });
            } else {
              //valid record exists so we validate the user string
              //First comparing the hashed unique string
              bcrypt
                .compare(uniqueString, hashedUniqueString)
                .then((result) => {
                  if (result) {
                    //string matches
                    User.updateOne({ _id: userId }, { verified: true })
                      .then(() => {
                        UserVerification.deleteOne({ userId })
                          .then(() => {
                            response.returnStatus = "success";
                            response.returnMessage =
                              "Email Verified successfully";
                            res.render(
                              "emailConfirmation/emailVerificationSuccess"
                            );
                          })
                          .catch((error) => {
                            response.returnMessage =
                              "IAn error occured while finializing successfull verification";
                            response.returnStatus = "failed";
                            res.render(
                              "emailConfirmation/emailVerificationFailed",
                              {
                                message: response.returnMessage,
                              }
                            );
                          });
                      })
                      .catch((error) => {
                        response.returnMessage =
                          "IAn error occured while updating user record";
                        response.returnStatus = "failed";
                        res.render(
                          "emailConfirmation/emailVerificationFailed",
                          {
                            message: response.returnMessage,
                          }
                        );
                      });
                  } else {
                    //existing record but incorrect verification passed.
                    response.returnMessage =
                      "Invalid verification details passed";
                    res.render("emailConfirmation/emailVerificationFailed", {
                      message: response.returnMessage,
                    });
                  }
                });
            }
          } else {
            //user verification account doesn't exist
            console.error(error);
            response.returnMessage =
              "Account record doesn't exist or has been verified already. Please sign up or log in.";
            res.render("emailConfirmation/emailVerificationFailed", {
              message: response.returnMessage,
            });
          }
        })
        .catch((error) => {
          console.error(error);
          response.returnMessage =
            "an error occurred while checking for existing user verification record.";
          res.render("emailConfirmation/emailVerificationFailed", {
            message: response.returnMessage,
          });
        });
    } catch (error) {
      console.log(error);
    }
  },

  verifyEmailSuccefully: async (req, res) => {
    res.render("emailConfirmation/emailVerificationSuccess");
  },

  verifyEmailFailed: async (req, res) => {
    res.render("emailConfirmation/emailVerificationFailed", {
      message: req.body.message,
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
