import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { connectDB } from "./db/db.js";

// app config
const app = express();

app.use(
  cors({
    origin: [process.env.CLIENT_AUTH_URL, process.env.APP_URL],
    credentials: true,
  })
);

// middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

// import routes
import userRouter from "./routes/user.routes.js";
import transfersRouter from "./routes/transfer.routes.js"
import contactRouter from "./routes/contact.routes.js"

// declear routes
app.use("/api/v1/user", userRouter);
app.use("/api/v1/transfer", transfersRouter);
app.use("/api/v1/contact", contactRouter);

app.get("/", (req, res) => {
  res.send("skayShare Backend Server!");
});

app.use(function (err, req, res, next) {
  const statusCode = err.statusCode || 500;

  return res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    errors: err.errors || [],
    data: null,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
});

app.listen(process.env.PORT, (err) => {
  connectDB();
  if (err) {
    console.log("Something went wrong!...", err);
    return;
  }

  console.log(`app running on port ${process.env.PORT}!...`);
});
