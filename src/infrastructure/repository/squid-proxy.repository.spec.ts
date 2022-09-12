import {mock, MockProxy} from 'jest-mock-extended';
import {INetworkInterfaceRepositoryInterface} from '@src-core/interface/i-network-interface-repository.interface';
import {IIdentifier} from '@src-core/interface/i-identifier.interface';
import {Test, TestingModule} from '@nestjs/testing';
import {SquidProxyRepository} from './squid-proxy.repository';
import {RepositoryException} from '@src-core/exception/repository.exception';
import {checkDirOrFileExist, checkPortInUse, getFiles} from '@src-infrastructure/utility/utility';
import * as path from 'path';
import * as fsAsync from 'fs/promises';
import {spawn} from 'child_process';
import {ProxyDownstreamModel, ProxyStatusEnum, ProxyTypeEnum, ProxyUpstreamModel} from '@src-core/model/proxy.model';
import {FillDataRepositoryException} from '@src-core/exception/fill-data-repository.exception';
import {InvalidConfigFileException} from '@src-core/exception/invalid-config-file.exception';
import {defaultModelFactory} from '@src-core/model/defaultModel';
import {
  RunnerExecEnum,
  RunnerModel,
  RunnerServiceEnum,
  RunnerSocketTypeEnum,
  RunnerStatusEnum,
} from '@src-core/model/runner.model';
import {ExistException} from '@src-core/exception/exist.exception';
import {ProviderTokenEnum} from '@src-core/enum/provider-token.enum';
import {PassThrough} from 'stream';
import {NotFoundException} from '@src-core/exception/not-found.exception';

jest.mock('child_process');
jest.mock('fs/promises');
jest.mock('@src-infrastructure/utility/utility');

