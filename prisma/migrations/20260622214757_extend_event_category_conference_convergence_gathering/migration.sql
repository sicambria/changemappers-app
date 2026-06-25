-- AlterEnum
-- Additive only: new EventCategory values for conference/convergence/gathering
-- style events (the prior catalogue forced these into WORKSHOP/OPEN_SPACE/OTHER).
ALTER TYPE "EventCategory" ADD VALUE 'CONFERENCE';
ALTER TYPE "EventCategory" ADD VALUE 'CONVERGENCE';
ALTER TYPE "EventCategory" ADD VALUE 'GATHERING';
