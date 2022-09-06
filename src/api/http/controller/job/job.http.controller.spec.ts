import { Test, TestingModule } from '@nestjs/testing';
import { JobHttpController } from './job.http.controller';

describe('JobHttpController', () => {
  let controller: JobHttpController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JobHttpController],
    }).compile();

    controller = module.get<JobHttpController>(JobHttpController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
