// Test d'intégration
// A. Création d'un repository avec Prisma

import { PrismaClient, Webinar as PrismaWebinar } from '@prisma/client';
import { Webinar } from 'src/webinars/entities/webinar.entity';
import { IWebinarRepository } from 'src/webinars/ports/webinar-repository.interface';

export class PrismaWebinarRepository implements IWebinarRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(webinar: Webinar): Promise<void> {
    try {
      await this.prisma.webinar.create({
        data: WebinarMapper.toPersistence(webinar),
      });
    } catch (error) {
      console.error("❌ Error creating webinar:", error);
      throw error;
    }
  }

  async findById(id: string): Promise<Webinar | null> {
    try {
      const maybeWebinar = await this.prisma.webinar.findUnique({
        where: { id },
      });

      return maybeWebinar ? WebinarMapper.toEntity(maybeWebinar) : null;
    } catch (error) {
      console.error(`❌ Error finding webinar with id ${id}:`, error);
      throw error;
    }
  }

  async update(webinar: Webinar): Promise<void> {
    try {
      await this.prisma.webinar.update({
        where: { id: webinar.props.id },
        data: WebinarMapper.toPersistence(webinar),
      });
    } catch (error) {
      console.error("❌ Error updating webinar:", error);
      throw error;
    }
  }
}

class WebinarMapper {
  static toEntity(webinar: PrismaWebinar): Webinar {
    return new Webinar({
      id: webinar.id,
      organizerId: webinar.organizerId,
      title: webinar.title,
      startDate: webinar.startDate,
      endDate: webinar.endDate,
      seats: webinar.seats,
    });
  }

  static toPersistence(webinar: Webinar): PrismaWebinar {
    return {
      id: webinar.props.id,
      organizerId: webinar.props.organizerId,
      title: webinar.props.title,
      startDate: webinar.props.startDate,
      endDate: webinar.props.endDate,
      seats: webinar.props.seats,
    };
  }
}
