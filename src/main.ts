import { ConfigService } from '@nestjs/config';

import { createConfiguredApp } from './bootstrap';

async function bootstrap() {
  const app = await createConfiguredApp();
  const configService = app.get(ConfigService);

  await app.listen({ port: configService.getOrThrow<number>('app.port'), host: '0.0.0.0' });
}

void bootstrap();
