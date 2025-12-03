import { Socket } from "socket.io";
import {type UserDocument } from "src/DB";
import { JwtPayload } from 'jsonwebtoken'

export interface ISocketAuth extends Socket{
    credentials:{
        user:UserDocument,
        decoded:JwtPayload
    }
}