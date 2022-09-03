import {Module} from '@nestjs/common';
import {ConfigureModule} from '@src-loader/configure/configure.module';

@Module({
  imports: [ConfigureModule],
  controllers: [],
  providers: [],
})
export class AppModule {
}
