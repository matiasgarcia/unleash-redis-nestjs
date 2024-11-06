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
