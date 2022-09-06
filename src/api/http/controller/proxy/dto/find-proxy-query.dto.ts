import {ApiProperty, PartialType} from '@nestjs/swagger';
import {FilterInputDto} from '@src-api/http/dto/filter-input.dto';
import {IsBoolean, IsEnum, IsIP, IsNumber, IsOptional, IsString, MaxLength, ValidateNested} from 'class-validator';
import {Transform, Type} from 'class-transformer';
import {SortEnum} from '@src-core/model/filter.model';

class SortProxyInputDto {
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
  port?: SortEnum.ASC | SortEnum.DESC;
}

class FilterProxyInputDto {
  @ApiProperty({
    description: 'The port of proxy has been runner',
    type: Number,
    required: false,
    example: 3128,
  })
  @IsOptional()
  @IsNumber()
  port?: string;
}

export class FindProxyQueryDto extends PartialType(FilterInputDto) {
  @Type(() => SortProxyInputDto)
  @ValidateNested()
  @ApiProperty({
    type: SortProxyInputDto,
    examples: {
      'no sort': {
        description: 'Default not use sort',
        value: {},
      },
      'sort with port': {
        description: 'Sort by port with DESC format',
        value: {
          port: SortEnum.DESC,
        },
      },
    },
  })
  sorts?: SortProxyInputDto;

  @Type(() => FilterProxyInputDto)
  @ValidateNested()
  @ApiProperty({
    type: FilterProxyInputDto,
    examples: {
      'no filter': {
        description: 'Search without any filters',
        value: {},
      },
      'search with port': {
        value: {
          port: 3128,
        },
      },
    },
  })
  filters?: FilterProxyInputDto;
}
