import express, { Express, Request, Response } from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import emailValidator from 'email-validator';
import bcrypt from 'bcrypt';

import userModel from './models/user';

mongoose.connect('mongodb://127.0.0.1:27017/collabity', { useNewUrlParser: true,  useUnifiedTopology: true } );

const app : Express = express();
const port : number = 3000;
const saltRounds : number = 10;

const jsonParser = bodyParser.json();
const urlencodedParser = bodyParser.urlencoded({ extended: false });

app.use(jsonParser);
app.use(urlencodedParser);

app.post('/register', async (req : Request, res: Response) => {
    if (!req.body.info.username) {
        res.status(400)
        console.log('Username must be at least 3 characters long.');
        res.end('Username must be at least 3 characters long.');
        return;
    }
    if (!req.body.info.password) {
        res.status(400)
        console.log('Password must be at least 6 characters.');
        res.end('Password must be at least 6 characters.');
        return;
    }
    if (!req.body.info.email || !emailValidator.validate(req.body.info.email)) {
        res.status(400)
        console.log('Email is not valid.');
        res.end('Email is not valid.');
        return;
    }

    const usernameTaken = await isUsernameTaken(req.body.info.username);
    // if (usernameTaken) {
    //     res.status(400)
    //     res.end('Username already taken.');
    //     return;
    // }

    const emailTaken = await isEmailTaken(req.body.info.email);
    // if (emailTaken) {
    //     res.status(400)
    //     res.end('Email already taken.');
    //     return;
    // }
    //SOLVED: two seperate vars for determining if either username or email is taken so that way I (Jude) can display
    // to the user in the UI which one exactly is taken indeed.
    if(usernameTaken || emailTaken){
        res.status(400);
        res.send({
            "isUsernameTaken": usernameTaken,
            "isEmailTaken": emailTaken
        });
        res.end('Fail');
        return;
    }

    bcrypt.hash(req.body.info.password, saltRounds, (err, encrypted) => {
        if (err) {
            res.status(400)
            res.end('There was an error encrypting the password.');
            return;
        }
        const newUser = new userModel({
            username: req.body.info.username,
            email: req.body.info.email,
            password: encrypted
        });
        newUser.save();
        res.status(200)
        console.log('Successfully registered')
        res.end('Success');
    });
});

app.post('/login', async (req : Request, res: Response) => {
    if (!req.body.password || (!req.body.username && !req.body.email)) {
        res.status(400)
        res.end('Invalid info.');
        return;
    }
    let validLogin: boolean;
    // login by email
    if (req.body.email)
        validLogin = await loginEmail(req.body.email, req.body.password);
    else
        validLogin = await loginUsername(req.body.username, req.body.password);
    
    if (validLogin) {
        res.status(200)
        console.log('Successfully logged in')
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


// TODO make this one function : Jude changes - review my interpretation of this TODO, if everything
// is good, please delete this comment.
//view line 55-62
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
                reject('There was an error determining if an email is taken');
            else
                resolve(res !== null);
        });
    });
}

async function loginUsername(username: string, password: string): Promise<boolean> {
    return new Promise<boolean>(async (resolve, reject) => {
        userModel.findOne({ username }, (err, res : mongoose.Document) => {
            if (err)
                reject('There was an error finding a user')
            else if (res === null)
                resolve(false);
            else
                resolve(bcrypt.compareSync(password, res.get('password')));
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