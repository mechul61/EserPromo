module.exports = {
  apps: [
    {
      name: "eserpromo-sync",
      cwd: "/www/wwwroot/eserpromo/web",
      script: "npm",
      args: "run sync:scheduler",
      cron_restart: "*/10 * * * *",
      autorestart: false,
      watch: false,
    },
  ],
};
