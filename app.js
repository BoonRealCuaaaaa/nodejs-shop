import express from "express";
import bodyParser from "body-parser";
import path from "path";
import rootDir from "./util/path.js";
import mongoose from "mongoose";
import session from "express-session";
import connectMongoDBSession from "connect-mongodb-session";
import csrf from "csurf";
import multer from "multer";
import flash from "connect-flash";

// Route import
import adminRoutes from "./routes/admin.js";
import shopRoutes from "./routes/shop.js";
import errorControllers from "./controllers/error.js";
import authRoutes from "./routes/auth.js";

//Model
import User from "./model/user.js";

//Define constant support for middleware
const MongoDBStore = connectMongoDBSession(session);
const MONGODB_URI =
  "mongodb+srv://NKHoang:tuilaemga@cluster0.afijb8i.mongodb.net/shop?retryWrites=true";

const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: "sessions",
});

const app = express();

const csrfProtection = csrf();

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      new Date().toISOString().replace(/:/g, "-") + "-" + file.originalname
    );
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    //image=content
    cb(null, true);
  } else {
    //image=undefined
    cb(null, false);
  }
};

//Using dynamic template
app.set("view engine", "ejs");
app.set("views", "views");

//Middleware-run whenever receive a request

//Parse the req.body
app.use(bodyParser.urlencoded({ extended: false }));

//File upload handling
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);

//Serving static folder
app.use(express.static(path.join(rootDir, "public")));
app.use("/images", express.static(path.join(rootDir, "images")));

//Session middleware
app.use(
  session({
    secret: "my secret",
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

//CSRF Protection middleware
app.use(csrfProtection);

//Flash message middleware
app.use(flash());

//Store local variable for view
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

//Assign a user to req.user
app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then((user) => {
      if (!user) {
        return next();
      }
      req.user = user;
      next();
    })
    .catch((err) => {
      next(new Error(err));
    });
});

//Route
app.use("/admin", adminRoutes.router);
app.use(shopRoutes);
app.use(authRoutes);

app.get("/500", errorControllers.error500);

app.use(errorControllers.error404);

//Database
mongoose
  .connect(MONGODB_URI)
  .then((result) => {
    app.listen(3000);
  })
  .catch((err) => console.log(err));
