import dotenv from 'dotenv';
import { createApp } from './app.js';

dotenv.config();

const port = process.env.PORT || 8080;
const app = createApp();

app.listen(port, () => {
  console.log(`TaxSathi backend running on :${port}`);
});
