import express, { Express, Request, Response } from 'express';
import mongoose from 'mongoose';

import handlers from './handlers';

mongoose.connect('mongodb://127.0.0.1:27017/collabity', { useNewUrlParser: true,  useUnifiedTopology: true } );

const app : Express = express();
const port : number = (process.env.PORT as unknown) as number || 3000;

app.use(express.json());
app.use(express.urlencoded());

app.post('/register', handlers.register);
app.post('/login', handlers.login);
app.get('/setcookie', (req : Request, res: Response) => {
    for (const key in req.query)
        res.cookie(key, req.query[key]);
    res.end();
});

app.get('/getcookie', (req : Request, res: Response) => {
    console.log(req.headers);
    const cookies = req.headers.cookie?.split('; ').map(cookie => {
        let splitted = cookie.split('=');
        let obj : any = { };
        obj[decodeURIComponent(splitted[0])] = decodeURIComponent(splitted[1]);
        return obj;
    });
    res.end(JSON.stringify(cookies));
});
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
