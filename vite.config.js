export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api/replicate": {
        target: "https://api.replicate.com/v1",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/replicate/, ""),
        headers: {
          Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}`,
        },
      },
    },
  },
});