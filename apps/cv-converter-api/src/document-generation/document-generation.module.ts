import { Module } from '@nestjs/common';
import { DocumentGenerationService } from './document-generation.service';
import { DocumentGenerationController } from './document-generation.controller';
import { CvModule } from '../cv/cv.module';

@Module({
  imports: [CvModule],
  providers: [DocumentGenerationService],
  controllers: [DocumentGenerationController],
  exports: [DocumentGenerationService],
})
export class DocumentGenerationModule {}
