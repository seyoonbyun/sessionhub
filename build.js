const fs = require('fs');

const config = `const CONFIG = {
  SUPABASE_URL: '${process.env.SUPABASE_URL || ''}',
  SUPABASE_KEY: '${process.env.SUPABASE_KEY || ''}',
  GOOGLE_CALENDAR_ID: '${process.env.GOOGLE_CALENDAR_ID || ''}',
  GOOGLE_API_KEY: '${process.env.GOOGLE_API_KEY || ''}',
  GOOGLE_APPS_SCRIPT_URL: '${process.env.GOOGLE_APPS_SCRIPT_URL || ''}',
};
`;

fs.writeFileSync('config.js', config);
console.log('config.js generated from environment variables');
