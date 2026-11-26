// npx ts-node prisma/seeds/createAdmin.ts
// Kept for existing docs/scripts: the super admin seed lives in prisma/seed.superadmin.ts and takes its
// credentials from SEED_ADMIN_* in .env (no hardcoded password; the password policy is enforced).
import '../seed.superadmin';
