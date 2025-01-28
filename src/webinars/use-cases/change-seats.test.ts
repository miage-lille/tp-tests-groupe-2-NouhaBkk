import { InMemoryWebinarRepository } from 'src/webinars/adapters/webinar-repository.in-memory';
import { ChangeSeats } from 'src/webinars/use-cases/change-seats';
import { testUser } from 'src/users/tests/user-seeds';
import { Webinar } from 'src/webinars/entities/webinar.entity';
import { WebinarNotFoundException } from 'src/webinars/exceptions/webinar-not-found';
import { WebinarNotOrganizerException } from 'src/webinars/exceptions/webinar-not-organizer';
import { WebinarReduceSeatsException } from 'src/webinars/exceptions/webinar-reduce-seats';
import { WebinarTooManySeatsException } from 'src/webinars/exceptions/webinar-too-many-seats';

describe('ChangeSeats Use Case', () => {
  let repository: InMemoryWebinarRepository;
  let useCase: ChangeSeats;

  beforeEach(() => {
    repository = new InMemoryWebinarRepository();
    useCase = new ChangeSeats(repository);
  });

  describe('Scenario: Happy Path', () => {
    it('should successfully update the number of seats', async () => {
      const webinar = new Webinar({
        id: 'webinar-id',
        organizerId: testUser.alice.props.id,
        title: 'Webinar Title',
        startDate: new Date(),
        endDate: new Date(),
        seats: 100,
      });

      repository.create(webinar);

      const payload = {
        user: testUser.alice,
        webinarId: 'webinar-id',
        seats: 200,
      };

      await useCase.execute(payload);

      const updatedWebinar = repository.findByIdSync('webinar-id');
      expect(updatedWebinar?.props.seats).toEqual(200);
    });
  });

  describe('Scenario: Errors and Edge Cases', () => {
    it('should throw if webinar does not exist', async () => {
      const payload = {
        user: testUser.alice,
        webinarId: 'non-existent-webinar',
        seats: 200,
      };

      await expect(useCase.execute(payload)).rejects.toThrow(WebinarNotFoundException);
    });

    it('should throw if user is not the organizer', async () => {
      const webinar = new Webinar({
        id: 'webinar-id',
        organizerId: testUser.alice.props.id,
        title: 'Webinar Title',
        startDate: new Date(),
        endDate: new Date(),
        seats: 100,
      });

      repository.create(webinar);

      const payload = {
        user: testUser.bob, // Bob n'est pas l'organisateur
        webinarId: 'webinar-id',
        seats: 200,
      };

      await expect(useCase.execute(payload)).rejects.toThrow(WebinarNotOrganizerException);
    });

    it('should throw if trying to decrease seats', async () => {
      const webinar = new Webinar({
        id: 'webinar-id',
        organizerId: testUser.alice.props.id,
        title: 'Webinar Title',
        startDate: new Date(),
        endDate: new Date(),
        seats: 100,
      });

      repository.create(webinar);

      const payload = {
        user: testUser.alice,
        webinarId: 'webinar-id',
        seats: 50, // Réduction du nombre de sièges
      };

      await expect(useCase.execute(payload)).rejects.toThrow(WebinarReduceSeatsException);
    });

    it('should throw if seats exceed 1000', async () => {
      const webinar = new Webinar({
        id: 'webinar-id',
        organizerId: testUser.alice.props.id,
        title: 'Webinar Title',
        startDate: new Date(),
        endDate: new Date(),
        seats: 100,
      });

      repository.create(webinar);

      const payload = {
        user: testUser.alice,
        webinarId: 'webinar-id',
        seats: 1500, // Dépassement du maximum autorisé
      };

      await expect(useCase.execute(payload)).rejects.toThrow(WebinarTooManySeatsException);
    });

    it('should throw if seats is negative', async () => {
      const payload = {
        user: testUser.alice,
        webinarId: 'webinar-id',
        seats: -5,
      };

      await expect(useCase.execute(payload)).rejects.toThrow();
    });

    it('should throw if seats is NaN', async () => {
      const payload = {
        user: testUser.alice,
        webinarId: 'webinar-id',
        seats: NaN,
      };

      await expect(useCase.execute(payload)).rejects.toThrow();
    });

    it('should throw if seats is null or undefined', async () => {
      const payloads = [
        { user: testUser.alice, webinarId: 'webinar-id', seats: null },
        { user: testUser.alice, webinarId: 'webinar-id', seats: undefined },
      ];

      for (const payload of payloads) {
        await expect(useCase.execute(payload as any)).rejects.toThrow();
      }
    });
  });
});
