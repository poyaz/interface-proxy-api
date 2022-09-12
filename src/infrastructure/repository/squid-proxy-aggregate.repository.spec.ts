import {SquidProxyAggregateRepository} from './squid-proxy-aggregate.repository';
import {mock, MockProxy} from 'jest-mock-extended';
import {IIdentifier} from '@src-core/interface/i-identifier.interface';
import {Test, TestingModule} from '@nestjs/testing';
import {ProviderTokenEnum} from '@src-core/enum/provider-token.enum';
import {IRunnerRepositoryInterface} from '@src-core/interface/i-runner-repository.interface';
import {IProxyRepositoryInterface} from '@src-core/interface/i-proxy-repository.interface';
import {UnknownException} from '@src-core/exception/unknown.exception';
import {
  ProxyDownstreamModel,
  ProxyInstanceModel,
  ProxyStatusEnum,
  ProxyTypeEnum,
  ProxyUpstreamModel,
} from '@src-core/model/proxy.model';
import {
  RunnerExecEnum,
  RunnerModel, RunnerObjectLabel,
  RunnerServiceEnum,
  RunnerSocketTypeEnum,
  RunnerStatusEnum,
} from '@src-core/model/runner.model';
import {spawn} from 'child_process';
import * as path from 'path';
import {RepositoryException} from '@src-core/exception/repository.exception';
import {PassThrough} from 'stream';
import {defaultModelFactory} from '@src-core/model/defaultModel';

jest.mock('child_process');

