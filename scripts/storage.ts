import 'dotenv/config';
import { setupBucket } from '../lib/storage';
setupBucket()
  .then(() =>
    console.log('Image bucket ready. Keep bucket private; images are served by the application.'),
  )
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  });
