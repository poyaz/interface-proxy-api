import {IsNumber, IsOptional} from 'class-validator';
import {ApiProperty} from '@nestjs/swagger';
import {ProxyDownstreamModel, ProxyStatusEnum, ProxyTypeEnum, ProxyUpstreamModel} from '@src-core/model/proxy.model';
import {defaultModelFactory} from '@src-core/model/defaultModel';

export class CreateProxyInterfaceInputDto {
  @ApiProperty({
    description: 'The port of proxy wanna run it. (If empty use random port)',
    required: false,
    type: Number,
    minimum: 1,
    example: 3128,
  })
  @IsOptional()
  @IsNumber()
  port?: number;

  static toModel(interfaceId: string, dto: CreateProxyInterfaceInputDto): ProxyUpstreamModel {
    const proxyDownstreamModel = defaultModelFactory<ProxyDownstreamModel>(
      ProxyDownstreamModel,
      {
        id: 'default',
        refId: interfaceId,
        ip: 'default',
        mask: 32,
        type: ProxyTypeEnum.INTERFACE,
        status: ProxyStatusEnum.DISABLE,
      },
      ['id', 'ip', 'status'],
    );

    return defaultModelFactory<ProxyUpstreamModel>(
      ProxyUpstreamModel,
      {
        id: 'default',
        listenIp: 'default',
        proxyDownstream: [proxyDownstreamModel], ...(dto.port && {listenPort: dto.port}),
      },
      ['id', 'listenIp'],
    );
  }
}
