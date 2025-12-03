
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const User = createParamDecorator(
    (data: unknown, context: ExecutionContext) => {
        let user: any;
        switch (context.getType()) {
            case 'http':
                user = context.switchToHttp().getRequest().credentials.user;
                break;
            // case 'rpc':
            //   const ctx_rpc = context.switchToRpc()
            //   break;

            case 'ws':
                user = context.switchToWs().getClient().credentials.user;
                break;

            default:
                break;
        }

        return user;
    },
);
