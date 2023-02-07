const express = require("express");
const router = express.Router();
const multer = require("multer");

const homePageController = require("../controller/homePage");
const userController = require("../controller/userController");
const loginController = require("../controller/loginController");

const Storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/images/");
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "-" + Date.now() + ".jpg");
  },
});

const upload = multer({ storage: Storage });

router.get("/", loginController.getLoginPage);
router.get("/signUp", loginController.getSignUpPage);
router.post("/updateUser", upload.single("image"), userController.updateUser);

router.get("/verifyEmail", userController.verifyEmailPage);
router.get(
  "/user/verify/:userId/:uniqueString",
  userController.verifyEmailAddress
);
router.get("/verifyEmailSuccefully", userController.verifyEmailSuccefully);
router.get("/verifyEmailFailed", userController.verifyEmailFailed);

router.post("/verifyLogin", loginController.checkLoginIn);

router.get("/dashboard", userController.homePage);

router.get("/logout", userController.logout);

module.exports = router;
