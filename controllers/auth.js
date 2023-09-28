import User from "../model/user.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import Mailjet from "node-mailjet";
import { validationResult } from "express-validator";

//Mailjet - sending email
const mailjet = new Mailjet({
  apiKey: process.env.MJ_APIKEY_PUBLIC || "5f453b57b69003f11cdbd0d46c363385",
  apiSecret:
    process.env.MJ_APIKEY_PRIVATE || "b7af7b365498a7f77d1270fb86fa5826",
});

const getLogin = (req, res, next) => {
  let message = req.flash("error");

  if (message.length > 0) {
    //Has error
    message = message[0];
  } else {
    //No error
    message = null;
  }

  res.render("auth/login", {
    path: "/login",
    pageTitle: "Login",
    errorMessage: message,
    oldInput: {
      email: "",
      password: "",
    },
    validationErrors: [],
  });
};

const getSignup = (req, res, next) => {
  let message = req.flash("error");

  if (message.length > 0) {
    //Has error
    message = message[0];
  } else {
    //No error
    message = null;
  }

  res.render("auth/signup", {
    path: "/signup",
    pageTitle: "Signup",
    errorMessage: message,
    oldInput: { email: "", password: "", confirmPassword: "" },
    validationErrors: [],
  });
};

const postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const errors = validationResult(req);

  //Has error
  if (!errors.isEmpty()) {
    console.log("here");
    return res.status(422).render("auth/login", {
      path: "/login",
      pageTitle: "Login",
      errorMessage: errors.array()[0].msg,
      oldInput: { email: email, password: password },
      validationErrors: errors.array(),
    });
  }

  //Fetching the user by email
  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        return res.status(422).render("auth/login", {
          path: "/login",
          pageTitle: "Login",
          errorMessage: "Invalid email.",
          oldInput: { email: email, password: password },
          validationErrors: [],
        });
      }
      //Comparing the password
      bcrypt
        .compare(password, user.password)
        .then((doMatch) => {
          if (doMatch) {
            req.session.isLoggedIn = true;
            req.session.user = user;
            return req.session.save((err) => {
              if (err) {
                console.log(err);
              }
              res.redirect("/");
            });
          }
          return res.status(422).render("auth/login", {
            path: "/login",
            pageTitle: "Login",
            errorMessage: "Invalid password.",
            oldInput: { email: email, password: password },
            validationErrors: [],
          });
        })
        .catch((err) => {
          console.log(err);
          res.redirect("/login");
        });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

const postLogout = (req, res, next) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
};

const postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const errors = validationResult(req);

  //Already exist the email
  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(422).render("auth/signup", {
      path: "/signup",
      pageTitle: "Signup",
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password,
        confirmPassword: req.body.confirmPassword,
      },
      validationErrors: errors.array(),
    });
  }

  //Creating a use
  bcrypt
    .hash(password, 12)
    .then((hashedPassword) => {
      const newUser = new User({
        email: email,
        password: hashedPassword,
        cart: { items: [] },
      });
      return newUser.save();
    })
    .then((result) => {
      res.redirect("/login");

      //Sending an email
      const request = mailjet.post("send", { version: "v3.1" }).request({
        Messages: [
          {
            From: {
              Email: "hiiback0608@gmail.com",
              Name: "Mailjet Pilot",
            },
            To: [
              {
                Email: "hoangchuongvang068@gmail.com",
                Name: email,
              },
            ],
            Subject: "Successful message",
            TextPart: "You have successfully created a new account",
            HTMLPart: "<h3>You have successfully created a new account!</h3>",
          },
        ],
      });

      request
        .then((result) => {
          console.log(result.body);
        })
        .catch((err) => {
          const error = new Error(err);
          error.httpStatusCode = 500;
          return next(error);
        });
    });
};

const getReset = (req, res, next) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("auth/reset", {
    pageTitle: "Reset",
    path: "/reset",
    errorMessage: message,
  });
};

const postReset = (req, res, next) => {
  //Creating a token
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      return res.redirect("/reset");
    }
    const token = buffer.toString("hex");

    //Fetching the user
    User.findOne({ email: req.body.email })
      .then((user) => {
        if (!user) {
          //No user found
          req.flash("error", "No account with that email found");
          return res.redirect("/reset");
        } else {
          //User found
          //Set resetToken and expiration
          user.resetToken = token;
          user.resetTokenExpiration = Date.now() + 3600000;
          return user.save();
        }
      })
      .then((result) => {
        res.redirect("/");
        //Sending an email
        const request = mailjet.post("send", { version: "v3.1" }).request({
          Messages: [
            {
              From: {
                Email: "hiiback0608@gmail.com",
                Name: "Mailjet Pilot",
              },
              To: [
                {
                  Email: req.body.email,
                  Name: req.body.email,
                },
              ],
              Subject: "Password reset",
              TextPart: "You have successfully created a new account",
              HTMLPart: `
              <p>You requested a password reset</p>
              <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password.</p>
            `,
            },
          ],
        });
      })
      .catch((err) => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
  });
};

const getNewPassword = (req, res, next) => {
  const token = req.params.token;
  User.findOne({
    resetToken: token,
    resetTokenExpiration: { $gt: Date.now() },
  })
    .then((user) => {
      let message = req.flash("error");
      if (message.length > 0) {
        message = message[0];
      } else {
        message = null;
      }
      res.render("auth/new-password", {
        pageTitle: "New password",
        path: "/new-password",
        errorMessage: message,
        userId: user._id.toString(),
        passwordToken: token,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

const postNewPassword = (req, res, next) => {
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  let resetUser;

  User.findOne({
    resetToken: passwordToken,
    resetTokenExpiration: { $gt: Date.now() },
    _id: userId,
  })
    .then((user) => {
      resetUser = user;
      return bcrypt.hash(newPassword, 12);
    })
    .then((hashedPassword) => {
      resetUser.password = hashedPassword;
      resetUser.resetToken = undefined;
      resetUser.resetTokenExpiration = undefined;
      return resetUser.save();
    })
    .then((result) => {
      res.redirect("/login");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

export default {
  getLogin,
  postLogin,
  postLogout,
  getSignup,
  postSignup,
  getReset,
  postReset,
  getNewPassword,
  postNewPassword,
};
