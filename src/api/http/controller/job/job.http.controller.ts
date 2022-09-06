import {Controller, Get, Param} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiExtraModels,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags, getSchemaPath,
} from '@nestjs/swagger';
import {DefaultSuccessDto} from '@src-api/http/dto/default-success.dto';
import {DefaultArraySuccessDto} from '@src-api/http/dto/default-array-success.dto';
import {NotFoundExceptionDto} from '@src-api/http/dto/not-found-exception.dto';
import {DefaultExceptionDto} from '@src-api/http/dto/default-exception.dto';
import {FindJobOutputDto} from '@src-api/http/controller/job/dto/find-job-output.dto';

@Controller({
  path: 'job',
  version: '1',
})
@ApiTags('job')
@ApiExtraModels(DefaultSuccessDto, DefaultArraySuccessDto, FindJobOutputDto)
@ApiBadRequestResponse({description: 'Bad Request', type: DefaultExceptionDto})
export class JobHttpController {

  @Get(':jobId')
  @ApiOperation({description: 'Get info of one job with ID', operationId: 'Get job'})
  @ApiParam({name: 'jobId', type: String, example: '00000000-0000-0000-0000-000000000000'})
  @ApiBearerAuth()
  @ApiOkResponse({
    schema: {
      allOf: [
        {$ref: getSchemaPath(DefaultSuccessDto)},
        {
          properties: {
            data: {
              type: 'object',
              $ref: getSchemaPath(FindJobOutputDto),
            },
          },
        },
      ],
    },
  })
  @ApiNotFoundResponse({
    description: 'The job id not found.',
    type: NotFoundExceptionDto,
  })
  async findOne(@Param('jobId') jobId: string) {
  }
}
