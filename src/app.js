import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

// middle-ware configure
// CORS allows or restricts cross-origin requests between different domains.
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}))

app.use(express.json({ limit: "16kb" }))

app.use(express.urlencoded({
    extended: true,
    limit: "16kb"
}))

//favicons and images
app.use(express.static("public")) // ../public file

app.use(cookieParser()); // Enable cookie parsing


// router import 
import userRouter from "./routes/user.routes.js"
import subscribeRouter from "./routes/subscription.routes.js"
// routes declaration
app.use("/api/v1/user", userRouter) // prefix
app.use("/api/v1/subscription", subscribeRouter) 


export default app