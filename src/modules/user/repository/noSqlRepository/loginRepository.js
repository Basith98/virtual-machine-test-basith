const User = require("../model/user");
const bcrypt = require("bcrypt");

let response = {};

module.exports = {
  checkLogin: async (userDetails) => {
    let { email } = userDetails;
    let inputPassword = userDetails.password;
    await User.find({ email: email })
      .then((result) => {
        const { verified, password } = result[0];
        if (result.length > 0) {
          bcrypt
            .compare(inputPassword, password)
            .then((result) => {
              if (result.length > 0) {
                if (isVerified) {
                  response.returnStatus = true;
                  response.returnStatusMessage = "login successfully";
                  return response;
                } else {
                  response.returnStatus = false;
                  response.returnStatusMessage =
                    "please verify your email address";
                  return response;
                }
              } else {
                response.returnStatus = false;
                response.returnStatusMessage = "Wrong credintials";
                return response;
              }
            })
            .catch((err) => {
              console.error(err);
              response.returnStatus = false;
              response.returnStatusMessage =
                "something went wrong while checking credintials";
              return response;
            });
        } else {
          response.returnStatus = false;
          response.returnStatusMessage = "wrong credintials";
          return response;
        }
      })
      .catch((err) => {
        console.error(err);
        response.returnStatus = false;
        response.returnStatusMessage =
          "something went wrong while checking credintials";
        return response;
      });
  },
};
