import {mock, MockProxy} from 'jest-mock-extended';
import {IIdentifier} from '@src-core/interface/i-identifier.interface';
import {Test, TestingModule} from '@nestjs/testing';
import {ProviderTokenEnum} from '@src-core/enum/provider-token.enum';
import {RepositoryException} from '@src-core/exception/repository.exception';
import {FilterModel, SortEnum} from '@src-core/model/filter.model';
import {IpInterfaceModel} from '@src-core/model/ip-interface.model';
import {SystemInfoRepository} from './system-info.repository';

jest.mock('os');
import {NetworkInterfaceInfo, networkInterfaces} from 'os';
import {DefaultModel} from '@src-core/model/defaultModel';
import {UnknownException} from '@src-core/exception/unknown.exception';

describe('SystemInfoRepository', () => {
  let repository: SystemInfoRepository;
  let identifierMock: MockProxy<IIdentifier>;
  let fakeIdentifierMock: MockProxy<IIdentifier>;

  beforeEach(async () => {
    identifierMock = mock<IIdentifier>();
    identifierMock.generateId.mockReturnValue('00000000-0000-0000-0000-000000000000');

    fakeIdentifierMock = mock<IIdentifier>();
    fakeIdentifierMock.generateId.mockReturnValue('11111111-1111-1111-1111-111111111111');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ProviderTokenEnum.IDENTIFIER_UUID_REPOSITORY,
          useValue: identifierMock,
        },
        {
          provide: SystemInfoRepository,
          inject: [ProviderTokenEnum.IDENTIFIER_UUID_REPOSITORY],
          useFactory: (identifier: IIdentifier) => new SystemInfoRepository(identifier),
        },
      ],
    }).compile();

    repository = module.get<SystemInfoRepository>(SystemInfoRepository);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe(`Get all network interface`, () => {
    let inputIdentityFilterModel: FilterModel<IpInterfaceModel>;
    let inputFilterPaginationModel: FilterModel<IpInterfaceModel>;
    let inputFilterSortAndPaginationModel: FilterModel<IpInterfaceModel>;
    let inputFilterSkipPaginationModel: FilterModel<IpInterfaceModel>;
    let outputNetworkLoData1: NodeJS.Dict<NetworkInterfaceInfo[]>;
    let outputNetworkDockerData2: NodeJS.Dict<NetworkInterfaceInfo[]>;
    let outputNetworkBridgeData3: NodeJS.Dict<NetworkInterfaceInfo[]>;
    let outputNetworkRealData4: NodeJS.Dict<NetworkInterfaceInfo[]>;
    let outputNetworkRealData5: NodeJS.Dict<NetworkInterfaceInfo[]>;

    beforeEach(() => {
      inputIdentityFilterModel = new FilterModel<IpInterfaceModel>();
      inputIdentityFilterModel.addCondition({$opr: 'eq', name: 'eno1'});

      inputFilterPaginationModel = new FilterModel<IpInterfaceModel>({page: 2, limit: 1});

      inputFilterSortAndPaginationModel = new FilterModel<IpInterfaceModel>({page: 2, limit: 1});
      inputFilterSortAndPaginationModel.addSortBy({ip: SortEnum.DESC});

      inputFilterSkipPaginationModel = new FilterModel<IpInterfaceModel>({skipPagination: true});

      outputNetworkLoData1 = {
        lo: [
          {
            address: '127.0.0.1',
            netmask: '255.0.0.0',
            family: 'IPv4',
            mac: '00:00:00:00:00:00',
            internal: true,
            cidr: '127.0.0.1/8',
          },
          {
            address: '::1',
            netmask: 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff',
            family: 'IPv6',
            mac: '00:00:00:00:00:00',
            internal: true,
            cidr: '::1/128',
            scopeid: 0,
          },
        ],
      };
      outputNetworkDockerData2 = {
        docker0: [
          {
            address: '172.17.0.1',
            netmask: '255.255.0.0',
            family: 'IPv4',
            mac: '02:42:8b:e3:16:f0',
            internal: false,
            cidr: '172.17.0.1/16',
          },
          {
            address: 'fe80::42:8bff:fee3:16f0',
            netmask: 'ffff:ffff:ffff:ffff::',
            family: 'IPv6',
            mac: '02:42:8b:e3:16:f0',
            internal: false,
            cidr: 'fe80::42:8bff:fee3:16f0/64',
            scopeid: 7,
          },
        ],
      };
      outputNetworkBridgeData3 = {
        'br-e56': [
          {
            address: '10.101.0.1',
            netmask: '255.255.255.248',
            family: 'IPv4',
            mac: '02:42:76:70:59:20',
            internal: false,
            cidr: '10.101.0.1/29',
          },
          {
            address: 'fe80::42:76ff:fe70:5920',
            netmask: 'ffff:ffff:ffff:ffff::',
            family: 'IPv6',
            mac: '02:42:76:70:59:20',
            internal: false,
            cidr: 'fe80::42:76ff:fe70:5920/64',
            scopeid: 6,
          },
        ],
      };
      outputNetworkRealData4 = {
        eno1: [
          {
            address: '172.30.200.151',
            netmask: '255.255.255.224',
            family: 'IPv4',
            mac: '11:b1:4f:45:1f:70',
            internal: false,
            cidr: '192.168.1.1/27',
          },
          {
            address: 'fe80::14f:ab30:bb64:30c8',
            netmask: 'ffff:ffff:ffff:ffff::',
            family: 'IPv6',
            mac: '11:b1:4f:45:1f:70',
            internal: false,
            cidr: 'fe80::14f:ab30:bb64:30c8/64',
            scopeid: 2,
          },
        ],
      };
      outputNetworkRealData5 = {
        eno2: [
          {
            address: '172.30.200.151',
            netmask: '255.255.255.224',
            family: 'IPv4',
            mac: '11:b1:4f:45:1f:70',
            internal: false,
            cidr: '192.168.100.1/27',
          },
          {
            address: 'fe80::14f:ab30:bb64:30c8',
            netmask: 'ffff:ffff:ffff:ffff::',
            family: 'IPv6',
            mac: '11:b1:4f:45:1f:70',
            internal: false,
            cidr: 'fe80::14f:ab30:bb64:30c8/64',
            scopeid: 2,
          },
        ],
      };
    });

    it(`Should error get all network interface`, async () => {
      const networkError = new Error('Network error');
      (<jest.Mock>networkInterfaces).mockImplementation(() => {
        throw networkError;
      });

      const [error] = await repository.getAllNetworkInterface();

      expect(networkInterfaces).toHaveBeenCalled();
      expect(error).toBeInstanceOf(RepositoryException);
      expect((error as RepositoryException).additionalInfo).toEqual(networkError);
    });

    it(`Should successfully get all network interface (without filter) and return empty records`, async () => {
      (<jest.Mock>networkInterfaces).mockReturnValue({});

      const [error, result, count] = await repository.getAllNetworkInterface();

      expect(networkInterfaces).toHaveBeenCalled();
      expect(error).toBeNull();
      expect(result.length).toEqual(0);
      expect(count).toEqual(0);
    });

    it(`Should successfully get all network interface (without filter) and return records`, async () => {
      (<jest.Mock>networkInterfaces).mockReturnValue({
        ...outputNetworkLoData1,
        ...outputNetworkDockerData2,
        ...outputNetworkBridgeData3,
        ...outputNetworkRealData4,
        ...outputNetworkRealData5,
      });

      const [error, result, count] = await repository.getAllNetworkInterface();

      expect(networkInterfaces).toHaveBeenCalled();
      expect(error).toBeNull();
      expect(result.length).toEqual(2);
      expect(result[0]).toMatchObject<Omit<IpInterfaceModel, 'clone' | 'isUse'>>({
        id: identifierMock.generateId(),
        name: Object.keys(outputNetworkRealData4)[0],
        ip: outputNetworkRealData4[Object.keys(outputNetworkRealData4)[0]][0].cidr.split('/')[0],
      });
      expect(result[0]).toEqual(expect.objectContaining({
        isDefaultProperty: expect.anything(),
        getDefaultProperties: expect.anything(),
      }));
      expect((<DefaultModel<IpInterfaceModel>><unknown>result[0]).getDefaultProperties()).toEqual(expect.arrayContaining<keyof IpInterfaceModel>(['isUse']));
      expect(result[1]).toMatchObject<Omit<IpInterfaceModel, 'clone' | 'isUse'>>({
        id: identifierMock.generateId(),
        name: Object.keys(outputNetworkRealData5)[0],
        ip: outputNetworkRealData5[Object.keys(outputNetworkRealData5)[0]][0].cidr.split('/')[0],
      });
      expect(result[1]).toEqual(expect.objectContaining({
        isDefaultProperty: expect.anything(),
        getDefaultProperties: expect.anything(),
      }));
      expect((<DefaultModel<IpInterfaceModel>><unknown>result[1]).getDefaultProperties()).toEqual(expect.arrayContaining<keyof IpInterfaceModel>(['isUse']));
      expect(count).toEqual(2);
    });

    it(`Should successfully get all network interface (with filter) and return records`, async () => {
      (<jest.Mock>networkInterfaces).mockReturnValue({
        ...outputNetworkLoData1,
        ...outputNetworkDockerData2,
        ...outputNetworkBridgeData3,
        ...outputNetworkRealData4,
        ...outputNetworkRealData5,
      });

      const [error, result, count] = await repository.getAllNetworkInterface(inputIdentityFilterModel);

      expect(networkInterfaces).toHaveBeenCalled();
      expect(error).toBeNull();
      expect(result.length).toEqual(1);
      expect(result[0]).toMatchObject<Omit<IpInterfaceModel, 'clone' | 'isUse'>>({
        id: identifierMock.generateId(),
        name: Object.keys(outputNetworkRealData4)[0],
        ip: outputNetworkRealData4[Object.keys(outputNetworkRealData4)[0]][0].cidr.split('/')[0],
      });
      expect(result[0]).toEqual(expect.objectContaining({
        isDefaultProperty: expect.anything(),
        getDefaultProperties: expect.anything(),
      }));
      expect((<DefaultModel<IpInterfaceModel>><unknown>result[0]).getDefaultProperties()).toEqual(expect.arrayContaining<keyof IpInterfaceModel>(['isUse']));
      expect(count).toEqual(1);
    });

    it(`Should successfully get all network interface (with pagination) and return records`, async () => {
      (<jest.Mock>networkInterfaces).mockReturnValue({
        ...outputNetworkLoData1,
        ...outputNetworkDockerData2,
        ...outputNetworkBridgeData3,
        ...outputNetworkRealData4,
        ...outputNetworkRealData5,
      });

      const [error, result, count] = await repository.getAllNetworkInterface(inputFilterPaginationModel);

      expect(networkInterfaces).toHaveBeenCalled();
      expect(error).toBeNull();
      expect(result.length).toEqual(1);
      expect(result[0]).toMatchObject<Omit<IpInterfaceModel, 'clone' | 'isUse'>>({
        id: identifierMock.generateId(),
        name: Object.keys(outputNetworkRealData5)[0],
        ip: outputNetworkRealData5[Object.keys(outputNetworkRealData5)[0]][0].cidr.split('/')[0],
      });
      expect(result[0]).toEqual(expect.objectContaining({
        isDefaultProperty: expect.anything(),
        getDefaultProperties: expect.anything(),
      }));
      expect((<DefaultModel<IpInterfaceModel>><unknown>result[0]).getDefaultProperties()).toEqual(expect.arrayContaining<keyof IpInterfaceModel>(['isUse']));
      expect(count).toEqual(2);
    });

    it(`Should successfully get all network interface (with sort and pagination) and return records`, async () => {
      (<jest.Mock>networkInterfaces).mockReturnValue({
        ...outputNetworkLoData1,
        ...outputNetworkDockerData2,
        ...outputNetworkBridgeData3,
        ...outputNetworkRealData4,
        ...outputNetworkRealData5,
      });

      const [error, result, count] = await repository.getAllNetworkInterface(inputFilterSortAndPaginationModel);

      expect(networkInterfaces).toHaveBeenCalled();
      expect(error).toBeNull();
      expect(result.length).toEqual(1);
      expect(result[0]).toMatchObject<Omit<IpInterfaceModel, 'clone' | 'isUse'>>({
        id: identifierMock.generateId(),
        name: Object.keys(outputNetworkRealData4)[0],
        ip: outputNetworkRealData4[Object.keys(outputNetworkRealData4)[0]][0].cidr.split('/')[0],
      });
      expect(result[0]).toEqual(expect.objectContaining({
        isDefaultProperty: expect.anything(),
        getDefaultProperties: expect.anything(),
      }));
      expect((<DefaultModel<IpInterfaceModel>><unknown>result[0]).getDefaultProperties()).toEqual(expect.arrayContaining<keyof IpInterfaceModel>(['isUse']));
      expect(count).toEqual(2);
    });

    it(`Should successfully get all network interface (with skip pagination) and return records`, async () => {
      (<jest.Mock>networkInterfaces).mockReturnValue({
        ...outputNetworkLoData1,
        ...outputNetworkDockerData2,
        ...outputNetworkBridgeData3,
        ...outputNetworkRealData4,
        ...outputNetworkRealData5,
      });

      const [error, result, count] = await repository.getAllNetworkInterface(inputFilterSkipPaginationModel);

      expect(networkInterfaces).toHaveBeenCalled();
      expect(error).toBeNull();
      expect(result.length).toEqual(2);
      expect(result[0]).toMatchObject<Omit<IpInterfaceModel, 'clone' | 'isUse'>>({
        id: identifierMock.generateId(),
        name: Object.keys(outputNetworkRealData4)[0],
        ip: outputNetworkRealData4[Object.keys(outputNetworkRealData4)[0]][0].cidr.split('/')[0],
      });
      expect(result[0]).toEqual(expect.objectContaining({
        isDefaultProperty: expect.anything(),
        getDefaultProperties: expect.anything(),
      }));
      expect((<DefaultModel<IpInterfaceModel>><unknown>result[0]).getDefaultProperties()).toEqual(expect.arrayContaining<keyof IpInterfaceModel>(['isUse']));
      expect(result[1]).toMatchObject<Omit<IpInterfaceModel, 'clone' | 'isUse'>>({
        id: identifierMock.generateId(),
        name: Object.keys(outputNetworkRealData5)[0],
        ip: outputNetworkRealData5[Object.keys(outputNetworkRealData5)[0]][0].cidr.split('/')[0],
      });
      expect(result[1]).toEqual(expect.objectContaining({
        isDefaultProperty: expect.anything(),
        getDefaultProperties: expect.anything(),
      }));
      expect((<DefaultModel<IpInterfaceModel>><unknown>result[1]).getDefaultProperties()).toEqual(expect.arrayContaining<keyof IpInterfaceModel>(['isUse']));
      expect(count).toEqual(2);
    });
  });

  describe(`Get network interface by id`, () => {
    let inputId: string;
    let repositoryGetAllStub: jest.SpyInstance;
    let outputIpModelDataMatch1: IpInterfaceModel;
    let outputIpModelDataNotMatch2: IpInterfaceModel;

    beforeEach(() => {
      inputId = identifierMock.generateId();

      repositoryGetAllStub = jest.spyOn(repository, 'getAllNetworkInterface');

      outputIpModelDataMatch1 = new IpInterfaceModel({
        id: identifierMock.generateId(),
        name: 'eno1',
        ip: '192.168.1.1',
        isUse: false,
      });

      outputIpModelDataNotMatch2 = new IpInterfaceModel({
        id: fakeIdentifierMock.generateId(),
        name: 'eno2',
        ip: '192.168.100.1',
        isUse: false,
      });
    });

    afterEach(() => {
      repositoryGetAllStub.mockClear();
    });

    it(`Should error get network interface with id`, async () => {
      repositoryGetAllStub.mockResolvedValue([new UnknownException()]);

      const [error] = await repository.getNetworkInterfaceById(inputId);

      expect(repositoryGetAllStub).toHaveBeenCalled();
      expect(repositoryGetAllStub).toHaveBeenCalledWith(new FilterModel<IpInterfaceModel>({skipPagination: true}));
      expect(error).toBeInstanceOf(UnknownException);
    });

    it(`Should successfully get network interface with id and return null if not found any data`, async () => {
      repositoryGetAllStub.mockResolvedValue([null, [], 0]);

      const [error, result] = await repository.getNetworkInterfaceById(inputId);

      expect(repositoryGetAllStub).toHaveBeenCalled();
      expect(repositoryGetAllStub).toHaveBeenCalledWith(new FilterModel<IpInterfaceModel>({skipPagination: true}));
      expect(error).toBeNull();
      expect(result).toBeNull();
    });

    it(`Should successfully get network interface with id and return null if not match id`, async () => {
      repositoryGetAllStub.mockResolvedValue([null, [outputIpModelDataNotMatch2], 1]);

      const [error, result] = await repository.getNetworkInterfaceById(inputId);

      expect(repositoryGetAllStub).toHaveBeenCalled();
      expect(repositoryGetAllStub).toHaveBeenCalledWith(new FilterModel<IpInterfaceModel>({skipPagination: true}));
      expect(error).toBeNull();
      expect(result).toBeNull();
    });

    it(`Should successfully get network interface with id`, async () => {
      repositoryGetAllStub.mockResolvedValue([null, [outputIpModelDataNotMatch2, outputIpModelDataMatch1], 2]);

      const [error, result] = await repository.getNetworkInterfaceById(inputId);

      expect(repositoryGetAllStub).toHaveBeenCalled();
      expect(repositoryGetAllStub).toHaveBeenCalledWith(new FilterModel<IpInterfaceModel>({skipPagination: true}));
      expect(error).toBeNull();
      expect(result).toMatchObject<Omit<IpInterfaceModel, 'clone'>>({
        id: outputIpModelDataMatch1.id,
        name: outputIpModelDataMatch1.name,
        ip: outputIpModelDataMatch1.ip,
        isUse: outputIpModelDataMatch1.isUse,
      });
    });
  });
});
