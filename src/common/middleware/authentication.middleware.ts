
import { BadRequestException, Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../service';
import { TokenEnum } from '../enums';
import { IAuthRequest } from '../interfaces';


export const PreAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    if (!(req.headers.authorization?.split(' ')?.length == 2)) {
        throw new BadRequestException('Missing authorization key');
    }
    next();
}


// @Injectable()
// export class AuthenticationMiddleware implements NestMiddleware {
//     constructor(private readonly tokenService: TokenService) { }

//     async use(req: IAuthRequest, res: Response, next: NextFunction) {
//         console.log('Request...');
//         console.log(req.headers.authorization);
//         const { user, decoded } = await this.tokenService.decodedToken({
//             authorization: req.headers.authorization ?? '',
//             tokenType: req.tokenType as TokenEnum
//         })
//         req.credentials = { user, decoded };
//         next();
//     }
// }

