
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { NotificacionesController } from './notificaciones.controller.js';
import { NotificacionesService } from './notificaciones.service.js';
import { NotificacionesGateway } from './notificaciones.gateway.js';

@Module({
  imports: [
    JwtModule,
    ConfigModule,
  ],
  controllers: [
    NotificacionesController,
  ],
  providers: [
    NotificacionesService,
    NotificacionesGateway,
  ],
  exports: [
    NotificacionesService,
  ],
})
export class NotificacionesModule {}
