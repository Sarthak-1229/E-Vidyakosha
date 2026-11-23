import 'dotenv/config';
import { createApp } from './app.js';

const port = Number(process.env.PORT ?? 4000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be a valid TCP port');
}
const app = createApp();
app.listen(port, () => {
  process.stdout.write(`E-Vidyakosha API scaffold: http://localhost:${port}/api/v1/health\n`);
});
