import userModel from './models/user';
import bcrypt from 'bcrypt';
import { Document } from 'mongoose';

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

async function getUserId(email: string, password: string): Promise<string | null> {
    return new Promise<string | null>(async (resolve, reject) => {
        userModel.findOne({ email }, async (err, res : Document) => {
            if (err)
                reject('There was an error finding a user')
            else if (res === null || !(await bcrypt.compare(password, res.get('password'))))
                resolve(null);
            else
                resolve(res.get('_id'));
        });
    });
}

// TODO create cookie interface ?
function getCookies(cookieString: string | undefined) : Object | undefined {
    const cookies : any = {};
    cookieString?.split('; ')?.forEach(cookie => {
        let splitted = cookie.split('=');
        cookies[decodeURIComponent(splitted[0])] = decodeURIComponent(splitted[1]);
    });
    return cookies;
}

export = {
    isUsernameTaken,
    isEmailTaken,
    getUserId,
    getCookies
};
