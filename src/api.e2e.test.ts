import supertest from 'supertest';
import { TestServerFixture } from 'src/users/tests/test-server-fixture';


describe('Webinar Routes E2E', () => {
  let fixture: TestServerFixture;


  beforeAll(async () => {
    fixture = new TestServerFixture();
    await fixture.init();
  });


  beforeEach(async () => {
    await fixture.reset();
  });

  afterAll(async () => {
    await fixture.stop();
  });

  it('should update webinar seats', async () => {

    const prisma = fixture.getPrismaClient();
    const server = fixture.getServer();


    const webinar = await prisma.webinar.create({
      data: {
        id: 'test-webinar',
        title: 'Webinar Test',
        seats: 10,
        startDate: new Date(),
        endDate: new Date(),
        organizerId: 'test-user',
      },
    });


    const response = await supertest(server)
      .post(`/webinars/${webinar.id}/seats`)
      .send({ seats: 30 }) 
      .expect(200); // Vérifie que le code de retour est 200 (succès)

   
    expect(response.body).toEqual({ message: 'Seats updated' });
    const updatedWebinar = await prisma.webinar.findUnique({
      where: { id: webinar.id },
    });
    expect(updatedWebinar?.seats).toBe(30);
  });

  it('should throw WebinarNotFoundException for a non-existing webinar', async () => {

    const server = fixture.getServer();
    const response = await supertest(server)
      .post(`/webinars/non-existing-id/seats`)
      .send({ seats: 30 })
      .expect(404); // Vérifie que le code de retour est 404 (not found)

    
    expect(response.body).toEqual({ error: 'Webinar not found' });
  });

  it('should throw WebinarNotOrganizerException for unauthorized user', async () => {
   
    const prisma = fixture.getPrismaClient();
    const server = fixture.getServer();

    const webinar = await prisma.webinar.create({
      data: {
        id: 'test-webinar',
        title: 'Webinar Test',
        seats: 10,
        startDate: new Date(),
        endDate: new Date(),
        organizerId: 'other-user', 
      },
    });

    
    const response = await supertest(server)
      .post(`/webinars/${webinar.id}/seats`)
      .send({ seats: 30 }) 
      .expect(401); // Vérifie que le code de retour est 401 (unauthorized)


    expect(response.body).toEqual({
      error: 'User is not allowed to update this webinar',
    });

  
    const unchangedWebinar = await prisma.webinar.findUnique({
      where: { id: webinar.id },
    });
    expect(unchangedWebinar?.seats).toBe(10);
  });
});
