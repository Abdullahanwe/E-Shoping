import { NextFunction, Request, Response } from "express";
import { TokenEnum } from "../enums";


export const setDefaultLanguage = (req: Request, res: Response, next: NextFunction) => {

    console.log('Language MiddleWare.....');
    req.headers['accept-language'] = req.headers['accept-language'] ?? 'EN';
    next()
}


export const authenticationMiddleware = (tokenType:TokenEnum)=>{
    return (req:Request,res:Response,next:NextFunction)=>{
        console.log("Authentication Middleware....");
        console.log(tokenType);
        
        next()
    }
}
export const authorization = ()=>{
    return (req:Request,res:Response,next:NextFunction)=>{
        console.log("Authorization Middleware....");
        
        next()
    }
}