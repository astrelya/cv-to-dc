import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { CvModule } from '../cv/cv.module';
import { DocumentGenerationModule } from '../document-generation/document-generation.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'cv-converter-web'),
      exclude: ['/api*'],
      serveRoot: '/',
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    CvModule,
    DocumentGenerationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
