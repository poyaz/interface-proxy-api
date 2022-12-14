import {Test, TestingModule} from '@nestjs/testing';

jest.mock('uuid');
import * as uuid from 'uuid';

import {UuidIdentifierRepository} from './uuid-identifier.repository';

describe('UuidIdentifierRepository', () => {
  let repositoryV4: UuidIdentifierRepository;
  let repositoryV5: UuidIdentifierRepository;
  let nameSpaceUuid: string;

  beforeEach(async () => {
    nameSpaceUuid = '00000000-0000-0000-0000-000000000000';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: 'v4',
          useFactory: () => new UuidIdentifierRepository(),
        },
        {
          provide: 'v5',
          useFactory: () => new UuidIdentifierRepository(nameSpaceUuid),
        },
      ],
    }).compile();

    repositoryV4 = module.get<UuidIdentifierRepository>('v4');
    repositoryV5 = module.get<UuidIdentifierRepository>('v5');
  });

  it('should be defined v4', () => {
    expect(repositoryV4).toBeDefined();
  });

  it('should be defined v5', () => {
    expect(repositoryV5).toBeDefined();
  });

  it('should successful return string uuid v4', () => {
    (<jest.Mock>uuid.v4).mockReturnValue('00000000-0000-0000-0000-000000000000');

    const result = repositoryV4.generateId();

    expect(<jest.Mock>uuid.v4).toHaveBeenCalled();
    expect(<jest.Mock>uuid.v4.mock.calls[0][0]).toEqual(undefined);
    expect(result).toEqual('00000000-0000-0000-0000-000000000000');
  });

  it('should successful return string uuid v5', () => {
    const inputData = 'my data';
    (<jest.Mock>uuid.v5).mockReturnValue('11111111-1111-1111-1111-111111111111');

    const result = repositoryV5.generateId(inputData);

    expect(<jest.Mock>uuid.v5).toHaveBeenCalled();
    expect(<jest.Mock>uuid.v5).toBeCalledWith(inputData, nameSpaceUuid);
    expect(result).toEqual('11111111-1111-1111-1111-111111111111');
  });
});
