import 'dotenv/config';
import express from 'express';
import {PORT} from './config/env.js';
const app = express();


app.get('/',(req,res)=>{
    res.send('WHo Am i');
});


app.listen(PORT,'localhost',async()=>{
    console.log(`server is running on http://localhost:${PORT}`)
})
