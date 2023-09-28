import express from "express";
import path from "path";
import shopController from "../controllers/shop.js";
import isAuth from "../middleware/is-auth.js";
import shop from "../controllers/shop.js";

const router = express.Router();
// [GET] /
router.get("/", isAuth, shopController.getIndex);
// // [GET] /products
router.get("/products", isAuth, shopController.getProducts);
// // [GET] /products/:productId
router.get("/products/:productId", shopController.getProduct);
// // // [GET] /cart
router.get("/cart", isAuth, shopController.getCart);
// // // [POST] /cart
router.post("/cart", isAuth, shopController.postCart);
// // [GET] /checkout
router.get("/checkout", isAuth, shopController.getCheckout);
// // [GET] /orders
router.get("/orders", isAuth, shopController.getOrders);
// // // [POST] /cart-delete-item
router.post("/cart-delete-item", isAuth, shopController.postCartDeleteProduct);

router.get("/orders/:orderId", isAuth, shopController.getInvoice);

router.get("/checkout", isAuth, shopController.getCheckout);

router.get("/checkout/success", shopController.getCheckoutSuccess);

router.get("/checkout/cancel", shopController.getCheckout);

export default router;
