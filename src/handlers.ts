import { Request, Response } from 'express';
import emailValidator from 'email-validator';
import bcrypt from 'bcrypt';

import userModel from './models/user';
import tokenModel from './models/token';
import utils from './utils'
import randombytes from 'randombytes';

const saltRounds : number = 10;

async function register(req : Request, res: Response) {
    if (!req.body.username) {
        res.status(400).end('Username must be 6 characters long.');
        return;
    }
    if (!req.body.password) {
        res.status(400).end('Password must be 6 characters long.');
        return;
    }
    if (!req.body.email || !emailValidator.validate(req.body.email)) {
        res.status(400).end('Email not valid.');
        return;
    }

    const usernameTaken = await utils.isUsernameTaken(req.body.username);
    if (usernameTaken) {
        res.status(400).end('Username already taken.');
        return;
    }

    const emailTaken = await utils.isEmailTaken(req.body.email);
    if (emailTaken) {
        res.status(400).end('Email already taken.');
        return;
    }

    bcrypt.hash(req.body.password, saltRounds, (err, encrypted) => {
        if (err) {
            res.status(400).end('There was an error encrypting the password.');
            return;
        }
        const newUser = new userModel({
            username: req.body.username,
            email: req.body.email,
            password: encrypted
        });
        newUser.save();
        res.status(200).end('Success.');
    });
}
async function login(req : Request, res: Response) {
    // TODO change
    let cookies : any = utils.getCookies(req.headers.cookie);
    let token : boolean = false;
    // check if exists
    if (cookies && cookies.loginToken) {
        // check if a user has a token and compare against whats in the cookie
        let temp = await tokenModel.findOne( { userId : cookies.loginToken });
        token = await bcrypt.compare(cookies.loginToken, temp?.id);
    }
    
    if (token) {
        res.status(200).end('Success.');
        return;
    };

    if (!req.body.password || !req.body.email) {
        res.status(400).end('Invalid info.');
        return;
    }
    let userId: string | null = await utils.getUserId(req.body.email, req.body.password);
    
    if (userId !== null) {
        // TODO manage multiple devices
        // remove previous tokens
        tokenModel.remove({userId});

        // generate new token
        let bytes = randombytes(64);
        let output : string = '';
        bytes.forEach(byte => {
            output += byte.toString(16);
        });
        let token = await bcrypt.hash(output, saltRounds);
        
        // expires after a day
        res.cookie('loginToken', output, {
            expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
        });
        res.status(200).end('Success.');
        console.log('success from console');

        return;
    }
    res.status(400).end('Invalid info.');
    return;
}

export = {
    login,
    register
};