import {ApiProperty, PartialType} from '@nestjs/swagger';
import {DateOutputDto} from '@src-api/http/dto/date-output.dto';

export class FindProxyOutputDto extends PartialType(DateOutputDto) {
  @ApiProperty({
    description: 'The identity of user',
    type: String,
    required: false,
    readOnly: true,
    example: '00000000-0000-0000-0000-000000000000',
  })
  id: string;

  @ApiProperty({
    description: 'The ip address of proxy are listening',
    type: String,
    format: 'ipv4',
    required: false,
    example: '192.168.1.1',
  })
  listenIp?: string;

  @ApiProperty({
    description: 'The port of proxy are listening',
    type: Number,
    required: false,
    example: 3128,
  })
  listenPort?: number;
}
