-- AlterTable
ALTER TABLE "public"."cvs" ADD COLUMN     "template" TEXT;

-- CreateTable
CREATE TABLE "public"."informations_personnelles" (
    "id" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "postalCode" TEXT,
    "city" TEXT,
    "headline" TEXT,
    "photo" TEXT,
    "dateOfBirth" TEXT,
    "placeOfBirth" TEXT,
    "nationality" TEXT,
    "maritalStatus" TEXT,
    "drivingLicense" BOOLEAN,
    "website" TEXT,
    "linkedin" TEXT,
    "github" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cvId" TEXT NOT NULL,

    CONSTRAINT "informations_personnelles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."profils" (
    "id" TEXT NOT NULL,
    "summary" TEXT,
    "yearsOfExperience" TEXT,
    "objective" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cvId" TEXT NOT NULL,

    CONSTRAINT "profils_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."experiences_professionnelles" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT,
    "location" TEXT,
    "startMonth" TEXT,
    "startYear" TEXT,
    "endMonth" TEXT,
    "endYear" TEXT,
    "current" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "responsibilities" TEXT[],
    "achievements" TEXT[],
    "technologies" TEXT[],
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cvId" TEXT NOT NULL,

    CONSTRAINT "experiences_professionnelles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."formations" (
    "id" TEXT NOT NULL,
    "degree" TEXT NOT NULL,
    "institution" TEXT,
    "location" TEXT,
    "startMonth" TEXT,
    "startYear" TEXT,
    "endMonth" TEXT,
    "endYear" TEXT,
    "current" BOOLEAN NOT NULL DEFAULT false,
    "finished" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "gpa" TEXT,
    "honors" TEXT[],
    "activities" TEXT[],
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cvId" TEXT NOT NULL,

    CONSTRAINT "formations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."competences" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cvId" TEXT NOT NULL,

    CONSTRAINT "competences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."langues" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cvId" TEXT NOT NULL,

    CONSTRAINT "langues_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "informations_personnelles_cvId_key" ON "public"."informations_personnelles"("cvId");

-- CreateIndex
CREATE UNIQUE INDEX "profils_cvId_key" ON "public"."profils"("cvId");

-- AddForeignKey
ALTER TABLE "public"."informations_personnelles" ADD CONSTRAINT "informations_personnelles_cvId_fkey" FOREIGN KEY ("cvId") REFERENCES "public"."cvs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."profils" ADD CONSTRAINT "profils_cvId_fkey" FOREIGN KEY ("cvId") REFERENCES "public"."cvs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."experiences_professionnelles" ADD CONSTRAINT "experiences_professionnelles_cvId_fkey" FOREIGN KEY ("cvId") REFERENCES "public"."cvs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."formations" ADD CONSTRAINT "formations_cvId_fkey" FOREIGN KEY ("cvId") REFERENCES "public"."cvs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."competences" ADD CONSTRAINT "competences_cvId_fkey" FOREIGN KEY ("cvId") REFERENCES "public"."cvs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."langues" ADD CONSTRAINT "langues_cvId_fkey" FOREIGN KEY ("cvId") REFERENCES "public"."cvs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
