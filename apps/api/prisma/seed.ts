import { PrismaClient, WorkspaceRole } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // ── Clean existing data ────────────────────────────────────────────────────
  await prisma.document.deleteMany();
  await prisma.workspaceMember.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.user.deleteMany();

  // ── Create Users ──────────────────────────────────────────────────────────
  const aliceHash = await argon2.hash('Password123!');
  const bobHash = await argon2.hash('Password123!');

  const alice = await prisma.user.create({
    data: {
      name: 'Alice Johnson',
      email: 'alice@example.com',
      passwordHash: aliceHash,
    },
  });

  const bob = await prisma.user.create({
    data: {
      name: 'Bob Smith',
      email: 'bob@example.com',
      passwordHash: bobHash,
    },
  });

  console.log(`✅ Created users: ${alice.email}, ${bob.email}`);

  // ── Create Workspace ──────────────────────────────────────────────────────
  const workspace = await prisma.workspace.create({
    data: {
      name: 'Acme Engineering',
      ownerId: alice.id,
    },
  });

  console.log(`✅ Created workspace: ${workspace.name}`);

  // ── Create Workspace Members ──────────────────────────────────────────────
  await prisma.workspaceMember.createMany({
    data: [
      {
        workspaceId: workspace.id,
        userId: alice.id,
        role: WorkspaceRole.OWNER,
      },
      {
        workspaceId: workspace.id,
        userId: bob.id,
        role: WorkspaceRole.MEMBER,
      },
    ],
  });

  console.log('✅ Created workspace members');

  // ── Create Documents ──────────────────────────────────────────────────────
  const doc1 = await prisma.document.create({
    data: {
      workspaceId: workspace.id,
      title: 'Project Kickoff Notes',
      content: {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            text: 'Welcome to the Acme Engineering workspace! This is our kickoff document.',
          },
          {
            type: 'paragraph',
            text: 'Key goals: Build the collaboration platform Phase 1 by end of Q3.',
          },
        ],
      },
      createdBy: alice.id,
    },
  });

  const doc2 = await prisma.document.create({
    data: {
      workspaceId: workspace.id,
      title: 'Technical Architecture',
      content: {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            text: 'Phase 1: Modular Monolith with NestJS + Fastify backend and Next.js frontend.',
          },
          {
            type: 'paragraph',
            text: 'Phase 2: Add WebSockets, Redis Pub/Sub, and CRDT-based real-time editing.',
          },
        ],
      },
      createdBy: alice.id,
    },
  });

  console.log(`✅ Created documents: "${doc1.title}", "${doc2.title}"`);

  console.log('\n🎉 Seed complete!');
  console.log('\n📋 Test credentials:');
  console.log('  Email: alice@example.com | Password: Password123!');
  console.log('  Email: bob@example.com   | Password: Password123!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
