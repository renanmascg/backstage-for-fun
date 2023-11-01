import { CatalogBuilder } from '@backstage/plugin-catalog-backend';
import { ScaffolderEntitiesProcessor } from '@backstage/plugin-catalog-backend-module-scaffolder-entity-model';
import { Router } from 'express';
import { PluginEnvironment } from '../types';
import { LocalUserProvider } from './local-endpoint-plugin/local-user';
import { LocalGroupProvider } from './local-endpoint-plugin/local-group';

export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {
  const builder = await CatalogBuilder.create(env);

  builder.addProcessor(new ScaffolderEntitiesProcessor());
  
  const localUserProvider = new LocalUserProvider(env)
  builder.addEntityProvider(localUserProvider);

  const localGroupProvider = new LocalGroupProvider(env)
  builder.addEntityProvider(localGroupProvider);

  const { processingEngine, router } = await builder.build();
  
  await processingEngine.start();

  await env.scheduler.scheduleTask({
    id: 'local_user_refresh',
    fn: async () => {
      await localUserProvider.run();
    },
    frequency: { minutes: 1 },
    timeout: { minutes: 1 },
  });

  await env.scheduler.scheduleTask({
    id: 'local_group_refresh',
    fn: async () => {
      await localGroupProvider.run();
    },
    frequency: { minutes: 1 },
    timeout: { minutes: 1 },
  });
  
  return router;
}
