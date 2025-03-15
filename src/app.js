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

// Parses incoming URL-encoded data with a size limit of 16KB
app.use(express.urlencoded({
    extended: true,
    limit: "16kb"
}))

//favicons and images
app.use(express.static("public")) // ../public file

app.use(cookieParser()); // Enable cookie parsing

// Logging Middleware
/* import fs from "fs";
app.use((req, res, next) => {
    const time = new Date().toLocaleTimeString();
    let log = `${time} : ${req.method} :: ${req.originalUrl}\n`

    fs.appendFile('requestList.txt', log, err=>{
        if (err) console.error("Error writing to file:", err);
    })

    next(); // Move to the next middleware or route
});
*/


// router import 
import userRouter from "./routes/user.routes.js"

// routes declaration
app.use("/api/v1/user", userRouter) // prefix


export default app