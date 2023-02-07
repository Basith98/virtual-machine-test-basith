const express = require("express");
const hbs = require("hbs");
const app = express();
const cookieParser = require("cookie-parser");
const session = require("express-session");
require("dotenv").config();
const bodyParser = require("body-parser");

// const bodyParser = require("express").json;
app.use(bodyParser());

const user = require("./src/modules/user/routes/user");

app.use(cookieParser());
app.use(
  session({
    key: "user_sid",
    secret: "!Q@W1q2wP@12345rd$E#%W",
    resave: false,
    saveUninitialized: false,
    cookie: { expires: 600000 },
  })
);

const mongoose = require("mongoose");
console.log("env", process.env.DATABASE_ATLAS);
mongoose
  .connect(process.env.DATABASE_ATLAS, { useNewUrlParser: true })
  .then((con) => {
    console.log("Database connection successfully established");
  })
  .catch((err) => {
    console.log("Database connection failed: " + err.message);
  });

app.set("view engine", "hbs");
app.use(express.static(__dirname + "/public"));

// app.use((req, res, next) => {
//   if (req.session.user && req.cookies.user_sid) {
//     res.redirect("/dashboard");
//   }
//   next();
// });

// var sessionChecker = (req, res, next) => {
//   if (req.session.user && req.cookies.user_sid) {
//     res.redirect("/dashboard");
//   } else {
//     next();
//   }
// };

app.use("/", user);

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
