import { Router } from "express";
import { upload } from "../services/upload.service.js";
import {
  createTransfer,
  deleteTransfer,
  getRecivedTranfers,
  getSentTranfers,
  getTransferById,
  searchTransfers,
  updateTransferPassword,
  validateTransferPassword,
} from "../controller/transfer.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// POST /api/v1/transfers (multipart/form-data with files[])
router.route("/create").post(upload.array("files"), verifyJWT, createTransfer);
router.route("/get/:id").get(verifyJWT, getTransferById);
router.route("/sent/get").get(verifyJWT, getSentTranfers);
router.route("/recived/get").get(verifyJWT, getRecivedTranfers);
router.route("/search").get(verifyJWT, searchTransfers);
router.route("/delete/:id").delete(verifyJWT, deleteTransfer);
router.route("/password/:id").put(verifyJWT, updateTransferPassword);
router.route("/validate-password/:id").post(verifyJWT, validateTransferPassword);

export default router;
