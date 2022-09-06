import {Test, TestingModule} from '@nestjs/testing';

import {NullUuidIdentifierRepository} from './null-uuid-identifier.repository';

describe('NullUuidIdentifierRepository', () => {
  let repository: NullUuidIdentifierRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NullUuidIdentifierRepository],
    }).compile();

    repository = module.get<NullUuidIdentifierRepository>(NullUuidIdentifierRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  it('should successful return string uuid', () => {
    const result = repository.generateId();

    expect(result).toEqual('00000000-0000-0000-0000-000000000000');
  });
});
