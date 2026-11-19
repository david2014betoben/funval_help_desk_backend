
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';

interface UsuarioToken {
  id: number;
  estado?: string;
}

@WebSocketGateway({
  namespace: '/notificaciones',
  cors: {
    origin: (process.env.FRONTEND_URL ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    credentials: true,
  },
})
export class NotificacionesGateway
  implements OnGatewayConnection
{
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token;

      if (typeof token !== 'string' || !token) {
        client.disconnect(true);
        return;
      }

      const usuario = await this.jwtService.verifyAsync<UsuarioToken>(
        token,
        {
          secret: this.configService.getOrThrow<string>(
            'JWT_SECRET',
          ),
        },
      );

      if (
        !Number.isSafeInteger(usuario.id) ||
        usuario.id <= 0 ||
        usuario.estado !== 'ACTIVO'
      ) {
        client.disconnect(true);
        return;
      }

      client.data.usuarioId = usuario.id;

      await client.join(`usuario:${usuario.id}`);

      client.emit('usuarioRegistrado', {
        idUsuario: usuario.id,
      });
    } catch {
      client.disconnect(true);
    }
  }

  @SubscribeMessage('registrarUsuario')
  registrarUsuario(
    @ConnectedSocket() client: Socket,
    @MessageBody() _data: { idUsuario?: number },
  ) {
    const usuarioId = client.data.usuarioId as
      | number
      | undefined;

    if (!usuarioId) {
      client.disconnect(true);
      return;
    }

    client.emit('usuarioRegistrado', {
      idUsuario: usuarioId,
    });
  }

  emitirAUsuario(
    idUsuario: number,
    notificacion: unknown,
  ) {
    this.server
      .to(`usuario:${idUsuario}`)
      .emit('nuevaNotificacion', notificacion);
  }
}
