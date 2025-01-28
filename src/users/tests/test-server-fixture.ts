import { PrismaClient } from '@prisma/client';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { exec } from 'child_process';
import Fastify, { FastifyInstance } from 'fastify';
import { AppContainer } from 'src/container';  
import { webinarRoutes } from 'src/webinars/routes';  
import { promisify } from 'util';

const asyncExec = promisify(exec);

export class TestServerFixture {
  private container!: StartedPostgreSqlContainer;
  private prismaClient!: PrismaClient;
  private serverInstance!: FastifyInstance;
  private appContainer!: AppContainer;

  // Initialiser le serveur, la base de données et Prisma
  async init() {
    // Démarrer le container PostgreSQL
    this.container = await new PostgreSqlContainer()
      .withDatabase('test_db')
      .withUsername('user_test')
      .withPassword('password_test')
      .start();

    const dbUrl = this.container.getConnectionUri();

    // Configurer Prisma avec l'URL de connexion du container
    this.prismaClient = new PrismaClient({
      datasources: {
        db: { url: dbUrl },
      },
    });

    // Exécuter les migrations pour la base de données
    await asyncExec(`DATABASE_URL=${dbUrl} npx prisma migrate deploy`);
    await this.prismaClient.$connect();

    // Initialiser l'application (container des dépendances)
    this.appContainer = new AppContainer();
    this.appContainer.init(this.prismaClient);

    // Initialiser Fastify et enregistrer les routes
    this.serverInstance = Fastify({ logger: false });
    await webinarRoutes(this.serverInstance, this.appContainer);
    await this.serverInstance.ready();
  }

  // Méthode pour obtenir le client Prisma
  getPrismaClient() {
    return this.prismaClient;
  }

  // Méthode pour obtenir le serveur Fastify
  getServer() {
    return this.serverInstance.server;
  }

  // Arrêter le serveur, déconnecter Prisma et arrêter le container
  async stop() {
    if (this.serverInstance) await this.serverInstance.close();
    if (this.prismaClient) await this.prismaClient.$disconnect();
    if (this.container) await this.container.stop();
  }

  // Réinitialiser la base de données
  async reset() {
    await this.prismaClient.webinar.deleteMany(); 
    await this.prismaClient.$executeRawUnsafe('DELETE FROM "Webinar" CASCADE'); 
  }
}