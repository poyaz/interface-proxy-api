import {Body, Controller, Get, Param, Post, Query} from '@nestjs/common';
import {
  ApiBadRequestResponse, ApiBody, ApiCreatedResponse,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags, ApiUnprocessableEntityResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import {DefaultSuccessDto} from '@src-api/http/dto/default-success.dto';
import {DefaultArraySuccessDto} from '@src-api/http/dto/default-array-success.dto';
import {NotFoundExceptionDto} from '@src-api/http/dto/not-found-exception.dto';
import {DefaultExceptionDto} from '@src-api/http/dto/default-exception.dto';
import {FindProxyInterfaceQueryDto} from '@src-api/http/controller/interface/dto/find-proxy-interface-query.dto';
import {FindProxyInterfaceOutputDto} from '@src-api/http/controller/interface/dto/find-proxy-interface-output.dto';
import {ValidateExceptionDto} from '@src-api/http/dto/validate-exception.dto';
import {CreateProxyInterfaceInputDto} from '@src-api/http/controller/interface/dto/create-proxy-interface-input.dto';

@Controller({
  path: 'interface',
  version: '1',
})
@ApiTags('interface')
@ApiExtraModels(DefaultSuccessDto, DefaultArraySuccessDto, NotFoundExceptionDto, FindProxyInterfaceOutputDto)
@ApiBadRequestResponse({description: 'Bad Request', type: DefaultExceptionDto})
export class InterfaceHttpController {

  @Get()
  @ApiOperation({description: 'Get all interface', operationId: 'Get all interface'})
  @ApiQuery({
    name: 'sorts',
    required: false,
    style: 'deepObject',
    explode: true,
    type: 'object',
  })
  @ApiQuery({
    name: 'filters',
    required: false,
    style: 'deepObject',
    explode: true,
    type: 'object',
  })
  @ApiOkResponse({
    schema: {
      anyOf: [
        {
          allOf: [
            {
              title: 'With data',
            },
            {$ref: getSchemaPath(DefaultArraySuccessDto)},
            {
              properties: {
                count: {
                  type: 'number',
                  example: 1,
                },
                data: {
                  type: 'array',
                  items: {
                    $ref: getSchemaPath(FindProxyInterfaceOutputDto),
                  },
                },
              },
            },
          ],
        },
        {
          allOf: [
            {
              title: 'Without data',
            },
            {$ref: getSchemaPath(DefaultArraySuccessDto)},
            {
              properties: {
                count: {
                  type: 'number',
                  example: 0,
                },
                data: {
                  type: 'array',
                  example: [],
                },
              },
            },
          ],
        },
      ],
    },
  })
  async findAll(@Query() queryFilterDto: FindProxyInterfaceQueryDto) {

  }

  @Post(':interfaceId/proxy')
  @ApiOperation({description: 'Create new proxy on interface network', operationId: 'Add new proxy interface'})
  @ApiBody({
    type: CreateProxyInterfaceInputDto,
    examples: {
      'without port': {
        description: 'Generate random port for proxy',
        value: {},
      },
      'with port': {
        description: 'Generate proxy with selected port',
        value: {
          port: 3128,
        } as CreateProxyInterfaceInputDto,
      },
    },
  })
  @ApiCreatedResponse({
    description: 'The proxy has been successfully created on interface.',
    schema: {
      allOf: [
        {$ref: getSchemaPath(DefaultSuccessDto)},
        {
          properties: {
            data: {
              type: 'string',
              description: 'The id of job. You should check result of job with this id',
              example: '00000000-0000-0000-0000-000000000000',
            },
          },
        },
      ],
    },
  })
  @ApiUnprocessableEntityResponse({description: 'Unprocessable Entity', type: ValidateExceptionDto})
  async create(@Param('interfaceId') interfaceId: string, @Body() createIdentityDto: CreateProxyInterfaceInputDto) {
  }
}
