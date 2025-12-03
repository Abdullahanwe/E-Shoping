import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Types } from "mongoose";
import { Server, Socket } from "socket.io";
import { Auth, RoleEnum, TokenEnum, TokenService, User } from "src/common";
import { type ISocketAuth } from "src/common/interfaces/socket.interface";
import { getSocketAuth } from "src/common/utils/socket";
import { connectedSocket, type UserDocument } from "src/DB";


@WebSocketGateway(80, {
    cors: {
        origin: "*"
    },
    namespace: "public"
})
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    private readonly server: Server
    constructor(private readonly tokenService: TokenService) { }

    afterInit(server: Server) {
        console.log(`Realtime Gateway started 🚀🚀`);
    }

    async handleConnection(client: ISocketAuth) {
        try {
            const authorization = getSocketAuth(client)
            const { user, decoded } = await this.tokenService.decodedToken({ authorization, tokenType: TokenEnum.access })
            const userTapes = connectedSocket.get(user._id.toString()) || [];
            console.log(userTapes);
            userTapes.push(client.id)
            connectedSocket.set(user._id.toString(), userTapes)
            client.credentials = { user, decoded }
            console.log(connectedSocket);

        } catch (error) {
            client.emit("exception", error.message || 'something went wrong')
        }

    }
    handleDisconnect(client: ISocketAuth) {
        const userId = client.credentials?.user._id?.toString() as string;
        let remainingTaps = connectedSocket.get(userId)?.filter((tab: string) => {
            return tab !== client.id;
        }) || [];
        if(remainingTaps.length){
            connectedSocket.set(userId,remainingTaps);
        }else{
            connectedSocket.delete(userId);
            this.server.emit("offline_user",userId);
        }
        console.log(`logOut:: `, client.id);
        console.log(`After logOut:: `, connectedSocket);

    }
    @Auth([RoleEnum.admin])
    @SubscribeMessage("sayHi")
    sayHi(@MessageBody() data: any, @ConnectedSocket() client: ISocketAuth,@User() user:UserDocument): string {
        console.log(user);
        
        console.log({ data, client, user: client.credentials });
        this.server.emit("sayHi", "Nest To Frontend ")
        return "Received Data"
    }


    changeProductSocket(products:{productId:Types.ObjectId,stock:number}[]){
        this.server.emit("changeProductSocket",products)
    }
}