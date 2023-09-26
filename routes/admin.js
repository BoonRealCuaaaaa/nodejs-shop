import express from "express";
import path from "path";
import rootDir from "../util/path.js";
import { body } from "express-validator";
import adminController from "../controllers/admin.js";
import isAuth from "../middleware/is-auth.js";

const router = express.Router();
// console.log('Admin router')
// [GET] /admin/add-product
router.get("/add-product", isAuth, adminController.getAddProduct);

// // [GET] /admin/products
router.get("/products", isAuth, adminController.getProducts);

// // [POST] /admin/add-product
router.post(
  "/add-product",
  [
    body("title").isString().withMessage("Please enter a string").isLength({ min: 3 }).withMessage("Minimum is 3 character").trim(),
    body("price").isFloat().withMessage("Please enter a number"),
    body("description").isLength({ min: 5, max: 400 }).withMessage("Please enter a description from 5 characters to 400 characters").trim(),
  ],
  isAuth,
  adminController.postAddProduct
);

// // [GET] /admin/edit-product/:productId
router.get("/edit-product/:productId", isAuth, adminController.getEditProduct);

// // // [POST] /admin/edit-product
router.post(
  "/edit-product",
  [
    body("title").isString().isLength({ min: 3 }).withMessage("Minimum is 3 character").trim(),
    body("price").isFloat().withMessage("Please enter a number"),
    body("description").isLength({ min: 3 }).trim(),
  ],
  isAuth,
  adminController.postEditProduct
);

// [POST] /admin//delete-product
router.delete("/product/:productId", isAuth, adminController.deleteProduct);

export default { router };
