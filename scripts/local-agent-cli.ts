#!/usr/bin/env ts-node
/**
 * Local agent CLI — PA / PM / CMO / Twin without going through HTTP.
 *
 * Usage:
 *   pnpm agent -- "Remember launches should lead with time-to-trust"
 *   pnpm agent --role cmo -- "Draft a LinkedIn GTM post for verifiable BLs"
 *   pnpm agent --role pm -- "Create task: finish Vertex memory recall tests"
 *   pnpm agent --status
 */
import { NestFactory } from '@nestjs/core';
import { Module, Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import localAgentConfig from '../src/local-agent/config/local-agent.config';
import environmentConfig from '../src/config/environment.config';
import { LocalAgentModule } from '../src/local-agent/local-agent.module';
import { LocalAgentService } from '../src/local-agent/local-agent.service';
import { AgentRole } from '../src/local-agent/local-agent.constants';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [environmentConfig, localAgentConfig],
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/tradedocs'),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined,
      },
    }),
    LocalAgentModule,
  ],
})
class LocalAgentCliModule {}

function parseArgs(argv: string[]) {
  const args = argv.slice(2);
  let role: AgentRole = AgentRole.AUTO;
  let statusOnly = false;
  const messageParts: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--status') {
      statusOnly = true;
    } else if (arg === '--role' && args[i + 1]) {
      role = args[++i] as AgentRole;
    } else if (arg === '--') {
      messageParts.push(...args.slice(i + 1));
      break;
    } else if (!arg.startsWith('--')) {
      messageParts.push(arg);
    }
  }

  return { role, statusOnly, message: messageParts.join(' ').trim() };
}

async function main() {
  const logger = new Logger('LocalAgentCLI');
  const { role, statusOnly, message } = parseArgs(process.argv);

  const app = await NestFactory.createApplicationContext(LocalAgentCliModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const agent = app.get(LocalAgentService);

    if (statusOnly || !message) {
      const status = agent.getStatus();
      console.log(JSON.stringify(status, null, 2));
      if (!message) {
        logger.log('Pass a message after -- to chat. Example: pnpm agent -- "brief me"');
      }
      return;
    }

    const result = await agent.chat({ message, role });
    console.log(`\n[${result.role} | ${result.provider}/${result.model}] session=${result.sessionId}\n`);
    console.log(result.reply);
    if (result.toolCalls.length) {
      console.log('\nTools:', JSON.stringify(result.toolCalls, null, 2));
    }
  } finally {
    await app.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