describe('SquidProxyRepository', () => {
  let repository: SquidProxyRepository;
  let networkInterfaceAggregateRepository: MockProxy<INetworkInterfaceRepositoryInterface>;
  let identifierMock: MockProxy<IIdentifier>;
  let identifierFakeMock: MockProxy<IIdentifier>;

  let configPath: string;

  beforeEach(async () => {
    networkInterfaceAggregateRepository = mock<INetworkInterfaceRepositoryInterface>();

    identifierMock = mock<IIdentifier>();
    identifierMock.generateId.mockReturnValue('00000000-0000-0000-0000-000000000000');

    identifierFakeMock = mock<IIdentifier>();
    identifierFakeMock.generateId.mockReturnValue('11111111-1111-1111-1111-111111111111');

    configPath = '/path/of/squid/config';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ProviderTokenEnum.IDENTIFIER_UUID_REPOSITORY,
          useValue: identifierMock,
        },
        {
          provide: SquidProxyRepository,
          inject: [ProviderTokenEnum.IDENTIFIER_UUID_REPOSITORY],
          useFactory: (identifierMock) => new SquidProxyRepository(configPath, identifierMock),
        },
      ],
    }).compile();

    repository = module.get<SquidProxyRepository>(SquidProxyRepository);

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
    let outputFileConfig1: string;
    let outputFileConfig2: string;
    let outputFileConfig3: string;
    let outputFileConfigNoMatch4: string;

    let outputFileConfigContent1: string;
    let outputFileConfigContent2: string;
    let outputFileConfigContent3: string;
    let outputFileConfigContentNoUpstreamId4: string;
    let outputFileConfigContentNoDownstreamId5: string;
    let outputFileConfigContentNoRefId6: string;
    let outputFileConfigContentNoIp7: string;

    beforeEach(() => {
      outputFileConfig1 = path.join(configPath, 'squid-conf-1', 'port_3128.conf');
      outputFileConfig2 = path.join(configPath, 'squid-conf-1', 'port_3129.conf');
      outputFileConfig3 = path.join(configPath, 'squid-conf-2', 'port_3130.conf');
      outputFileConfigNoMatch4 = path.join(configPath, 'squid-conf-2', 'info.text');

      outputFileConfigContent1 = [
        '### upstream-id: 23b302fe9-242b-448b-82cf-ff632bbb80cc',
        'http_port 0.0.0.0:3128 name=port3128',
        '',
        'acl out3128 myportname port3128',
        '',
        '### downstream-id: 28d22781-2284-4c8d-b150-feb8947c2442',
        '### ref-id: ba65cf0d-65bd-4f5d-a7b6-61954076da6c',
        'tcp_outgoing_address 10.101.0.9 out3128',
      ].join('\n');
      outputFileConfigContent2 = [
        '### upstream-id: 15c48292-90c4-4a5d-bc7d-1ad3ce870b7e',
        'http_port 0.0.0.0:3130 name=port3130',
        '',
        'acl out3130 myportname port3130',
        '',
        '### downstream-id: d0548c93-5e93-49f5-81ed-0e0c607968be',
        '### ref-id: e9479355-2665-40bf-9f63-e916e1dec98a',
        'tcp_outgoing_address 10.101.0.25 out3130',
      ].join('\n');
      outputFileConfigContent3 = [
        '### upstream-id: b55f5d9b-2d87-4eda-812f-93be1949be54',
        'http_port 0.0.0.0:3129 name=port3129',
        '',
        'acl out3129 myportname port3129',
        '',
        '### downstream-id: 083f0860-e676-4927-9db4-c839948deec0',
        '### ref-id: b204ba2f-8f87-411f-9701-e2a145d3e624',
        'tcp_outgoing_address 10.101.0.17 out3129',
      ].join('\n');
      outputFileConfigContentNoUpstreamId4 = [
        'http_port 0.0.0.0:3129 name=port3129',
        '',
        'acl out3129 myportname port3129',
        '',
        '### downstream-id: 083f0860-e676-4927-9db4-c839948deec0',
        '### ref-id: b204ba2f-8f87-411f-9701-e2a145d3e624',
        'tcp_outgoing_address 10.101.0.17 out3129',
      ].join('\n');
      outputFileConfigContentNoDownstreamId5 = [
        '### upstream-id: b55f5d9b-2d87-4eda-812f-93be1949be54',
        'http_port 0.0.0.0:3129 name=port3129',
        '',
        'acl out3129 myportname port3129',
        '',
        '### ref-id: b204ba2f-8f87-411f-9701-e2a145d3e624',
        'tcp_outgoing_address 10.101.0.17 out3129',
      ].join('\n');
      outputFileConfigContentNoRefId6 = [
        '### upstream-id: b55f5d9b-2d87-4eda-812f-93be1949be54',
        'http_port 0.0.0.0:3129 name=port3129',
        '',
        'acl out3129 myportname port3129',
        '',
        '### downstream-id: 083f0860-e676-4927-9db4-c839948deec0',
        'tcp_outgoing_address 10.101.0.17 out3129',
      ].join('\n');
      outputFileConfigContentNoIp7 = [
        '### upstream-id: b55f5d9b-2d87-4eda-812f-93be1949be54',
        'http_port 0.0.0.0:3129 name=port3129',
        '',
        'acl out3129 myportname port3129',
        '',
        '### downstream-id: 083f0860-e676-4927-9db4-c839948deec0',
        '### ref-id: b204ba2f-8f87-411f-9701-e2a145d3e624',
        '#tcp_outgoing_address 10.101.0.17 out3129',
      ].join('\n');
    });

    it(`Should error get all downstream when get all config files`, async () => {
      const fileError = new Error('File error');
      (<jest.Mock>getFiles).mockImplementation(() => {
        throw fileError;
      });

      const [error] = await repository.getAllDownstream();

      expect(getFiles).toHaveBeenCalled();
      expect(getFiles).toBeCalledWith(configPath);
      expect(error).toBeInstanceOf(RepositoryException);
      expect((<RepositoryException>error).additionalInfo).toEqual(fileError);
    });

    it(`Should successfully get all downstream and return empty when not found any file config`, async () => {
      (<jest.Mock>getFiles).mockImplementation(() => {
        return {
          async* [Symbol.asyncIterator]() {
            yield* [outputFileConfigNoMatch4];
          },
        };
      });

      const [error, result, count] = await repository.getAllDownstream();

      expect(getFiles).toHaveBeenCalled();
      expect(getFiles).toBeCalledWith(configPath);
      expect(error).toBeNull();
      expect(result.length).toEqual(0);
      expect(count).toEqual(0);
    });

    it(`Should error get all downstream when read each file`, async () => {
      (<jest.Mock>getFiles).mockImplementation(() => {
        return {
          async* [Symbol.asyncIterator]() {
            yield* [outputFileConfig1, outputFileConfig2, outputFileConfig3, outputFileConfigNoMatch4];
          },
        };
      });
      const fileError = new Error('File error');
      (<jest.Mock>fsAsync.readFile).mockRejectedValue(fileError);

      const [error] = await repository.getAllDownstream();

      expect(getFiles).toHaveBeenCalled();
      expect(getFiles).toHaveBeenCalledWith(configPath);
      expect(fsAsync.readFile).toHaveBeenCalled();
      expect(fsAsync.readFile).toHaveBeenCalledWith(outputFileConfig1, 'utf-8');
      expect(error).toBeInstanceOf(RepositoryException);
      expect((<RepositoryException>error).additionalInfo).toEqual(fileError);
    });

    it(`Should error get all downstream when config file not valid and the upstream id not found`, async () => {
      (<jest.Mock>getFiles).mockImplementation(() => {
        return {
          async* [Symbol.asyncIterator]() {
            yield* [outputFileConfig1, outputFileConfig2, outputFileConfig3, outputFileConfigNoMatch4];
          },
        };
      });
      (<jest.Mock>fsAsync.readFile)
        .mockResolvedValueOnce(outputFileConfigContent1)
        .mockResolvedValueOnce(outputFileConfigContent2)
        .mockResolvedValueOnce(outputFileConfigContentNoUpstreamId4);

      const [error] = await repository.getAllDownstream();

      expect(getFiles).toHaveBeenCalled();
      expect(getFiles).toHaveBeenCalledWith(configPath);
      expect(fsAsync.readFile).toHaveBeenCalled();
      expect(fsAsync.readFile).toHaveBeenCalledWith(outputFileConfig1, 'utf-8');
      expect(error).toBeInstanceOf(InvalidConfigFileException);
      expect((<InvalidConfigFileException>error).additionalInfo.length).toEqual(1);
      expect((<InvalidConfigFileException>error).additionalInfo).toEqual(expect.arrayContaining([outputFileConfig3]));
    });

    it(`Should error get all downstream when config file not valid and the downstream id not found`, async () => {
      (<jest.Mock>getFiles).mockImplementation(() => {
        return {
          async* [Symbol.asyncIterator]() {
            yield* [outputFileConfig1, outputFileConfig2, outputFileConfig3, outputFileConfigNoMatch4];
          },
        };
      });
      (<jest.Mock>fsAsync.readFile)
        .mockResolvedValueOnce(outputFileConfigContent1)
        .mockResolvedValueOnce(outputFileConfigContent2)
        .mockResolvedValueOnce(outputFileConfigContentNoDownstreamId5);

      const [error] = await repository.getAllDownstream();

      expect(getFiles).toHaveBeenCalled();
      expect(getFiles).toHaveBeenCalledWith(configPath);
      expect(fsAsync.readFile).toHaveBeenCalled();
      expect(fsAsync.readFile).toHaveBeenCalledWith(outputFileConfig1, 'utf-8');
      expect(error).toBeInstanceOf(FillDataRepositoryException);
      expect((<FillDataRepositoryException<ProxyDownstreamModel>>error).fillProperties.length).toEqual(1);
      expect((<FillDataRepositoryException<ProxyDownstreamModel>>error).fillProperties).toEqual(expect.arrayContaining<keyof ProxyDownstreamModel>(['id']));
    });

    it(`Should error get all downstream when config file not valid and the ref id not found`, async () => {
      (<jest.Mock>getFiles).mockImplementation(() => {
        return {
          async* [Symbol.asyncIterator]() {
            yield* [outputFileConfig1, outputFileConfig2, outputFileConfig3, outputFileConfigNoMatch4];
          },
        };
      });
      (<jest.Mock>fsAsync.readFile)
        .mockResolvedValueOnce(outputFileConfigContent1)
        .mockResolvedValueOnce(outputFileConfigContent2)
        .mockResolvedValueOnce(outputFileConfigContentNoRefId6);

      const [error] = await repository.getAllDownstream();

      expect(getFiles).toHaveBeenCalled();
      expect(getFiles).toHaveBeenCalledWith(configPath);
      expect(fsAsync.readFile).toHaveBeenCalled();
      expect(fsAsync.readFile).toHaveBeenCalledWith(outputFileConfig1, 'utf-8');
      expect(error).toBeInstanceOf(FillDataRepositoryException);
      expect((<FillDataRepositoryException<ProxyDownstreamModel>>error).fillProperties.length).toEqual(1);
      expect((<FillDataRepositoryException<ProxyDownstreamModel>>error).fillProperties).toEqual(expect.arrayContaining<keyof ProxyDownstreamModel>(['refId']));
    });

    it(`Should error get all downstream when config file not valid and the ip not found`, async () => {
      (<jest.Mock>getFiles).mockImplementation(() => {
        return {
          async* [Symbol.asyncIterator]() {
            yield* [outputFileConfig1, outputFileConfig2, outputFileConfig3, outputFileConfigNoMatch4];
          },
        };
      });
      (<jest.Mock>fsAsync.readFile)
        .mockResolvedValueOnce(outputFileConfigContent1)
        .mockResolvedValueOnce(outputFileConfigContent2)
        .mockResolvedValueOnce(outputFileConfigContentNoIp7);

      const [error] = await repository.getAllDownstream();

      expect(getFiles).toHaveBeenCalled();
      expect(getFiles).toHaveBeenCalledWith(configPath);
      expect(fsAsync.readFile).toHaveBeenCalled();
      expect(fsAsync.readFile).toHaveBeenCalledWith(outputFileConfig1, 'utf-8');
      expect(error).toBeInstanceOf(FillDataRepositoryException);
      expect((<FillDataRepositoryException<ProxyDownstreamModel>>error).fillProperties.length).toEqual(1);
      expect((<FillDataRepositoryException<ProxyDownstreamModel>>error).fillProperties).toEqual(expect.arrayContaining<keyof ProxyDownstreamModel>(['ip']));
    });

    it(`Should successfully get all downstream`, async () => {
      (<jest.Mock>getFiles).mockImplementation(() => {
        return {
          async* [Symbol.asyncIterator]() {
            yield* [outputFileConfig1, outputFileConfig2, outputFileConfig3, outputFileConfigNoMatch4];
          },
        };
      });
      (<jest.Mock>fsAsync.readFile)
        .mockResolvedValueOnce(outputFileConfigContent1)
        .mockResolvedValueOnce(outputFileConfigContent2)
        .mockResolvedValueOnce(outputFileConfigContent3);

      const [error, result, count] = await repository.getAllDownstream();

      expect(getFiles).toHaveBeenCalled();
      expect(getFiles).toHaveBeenCalledWith(configPath);
      expect(fsAsync.readFile).toHaveBeenCalled();
      expect(fsAsync.readFile).toHaveBeenCalledWith(outputFileConfig1, 'utf-8');
      expect(error).toBeNull();
      expect(result[0]).toMatchObject<Omit<ProxyDownstreamModel, 'clone' | 'runner'>>({
        id: outputFileConfigContent1.match(/###\s+downstream-id:\s+(.+)/)[1],
        refId: outputFileConfigContent1.match(/###\s+ref-id:\s+(.+)/)[1],
        ip: outputFileConfigContent1.match(/tcp_outgoing_address\s+([^\s]+)\s+.+/)[1],
        mask: 32,
        type: ProxyTypeEnum.INTERFACE,
        status: ProxyStatusEnum.ONLINE,
      });
      expect(result[1]).toMatchObject<Omit<ProxyDownstreamModel, 'clone' | 'runner'>>({
        id: outputFileConfigContent2.match(/###\s+downstream-id:\s+(.+)/)[1],
        refId: outputFileConfigContent2.match(/###\s+ref-id:\s+(.+)/)[1],
        ip: outputFileConfigContent2.match(/tcp_outgoing_address\s+([^\s]+)\s+.+/)[1],
        mask: 32,
        type: ProxyTypeEnum.INTERFACE,
        status: ProxyStatusEnum.ONLINE,
      });
      expect(result[2]).toMatchObject<Omit<ProxyDownstreamModel, 'clone' | 'runner'>>({
        id: outputFileConfigContent3.match(/###\s+downstream-id:\s+(.+)/)[1],
        refId: outputFileConfigContent3.match(/###\s+ref-id:\s+(.+)/)[1],
        ip: outputFileConfigContent3.match(/tcp_outgoing_address\s+([^\s]+)\s+.+/)[1],
        mask: 32,
        type: ProxyTypeEnum.INTERFACE,
        status: ProxyStatusEnum.ONLINE,
      });
      expect(count).toEqual(3);
    });
  });

  describe(`Get all upstream`, () => {
    let outputFileConfig1: string;
    let outputFileConfig2: string;
    let outputFileConfig3: string;
    let outputFileConfigNoMatch4: string;

    let outputFileConfigContent1: string;
    let outputFileConfigContent2: string;
    let outputFileConfigContent3: string;
    let outputFileConfigContentNoUpstreamId4: string;
    let outputFileConfigContentNoIpAndPort5: string;

    beforeEach(() => {
      outputFileConfig1 = path.join(configPath, 'squid-conf-1', 'port_3128.conf');
      outputFileConfig2 = path.join(configPath, 'squid-conf-1', 'port_3129.conf');
      outputFileConfig3 = path.join(configPath, 'squid-conf-2', 'port_3130.conf');
      outputFileConfigNoMatch4 = path.join(configPath, 'squid-conf-2', 'info.text');

      outputFileConfigContent1 = [
        '### upstream-id: 23b302fe9-242b-448b-82cf-ff632bbb80cc',
        'http_port 0.0.0.0:3128 name=port3128',
        '',
        'acl out3128 myportname port3128',
        '',
        '### downstream-id: 28d22781-2284-4c8d-b150-feb8947c2442',
        '### ref-id: ba65cf0d-65bd-4f5d-a7b6-61954076da6c',
        'tcp_outgoing_address 10.101.0.9 out3128',
      ].join('\n');
      outputFileConfigContent2 = [
        '### upstream-id: 15c48292-90c4-4a5d-bc7d-1ad3ce870b7e',
        'http_port 0.0.0.0:3130 name=port3130',
        '',
        'acl out3130 myportname port3130',
        '',
        '### downstream-id: d0548c93-5e93-49f5-81ed-0e0c607968be',
        '### ref-id: e9479355-2665-40bf-9f63-e916e1dec98a',
        'tcp_outgoing_address 10.101.0.25 out3130',
      ].join('\n');
      outputFileConfigContent3 = [
        '### upstream-id: b55f5d9b-2d87-4eda-812f-93be1949be54',
        'http_port 0.0.0.0:3129 name=port3129',
        '',
        'acl out3129 myportname port3129',
        '',
        '### downstream-id: 083f0860-e676-4927-9db4-c839948deec0',
        '### ref-id: b204ba2f-8f87-411f-9701-e2a145d3e624',
        'tcp_outgoing_address 10.101.0.17 out3129',
      ].join('\n');
      outputFileConfigContentNoUpstreamId4 = [
        'http_port 0.0.0.0:3129 name=port3129',
        '',
        'acl out3129 myportname port3129',
        '',
        '### downstream-id: 083f0860-e676-4927-9db4-c839948deec0',
        '### ref-id: b204ba2f-8f87-411f-9701-e2a145d3e624',
        'tcp_outgoing_address 10.101.0.17 out3129',
      ].join('\n');
      outputFileConfigContentNoIpAndPort5 = [
        '### upstream-id: b55f5d9b-2d87-4eda-812f-93be1949be54',
        '#http_port 0.0.0.0:3129 name=port3129',
        '',
        'acl out3129 myportname port3129',
        '',
        '### downstream-id: 083f0860-e676-4927-9db4-c839948deec0',
        '### ref-id: b204ba2f-8f87-411f-9701-e2a145d3e624',
        'tcp_outgoing_address 10.101.0.17 out3129',
      ].join('\n');
    });

    it(`Should error get all upstream when get all config files`, async () => {
      const fileError = new Error('File error');
      (<jest.Mock>getFiles).mockImplementation(() => {
        throw fileError;
      });

      const [error] = await repository.getAllUpstream();

      expect(getFiles).toHaveBeenCalled();
      expect(getFiles).toBeCalledWith(configPath);
      expect(error).toBeInstanceOf(RepositoryException);
      expect((<RepositoryException>error).additionalInfo).toEqual(fileError);
    });

    it(`Should successfully get all upstream and return empty when not found any file config`, async () => {
      (<jest.Mock>getFiles).mockImplementation(() => {
        return {
          async* [Symbol.asyncIterator]() {
            yield* [outputFileConfigNoMatch4];
          },
        };
      });

      const [error, result, count] = await repository.getAllUpstream();

      expect(getFiles).toHaveBeenCalled();
      expect(getFiles).toBeCalledWith(configPath);
      expect(error).toBeNull();
      expect(result.length).toEqual(0);
      expect(count).toEqual(0);
    });

    it(`Should error get all upstream when read each file`, async () => {
      (<jest.Mock>getFiles).mockImplementation(() => {
        return {
          async* [Symbol.asyncIterator]() {
            yield* [outputFileConfig1, outputFileConfig2, outputFileConfig3, outputFileConfigNoMatch4];
          },
        };
      });
      const fileError = new Error('File error');
      (<jest.Mock>fsAsync.readFile).mockRejectedValue(fileError);

      const [error] = await repository.getAllUpstream();

      expect(getFiles).toHaveBeenCalled();
      expect(getFiles).toHaveBeenCalledWith(configPath);
      expect(fsAsync.readFile).toHaveBeenCalled();
      expect(fsAsync.readFile).toHaveBeenCalledWith(outputFileConfig1, 'utf-8');
      expect(error).toBeInstanceOf(RepositoryException);
      expect((<RepositoryException>error).additionalInfo).toEqual(fileError);
    });

    it(`Should error get all upstream when config file not valid and the upstream id not found`, async () => {
      (<jest.Mock>getFiles).mockImplementation(() => {
        return {
          async* [Symbol.asyncIterator]() {
            yield* [outputFileConfig1, outputFileConfig2, outputFileConfig3, outputFileConfigNoMatch4];
          },
        };
      });
      (<jest.Mock>fsAsync.readFile)
        .mockResolvedValueOnce(outputFileConfigContent1)
        .mockResolvedValueOnce(outputFileConfigContent2)
        .mockResolvedValueOnce(outputFileConfigContentNoUpstreamId4);

      const [error] = await repository.getAllUpstream();

      expect(getFiles).toHaveBeenCalled();
      expect(getFiles).toHaveBeenCalledWith(configPath);
      expect(fsAsync.readFile).toHaveBeenCalled();
      expect(fsAsync.readFile).toHaveBeenCalledWith(outputFileConfig1, 'utf-8');
      expect(error).toBeInstanceOf(FillDataRepositoryException);
      expect((<FillDataRepositoryException<ProxyUpstreamModel>>error).fillProperties.length).toEqual(1);
      expect((<FillDataRepositoryException<ProxyUpstreamModel>>error).fillProperties).toEqual(expect.arrayContaining<keyof ProxyUpstreamModel>(['id']));
    });

    it(`Should error get all upstream when config file not valid and the upstream ip and port not found`, async () => {
      (<jest.Mock>getFiles).mockImplementation(() => {
        return {
          async* [Symbol.asyncIterator]() {
            yield* [outputFileConfig1, outputFileConfig2, outputFileConfig3, outputFileConfigNoMatch4];
          },
        };
      });
      (<jest.Mock>fsAsync.readFile)
        .mockResolvedValueOnce(outputFileConfigContent1)
        .mockResolvedValueOnce(outputFileConfigContent2)
        .mockResolvedValueOnce(outputFileConfigContentNoIpAndPort5);

      const [error] = await repository.getAllUpstream();

      expect(getFiles).toHaveBeenCalled();
      expect(getFiles).toHaveBeenCalledWith(configPath);
      expect(fsAsync.readFile).toHaveBeenCalled();
      expect(fsAsync.readFile).toHaveBeenCalledWith(outputFileConfig1, 'utf-8');
      expect(error).toBeInstanceOf(FillDataRepositoryException);
      expect((<FillDataRepositoryException<ProxyUpstreamModel>>error).fillProperties.length).toEqual(2);
      expect((<FillDataRepositoryException<ProxyUpstreamModel>>error).fillProperties).toEqual(expect.arrayContaining<keyof ProxyUpstreamModel>(['listenIp', 'listenPort']));
    });

    it(`Should successfully get all upstream`, async () => {
      (<jest.Mock>getFiles).mockImplementation(() => {
        return {
          async* [Symbol.asyncIterator]() {
            yield* [outputFileConfig1, outputFileConfig2, outputFileConfig3, outputFileConfigNoMatch4];
          },
        };
      });
      (<jest.Mock>fsAsync.readFile)
        .mockResolvedValueOnce(outputFileConfigContent1)
        .mockResolvedValueOnce(outputFileConfigContent2)
        .mockResolvedValueOnce(outputFileConfigContent3);

      const [error, result, count] = await repository.getAllUpstream();

      expect(getFiles).toHaveBeenCalled();
      expect(getFiles).toHaveBeenCalledWith(configPath);
      expect(fsAsync.readFile).toHaveBeenCalled();
      expect(fsAsync.readFile).toHaveBeenCalledWith(outputFileConfig1, 'utf-8');
      expect(error).toBeNull();
      expect(result[0]).toMatchObject<Omit<ProxyUpstreamModel, 'clone' | 'runner' | 'proxyDownstream'>>({
        id: outputFileConfigContent1.match(/###\s+upstream-id:\s+(.+)/)[1],
        listenIp: outputFileConfigContent1.match(/http_port\s+([^\s]+):([0-9]+)\s+.+/)[1],
        listenPort: Number(outputFileConfigContent1.match(/http_port\s+([^\s]+):([0-9]+)\s+.+/)[2]),
      });
      expect(result[0].proxyDownstream.length).toEqual(1);
      expect(result[1]).toMatchObject<Omit<ProxyUpstreamModel, 'clone' | 'runner' | 'proxyDownstream'>>({
        id: outputFileConfigContent2.match(/###\s+upstream-id:\s+(.+)/)[1],
        listenIp: outputFileConfigContent2.match(/http_port\s+([^\s]+):([0-9]+)\s+.+/)[1],
        listenPort: Number(outputFileConfigContent2.match(/http_port\s+([^\s]+):([0-9]+)\s+.+/)[2]),
      });
      expect(result[1].proxyDownstream.length).toEqual(1);
      expect(result[2]).toMatchObject<Omit<ProxyUpstreamModel, 'clone' | 'runner' | 'proxyDownstream'>>({
        id: outputFileConfigContent3.match(/###\s+upstream-id:\s+(.+)/)[1],
        listenIp: outputFileConfigContent3.match(/http_port\s+([^\s]+):([0-9]+)\s+.+/)[1],
        listenPort: Number(outputFileConfigContent3.match(/http_port\s+([^\s]+):([0-9]+)\s+.+/)[2]),
      });
      expect(result[2].proxyDownstream.length).toEqual(1);
      expect(count).toEqual(3);
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

    it(`Should error create proxy when runner not exist`, async () => {
      delete inputModel.runner;

      const [error] = await repository.create(inputModel);

      expect(error).toBeInstanceOf(FillDataRepositoryException);
      expect((<FillDataRepositoryException<ProxyUpstreamModel>>error).fillProperties.length).toEqual(1);
      expect((<FillDataRepositoryException<ProxyUpstreamModel>>error).fillProperties).toEqual(expect.arrayContaining<keyof ProxyUpstreamModel>(['runner']));
    });

    it(`Should error create proxy when runner volume not exist`, async () => {
      inputModel.runner.volumes[0].dest = '/another/path/';

      const [error] = await repository.create(inputModel);

      expect(error).toBeInstanceOf(FillDataRepositoryException);
      expect((<FillDataRepositoryException<RunnerModel>>error).fillProperties.length).toEqual(1);
      expect((<FillDataRepositoryException<RunnerModel>>error).fillProperties).toEqual(expect.arrayContaining<keyof RunnerModel>(['volumes']));
    });

    it(`Should error create proxy when fail on checking config path exist`, async () => {
      const fileError = new Error('File error');
      (<jest.Mock>checkDirOrFileExist).mockRejectedValue(fileError);

      const [error] = await repository.create(inputModel);

      expect(checkDirOrFileExist).toHaveBeenCalled();
      expect(checkDirOrFileExist).toHaveBeenCalledWith(path.resolve(inputModel.runner.volumes[0].source, `port_${inputModel.listenPort}.conf`));
      expect(error).toBeInstanceOf(RepositoryException);
      expect((<RepositoryException>error).additionalInfo).toEqual(fileError);
    });

    it(`Should error create proxy when config file exist`, async () => {
      (<jest.Mock>checkDirOrFileExist).mockResolvedValue(true);

      const [error] = await repository.create(inputModel);

      expect(checkDirOrFileExist).toHaveBeenCalled();
      expect(checkDirOrFileExist).toHaveBeenCalledWith(path.resolve(inputModel.runner.volumes[0].source, `port_${inputModel.listenPort}.conf`));
      expect(error).toBeInstanceOf(ExistException);
      expect((<ExistException<RunnerModel>>error).existProperties.length).toEqual(1);
      expect((<ExistException<RunnerModel>>error).existProperties).toEqual(expect.arrayContaining<keyof RunnerModel>(['volumes']));
    });

    it(`Should error create proxy when create and write config file`, async () => {
      (<jest.Mock>checkDirOrFileExist).mockResolvedValue(false);
      const fileError = new Error('File error');
      (<jest.Mock>fsAsync.writeFile).mockRejectedValue(fileError);

      const [error] = await repository.create(inputModel);

      expect(checkDirOrFileExist).toHaveBeenCalled();
      expect(checkDirOrFileExist).toHaveBeenCalledWith(path.resolve(inputModel.runner.volumes[0].source, `port_${inputModel.listenPort}.conf`));
      expect(identifierMock.generateId).toHaveBeenCalledTimes(2);
      expect(fsAsync.writeFile).toHaveBeenCalled();
      expect(fsAsync.writeFile).toHaveBeenCalledWith(
        path.resolve(inputModel.runner.volumes[0].source, `port_${inputModel.listenPort}.conf`),
        [
          `### upstream-id: ${identifierMock.generateId()}`,
          `http_port ${inputModel.listenIp}:${inputModel.listenPort} name=port${inputModel.listenPort}`,
          '',
          `acl out${inputModel.listenPort} myportname port${inputModel.listenPort}`,
          '',
          `### downstream-id: ${identifierMock.generateId()}`,
          `### ref-id: ${identifierFakeMock.generateId()}`,
          `tcp_outgoing_address ${inputModel.proxyDownstream[0].ip} out${inputModel.listenPort}`,
        ].join('\n'),
        expect.objectContaining({encoding: 'utf-8', flag: 'w'}),
      );
      expect(error).toBeInstanceOf(RepositoryException);
      expect((<RepositoryException>error).additionalInfo).toEqual(fileError);
    });

    it(`Should successfully create proxy`, async () => {
      (<jest.Mock>checkDirOrFileExist).mockResolvedValue(false);
      (<jest.Mock>fsAsync.writeFile).mockResolvedValue(null);

      const [error, result] = await repository.create(inputModel);

      expect(checkDirOrFileExist).toHaveBeenCalled();
      expect(checkDirOrFileExist).toHaveBeenCalledWith(path.resolve(inputModel.runner.volumes[0].source, `port_${inputModel.listenPort}.conf`));
      expect(identifierMock.generateId).toHaveBeenCalledTimes(2);
      expect(fsAsync.writeFile).toHaveBeenCalled();
      expect(fsAsync.writeFile).toHaveBeenCalledWith(
        path.resolve(inputModel.runner.volumes[0].source, `port_${inputModel.listenPort}.conf`),
        [
          `### upstream-id: ${identifierMock.generateId()}`,
          `http_port ${inputModel.listenIp}:${inputModel.listenPort} name=port${inputModel.listenPort}`,
          '',
          `acl out${inputModel.listenPort} myportname port${inputModel.listenPort}`,
          '',
          `### downstream-id: ${identifierMock.generateId()}`,
          `### ref-id: ${identifierFakeMock.generateId()}`,
          `tcp_outgoing_address ${inputModel.proxyDownstream[0].ip} out${inputModel.listenPort}`,
        ].join('\n'),
        expect.objectContaining({encoding: 'utf-8', flag: 'w'}),
      );
      expect(error).toBeNull();
      expect(result).toMatchObject<Omit<ProxyUpstreamModel, 'clone' | 'proxyDownstream'>>({
        id: identifierMock.generateId(),
        listenIp: inputModel.listenIp,
        listenPort: inputModel.listenPort,
        runner: inputModel.runner,
      });
      expect(result.proxyDownstream[0]).toMatchObject<Omit<ProxyDownstreamModel, 'clone'>>({
        id: identifierMock.generateId(),
        refId: inputModel.proxyDownstream[0].refId,
        ip: inputModel.proxyDownstream[0].ip,
        mask: inputModel.proxyDownstream[0].mask,
        type: inputModel.proxyDownstream[0].type,
        status: inputModel.proxyDownstream[0].status,
      });
    });
  });

  describe(`Remove proxy`, () => {
    let inputId: string;

    beforeEach(() => {
      inputId = identifierFakeMock.generateId();
    });

    it(`Should error remove proxy when execute found upstream id`, async () => {
      const spawnError = new Error('Spawn error');
      (<jest.Mock>spawn).mockImplementation(() => {
        throw spawnError;
      });

      const [error] = await repository.remove(inputId);

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
          '-E',
          '-w',
          `^###\\s+upstream-id:\\s+${inputId}`,
          '{}',
          '+',
        ]),
      );
      expect(error).toBeInstanceOf(RepositoryException);
      expect((<RepositoryException>error).additionalInfo).toEqual(spawnError);
    });

    it(`Should error remove proxy when error on found upstream id`, async () => {
      const spawnErrorMsg = 'Spawn stderr error';
      (<jest.Mock>spawn).mockImplementation(() => {
        const stderr = new PassThrough();
        stderr.write(spawnErrorMsg);
        stderr.end();

        return {stderr};
      });

      const [error] = await repository.remove(inputId);

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
          '-E',
          '-w',
          `^###\\s+upstream-id:\\s+${inputId}`,
          '{}',
          '+',
        ]),
      );
      expect(error).toBeInstanceOf(RepositoryException);
      expect((<RepositoryException>error).additionalInfo).toEqual(new Error(spawnErrorMsg));
    });

    it(`Should error remove proxy when not found upstream id`, async () => {
      (<jest.Mock>spawn).mockImplementation(() => {
        const stderr = new PassThrough();
        stderr.end();
        const stdout = new PassThrough();
        stdout.write('');
        stdout.end();

        return {stderr, stdout};
      });

      const [error] = await repository.remove(inputId);

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
          '-E',
          '-w',
          `^###\\s+upstream-id:\\s+${inputId}`,
          '{}',
          '+',
        ]),
      );
      expect(error).toBeInstanceOf(NotFoundException);
    });

    it(`Should error remove proxy when delete upstream config`, async () => {
      (<jest.Mock>spawn).mockImplementation(() => {
        const stderr = new PassThrough();
        stderr.end();
        const stdout = new PassThrough();
        stdout.write(`${path.join(configPath, 'squid-conf-1/port_3128.conf')}:### upstream-id: ${inputId}`);
        stdout.write('');
        stdout.end();

        return {stderr, stdout};
      });
      const fileError = new Error('File error');
      (<jest.Mock>fsAsync.unlink).mockRejectedValue(fileError);

      const [error] = await repository.remove(inputId);

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
          '-E',
          '-w',
          `^###\\s+upstream-id:\\s+${inputId}`,
          '{}',
          '+',
        ]),
      );
      expect(fsAsync.unlink).toHaveBeenCalled();
      expect(fsAsync.unlink).toHaveBeenCalledWith(path.join(configPath, 'squid-conf-1/port_3128.conf'));
      expect(error).toBeInstanceOf(RepositoryException);
      expect((<RepositoryException>error).additionalInfo).toEqual(fileError);
    });

    it(`Should successfully remove proxy when delete upstream config`, async () => {
      (<jest.Mock>spawn).mockImplementation(() => {
        const stderr = new PassThrough();
        stderr.end();
        const stdout = new PassThrough();
        stdout.write(`${path.join(configPath, 'squid-conf-1/port_3128.conf')}:### upstream-id: ${inputId}`);
        stdout.write('');
        stdout.end();

        return {stderr, stdout};
      });
      (<jest.Mock>fsAsync.unlink).mockResolvedValue(null);

      const [error] = await repository.remove(inputId);

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
          '-E',
          '-w',
          `^###\\s+upstream-id:\\s+${inputId}`,
          '{}',
          '+',
        ]),
      );
      expect(fsAsync.unlink).toHaveBeenCalled();
      expect(fsAsync.unlink).toHaveBeenCalledWith(path.join(configPath, 'squid-conf-1/port_3128.conf'));
      expect(error).toBeNull();
    });
  });
});
