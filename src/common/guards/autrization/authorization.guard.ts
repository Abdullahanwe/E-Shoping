import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { roleName } from 'src/common/decorators';
import { RoleEnum } from 'src/common/enums';

@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) { }
  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {

    const accessRoles: RoleEnum[] = this.reflector.getAllAndOverride<RoleEnum[]>(roleName,
      [
        context.getHandler(),
        context.getClass()
      ]
    ) ?? [];
    let role: RoleEnum = RoleEnum.user
    switch (context.getType()) {
      case 'http':
        role = context.switchToHttp().getRequest().credentials.user.role
        break;
      case 'http':
        role = context.switchToWs().getClient().credentials.user.role
        break;
      // case 'rpc':
      //   const ctx_rpc = context.switchToRpc()
      //   break;

      // case 'ws':
      //   const ctx_ws = context.switchToWs()
      //   break;

      default:
        break;
    }


    return accessRoles.includes(role);
  }
}
