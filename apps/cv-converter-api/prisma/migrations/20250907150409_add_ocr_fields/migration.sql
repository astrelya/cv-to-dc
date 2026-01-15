-- AlterTable
ALTER TABLE "public"."cvs" ADD COLUMN     "confidence" INTEGER,
ADD COLUMN     "extractedText" TEXT,
ADD COLUMN     "fileName" TEXT,
ADD COLUMN     "fileSize" INTEGER,
ADD COLUMN     "mimeType" TEXT,
ADD COLUMN     "ocrData" JSONB,
ADD COLUMN     "processingNotes" TEXT[];
