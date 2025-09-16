import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  addContact,
  getMyContacts,
  searchMyContacts,
} from "../controller/contact.controller.js";

const router = Router();

router.route("/add").post(verifyJWT, addContact);
router.route("/get").get(verifyJWT, getMyContacts);
router.route("/search").get(verifyJWT, searchMyContacts);

export default router;
