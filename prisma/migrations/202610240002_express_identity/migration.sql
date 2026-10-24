-- Identity defaults only. Existing records are backed up and changed by scripts/rebrand.ts.
ALTER TABLE "Settings" ALTER COLUMN "phone" SET DEFAULT '+919342328311';
ALTER TABLE "Settings" ALTER COLUMN "address" SET DEFAULT 'SM Complex, 220/2A, Airport Mattuthavani Ring Rd, Santhosh Nagar, Avaniyapuram, Madurai, Tamil Nadu 625012';
ALTER TABLE "Settings" ALTER COLUMN "mapUrl" SET DEFAULT 'https://www.google.com/maps/search/?api=1&query=Madurai+Express+SM+Complex+Avaniyapuram+Madurai';
ALTER TABLE "Settings" ALTER COLUMN "orderUrl" SET DEFAULT '';
