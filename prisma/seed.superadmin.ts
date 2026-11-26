import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import path from 'path';
import dotenv from 'dotenv';
import { validatePassword } from '../src/utils/validations/passwordValidation';

// Usage: npx ts-node prisma/seed.superadmin.ts
// Reads SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD / SEED_ADMIN_FULLNAME from .env.
// The password must satisfy the same policy the app enforces on password changes.

const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

const prisma = new PrismaClient();

interface SeedAdminConfig {
    email: string;
    password: string;
    fullName: string;
}

/** Reads and validates the seed config. Returns null (after logging why) when it is unusable. */
const readSeedConfig = (): SeedAdminConfig | null => {
    const email = process.env.SEED_ADMIN_EMAIL?.trim();
    const password = process.env.SEED_ADMIN_PASSWORD;
    const fullName = process.env.SEED_ADMIN_FULLNAME?.trim() || 'Super Admin';

    if (!email || !password) {
        console.error('❌ SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set in .env');
        return null;
    }

    const policy = validatePassword(password);
    if (!policy.isValid) {
        console.error('❌ SEED_ADMIN_PASSWORD does not meet the password policy:');
        policy.errors.forEach((error) => console.error(`   - ${error}`));
        console.error('   Set a stronger SEED_ADMIN_PASSWORD in .env and run the seed again.');
        return null;
    }

    return { email, password, fullName };
};

async function createSuperAdmin(): Promise<number> {
    const config = readSeedConfig();
    if (!config) return 1;

    try {
        console.log(`Checking for existing admin with email: ${config.email}`);

        const existingUser = await prisma.user.findUnique({
            where: { email: config.email },
        });

        if (existingUser) {
            if (existingUser.role === Role.SUPER_ADMIN) {
                console.log('⚠️  Super admin already exists with this email (password left unchanged).');
                return 0;
            }
            // Dev convenience: promote the existing account (there is no public API that can do this)
            console.log('⚠️  User exists but is not a SUPER_ADMIN. Updating role...');
            await prisma.user.update({
                where: { email: config.email },
                data: { role: Role.SUPER_ADMIN },
            });
            console.log('✅ User role updated to SUPER_ADMIN');
            return 0;
        }

        console.log('Creating new Super Admin...');
        const hashedPassword = await bcrypt.hash(config.password, 12);

        const admin = await prisma.user.create({
            data: {
                email: config.email,
                password: hashedPassword,
                fullName: config.fullName,
                role: Role.SUPER_ADMIN,
                isEmailVerified: true,
                isPasswordSet: true,
            },
        });

        console.log('✅ Super admin created successfully with ID:', admin.id);
        console.log('📧 Email:', config.email);
        console.log('🔑 Password: the SEED_ADMIN_PASSWORD value from .env');
        return 0;
    } catch (error) {
        console.error('❌ Error creating super admin:', error);
        return 1;
    } finally {
        await prisma.$disconnect();
    }
}

createSuperAdmin().then((code) => {
    process.exitCode = code;
});
