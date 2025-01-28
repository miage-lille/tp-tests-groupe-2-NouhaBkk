import { PrismaClient } from '@prisma/client';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { exec } from 'child_process';
import { promisify } from 'util';
import { PrismaWebinarRepository } from 'src/webinars/adapters/webinar-repository.prisma';
import { Webinar } from 'src/webinars/entities/webinar.entity';

const asyncExec = promisify(exec);

describe('PrismaWebinarRepository', () => {
  let container: StartedPostgreSqlContainer;
  let prismaClient: PrismaClient;
  let repository: PrismaWebinarRepository;

  beforeAll(async () => {
    console.log("🚀 Starting PostgreSQL test container...");
    container = await new PostgreSqlContainer()
      .withDatabase('test_db')
      .withUsername('user_test')
      .withPassword('password_test')
      .start();

    const dbUrl = container.getConnectionUri();
    prismaClient = new PrismaClient({
      datasources: {
        db: { url: dbUrl },
      },
    });

    console.log("🔄 Running database migrations...");
    await asyncExec(`DATABASE_URL=${dbUrl} npx prisma migrate deploy`);
    await prismaClient.$connect();
  });

  beforeEach(async () => {
    repository = new PrismaWebinarRepository(prismaClient);
    await prismaClient.webinar.deleteMany();
  });

  afterAll(async () => {
    console.log("🛑 Stopping PostgreSQL test container...");
    await prismaClient.$disconnect();
    await container.stop();
  });

  it('should create and retrieve a webinar', async () => {
    const webinar = new Webinar({
      id: 'webinar-id',
      organizerId: 'organizer-id',
      title: 'Webinar title',
      startDate: new Date(),
      endDate: new Date(),
      seats: 100,
    });

    await repository.create(webinar);
    const maybeWebinar = await repository.findById('webinar-id');

    expect(maybeWebinar).toBeDefined();
    expect(maybeWebinar?.props.title).toEqual('Webinar title');
  });

  it('should return null if webinar does not exist', async () => {
    const maybeWebinar = await repository.findById('non-existent-webinar');
    expect(maybeWebinar).toBeNull();
  });

  it('should not update a non-existent webinar', async () => {
    const webinar = new Webinar({
      id: 'non-existent-webinar',
      organizerId: 'organizer-id',
      title: 'Non-Existent Webinar',
      startDate: new Date(),
      endDate: new Date(),
      seats: 100,
    });

    await expect(repository.update(webinar)).rejects.toThrow();
  });
});
