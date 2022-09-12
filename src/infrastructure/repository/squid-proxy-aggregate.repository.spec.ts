import {SquidProxyAggregateRepository} from './squid-proxy-aggregate.repository';
import {mock, MockProxy} from 'jest-mock-extended';
import {INetworkInterfaceRepositoryInterface} from '@src-core/interface/i-network-interface-repository.interface';
import {IIdentifier} from '@src-core/interface/i-identifier.interface';
import {Test, TestingModule} from '@nestjs/testing';
import {ProviderTokenEnum} from '@src-core/enum/provider-token.enum';
import {IRunnerRepositoryInterface} from '@src-core/interface/i-runner-repository.interface';
import {IProxyRepositoryInterface} from '@src-core/interface/i-proxy-repository.interface';
import {UnknownException} from '@src-core/exception/unknown.exception';

describe('SquidProxyAggregateRepository', () => {
  let repository: SquidProxyAggregateRepository;
  let dockerRunnerRepository: MockProxy<IRunnerRepositoryInterface>;
  let squidProxyRepository: MockProxy<IProxyRepositoryInterface>;
  let identifierMock: MockProxy<IIdentifier>;
  let identifierFakeMock: MockProxy<IIdentifier>;

  beforeEach(async () => {
    dockerRunnerRepository = mock<IRunnerRepositoryInterface>();
    squidProxyRepository = mock<IProxyRepositoryInterface>();

    identifierMock = mock<IIdentifier>();
    identifierMock.generateId.mockReturnValue('00000000-0000-0000-0000-000000000000');

    identifierFakeMock = mock<IIdentifier>();
    identifierFakeMock.generateId.mockReturnValue('11111111-1111-1111-1111-111111111111');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ProviderTokenEnum.DOCKER_RUNNER_REPOSITORY,
          useValue: dockerRunnerRepository,
        },
        {
          provide: ProviderTokenEnum.SQUID_PROXY_REPOSITORY,
          useValue: squidProxyRepository,
        },
        {
          provide: SquidProxyAggregateRepository,
          inject: [ProviderTokenEnum.DOCKER_RUNNER_REPOSITORY, ProviderTokenEnum.SQUID_PROXY_REPOSITORY],
          useFactory: (
            dockerRunnerRepository: IRunnerRepositoryInterface,
            squidProxyRepository: IProxyRepositoryInterface,
          ) => new SquidProxyAggregateRepository(dockerRunnerRepository, squidProxyRepository),
        },
      ],
    }).compile();

    repository = module.get<SquidProxyAggregateRepository>(SquidProxyAggregateRepository);

    jest.useFakeTimers().setSystemTime(new Date('2020-01-01'));
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe(`Get all downstream`, () => {
    it(`Should error get all downstream`, async () => {
      squidProxyRepository.getAllDownstream.mockResolvedValue([new UnknownException()]);

      const [error] = await repository.getAllDownstream();

      expect(error).toBeInstanceOf(UnknownException);
    });

    it(`Should successfully get all downstream`, async () => {
      squidProxyRepository.getAllDownstream.mockResolvedValue([null, [], 0]);

      const [error, result, count] = await repository.getAllDownstream();

      expect(error).toBeNull();
      expect(result.length).toEqual(0);
      expect(count).toEqual(0);
    });
  });
});
