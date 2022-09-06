import {Controller, Delete, Get, HttpCode, HttpStatus, Param, Query} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiExtraModels, ApiNoContentResponse, ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation, ApiParam,
  ApiQuery,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import {DefaultSuccessDto} from '@src-api/http/dto/default-success.dto';
import {DefaultArraySuccessDto} from '@src-api/http/dto/default-array-success.dto';
import {NotFoundExceptionDto} from '@src-api/http/dto/not-found-exception.dto';
import {FindProxyInterfaceOutputDto} from '@src-api/http/controller/interface/dto/find-proxy-interface-output.dto';
import {DefaultExceptionDto} from '@src-api/http/dto/default-exception.dto';
import {FindProxyQueryDto} from '@src-api/http/controller/proxy/dto/find-proxy-query.dto';
import {FindProxyOutputDto} from '@src-api/http/controller/proxy/dto/find-proxy-output.dto';
import {ExceptionEnum} from '@src-core/enum/exception.enum';

@Controller({
  path: 'proxy',
  version: '1',
})
@ApiTags('proxy')
@ApiExtraModels(DefaultSuccessDto, DefaultArraySuccessDto, FindProxyOutputDto)
@ApiBadRequestResponse({description: 'Bad Request', type: DefaultExceptionDto})
export class ProxyHttpController {

  @Get()
  @ApiOperation({description: 'Get all enabled proxy', operationId: 'Get all enabled proxy'})
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
                    $ref: getSchemaPath(FindProxyOutputDto),
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
  async findAll(@Query() queryFilterDto: FindProxyQueryDto) {
  }

  @Delete(':proxyId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({description: 'Delete proxy with ID', operationId: 'Remove proxy'})
  @ApiParam({name: 'proxyId', type: String, example: '00000000-0000-0000-0000-000000000000'})
  @ApiNoContentResponse({
    description: 'The proxy has been successfully deleted.',
  })
  @ApiNotFoundResponse({
    description: 'The proxy id not found.',
    type: NotFoundExceptionDto,
  })
  async remove(@Param('proxyId') proxyId: string) {
  }
}
