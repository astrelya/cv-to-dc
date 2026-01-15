import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { CvService } from './cv.service';
import { CvController } from './cv.controller';
import { OpenAIService } from '../openai/openai.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    MulterModule.register({
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  ],
  controllers: [CvController],
  providers: [CvService, OpenAIService],
  exports: [CvService],
})
export class CvModule {}
