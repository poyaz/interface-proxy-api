import {ApiProperty, PartialType} from '@nestjs/swagger';
import {FilterModel, SortEnum} from '@src-core/model/filter.model';
import {instanceToPlain, Transform, Type} from 'class-transformer';
import {FilterInputDto} from '@src-api/http/dto/filter-input.dto';
import {IsBoolean, IsEnum, IsIP, IsOptional, IsString, Matches, MaxLength, ValidateNested} from 'class-validator';
import {IpInterfaceModel} from '@src-core/model/ip-interface.model';

class FilterProxyInterfaceInputDto {
  @ApiProperty({
    description: 'The name of network interface',
    type: String,
    maxLength: 30,
    required: false,
    example: 'eno1',
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  name?: string;

  @ApiProperty({
    description: 'The ip address of network interface (v4)',
    type: String,
    format: 'ipv4',
    required: false,
    example: '192.168.1.1',
  })
  @IsOptional()
  @IsIP(4)
  ip?: string;

  @ApiProperty({
    description: 'The status of ip address is use on proxy or not',
    type: Boolean,
    required: false,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({value}) => value === 'true' ? true : value === 'false' ? false : value)
  isUse?: boolean;
}

class SortProxyInterfaceInputDto {
  @ApiProperty({
    type: String,
    required: false,
    enum: SortEnum,
    example: SortEnum.ASC,
    default: SortEnum.ASC,
  })
  @IsOptional()
  @IsString()
  @IsEnum(SortEnum)
  @Transform(({value}) => value.toString().toLowerCase())
  name?: SortEnum.ASC | SortEnum.DESC;

  @ApiProperty({
    type: String,
    required: false,
    enum: SortEnum,
    example: SortEnum.ASC,
    default: SortEnum.ASC,
  })
  @IsOptional()
  @IsString()
  @IsEnum(SortEnum)
  @Transform(({value}) => value.toString().toLowerCase())
  ip?: SortEnum.ASC | SortEnum.DESC;
}

export class FindProxyInterfaceQueryDto extends PartialType(FilterInputDto) {
  @Type(() => SortProxyInterfaceInputDto)
  @ValidateNested()
  @ApiProperty({
    type: SortProxyInterfaceInputDto,
    examples: {
      'no sort': {
        description: 'Default not use sort',
        value: {},
      },
      'sort with name': {
        description: 'Sort by name with DESC format',
        value: {
          name: SortEnum.DESC,
        },
      },
      'sort with ip': {
        description: 'Sort by ip with DESC format',
        value: {
          ip: SortEnum.DESC,
        },
      },
    },
  })
  sorts?: SortProxyInterfaceInputDto;

  @Type(() => FilterProxyInterfaceInputDto)
  @ValidateNested()
  @ApiProperty({
    type: FilterProxyInterfaceInputDto,
    examples: {
      'no filter': {
        description: 'Search without any filters',
        value: {},
      },
      'search with name': {
        value: {
          name: 'eno1',
        },
      },
      'search with ip': {
        value: {
          ip: '192.168.1.1',
        },
      },
      'search with isUse': {
        value: {
          isUse: true,
        },
      },
      'search with name & ip': {
        value: {
          name: 'eno1',
          ip: '192.168.1.1',
        },
      },
    },
  })
  filters?: FilterProxyInterfaceInputDto;

  static toModel(dto: FindProxyInterfaceQueryDto): FilterModel<IpInterfaceModel> {
    const data = instanceToPlain(dto);

    const filterModel = new FilterModel<IpInterfaceModel>(data);

    if (typeof dto.sorts?.name !== 'undefined') {
      filterModel.addSortBy({name: dto.sorts.name});
    }

    if (typeof dto.sorts?.ip !== 'undefined') {
      filterModel.addSortBy({ip: dto.sorts.ip});
    }

    if (typeof dto.filters?.name !== 'undefined') {
      filterModel.addCondition({$opr: 'eq', ip: data.filters.name});
    }
    if (typeof dto.filters?.ip !== 'undefined') {
      filterModel.addCondition({$opr: 'eq', ip: data.filters.ip});
    }
    if (typeof dto.filters?.isUse !== 'undefined') {
      filterModel.addCondition({$opr: 'eq', isUse: data.filters.isUse});
    }

    return filterModel;
  }
}
