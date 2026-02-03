
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import path from 'path';
import dotenv from 'dotenv';

const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

const prisma = new PrismaClient();

async function createSuperAdmin() {
    try {
        const email = 'admin@company.com';
        const password = 'StrongAdmin@123';
        const fullName = 'Super Admin';

        console.log(`Checking for existing admin with email: ${email}`);

        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            if (existingUser.role === Role.SUPER_ADMIN) {
                console.log('⚠️  Super admin already exists with this email.');
                return;
            } else {
                console.log('⚠️  User exists but is not a SUPER_ADMIN. Updating role...');
                // Optional: Upgrade existing user to SUPER_ADMIN? 
                // For safety, let's just warn and exit, or we can update it. 
                // Given requirements say "There MUST be NO way to create SUPER_ADMIN from any public API", 
                // we should probably just fail or manually update via seed.
                // Let's update the existing user to be SUPER_ADMIN for convenience in dev.
                await prisma.user.update({
                    where: { email },
                    data: { role: Role.SUPER_ADMIN }
                });
                console.log('✅ User role updated to SUPER_ADMIN');
                return;
            }
        }

        console.log('Creating new Super Admin...');
        const hashedPassword = await bcrypt.hash(password, 10);

        const admin = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                fullName,
                role: Role.SUPER_ADMIN,
                isEmailVerified: true,
                isPasswordSet: true,
            },
        });

        console.log('✅ Super admin created successfully with ID:', admin.id);
        console.log('📧 Email:', email);
        console.log('🔑 Password:', password);
        console.log('⚠️  Please change the password after first login');
    } catch (error) {
        console.error('❌ Error creating super admin:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createSuperAdmin();
