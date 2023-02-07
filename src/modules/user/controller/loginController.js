const loginService = require("../bussinessLogic/loginService");
const User = require("../repository/model/user");
const bcrypt = require("bcrypt");

module.exports = {
  getLoginPage: async (req, res) => {
    try {
      if (req.session.user) {
        res.redirect("/dashboard");
      } else {
        res.render("user/login");
      }
    } catch (error) {
      console.log(error);
    }
  },

  getSignUpPage: async (req, res) => {
    try {
      res.render("user/signup");
    } catch (error) {
      console.log(error);
    }
  },

  checkLoginIn: async (req, res) => {
    let response = {};
    try {
      console.log("req", req.body);

      let { email } = req.body;
      let inputPassword = req.body.password;
      await User.find({ email: email })
        .then(async (result) => {
          const { verified, password } = result[0];
          if (result.length > 0) {
            await bcrypt
              .compare(inputPassword, password)
              .then((response) => {
                if (response) {
                  if (verified) {
                    response.returnStatus = true;
                    response.returnStatusMessage = "login successfully";
                    console.log("success", response.returnStatusMessage);
                    req.session.user = result[0].id;
                    res.redirect("/dashboard");
                  } else {
                    response.returnStatus = false;
                    response.returnStatusMessage =
                      "please verify your email address";
                    res.render("user/login", {
                      isFailed: true,
                      message: response.returnStatusMessage,
                    });
                  }
                } else {
                  response.returnStatus = false;
                  response.returnStatusMessage = "Wrong credintials";
                  res.render("user/login", {
                    isFailed: true,
                    message: response.returnStatusMessage,
                  });
                }
              })
              .catch((err) => {
                console.error(err);
                response.returnStatus = false;
                response.returnStatusMessage =
                  "something went wrong while checking credintials";
                res.render("user/login", {
                  isFailed: true,
                  message: response.returnStatusMessage,
                });
              });
          } else {
            response.returnStatus = false;
            response.returnStatusMessage = "wrong credintials";
            res.render("user/login", {
              isFailed: true,
              message: response.returnStatusMessage,
            });
          }
        })
        .catch((err) => {
          console.error(err);
          response.returnStatus = false;
          response.returnStatusMessage =
            "something went wrong while checking credintials";
          res.render("user/login", {
            isFailed: true,
            message: response.returnStatusMessage,
          });
        });
    } catch (error) {
      console.log(error);
    }
  },
};
