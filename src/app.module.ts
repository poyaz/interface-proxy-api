import {Module} from '@nestjs/common';
import {ConfigureModule} from '@src-loader/configure/configure.module';
import {ConfigService} from '@nestjs/config';
import {controllersExport} from '@src-api/http/controller.export';
import {ProviderTokenEnum} from '@src-core/enum/provider-token.enum';
import {DateTimeRepository} from '@src-infrastructure/system/date-time.repository';
import {UuidIdentifierRepository} from '@src-infrastructure/system/uuid-identifier.repository';
import {NullUuidIdentifierRepository} from '@src-infrastructure/system/null-uuid-identifier.repository';

@Module({
  imports: [ConfigureModule],
  controllers: [...controllersExport],
  providers: [
    ConfigService,
    {
      provide: ProviderTokenEnum.DATE_TIME_DEFAULT,
      useClass: DateTimeRepository,
    },
    {
      provide: ProviderTokenEnum.IDENTIFIER_UUID_NULL_REPOSITORY,
      useFactory: () => new UuidIdentifierRepository(),
    },
    {
      provide: ProviderTokenEnum.IDENTIFIER_UUID_NULL_REPOSITORY,
      useClass: NullUuidIdentifierRepository,
    },
  ],
})
export class AppModule {
}
