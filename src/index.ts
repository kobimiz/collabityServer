import express, { Express, Request, Response } from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import emailValidator from 'email-validator';
import bcrypt from 'bcrypt';

import userModel from './models/user';

mongoose.connect('mongodb://127.0.0.1:27017/collabity', { useNewUrlParser: true,  useUnifiedTopology: true } );

const app : Express = express();
const port : number = 3000 || (process.env.PORT as unknown) as number;
const saltRounds : number = 10;

const jsonParser = bodyParser.json();
const urlencodedParser = bodyParser.urlencoded({ extended: false });

app.use(jsonParser);
app.use(urlencodedParser);

app.post('/register', async (req : Request, res: Response) => {
    if (!req.body.username) {
        res.status(400)
        res.end('Username must be 6 characters long.');
        return;
    }
    if (!req.body.password) {
        res.status(400)
        res.end('Password must be 6 characters long.');
        return;
    }
    if (!req.body.email || !emailValidator.validate(req.body.email)) {
        res.status(400)
        res.end('Email not valid.');
        return;
    }

    const usernameTaken = await isUsernameTaken(req.body.username);
    if (usernameTaken) {
        res.status(400)
        res.end('Username already taken.');
        return;
    }

    const emailTaken = await isEmailTaken(req.body.email);
    if (emailTaken) {
        res.status(400)
        res.end('Email already taken.');
        return;
    }

    bcrypt.hash(req.body.password, saltRounds, (err, encrypted) => {
        if (err) {
            res.status(400)
            res.end('There was an error encrypting the password.');
            return;
        }
        const newUser = new userModel({
            username: req.body.username,
            email: req.body.email,
            password: encrypted
        });
        newUser.save();
        res.status(200)
        res.end('Success.');
    });
});

app.post('/login', async (req : Request, res: Response) => {
    if (!req.body.password || !req.body.email) {
        res.status(400)
        res.end('Invalid info.');
        return;
    }
    let validLogin: boolean = await loginEmail(req.body.email, req.body.password);
    
    if (validLogin) {
        res.status(200)
        res.end('Success.');
        return;
    }
    res.status(400)
    res.end('Invalid info.');
    return;
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});


// TODO make this one function
async function isUsernameTaken(username: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
        userModel.findOne({ username }, (err, res) => {
            if (err)
                reject('There was an error determining if a username is taken')
            else
                resolve(res !== null);
        });
    });
}

async function isEmailTaken(email: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
        userModel.findOne({ email }, (err, res) => {
            if (err)
                reject('There was an error determining if an email is taken')
            else
                resolve(res !== null);
        });
    });
}

async function loginEmail(email: string, password: string): Promise<boolean> {
    return new Promise<boolean>(async (resolve, reject) => {
        userModel.findOne({ email }, (err, res : mongoose.Document) => {
            if (err)
                reject('There was an error finding a user')
            else if (res === null)
                resolve(false);
            else
                resolve(bcrypt.compareSync(password, res.get('password')));
        });
    });
}