-- CreateEnum
CREATE TYPE "FieldOffice" AS ENUM ('ALBUQUERQUE', 'ANCHORAGE', 'LAS_VEGAS', 'LOS_ANGELES', 'ROSWELL', 'SEATTLE', 'WASHINGTON_DC');

-- CreateEnum
CREATE TYPE "ObjectShape" AS ENUM ('DISC', 'TRIANGLE', 'CIGAR', 'ORB', 'TIC_TAC', 'OTHER');

-- CreateEnum
CREATE TYPE "ObjectCount" AS ENUM ('ONE', 'TWO_TO_FIVE', 'SIX_TO_TWENTY', 'TOO_MANY');

-- CreateEnum
CREATE TYPE "ObservationDuration" AS ENUM ('UNDER_1_MIN', 'ONE_TO_5_MIN', 'FIVE_TO_30_MIN', 'OVER_30_MIN');

-- CreateEnum
CREATE TYPE "EstimatedAltitude" AS ENUM ('TREETOP', 'BELOW_CLOUD', 'ABOVE_CLOUD', 'ORBITAL', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "EvidenceType" AS ENUM ('PHOTOGRAPHIC', 'RADAR', 'PHYSICAL_DEBRIS', 'BIOLOGICAL_SAMPLE', 'AUDIO');

-- CreateEnum
CREATE TYPE "StorageLocation" AS ENUM ('QUANTICO_LAB', 'HANGAR_18', 'FIELD_OFFICE_SAFE');

-- CreateEnum
CREATE TYPE "EncounterClass" AS ENUM ('CE1', 'CE2', 'CE3', 'CE4');

-- CreateEnum
CREATE TYPE "MedicalEvaluation" AS ENUM ('SCHEDULED', 'COMPLETED', 'DECLINED');

-- CreateEnum
CREATE TYPE "ThreatLevel" AS ENUM ('NONE', 'LOW', 'MODERATE', 'HIGH');

-- CreateEnum
CREATE TYPE "ClassificationLevel" AS ENUM ('UNCLASSIFIED', 'CONFIDENTIAL', 'SECRET', 'TOP_SECRET');

-- CreateTable
CREATE TABLE "UapReport" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "caseNumber" TEXT NOT NULL,
    "reportingAgentName" TEXT NOT NULL,
    "badgeNumber" TEXT NOT NULL,
    "fieldOffice" "FieldOffice" NOT NULL,
    "sightingDate" DATE NOT NULL,
    "reportFiledDate" DATE NOT NULL,
    "sightingLocation" TEXT NOT NULL,
    "objectShape" "ObjectShape" NOT NULL,
    "objectShapeOther" TEXT,
    "objectCount" "ObjectCount" NOT NULL,
    "observationDuration" "ObservationDuration" NOT NULL,
    "estimatedAltitude" "EstimatedAltitude",
    "narrative" TEXT NOT NULL,
    "evidenceCollected" "EvidenceType"[],
    "debrisCustodyChain" TEXT,
    "debrisStorageLocation" "StorageLocation",
    "mediaReferenceIds" TEXT,
    "civilianWitnesses" BOOLEAN NOT NULL DEFAULT false,
    "witnessCount" INTEGER,
    "witnessStatement" TEXT,
    "encounterClass" "EncounterClass" NOT NULL,
    "physicalEffects" TEXT,
    "occupantDescription" TEXT,
    "missingTimeMinutes" INTEGER,
    "medicalEvaluation" "MedicalEvaluation",
    "threatAssessment" "ThreatLevel" NOT NULL,
    "escalationJustification" TEXT,
    "classificationLevel" "ClassificationLevel" NOT NULL,
    "notifyBureauLeadership" BOOLEAN NOT NULL DEFAULT false,
    "additionalRemarks" TEXT,
    "certified" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UapReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UapReport_caseNumber_key" ON "UapReport"("caseNumber");

-- CreateIndex
CREATE INDEX "UapReport_userId_idx" ON "UapReport"("userId");

-- AddForeignKey
ALTER TABLE "UapReport" ADD CONSTRAINT "UapReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