describe('SquidProxyAggregateRepository', () => {
  let repository: SquidProxyAggregateRepository;
  let dockerRunnerRepository: MockProxy<IRunnerRepositoryInterface>;
  let squidProxyRepository: MockProxy<IProxyRepositoryInterface>;
  let identifierMock: MockProxy<IIdentifier>;
  let identifierFakeMock: MockProxy<IIdentifier>;
  let configPath: string;

  beforeEach(async () => {
    dockerRunnerRepository = mock<IRunnerRepositoryInterface>();
    squidProxyRepository = mock<IProxyRepositoryInterface>();

    identifierMock = mock<IIdentifier>();
    identifierMock.generateId.mockReturnValue('00000000-0000-0000-0000-000000000000');

    identifierFakeMock = mock<IIdentifier>();
    identifierFakeMock.generateId.mockReturnValue('11111111-1111-1111-1111-111111111111');

    configPath = '/path/of/squid/config';

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
          ) => new SquidProxyAggregateRepository(configPath, dockerRunnerRepository, squidProxyRepository),
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

  describe(`Get all upstream`, () => {
    let outputUpstreamMatch1: ProxyUpstreamModel;
    let outputUpstreamMatch2: ProxyUpstreamModel;
    let outputUpstreamMatch3: ProxyUpstreamModel;

    let outputRunnerMatch1: RunnerModel<ProxyInstanceModel>;
    let outputRunnerNoMatch2: RunnerModel<ProxyInstanceModel>;

    let outputFindMatch1: Array<string>;

    beforeEach(() => {
      outputUpstreamMatch1 = new ProxyUpstreamModel({
        id: 'proxy-match-id-1',
        listenIp: '0.0.0.0',
        listenPort: 3128,
        proxyDownstream: [],
      });
      outputUpstreamMatch2 = new ProxyUpstreamModel({
        id: 'proxy-match-id-2',
        listenIp: '0.0.0.0',
        listenPort: 3129,
        proxyDownstream: [],
      });
      outputUpstreamMatch3 = new ProxyUpstreamModel({
        id: 'proxy-match-id-3',
        listenIp: '0.0.0.0',
        listenPort: 3130,
        proxyDownstream: [],
      });

      outputRunnerMatch1 = new RunnerModel<ProxyInstanceModel>({
        id: 'runner-match-id-1',
        serial: 'serial-1',
        name: 'squid-1',
        service: RunnerServiceEnum.SQUID,
        exec: RunnerExecEnum.DOCKER,
        socketType: RunnerSocketTypeEnum.NONE,
        volumes: [{source: '/path/of/squid-1', dest: '/etc/squid/conf.d/'}],
        label: <RunnerObjectLabel<ProxyInstanceModel>>{
          $namespace: ProxyInstanceModel.name,
          id: 'match-id-1',
        },
        status: RunnerStatusEnum.RUNNING,
        insertDate: new Date(),
      });
      outputRunnerNoMatch2 = new RunnerModel<ProxyInstanceModel>({
        id: 'runner-match-id-2',
        serial: 'serial-2',
        name: 'squid-2',
        service: RunnerServiceEnum.SQUID,
        exec: RunnerExecEnum.DOCKER,
        socketType: RunnerSocketTypeEnum.NONE,
        volumes: [{source: '/path/of/squid-no-match', dest: '/etc/squid/conf.d/'}],
        label: <RunnerObjectLabel<ProxyInstanceModel>>{
          $namespace: ProxyInstanceModel.name,
          id: 'no-match-id',
        },
        status: RunnerStatusEnum.RUNNING,
        insertDate: new Date(),
      });

      outputFindMatch1 = [
        `${path.join('/path/of/squid-1', 'port_3128.conf')}:proxy-match-id-1`,
        `${path.join('/path/of/squid-1', 'port_3129.conf')}:proxy-match-id-2`,
        `${path.join('/path/of/squid-2', 'port_3130.conf')}:proxy-match-id-3`,
      ];
    });

    it(`Should error get all upstream on execute one of task when failed on get squid proxy`, async () => {
      squidProxyRepository.getAllUpstream.mockResolvedValue([new UnknownException()]);
      dockerRunnerRepository.getAll.mockResolvedValue([null, [], 0]);
      (<jest.Mock>spawn).mockImplementation(() => {
        const stderr = new PassThrough();
        stderr.end();
        const stdout = new PassThrough();
        stdout.write('');
        stdout.end();

        return {stderr, stdout};
      });

      const [error] = await repository.getAllUpstream();

      expect(squidProxyRepository.getAllUpstream).toHaveBeenCalled();
      expect(dockerRunnerRepository.getAll).toHaveBeenCalled();
      expect(spawn).toHaveBeenCalled();
      expect(spawn).toBeCalledWith(
        'find',
        expect.arrayContaining([
          configPath,
          '-type',
          'f',
          '-name',
          '*.conf',
          '-exec',
          'grep',
          '-oP',
          '-w',
          '^###\\s+upstream-id:\\s+\\K(.+)',
          '{}',
          '+',
        ]),
      );
      expect(error).toBeInstanceOf(UnknownException);
    });

    it(`Should error get all upstream on execute one of task when failed on get runner`, async () => {
      squidProxyRepository.getAllUpstream.mockResolvedValue([null, [], 0]);
      dockerRunnerRepository.getAll.mockResolvedValue([new UnknownException()]);
      (<jest.Mock>spawn).mockImplementation(() => {
        const stderr = new PassThrough();
        stderr.end();
        const stdout = new PassThrough();
        stdout.write('');
        stdout.end();

        return {stderr, stdout};
      });

      const [error] = await repository.getAllUpstream();

      expect(squidProxyRepository.getAllUpstream).toHaveBeenCalled();
      expect(dockerRunnerRepository.getAll).toHaveBeenCalled();
      expect(spawn).toHaveBeenCalled();
      expect(spawn).toBeCalledWith(
        'find',
        expect.arrayContaining([
          configPath,
          '-type',
          'f',
          '-name',
          '*.conf',
          '-exec',
          'grep',
          '-oP',
          '-w',
          '^###\\s+upstream-id:\\s+\\K(.+)',
          '{}',
          '+',
        ]),
      );
      expect(error).toBeInstanceOf(UnknownException);
    });

    it(`Should error get all upstream on execute one of task when failed on execute find path and upstream id`, async () => {
      squidProxyRepository.getAllUpstream.mockResolvedValue([null, [], 0]);
      dockerRunnerRepository.getAll.mockResolvedValue([null, [], 0]);
      const spawnError = new Error('Spawn error');
      (<jest.Mock>spawn).mockImplementation(() => {
        throw spawnError;
      });

      const [error] = await repository.getAllUpstream();

      expect(squidProxyRepository.getAllUpstream).toHaveBeenCalled();
      expect(dockerRunnerRepository.getAll).toHaveBeenCalled();
      expect(spawn).toHaveBeenCalled();
      expect(spawn).toBeCalledWith(
        'find',
        expect.arrayContaining([
          configPath,
          '-type',
          'f',
          '-name',
          '*.conf',
          '-exec',
          'grep',
          '-oP',
          '-w',
          '^###\\s+upstream-id:\\s+\\K(.+)',
          '{}',
          '+',
        ]),
      );
      expect(error).toBeInstanceOf(RepositoryException);
      expect((<RepositoryException>error).additionalInfo).toEqual(spawnError);
    });

    it(`Should error get all upstream on execute one of task when error on output of find volume path`, async () => {
      squidProxyRepository.getAllUpstream.mockResolvedValue([null, [], 0]);
      dockerRunnerRepository.getAll.mockResolvedValue([null, [], 0]);
      const spawnErrorMsg = 'Spawn stderr error';
      (<jest.Mock>spawn).mockImplementation(() => {
        const stderr = new PassThrough();
        stderr.write(spawnErrorMsg);
        stderr.end();

        return {stderr};
      });

      const [error] = await repository.getAllUpstream();

      expect(squidProxyRepository.getAllUpstream).toHaveBeenCalled();
      expect(dockerRunnerRepository.getAll).toHaveBeenCalled();
      expect(spawn).toHaveBeenCalled();
      expect(spawn).toBeCalledWith(
        'find',
        expect.arrayContaining([
          configPath,
          '-type',
          'f',
          '-name',
          '*.conf',
          '-exec',
          'grep',
          '-oP',
          '-w',
          '^###\\s+upstream-id:\\s+\\K(.+)',
          '{}',
          '+',
        ]),
      );
      expect(error).toBeInstanceOf(RepositoryException);
      expect((<RepositoryException>error).additionalInfo).toEqual(new Error(spawnErrorMsg));
    });

    it(`Should successfully get all upstream and return empty records if not found any upstream`, async () => {
      squidProxyRepository.getAllUpstream.mockResolvedValue([null, [], 0]);
      dockerRunnerRepository.getAll.mockResolvedValue([null, [], 0]);
      (<jest.Mock>spawn).mockImplementation(() => {
        const stderr = new PassThrough();
        stderr.end();
        const stdout = new PassThrough();
        stdout.end();

        return {stderr, stdout};
      });

      const [error, result, count] = await repository.getAllUpstream();

      expect(squidProxyRepository.getAllUpstream).toHaveBeenCalled();
      expect(dockerRunnerRepository.getAll).toHaveBeenCalled();
      expect(spawn).toHaveBeenCalled();
      expect(spawn).toBeCalledWith(
        'find',
        expect.arrayContaining([
          configPath,
          '-type',
          'f',
          '-name',
          '*.conf',
          '-exec',
          'grep',
          '-oP',
          '-w',
          '^###\\s+upstream-id:\\s+\\K(.+)',
          '{}',
          '+',
        ]),
      );
      expect(error).toBeNull();
      expect(result.length).toEqual(0);
      expect(count).toEqual(0);
    });

    it(`Should successfully get all upstream and return empty records if not found any runner`, async () => {
      squidProxyRepository.getAllUpstream.mockResolvedValue([
        null,
        [outputUpstreamMatch1, outputUpstreamMatch2, outputUpstreamMatch3],
        3,
      ]);
      dockerRunnerRepository.getAll.mockResolvedValue([null, [], 0]);
      (<jest.Mock>spawn).mockImplementation(() => {
        const stderr = new PassThrough();
        stderr.end();
        const stdout = new PassThrough();
        stdout.end();

        return {stderr, stdout};
      });

      const [error, result, count] = await repository.getAllUpstream();

      expect(squidProxyRepository.getAllUpstream).toHaveBeenCalled();
      expect(dockerRunnerRepository.getAll).toHaveBeenCalled();
      expect(spawn).toHaveBeenCalled();
      expect(spawn).toBeCalledWith(
        'find',
        expect.arrayContaining([
          configPath,
          '-type',
          'f',
          '-name',
          '*.conf',
          '-exec',
          'grep',
          '-oP',
          '-w',
          '^###\\s+upstream-id:\\s+\\K(.+)',
          '{}',
          '+',
        ]),
      );
      expect(error).toBeNull();
      expect(result.length).toEqual(0);
      expect(count).toEqual(0);
    });

    it(`Should successfully get all upstream and return empty records if not found any volume path`, async () => {
      squidProxyRepository.getAllUpstream.mockResolvedValue([
        null,
        [outputUpstreamMatch1, outputUpstreamMatch2, outputUpstreamMatch3],
        3,
      ]);
      dockerRunnerRepository.getAll.mockResolvedValue([
        null,
        [outputRunnerMatch1, outputRunnerNoMatch2],
        0,
      ]);
      (<jest.Mock>spawn).mockImplementation(() => {
        const stderr = new PassThrough();
        stderr.end();
        const stdout = new PassThrough();
        stdout.end();

        return {stderr, stdout};
      });

      const [error, result, count] = await repository.getAllUpstream();

      expect(squidProxyRepository.getAllUpstream).toHaveBeenCalled();
      expect(dockerRunnerRepository.getAll).toHaveBeenCalled();
      expect(spawn).toHaveBeenCalled();
      expect(spawn).toBeCalledWith(
        'find',
        expect.arrayContaining([
          configPath,
          '-type',
          'f',
          '-name',
          '*.conf',
          '-exec',
          'grep',
          '-oP',
          '-w',
          '^###\\s+upstream-id:\\s+\\K(.+)',
          '{}',
          '+',
        ]),
      );
      expect(error).toBeNull();
      expect(result.length).toEqual(0);
      expect(count).toEqual(0);
    });

    it(`Should successfully get all upstream`, async () => {
      squidProxyRepository.getAllUpstream.mockResolvedValue([
        null,
        [outputUpstreamMatch1, outputUpstreamMatch2, outputUpstreamMatch3],
        3,
      ]);
      dockerRunnerRepository.getAll.mockResolvedValue([
        null,
        [outputRunnerMatch1, outputRunnerNoMatch2],
        2,
      ]);
      (<jest.Mock>spawn).mockImplementation(() => {
        const stderr = new PassThrough();
        stderr.end();
        const stdout = new PassThrough();
        outputFindMatch1.map((v) => {
          stdout.write(v);
          stdout.write('\n');
        });
        stdout.end();

        return {stderr, stdout};
      });

      const [error, result, count] = await repository.getAllUpstream();

      expect(squidProxyRepository.getAllUpstream).toHaveBeenCalled();
      expect(dockerRunnerRepository.getAll).toHaveBeenCalled();
      expect(spawn).toHaveBeenCalled();
      expect(spawn).toBeCalledWith(
        'find',
        expect.arrayContaining([
          configPath,
          '-type',
          'f',
          '-name',
          '*.conf',
          '-exec',
          'grep',
          '-oP',
          '-w',
          '^###\\s+upstream-id:\\s+\\K(.+)',
          '{}',
          '+',
        ]),
      );
      expect(error).toBeNull();
      expect(result[0]).toMatchObject<Omit<ProxyUpstreamModel, 'clone' | 'proxyDownstream'>>({
        id: outputUpstreamMatch1.id,
        listenIp: outputUpstreamMatch1.listenIp,
        listenPort: outputUpstreamMatch1.listenPort,
        runner: outputRunnerMatch1,
      });
      expect(result[1]).toMatchObject<Omit<ProxyUpstreamModel, 'clone' | 'proxyDownstream'>>({
        id: outputUpstreamMatch2.id,
        listenIp: outputUpstreamMatch2.listenIp,
        listenPort: outputUpstreamMatch2.listenPort,
        runner: outputRunnerMatch1,
      });
      expect(count).toEqual(2);
    });
  });

  describe(`Create proxy`, () => {
    let inputModel: ProxyUpstreamModel;

    beforeEach(() => {
      const downstreamModel = defaultModelFactory(
        ProxyDownstreamModel,
        {
          id: 'default-id',
          refId: identifierFakeMock.generateId(),
          ip: '192.168.1.1',
          mask: 32,
          type: ProxyTypeEnum.INTERFACE,
          status: ProxyStatusEnum.DISABLE,
        },
        ['id'],
      );
      const runner = new RunnerModel({
        id: identifierFakeMock.generateId(),
        serial: 'serial',
        name: 'squid-1',
        service: RunnerServiceEnum.SQUID,
        exec: RunnerExecEnum.DOCKER,
        socketType: RunnerSocketTypeEnum.NONE,
        volumes: [{source: '/host/path/of/squid-conf-1', dest: '/etc/squid/conf.d/'}],
        status: RunnerStatusEnum.RUNNING,
        insertDate: new Date(),
      });
      inputModel = defaultModelFactory(
        ProxyUpstreamModel,
        {
          id: 'default-id',
          listenIp: '0.0.0.0',
          listenPort: 3128,
          proxyDownstream: [downstreamModel],
          runner: runner,
        },
        ['id'],
      );
    });

    it(`Should error create proxy`, async () => {
      squidProxyRepository.create.mockResolvedValue([new UnknownException()]);

      const [error] = await repository.create(inputModel);

      expect(error).toBeInstanceOf(UnknownException);
    });

    it(`Should successfully create proxy`, async () => {
      squidProxyRepository.create.mockResolvedValue([null, inputModel]);

      const [error] = await repository.create(inputModel);

      expect(error).toBeNull();
    });
  });

  describe(`Remove proxy`, () => {
    let inputId: string;

    beforeEach(() => {
      inputId = identifierFakeMock.generateId();
    });

    it(`Should error remove proxy`, async () => {
      squidProxyRepository.remove.mockResolvedValue([new UnknownException()]);

      const [error] = await repository.remove(inputId);

      expect(error).toBeInstanceOf(UnknownException);
    });

    it(`Should successfully remove proxy`, async () => {
      squidProxyRepository.remove.mockResolvedValue([null]);

      const [error] = await repository.remove(inputId);

      expect(error).toBeNull();
    });
  });
});
