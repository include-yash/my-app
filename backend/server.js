import express from 'express';
import authRoutes from './routes/auth.routes.js'
import dotenv from 'dotenv';
import {connectMongoDB} from './db/connectMongoDB.js'
import cookieParser from 'cookie-parser';


const app = express();
const PORT = process.env.PORT || 5000;

dotenv.config();

app.use(express.json());
app.use(express.urlencoded({extended: true}))
app.use(cookieParser());

app.use("/api/auth", authRoutes);

app.get("/",(req, res)=>{
    res.send("Server is running")
})


app.listen(PORT,()=>{
    console.log("Server is running on port",PORT);
    connectMongoDB();
})