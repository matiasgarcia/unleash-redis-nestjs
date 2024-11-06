# Unleash Redis
How to config:
- `npm i`
- `docker compose up`
- Log into Unleash (localhost:4242) username: `admin`, password: `unleash4all`
- Create an API Key following these instructions: https://docs.getunleash.io/how-to/how-to-create-api-tokens
- Modify `.development.env`, set `UNLEASH_API_KEY` with your api key

Then:
1. Simulate NestJS not closing due to Unleash and Redis active handles => `npm run job-hangs`
2. Simulate Unleash crashing when closing redis => `npm run job-crashes`

--

@chriswk I played around with this a little bit more to understand _why_ it happens in our production environment and why I cannot reproduce it on my local.

What I realized is that these two elements can cause the race condition:
- get() request to server: https://github.com/Unleash/unleash-client-node/blob/main/src/repository/index.ts#L346-L355
- job time: https://github.com/matiasgarcia/unleash-redis-nestjs/blob/main/src/job.ts#L9 (simulated with sleep(200))

In my localhost, the get() request takes 40ms to resolve. However, our unleash server takes approximately 1s to resolve.

If get() time > job (simulated as sleep(200)) => there is a chance that the process will crash on shutdown due to not flushing to Unleash (see trace below).

If get() time < job => process will shutdown gracefully

```
/Users/matias/projects/unleash-redis-race/node_modules/ioredis/built/Redis.js:332
            command.reject(new Error(utils_1.CONNECTION_CLOSED_ERROR_MSG));
                           ^

Error: Connection is closed.
    at EventEmitter.sendCommand (/Users/matias/projects/unleash-redis-race/node_modules/ioredis/built/Redis.js:332:28)
    at EventEmitter.set (/Users/matias/projects/unleash-redis-race/node_modules/ioredis/built/utils/Commander.js:90:25)
    at UnleashRedisStorage.set (/Users/matias/projects/unleash-redis-race/src/unleash/unleash.redis.ts:13:22)
    at Repository.save (/Users/matias/projects/unleash-redis-race/node_modules/unleash-client/src/repository/index.ts:202:32)
    at Repository.fetch (/Users/matias/projects/unleash-redis-race/node_modules/unleash-client/src/repository/index.ts:287:23)
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async Promise.all (index 0)
    at Repository.start (/Users/matias/projects/unleash-redis-race/node_modules/unleash-client/src/repository/index.ts:150:5)
    at async Promise.all (index 0)
    at Unleash.start (/Users/matias/projects/unleash-redis-race/node_modules/unleash-client/src/unleash.ts:248:5)
Emitted 'error' event on Repository instance at:
    at Repository.fetch (/Users/matias/projects/unleash-redis-race/node_modules/unleash-client/src/repository/index.ts:299:6)
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    [... lines matching original stack trace ...]
    at Unleash.start (/Users/matias/projects/unleash-redis-race/node_modules/unleash-client/src/unleash.ts:248:5)
```

What I am missing here is how can I create a dockerized environment where the latency can be simulated, will try to spend a bit more on that but I would appreciate any guidance.