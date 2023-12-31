import dotenv from 'dotenv'
import app from './app.js'
dotenv.config({
    path: "./env"
})


import connectDB from './db/db.js'


connectDB()
    .then(() => {
        app.listen(`${process.env.PORT}` || 8000, () => {
            console.log(`Server is listening on port ${process.env.PORT} || 8000`);
        })
    }
    )
    .catch((error) => {
        console.log(`MONGODB connection failed: ${error}`);
    })
















/* this code will also work but it's not as clean as the code after it (which is the code we'll use in the project) which will be more modular and easier to read and reusable in other projects etc etc.
import mongoose from 'mongoose'
import { DB_NAME } from './constants.js'
import express from 'express'
import dotenv from 'dotenv'

dotenv.config()
const app = express()


    ; (async () => {
        try {
            await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`) // we add the name of the database to the URI string here becasue we want to connect to a specific database (mytube) and not just the MongoDB server in general (which is what the URI string would do if we didn't specify a database name). 
            app.on("error", (error) => {
                console.error("MongoDB connection error: ", error)
                throw error
            })

            app.listen(process.env.PORT, () => {
                console.log(`Server is listening on port ${process.env.PORT}`)
            })
        } catch (error) {
            console.error(error)
            throw error
        }
    })()

*/
