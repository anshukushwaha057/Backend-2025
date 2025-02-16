import express from "express"
import cors from "cors"
import CookiesParser from "cookies"

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

app.use(CookiesParser()) // Enable cookie parsing




export default app