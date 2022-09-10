import {SquidNetworkInterfaceRepository} from './squid-network-interface.repository';
import {mock, MockProxy} from 'jest-mock-extended';
import {IIdentifier} from '@src-core/interface/i-identifier.interface';
import {Test, TestingModule} from '@nestjs/testing';
import {ProviderTokenEnum} from '@src-core/enum/provider-token.enum';
import {FilterModel, SortEnum} from '@src-core/model/filter.model';
import {IpInterfaceModel} from '@src-core/model/ip-interface.model';
import {RepositoryException} from '@src-core/exception/repository.exception';
import {PassThrough} from 'stream';
import {spawn} from 'child_process';
import {DefaultModel, defaultModelFactory, defaultModelType} from '@src-core/model/defaultModel';
import {filterAndSortIpInterface} from '@src-infrastructure/utility/filterAndSortIpInterface';

jest.mock('child_process');
jest.mock('@src-infrastructure/utility/filterAndSortIpInterface');

describe('NetworkInterfaceRepository', () => {
  let repository: SquidNetworkInterfaceRepository;
  let identifierMock: MockProxy<IIdentifier>;
  let fakeIdentifierMock: MockProxy<IIdentifier>;
  let configPath: string;

  beforeEach(async () => {
    identifierMock = mock<IIdentifier>();
    identifierMock.generateId.mockReturnValue('00000000-0000-0000-0000-000000000000');

    fakeIdentifierMock = mock<IIdentifier>();
    fakeIdentifierMock.generateId.mockReturnValue('11111111-1111-1111-1111-111111111111');

    configPath = '/path/of/squid/config';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ProviderTokenEnum.IDENTIFIER_UUID_NULL_REPOSITORY,
          useValue: fakeIdentifierMock,
        },
        {
          provide: SquidNetworkInterfaceRepository,
          useFactory: () => new SquidNetworkInterfaceRepository(configPath),
        },
      ],
    }).compile();

    repository = module.get<SquidNetworkInterfaceRepository>(SquidNetworkInterfaceRepository);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe(`Get all ip address registered on squid`, () => {
    let inputFilterModel: FilterModel<IpInterfaceModel>;

    let outputSquidIpData1: string;
    let outputSquidIpData2: string;

    let outputNetworkIpData1: defaultModelType<IpInterfaceModel>;
    let outputNetworkIpData2: defaultModelType<IpInterfaceModel>;

    beforeEach(() => {
      inputFilterModel = new FilterModel<IpInterfaceModel>();
      inputFilterModel.addCondition({$opr: 'eq', ip: '192.168.1.1'});

      outputSquidIpData1 = '192.168.1.1';
      outputSquidIpData2 = '192.168.100.1';

      outputNetworkIpData1 = defaultModelFactory(
        IpInterfaceModel,
        {
          id: 'default-id',
          name: 'default-name',
          ip: '192.168.1.1',
          isUse: false,
        },
        ['id', 'name', 'isUse'],
      );
      outputNetworkIpData2 = defaultModelFactory(
        IpInterfaceModel,
        {
          id: 'default-id',
          name: 'default-name',
          ip: '192.168.100.1',
          isUse: false,
        },
        ['id', 'name', 'isUse'],
      );
    });

    it(`Should error get all ip address registered on squid when find ip`, async () => {
      const spawnError = new Error('Spawn error');
      (<jest.Mock>spawn).mockImplementation(() => {
        throw spawnError;
      });

      const [error] = await repository.getAll();

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
          'sed',
          '-rn',
          's/^tcp_outgoing_address\\s+([^\\s]+)\\s+.+$/\\1/p',
          '{}',
          '+',
        ]),
      );
      expect(error).toBeInstanceOf(RepositoryException);
      expect((<RepositoryException>error).additionalInfo).toEqual(spawnError);
    });

    it(`Should error get all ip address registered on squid when have error on stderr`, async () => {
      const spawnErrorMsg = 'Spawn stderr error';
      (<jest.Mock>spawn).mockImplementation(() => {
        const stderr = new PassThrough();
        stderr.write(spawnErrorMsg);
        stderr.end();

        return {stderr};
      });

      const [error] = await repository.getAll();

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
          'sed',
          '-rn',
          's/^tcp_outgoing_address\\s+([^\\s]+)\\s+.+$/\\1/p',
          '{}',
          '+',
        ]),
      );
      expect(error).toBeInstanceOf(RepositoryException);
      expect((<RepositoryException>error).additionalInfo).toEqual(new Error(spawnErrorMsg));
    });

    it(`Should successfully get all ip address registered (without filter) and return empty records`, async () => {
      (<jest.Mock>spawn).mockImplementation(() => {
        const stderr = new PassThrough();
        stderr.end();
        const stdout = new PassThrough();
        stdout.write('');
        stdout.end();

        return {stderr, stdout};
      });

      const [error, result, count] = await repository.getAll();
      console.log(error);

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
          'sed',
          '-rn',
          's/^tcp_outgoing_address\\s+([^\\s]+)\\s+.+$/\\1/p',
          '{}',
          '+',
        ]),
      );
      expect(error).toBeNull();
      expect(result.length).toEqual(0);
      expect(count).toEqual(0);
    });

    it(`Should successfully get all ip address registered (without filter) and return records`, async () => {
      (<jest.Mock>spawn).mockImplementation(() => {
        const stderr = new PassThrough();
        stderr.end();
        const stdout = new PassThrough();
        stdout.write([outputSquidIpData1, outputSquidIpData2].join('\n'));
        stdout.end();

        return {stderr, stdout};
      });
      (<jest.Mock>filterAndSortIpInterface).mockReturnValue([[outputNetworkIpData1, outputNetworkIpData2], 2]);

      const [error, result, count] = await repository.getAll();

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
          'sed',
          '-rn',
          's/^tcp_outgoing_address\\s+([^\\s]+)\\s+.+$/\\1/p',
          '{}',
          '+',
        ]),
      );
      expect(error).toBeNull();
      expect(result.length).toEqual(2);
      expect(result[0]).toMatchObject<Omit<IpInterfaceModel, 'clone' | 'id' | 'name' | 'isUse'>>({
        ip: outputSquidIpData1,
      });
      expect(result[0]).toEqual(expect.objectContaining({
        isDefaultProperty: expect.anything(),
        getDefaultProperties: expect.anything(),
      }));
      expect((<DefaultModel<IpInterfaceModel>><unknown>result[0]).getDefaultProperties()).toEqual(expect.arrayContaining<keyof IpInterfaceModel>(['id', 'name', 'isUse']));
      expect(result[1]).toMatchObject<Omit<IpInterfaceModel, 'clone' | 'id' | 'name' | 'isUse'>>({
        ip: outputSquidIpData2,
      });
      expect(result[1]).toEqual(expect.objectContaining({
        isDefaultProperty: expect.anything(),
        getDefaultProperties: expect.anything(),
      }));
      expect((<DefaultModel<IpInterfaceModel>><unknown>result[1]).getDefaultProperties()).toEqual(expect.arrayContaining<keyof IpInterfaceModel>(['id', 'name', 'isUse']));
      expect(count).toEqual(2);
    });

    it(`Should successfully get all ip address registered (with filter) and return records`, async () => {
      (<jest.Mock>spawn).mockImplementation(() => {
        const stderr = new PassThrough();
        stderr.end();
        const stdout = new PassThrough();
        stdout.write([outputSquidIpData1, outputSquidIpData2].join('\n'));
        stdout.end();

        return {stderr, stdout};
      });
      (<jest.Mock>filterAndSortIpInterface).mockReturnValue([[outputNetworkIpData1], 1]);

      const [error, result, count] = await repository.getAll(inputFilterModel);

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
          'sed',
          '-rn',
          's/^tcp_outgoing_address\\s+([^\\s]+)\\s+.+$/\\1/p',
          '{}',
          '+',
        ]),
      );
      expect(error).toBeNull();
      expect(result.length).toEqual(1);
      expect(result[0]).toMatchObject<Omit<IpInterfaceModel, 'clone' | 'id' | 'name' | 'isUse'>>({
        ip: outputSquidIpData1,
      });
      expect(result[0]).toEqual(expect.objectContaining({
        isDefaultProperty: expect.anything(),
        getDefaultProperties: expect.anything(),
      }));
      expect((<DefaultModel<IpInterfaceModel>><unknown>result[0]).getDefaultProperties()).toEqual(expect.arrayContaining<keyof IpInterfaceModel>(['id', 'name', 'isUse']));
      expect(count).toEqual(1);
    });
  });
});
