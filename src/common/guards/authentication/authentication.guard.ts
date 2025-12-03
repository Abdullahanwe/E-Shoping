import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { tokenName } from 'src/common/decorators';
import { TokenEnum } from 'src/common/enums';
import { TokenService } from 'src/common/service';
import { getSocketAuth } from 'src/common/utils/socket';

@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(private readonly tokenService: TokenService, private readonly reflector: Reflector) { }
  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    
    
    
    const tokenType: TokenEnum = this.reflector.getAllAndOverride<TokenEnum>(tokenName,
      [
        context.getHandler(),
        context.getClass()
      ]
    )?? TokenEnum.access;
    
    
    console.log({ context ,tokenType});


    let req: any;
    let authorization: string = '';
    switch (context.getType()) {
      case 'http':
        const ctx_http = context.switchToHttp()
        req = ctx_http.getRequest();
        authorization = req.headers.authorization;
        break;
      // case 'rpc':
      //   const ctx_rpc = context.switchToRpc()
      //   break;

      case 'ws':
        const ctx_ws = context.switchToWs()
        req = ctx_ws.getClient()
        authorization = getSocketAuth(req)
        break;

      default:
        break;
    }
    if(!authorization){
      return false;
    }
    const { decoded, user } = await this.tokenService.decodedToken({
      authorization,
      tokenType,
    })
    req.credentials = { decoded, user };
    return true;
  }
}
