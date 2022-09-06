import {ApiProperty, PartialType} from '@nestjs/swagger';
import {DateOutputDto} from '@src-api/http/dto/date-output.dto';

export class FindProxyInterfaceOutputDto extends PartialType(DateOutputDto) {
  @ApiProperty({
    description: 'The identity of user',
    type: String,
    required: false,
    readOnly: true,
    example: '00000000-0000-0000-0000-000000000000',
  })
  id: string;

  @ApiProperty({
    description: 'The identity of VPN account',
    type: String,
    maxLength: 30,
    required: false,
    example: 'eno1',
  })
  name?: string;

  @ApiProperty({
    description: 'The ip address of network interface (v4)',
    type: String,
    format: 'ipv4',
    required: false,
    example: '192.168.1.1',
  })
  ip?: string;

  @ApiProperty({
    description: 'The status of identity is enable or not',
    type: Boolean,
    required: false,
    example: true,
  })
  isUse?: boolean;
}
