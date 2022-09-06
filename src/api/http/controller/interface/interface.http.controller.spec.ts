import {Test, TestingModule} from '@nestjs/testing';
import {InterfaceHttpController} from '@src-api/http/controller/interface/interface.http.controller';

describe('InterfaceHttpController', () => {
  let controller: InterfaceHttpController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InterfaceHttpController],
    }).compile();

    controller = module.get<InterfaceHttpController>(InterfaceHttpController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
