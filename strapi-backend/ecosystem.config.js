module.exports = {
  apps: [
    {
      name: 'strapi',
      cwd: __dirname,
      script: 'npm',
      args: 'run start',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
