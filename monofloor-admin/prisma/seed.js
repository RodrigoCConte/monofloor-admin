"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function hashPassword(password) {
    return bcrypt.hash(password, 12);
}
async function main() {
    console.log('🌱 Starting seed...');
    // Create admin users
    const adminPassword = await hashPassword('admin123');
    const superAdmin = await prisma.adminUser.upsert({
        where: { email: 'admin@monofloor.com.br' },
        update: {},
        create: {
            email: 'admin@monofloor.com.br',
            passwordHash: adminPassword,
            name: 'Administrador',
            role: 'SUPER_ADMIN',
            isActive: true,
        },
    });
    console.log('✅ Admin user created:', superAdmin.email);
    // Create some sample aplicadores
    const userPassword = await hashPassword('senha123');
    const aplicador1 = await prisma.user.upsert({
        where: { email: 'joao@monofloor.com.br' },
        update: {},
        create: {
            email: 'joao@monofloor.com.br',
            passwordHash: userPassword,
            name: 'João Silva',
            username: 'joaosilva',
            phone: '11999998888',
            status: 'APPROVED',
            approvedAt: new Date(),
            approvedById: superAdmin.id,
            role: 'APLICADOR_SENIOR',
            xpTotal: 2500,
            level: 8,
            totalHoursWorked: 450,
            totalM2Applied: 1200,
            totalProjectsCount: 15,
        },
    });
    const aplicador2 = await prisma.user.upsert({
        where: { email: 'maria@monofloor.com.br' },
        update: {},
        create: {
            email: 'maria@monofloor.com.br',
            passwordHash: userPassword,
            name: 'Maria Santos',
            username: 'mariasantos',
            phone: '11999997777',
            status: 'APPROVED',
            approvedAt: new Date(),
            approvedById: superAdmin.id,
            role: 'LIDER_EQUIPE',
            xpTotal: 4200,
            level: 12,
            totalHoursWorked: 820,
            totalM2Applied: 2500,
            totalProjectsCount: 28,
        },
    });
    const aplicador3 = await prisma.user.upsert({
        where: { email: 'pedro@monofloor.com.br' },
        update: {},
        create: {
            email: 'pedro@monofloor.com.br',
            passwordHash: userPassword,
            name: 'Pedro Oliveira',
            username: 'pedrooliveira',
            phone: '11999996666',
            status: 'APPROVED',
            approvedAt: new Date(),
            approvedById: superAdmin.id,
            role: 'APLICADOR',
            xpTotal: 850,
            level: 4,
            totalHoursWorked: 120,
            totalM2Applied: 350,
            totalProjectsCount: 5,
        },
    });
    const pendingUser = await prisma.user.upsert({
        where: { email: 'novo@email.com' },
        update: {},
        create: {
            email: 'novo@email.com',
            passwordHash: userPassword,
            name: 'Novo Candidato',
            username: 'novocandidato',
            phone: '11999995555',
            status: 'PENDING_APPROVAL',
            role: 'AUXILIAR',
        },
    });
    console.log('✅ Sample users created');
    // Create sample projects
    const project1 = await prisma.project.upsert({
        where: { pipefyCardId: 'seed-project-1' },
        update: {},
        create: {
            pipefyCardId: 'seed-project-1',
            title: 'Residência Alto Padrão - Alphaville',
            cliente: 'Família Rodrigues',
            endereco: 'Alameda das Palmeiras, 1500 - Alphaville, SP',
            m2Total: 450,
            m2Piso: 320,
            m2Parede: 130,
            equipe: 'Equipe Alpha',
            cor: 'Cinza Chumbo',
            material: 'STELION Premium',
            status: 'EM_EXECUCAO',
            estimatedHours: 180,
            workedHours: 85,
            latitude: -23.4705,
            longitude: -46.8442,
            startedAt: new Date('2024-01-15'),
        },
    });
    const project2 = await prisma.project.upsert({
        where: { pipefyCardId: 'seed-project-2' },
        update: {},
        create: {
            pipefyCardId: 'seed-project-2',
            title: 'Clínica Odontológica',
            cliente: 'Dr. Paulo Mendes',
            endereco: 'Av. Paulista, 1000 - São Paulo, SP',
            m2Total: 180,
            m2Piso: 180,
            equipe: 'Equipe Beta',
            cor: 'Branco Gelo',
            material: 'STELION Medical',
            status: 'EM_EXECUCAO',
            estimatedHours: 72,
            workedHours: 24,
            latitude: -23.5629,
            longitude: -46.6544,
            startedAt: new Date('2024-02-01'),
        },
    });
    const project3 = await prisma.project.upsert({
        where: { pipefyCardId: 'seed-project-3' },
        update: {},
        create: {
            pipefyCardId: 'seed-project-3',
            title: 'Escritório Corporativo',
            cliente: 'Tech Solutions LTDA',
            endereco: 'Rua Funchal, 500 - Vila Olímpia, SP',
            m2Total: 850,
            m2Piso: 650,
            m2Parede: 200,
            equipe: 'Equipe Alpha',
            cor: 'Grafite',
            material: 'STELION Corporate',
            status: 'PAUSADO',
            estimatedHours: 340,
            workedHours: 210,
            latitude: -23.5954,
            longitude: -46.6858,
            startedAt: new Date('2024-01-02'),
        },
    });
    console.log('✅ Sample projects created');
    // Create project assignments
    await prisma.projectAssignment.upsert({
        where: {
            userId_projectId: {
                userId: aplicador1.id,
                projectId: project1.id,
            },
        },
        update: {},
        create: {
            userId: aplicador1.id,
            projectId: project1.id,
            projectRole: 'APLICADOR',
            assignedById: superAdmin.id,
        },
    });
    await prisma.projectAssignment.upsert({
        where: {
            userId_projectId: {
                userId: aplicador2.id,
                projectId: project1.id,
            },
        },
        update: {},
        create: {
            userId: aplicador2.id,
            projectId: project1.id,
            projectRole: 'LIDER',
            assignedById: superAdmin.id,
        },
    });
    await prisma.projectAssignment.upsert({
        where: {
            userId_projectId: {
                userId: aplicador3.id,
                projectId: project1.id,
            },
        },
        update: {},
        create: {
            userId: aplicador3.id,
            projectId: project1.id,
            projectRole: 'APLICADOR',
            assignedById: superAdmin.id,
        },
    });
    await prisma.projectAssignment.upsert({
        where: {
            userId_projectId: {
                userId: aplicador2.id,
                projectId: project2.id,
            },
        },
        update: {},
        create: {
            userId: aplicador2.id,
            projectId: project2.id,
            projectRole: 'LIDER',
            assignedById: superAdmin.id,
        },
    });
    console.log('✅ Project assignments created');
    // Create sample checkins
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(8, 0, 0, 0);
    const yesterdayEnd = new Date(yesterday);
    yesterdayEnd.setHours(17, 0, 0, 0);
    await prisma.checkin.create({
        data: {
            userId: aplicador1.id,
            projectId: project1.id,
            checkinAt: yesterday,
            checkoutAt: yesterdayEnd,
            checkinLatitude: -23.4705,
            checkinLongitude: -46.8442,
            checkoutLatitude: -23.4705,
            checkoutLongitude: -46.8442,
            checkoutReason: 'FIM_EXPEDIENTE',
            hoursWorked: 9,
        },
    });
    await prisma.checkin.create({
        data: {
            userId: aplicador2.id,
            projectId: project1.id,
            checkinAt: yesterday,
            checkoutAt: yesterdayEnd,
            hoursWorked: 9,
        },
    });
    console.log('✅ Sample checkins created');
    // Create sample reports
    await prisma.report.create({
        data: {
            userId: aplicador1.id,
            projectId: project1.id,
            reportType: 'DAILY',
            reportDate: yesterday,
            notes: 'Finalizamos a preparação da base do piso na área principal. Amanhã iniciamos a aplicação do primer.',
            tags: ['preparacao', 'base', 'piso'],
            status: 'SUBMITTED',
            submittedAt: yesterdayEnd,
        },
    });
    await prisma.report.create({
        data: {
            userId: aplicador2.id,
            projectId: project1.id,
            reportType: 'DAILY',
            reportDate: yesterday,
            notes: 'Equipe trabalhou bem. Consumo de material dentro do esperado. Sem intercorrências.',
            tags: ['lideranca', 'material', 'equipe'],
            status: 'SUBMITTED',
            submittedAt: yesterdayEnd,
        },
    });
    console.log('✅ Sample reports created');
    console.log('');
    console.log('🎉 Seed completed!');
    console.log('');
    console.log('📋 Test credentials:');
    console.log('   Admin: admin@monofloor.com.br / admin123');
    console.log('   Mobile: joao@monofloor.com.br / senha123');
    console.log('   Mobile: maria@monofloor.com.br / senha123');
    console.log('');
}
main()
    .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map