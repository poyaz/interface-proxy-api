import {mock, MockProxy} from 'jest-mock-extended';
import {Test, TestingModule} from '@nestjs/testing';
import {NetworkInterfaceAggregateRepository} from './network-interface-aggregate.repository';
import {ProviderTokenEnum} from '@src-core/enum/provider-token.enum';
import {ISystemInfoRepositoryInterface} from '@src-core/interface/i-system-info-repository.interface';
import {INetworkInterfaceRepositoryInterface} from '@src-core/interface/i-network-interface-repository.interface';
import {FilterModel, SortEnum} from '@src-core/model/filter.model';
import {IpInterfaceModel} from '@src-core/model/ip-interface.model';
import {UnknownException} from '@src-core/exception/unknown.exception';
import {IIdentifier} from '@src-core/interface/i-identifier.interface';
import {DefaultModel, defaultModelFactory, defaultModelType} from '@src-core/model/defaultModel';

describe('NetworkInterfaceAggregateRepository', () => {
  let repository: NetworkInterfaceAggregateRepository;
  let systemInfoRepository: MockProxy<ISystemInfoRepositoryInterface>;
  let squidNetworkInterfaceRepository: MockProxy<INetworkInterfaceRepositoryInterface>;
  let identifierMock: MockProxy<IIdentifier>;

  beforeEach(async () => {
    systemInfoRepository = mock<ISystemInfoRepositoryInterface>();
    squidNetworkInterfaceRepository = mock<INetworkInterfaceRepositoryInterface>();

    identifierMock = mock<IIdentifier>();
    identifierMock.generateId.mockReturnValue('00000000-0000-0000-0000-000000000000');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ProviderTokenEnum.SYSTEM_INFO_REPOSITORY,
          useValue: systemInfoRepository,
        },
        {
          provide: ProviderTokenEnum.SQUID_NETWORK_INTERFACE_REPOSITORY,
          useValue: squidNetworkInterfaceRepository,
        },
        {
          provide: NetworkInterfaceAggregateRepository,
          inject: [ProviderTokenEnum.SYSTEM_INFO_REPOSITORY, ProviderTokenEnum.SQUID_NETWORK_INTERFACE_REPOSITORY],
          useFactory: (
            systemInfoRepository: ISystemInfoRepositoryInterface,
            squidNetworkInterfaceRepository: INetworkInterfaceRepositoryInterface,
          ) => new NetworkInterfaceAggregateRepository(systemInfoRepository, squidNetworkInterfaceRepository),
        },
      ],
    }).compile();

    repository = module.get<NetworkInterfaceAggregateRepository>(NetworkInterfaceAggregateRepository);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe(`Get all network ip address`, () => {
    let inputIpFilterModel: FilterModel<IpInterfaceModel>;
    let inputIsUseFilterModel: FilterModel<IpInterfaceModel>;
    let inputFilterPaginationModel: FilterModel<IpInterfaceModel>;
    let inputFilterSortAndPaginationModel: FilterModel<IpInterfaceModel>;
    let inputFilterSkipPaginationModel: FilterModel<IpInterfaceModel>;
    let outputNetworkIpData1: defaultModelType<IpInterfaceModel>;
    let outputNetworkIpData2: defaultModelType<IpInterfaceModel>;
    let outputSquidIpData3: IpInterfaceModel;
    let outputSquidIpNotMatchData4: IpInterfaceModel;

    beforeEach(() => {
      inputIpFilterModel = new FilterModel<IpInterfaceModel>();
      inputIpFilterModel.addCondition({$opr: 'eq', ip: '192.168.1.1'});

      inputIsUseFilterModel = new FilterModel<IpInterfaceModel>();
      inputIsUseFilterModel.addCondition({$opr: 'eq', isUse: true});

      inputFilterPaginationModel = new FilterModel<IpInterfaceModel>({page: 2, limit: 1});

      inputFilterSortAndPaginationModel = new FilterModel<IpInterfaceModel>({page: 2, limit: 1});
      inputFilterSortAndPaginationModel.addSortBy({ip: SortEnum.DESC});

      inputFilterSkipPaginationModel = new FilterModel<IpInterfaceModel>({skipPagination: true});

      outputNetworkIpData1 = defaultModelFactory(
        IpInterfaceModel,
        {
          id: identifierMock.generateId(),
          name: 'eno1',
          ip: '192.168.1.1',
          isUse: false,
        },
        ['isUse'],
      );
      outputNetworkIpData2 = defaultModelFactory(
        IpInterfaceModel,
        {
          id: identifierMock.generateId(),
          name: 'eno2',
          ip: '192.168.100.1',
          isUse: false,
        },
        ['isUse'],
      );
      outputSquidIpData3 = new IpInterfaceModel({
        id: 'default-id',
        name: 'default-name',
        ip: '192.168.1.1',
        isUse: false,
      });
      outputSquidIpNotMatchData4 = new IpInterfaceModel({
        id: 'default-id',
        name: 'default-name',
        ip: '192.168.1.2',
        isUse: false,
      });
    });

    it(`Should error all network ip address when fail on get network ip`, async () => {
      systemInfoRepository.getAllNetworkInterface.mockResolvedValue([new UnknownException()]);
      squidNetworkInterfaceRepository.getAll.mockResolvedValue([null, [], 0]);

      const [error] = await repository.getAll();

      expect(systemInfoRepository.getAllNetworkInterface).toHaveBeenCalled();
      expect(systemInfoRepository.getAllNetworkInterface).toHaveBeenCalledWith(expect.objectContaining({skipPagination: true}));
      expect((<FilterModel<IpInterfaceModel>>systemInfoRepository.getAllNetworkInterface.mock.calls[0][0]).getConditionList()).toEqual([]);
      expect(squidNetworkInterfaceRepository.getAll).toHaveBeenCalled();
      expect(squidNetworkInterfaceRepository.getAll).toHaveBeenCalledWith(expect.objectContaining({skipPagination: true}));
      expect((<FilterModel<IpInterfaceModel>>squidNetworkInterfaceRepository.getAll.mock.calls[0][0]).getConditionList()).toEqual([]);
      expect(error).toBeInstanceOf(UnknownException);
    });

    it(`Should error all network ip address when fail on get squid ip`, async () => {
      systemInfoRepository.getAllNetworkInterface.mockResolvedValue([null, [], 0]);
      squidNetworkInterfaceRepository.getAll.mockResolvedValue([new UnknownException()]);

      const [error] = await repository.getAll();

      expect(systemInfoRepository.getAllNetworkInterface).toHaveBeenCalled();
      expect(systemInfoRepository.getAllNetworkInterface).toHaveBeenCalledWith(expect.objectContaining({skipPagination: true}));
      expect((<FilterModel<IpInterfaceModel>>systemInfoRepository.getAllNetworkInterface.mock.calls[0][0]).getConditionList()).toEqual([]);
      expect(squidNetworkInterfaceRepository.getAll).toHaveBeenCalled();
      expect(squidNetworkInterfaceRepository.getAll).toHaveBeenCalledWith(expect.objectContaining({skipPagination: true}));
      expect((<FilterModel<IpInterfaceModel>>squidNetworkInterfaceRepository.getAll.mock.calls[0][0]).getConditionList()).toEqual([]);
      expect(error).toBeInstanceOf(UnknownException);
    });

    it(`Should successfully all network ip address (without filter) and return empty records because not found any ip on network interface`, async () => {
      systemInfoRepository.getAllNetworkInterface.mockResolvedValue([null, [], 0]);
      squidNetworkInterfaceRepository.getAll.mockResolvedValue([null, [], 0]);

      const [error, result, count] = await repository.getAll();

      expect(systemInfoRepository.getAllNetworkInterface).toHaveBeenCalled();
      expect(systemInfoRepository.getAllNetworkInterface).toHaveBeenCalledWith(expect.objectContaining({skipPagination: true}));
      expect((<FilterModel<IpInterfaceModel>>systemInfoRepository.getAllNetworkInterface.mock.calls[0][0]).getConditionList()).toEqual([]);
      expect(squidNetworkInterfaceRepository.getAll).toHaveBeenCalled();
      expect(squidNetworkInterfaceRepository.getAll).toHaveBeenCalledWith(expect.objectContaining({skipPagination: true}));
      expect((<FilterModel<IpInterfaceModel>>squidNetworkInterfaceRepository.getAll.mock.calls[0][0]).getConditionList()).toEqual([]);
      expect(error).toBeNull();
      expect(result.length).toEqual(0);
      expect(count).toEqual(0);
    });

    it(`Should successfully all network ip address (without filter) and return records with "isUse" false because not found any ip on squid`, async () => {
      systemInfoRepository.getAllNetworkInterface.mockResolvedValue([null, [outputNetworkIpData1, outputNetworkIpData2], 2]);
      squidNetworkInterfaceRepository.getAll.mockResolvedValue([null, [], 0]);

      const [error, result, count] = await repository.getAll();

      expect(systemInfoRepository.getAllNetworkInterface).toHaveBeenCalled();
      expect(systemInfoRepository.getAllNetworkInterface).toHaveBeenCalledWith(expect.objectContaining({skipPagination: true}));
      expect((<FilterModel<IpInterfaceModel>>systemInfoRepository.getAllNetworkInterface.mock.calls[0][0]).getConditionList()).toEqual([]);
      expect(squidNetworkInterfaceRepository.getAll).toHaveBeenCalled();
      expect(squidNetworkInterfaceRepository.getAll).toHaveBeenCalledWith(expect.objectContaining({skipPagination: true}));
      expect((<FilterModel<IpInterfaceModel>>squidNetworkInterfaceRepository.getAll.mock.calls[0][0]).getConditionList()).toEqual([]);
      expect(error).toBeNull();
      expect(result[0]).toMatchObject<Omit<IpInterfaceModel, 'clone'>>({
        id: outputNetworkIpData1.id,
        name: outputNetworkIpData1.name,
        ip: outputNetworkIpData1.ip,
        isUse: false,
      });
      expect((<DefaultModel<IpInterfaceModel>><unknown>result[0]).getDefaultProperties()).toEqual(expect.arrayContaining<keyof IpInterfaceModel>(['isUse']));
      expect(result[1]).toMatchObject<Omit<IpInterfaceModel, 'clone'>>({
        id: outputNetworkIpData2.id,
        name: outputNetworkIpData2.name,
        ip: outputNetworkIpData2.ip,
        isUse: false,
      });
      expect((<DefaultModel<IpInterfaceModel>><unknown>result[1]).getDefaultProperties()).toEqual(expect.arrayContaining<keyof IpInterfaceModel>(['isUse']));
      expect(count).toEqual(2);
    });

    it(`Should successfully all network ip address (without filter) and return records with "isUse" true if found ip on squid`, async () => {
      systemInfoRepository.getAllNetworkInterface.mockResolvedValue([null, [outputNetworkIpData1, outputNetworkIpData2], 2]);
      squidNetworkInterfaceRepository.getAll.mockResolvedValue([null, [outputSquidIpData3, outputSquidIpNotMatchData4], 2]);

      const [error, result, count] = await repository.getAll();

      expect(systemInfoRepository.getAllNetworkInterface).toHaveBeenCalled();
      expect(systemInfoRepository.getAllNetworkInterface).toHaveBeenCalledWith(expect.objectContaining({skipPagination: true}));
      expect((<FilterModel<IpInterfaceModel>>systemInfoRepository.getAllNetworkInterface.mock.calls[0][0]).getConditionList()).toEqual([]);
      expect(squidNetworkInterfaceRepository.getAll).toHaveBeenCalled();
      expect(squidNetworkInterfaceRepository.getAll).toHaveBeenCalledWith(expect.objectContaining({skipPagination: true}));
      expect((<FilterModel<IpInterfaceModel>>squidNetworkInterfaceRepository.getAll.mock.calls[0][0]).getConditionList()).toEqual([]);
      expect(error).toBeNull();
      expect(result[0]).toMatchObject<Omit<IpInterfaceModel, 'clone'>>({
        id: outputNetworkIpData1.id,
        name: outputNetworkIpData1.name,
        ip: outputNetworkIpData1.ip,
        isUse: true,
      });
      expect((<DefaultModel<IpInterfaceModel>><unknown>result[0]).getDefaultProperties().length).toEqual(0);
      expect(result[1]).toMatchObject<Omit<IpInterfaceModel, 'clone'>>({
        id: outputNetworkIpData2.id,
        name: outputNetworkIpData2.name,
        ip: outputNetworkIpData2.ip,
        isUse: false,
      });
      expect((<DefaultModel<IpInterfaceModel>><unknown>result[1]).getDefaultProperties()).toEqual(expect.arrayContaining<keyof IpInterfaceModel>(['isUse']));
      expect(count).toEqual(2);
    });

    it(`Should successfully all network ip address (with ip filter) and return records`, async () => {
      systemInfoRepository.getAllNetworkInterface.mockResolvedValue([null, [outputNetworkIpData1, outputNetworkIpData2], 2]);
      squidNetworkInterfaceRepository.getAll.mockResolvedValue([null, [outputSquidIpData3, outputSquidIpNotMatchData4], 2]);

      const [error, result, count] = await repository.getAll(inputIpFilterModel);

      expect(systemInfoRepository.getAllNetworkInterface).toHaveBeenCalled();
      expect(systemInfoRepository.getAllNetworkInterface).toHaveBeenCalledWith(expect.objectContaining({skipPagination: true}));
      expect((<FilterModel<IpInterfaceModel>>systemInfoRepository.getAllNetworkInterface.mock.calls[0][0]).getCondition('ip')).toMatchObject(inputIpFilterModel.getCondition('ip'));
      expect(squidNetworkInterfaceRepository.getAll).toHaveBeenCalled();
      expect(squidNetworkInterfaceRepository.getAll).toHaveBeenCalledWith(expect.objectContaining({skipPagination: true}));
      expect((<FilterModel<IpInterfaceModel>>squidNetworkInterfaceRepository.getAll.mock.calls[0][0]).getCondition('ip')).toMatchObject(inputIpFilterModel.getCondition('ip'));
      expect(error).toBeNull();
      expect(result[0]).toMatchObject<Omit<IpInterfaceModel, 'clone'>>({
        id: outputNetworkIpData1.id,
        name: outputNetworkIpData1.name,
        ip: outputNetworkIpData1.ip,
        isUse: true,
      });
      expect((<DefaultModel<IpInterfaceModel>><unknown>result[0]).getDefaultProperties().length).toEqual(0);
      expect(result[1]).toMatchObject<Omit<IpInterfaceModel, 'clone'>>({
        id: outputNetworkIpData2.id,
        name: outputNetworkIpData2.name,
        ip: outputNetworkIpData2.ip,
        isUse: false,
      });
      expect((<DefaultModel<IpInterfaceModel>><unknown>result[1]).getDefaultProperties()).toEqual(expect.arrayContaining<keyof IpInterfaceModel>(['isUse']));
      expect(count).toEqual(2);
    });

    it(`Should successfully all network ip address (with isUse filter) and return records`, async () => {
      systemInfoRepository.getAllNetworkInterface.mockResolvedValue([null, [outputNetworkIpData1, outputNetworkIpData2], 2]);
      squidNetworkInterfaceRepository.getAll.mockResolvedValue([null, [outputSquidIpData3, outputSquidIpNotMatchData4], 2]);

      const [error, result, count] = await repository.getAll(inputIsUseFilterModel);

      expect(systemInfoRepository.getAllNetworkInterface).toHaveBeenCalled();
      expect(systemInfoRepository.getAllNetworkInterface).toHaveBeenCalledWith(expect.objectContaining({skipPagination: true}));
      expect((<FilterModel<IpInterfaceModel>>systemInfoRepository.getAllNetworkInterface.mock.calls[0][0]).getConditionList().length).toEqual(0);
      expect(squidNetworkInterfaceRepository.getAll).toHaveBeenCalled();
      expect(squidNetworkInterfaceRepository.getAll).toHaveBeenCalledWith(expect.objectContaining({skipPagination: true}));
      expect((<FilterModel<IpInterfaceModel>>squidNetworkInterfaceRepository.getAll.mock.calls[0][0]).getConditionList().length).toEqual(0);
      expect(error).toBeNull();
      expect(result[0]).toMatchObject<Omit<IpInterfaceModel, 'clone'>>({
        id: outputNetworkIpData1.id,
        name: outputNetworkIpData1.name,
        ip: outputNetworkIpData1.ip,
        isUse: true,
      });
      expect((<DefaultModel<IpInterfaceModel>><unknown>result[0]).getDefaultProperties().length).toEqual(0);
      expect(count).toEqual(1);
    });

    it(`Should successfully all network ip address (with pagination) and return records`, async () => {
      systemInfoRepository.getAllNetworkInterface.mockResolvedValue([null, [outputNetworkIpData1, outputNetworkIpData2], 2]);
      squidNetworkInterfaceRepository.getAll.mockResolvedValue([null, [outputSquidIpData3, outputSquidIpNotMatchData4], 2]);

      const [error, result, count] = await repository.getAll(inputFilterPaginationModel);

      expect(systemInfoRepository.getAllNetworkInterface).toHaveBeenCalled();
      expect(systemInfoRepository.getAllNetworkInterface).toHaveBeenCalledWith(expect.objectContaining({skipPagination: true}));
      expect((<FilterModel<IpInterfaceModel>>systemInfoRepository.getAllNetworkInterface.mock.calls[0][0]).getConditionList().length).toEqual(0);
      expect(squidNetworkInterfaceRepository.getAll).toHaveBeenCalled();
      expect(squidNetworkInterfaceRepository.getAll).toHaveBeenCalledWith(expect.objectContaining({skipPagination: true}));
      expect((<FilterModel<IpInterfaceModel>>squidNetworkInterfaceRepository.getAll.mock.calls[0][0]).getConditionList().length).toEqual(0);
      expect(error).toBeNull();
      expect(result[0]).toMatchObject<Omit<IpInterfaceModel, 'clone'>>({
        id: outputNetworkIpData2.id,
        name: outputNetworkIpData2.name,
        ip: outputNetworkIpData2.ip,
        isUse: false,
      });
      expect((<DefaultModel<IpInterfaceModel>><unknown>result[0]).getDefaultProperties()).toEqual(expect.arrayContaining<keyof IpInterfaceModel>(['isUse']));
      expect(count).toEqual(2);
    });

    it(`Should successfully all network ip address (with sort and pagination) and return records`, async () => {
      systemInfoRepository.getAllNetworkInterface.mockResolvedValue([null, [outputNetworkIpData1, outputNetworkIpData2], 2]);
      squidNetworkInterfaceRepository.getAll.mockResolvedValue([null, [outputSquidIpData3, outputSquidIpNotMatchData4], 2]);

      const [error, result, count] = await repository.getAll(inputFilterSortAndPaginationModel);

      expect(systemInfoRepository.getAllNetworkInterface).toHaveBeenCalled();
      expect(systemInfoRepository.getAllNetworkInterface).toHaveBeenCalledWith(expect.objectContaining({skipPagination: true}));
      expect((<FilterModel<IpInterfaceModel>>systemInfoRepository.getAllNetworkInterface.mock.calls[0][0]).getConditionList().length).toEqual(0);
      expect(squidNetworkInterfaceRepository.getAll).toHaveBeenCalled();
      expect(squidNetworkInterfaceRepository.getAll).toHaveBeenCalledWith(expect.objectContaining({skipPagination: true}));
      expect((<FilterModel<IpInterfaceModel>>squidNetworkInterfaceRepository.getAll.mock.calls[0][0]).getConditionList().length).toEqual(0);
      expect(error).toBeNull();
      expect(result[0]).toMatchObject<Omit<IpInterfaceModel, 'clone'>>({
        id: outputNetworkIpData1.id,
        name: outputNetworkIpData1.name,
        ip: outputNetworkIpData1.ip,
        isUse: true,
      });
      expect((<DefaultModel<IpInterfaceModel>><unknown>result[0]).getDefaultProperties().length).toEqual(0);
      expect(count).toEqual(2);
    });

    it(`Should successfully all network ip address (with skip pagination) and return records`, async () => {
      systemInfoRepository.getAllNetworkInterface.mockResolvedValue([null, [outputNetworkIpData1, outputNetworkIpData2], 2]);
      squidNetworkInterfaceRepository.getAll.mockResolvedValue([null, [outputSquidIpData3, outputSquidIpNotMatchData4], 2]);

      const [error, result, count] = await repository.getAll(inputFilterSkipPaginationModel);

      expect(systemInfoRepository.getAllNetworkInterface).toHaveBeenCalled();
      expect(systemInfoRepository.getAllNetworkInterface).toHaveBeenCalledWith(expect.objectContaining({skipPagination: true}));
      expect((<FilterModel<IpInterfaceModel>>systemInfoRepository.getAllNetworkInterface.mock.calls[0][0]).getConditionList().length).toEqual(0);
      expect(squidNetworkInterfaceRepository.getAll).toHaveBeenCalled();
      expect(squidNetworkInterfaceRepository.getAll).toHaveBeenCalledWith(expect.objectContaining({skipPagination: true}));
      expect((<FilterModel<IpInterfaceModel>>squidNetworkInterfaceRepository.getAll.mock.calls[0][0]).getConditionList().length).toEqual(0);
      expect(error).toBeNull();
      expect(result[0]).toMatchObject<Omit<IpInterfaceModel, 'clone'>>({
        id: outputNetworkIpData1.id,
        name: outputNetworkIpData1.name,
        ip: outputNetworkIpData1.ip,
        isUse: true,
      });
      expect((<DefaultModel<IpInterfaceModel>><unknown>result[0]).getDefaultProperties().length).toEqual(0);
      expect(result[1]).toMatchObject<Omit<IpInterfaceModel, 'clone'>>({
        id: outputNetworkIpData2.id,
        name: outputNetworkIpData2.name,
        ip: outputNetworkIpData2.ip,
        isUse: false,
      });
      expect((<DefaultModel<IpInterfaceModel>><unknown>result[1]).getDefaultProperties()).toEqual(expect.arrayContaining<keyof IpInterfaceModel>(['isUse']));
      expect(count).toEqual(2);
    });
  });
});
