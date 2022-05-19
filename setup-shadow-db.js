const { PrismaClient } = require("@prisma/client");

const client = new PrismaClient({
  datasources: {
    db: {
      url: process.env.SHADOW_DATABASE_URL,
    },
  },
});

const waitingMessages = {
  2: `You love Remix.Run ? Check the doc
  
💿 https://remix.run/docs
  `,
  4: `Still love Remix.Run ? Join the Discord
  
💿 https://discord.com/invite/remix
  `,
  6: `I love Supabase, and you ? 
  
🔨 https://supabase.com/docs
  `,
  8: `You love it ? Join the Discord 
  
🔨 https://discord.supabase.com/
  `,
};

const MAX_ATTEMPTS = 15; // 30 seconds, increase if your computer is slow 😅
let attempt = 1;

console.log(
  "\x1b[35m%s\x1b[0m",
  `☕️ Take a coffee break... I'm running docker-compose to setup supabase-shadow-db

This step is required to use prisma migrate

👉 https://www.prisma.io/docs/concepts/components/prisma-migrate/shadow-database

`
);

const wait = setInterval(() => {
  if (attempt > MAX_ATTEMPTS) {
    clearInterval(wait);
    console.error(
      "\x1b[31m%s\x1b[0m",
      "👾 supabase-shadow-db takes too many time to setup.\nPlease retry or open an issue."
    );
    return;
  }

  client
    .$connect()
    .then(() => {
      clearInterval(wait);
      console.log("\x1b[32m%s\x1b[0m", "🥳 supabase-shadow-db is ready");
    })
    .catch(() => {
      console.log(
        "\x1b[33m%s\x1b[0m",
        "⏱ Waiting for supabase-shadow-db to finish setup ..."
      );

      const waitingMessage = waitingMessages[attempt];

      if (waitingMessage) {
        console.log(
          "\x1b[34m%s\x1b[0m",
          `
        
${waitingMessage}
        
        `
        );
      }
    });

  attempt++;
}, 2_000);
