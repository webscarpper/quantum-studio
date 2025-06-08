// vite.config.ts
import { cloudflareDevProxyVitePlugin as remixCloudflareDevProxy, vitePlugin as remixVitePlugin } from "file:///D:/Quantum%20Studio%20DONE/quantum-studio/node_modules/.pnpm/@remix-run+dev@2.16.3_@remix-run+react@2.16.3_react-dom@18.3.1_react@18.3.1__react@18.3.1_typ_56tyhioi4fkoibvrjndu6yshyi/node_modules/@remix-run/dev/dist/index.js";
import UnoCSS from "file:///D:/Quantum%20Studio%20DONE/quantum-studio/node_modules/.pnpm/unocss@0.61.9_postcss@8.5.3_rollup@4.38.0_vite@5.4.15_@types+node@22.13.14_sass-embedded@1.86.0_/node_modules/unocss/dist/vite.mjs";
import { defineConfig } from "file:///D:/Quantum%20Studio%20DONE/quantum-studio/node_modules/.pnpm/vite@5.4.15_@types+node@22.13.14_sass-embedded@1.86.0/node_modules/vite/dist/node/index.js";
import { nodePolyfills } from "file:///D:/Quantum%20Studio%20DONE/quantum-studio/node_modules/.pnpm/vite-plugin-node-polyfills@0.22.0_rollup@4.38.0_vite@5.4.15_@types+node@22.13.14_sass-embedded@1.86.0_/node_modules/vite-plugin-node-polyfills/dist/index.js";
import { optimizeCssModules } from "file:///D:/Quantum%20Studio%20DONE/quantum-studio/node_modules/.pnpm/vite-plugin-optimize-css-modules@1.2.0_vite@5.4.15_@types+node@22.13.14_sass-embedded@1.86.0_/node_modules/vite-plugin-optimize-css-modules/dist/index.mjs";
import tsconfigPaths from "file:///D:/Quantum%20Studio%20DONE/quantum-studio/node_modules/.pnpm/vite-tsconfig-paths@4.3.2_typescript@5.8.2_vite@5.4.15_@types+node@22.13.14_sass-embedded@1.86.0_/node_modules/vite-tsconfig-paths/dist/index.mjs";
import * as dotenv from "file:///D:/Quantum%20Studio%20DONE/quantum-studio/node_modules/.pnpm/dotenv@16.4.7/node_modules/dotenv/lib/main.js";
import { execSync } from "child_process";
import { readFileSync } from "fs";
import { join } from "path";
dotenv.config();
var getGitInfo = () => {
  try {
    return {
      commitHash: execSync("git rev-parse --short HEAD").toString().trim(),
      branch: execSync("git rev-parse --abbrev-ref HEAD").toString().trim(),
      commitTime: execSync("git log -1 --format=%cd").toString().trim(),
      author: execSync("git log -1 --format=%an").toString().trim(),
      email: execSync("git log -1 --format=%ae").toString().trim(),
      remoteUrl: execSync("git config --get remote.origin.url").toString().trim(),
      repoName: execSync("git config --get remote.origin.url").toString().trim().replace(/^.*github.com[:/]/, "").replace(/\.git$/, "")
    };
  } catch {
    return {
      commitHash: "no-git-info",
      branch: "unknown",
      commitTime: "unknown",
      author: "unknown",
      email: "unknown",
      remoteUrl: "unknown",
      repoName: "unknown"
    };
  }
};
var getPackageJson = () => {
  try {
    const pkgPath = join(process.cwd(), "package.json");
    const pkg2 = JSON.parse(readFileSync(pkgPath, "utf-8"));
    return {
      name: pkg2.name,
      description: pkg2.description,
      license: pkg2.license,
      dependencies: pkg2.dependencies || {},
      devDependencies: pkg2.devDependencies || {},
      peerDependencies: pkg2.peerDependencies || {},
      optionalDependencies: pkg2.optionalDependencies || {}
    };
  } catch {
    return {
      name: "bolt.diy",
      description: "A DIY LLM interface",
      license: "MIT",
      dependencies: {},
      devDependencies: {},
      peerDependencies: {},
      optionalDependencies: {}
    };
  }
};
var pkg = getPackageJson();
var gitInfo = getGitInfo();
var vite_config_default = defineConfig((config2) => {
  return {
    define: {
      __COMMIT_HASH: JSON.stringify(gitInfo.commitHash),
      __GIT_BRANCH: JSON.stringify(gitInfo.branch),
      __GIT_COMMIT_TIME: JSON.stringify(gitInfo.commitTime),
      __GIT_AUTHOR: JSON.stringify(gitInfo.author),
      __GIT_EMAIL: JSON.stringify(gitInfo.email),
      __GIT_REMOTE_URL: JSON.stringify(gitInfo.remoteUrl),
      __GIT_REPO_NAME: JSON.stringify(gitInfo.repoName),
      __APP_VERSION: JSON.stringify(process.env.npm_package_version),
      __PKG_NAME: JSON.stringify(pkg.name),
      __PKG_DESCRIPTION: JSON.stringify(pkg.description),
      __PKG_LICENSE: JSON.stringify(pkg.license),
      __PKG_DEPENDENCIES: JSON.stringify(pkg.dependencies),
      __PKG_DEV_DEPENDENCIES: JSON.stringify(pkg.devDependencies),
      __PKG_PEER_DEPENDENCIES: JSON.stringify(pkg.peerDependencies),
      __PKG_OPTIONAL_DEPENDENCIES: JSON.stringify(pkg.optionalDependencies),
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV)
    },
    build: {
      target: "esnext"
    },
    plugins: [
      nodePolyfills({
        include: ["buffer", "process", "util", "stream"],
        globals: {
          Buffer: true,
          process: true,
          global: true
        },
        protocolImports: true,
        exclude: ["child_process", "fs", "path"]
      }),
      {
        name: "buffer-polyfill",
        transform(code, id) {
          if (id.includes("env.mjs")) {
            return {
              code: `import { Buffer } from 'buffer';
${code}`,
              map: null
            };
          }
          return null;
        }
      },
      config2.mode !== "test" && remixCloudflareDevProxy(),
      remixVitePlugin({
        future: {
          v3_fetcherPersist: true,
          v3_relativeSplatPath: true,
          v3_throwAbortReason: true,
          v3_lazyRouteDiscovery: true
        }
      }),
      UnoCSS(),
      tsconfigPaths(),
      chrome129IssuePlugin(),
      config2.mode === "production" && optimizeCssModules({ apply: "build" })
    ],
    envPrefix: [
      "VITE_",
      "OPENAI_LIKE_API_BASE_URL",
      "OLLAMA_API_BASE_URL",
      "LMSTUDIO_API_BASE_URL",
      "TOGETHER_API_BASE_URL"
    ],
    css: {
      preprocessorOptions: {
        scss: {
          api: "modern-compiler"
        }
      }
    }
  };
});
function chrome129IssuePlugin() {
  return {
    name: "chrome129IssuePlugin",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const raw = req.headers["user-agent"]?.match(/Chrom(e|ium)\/([0-9]+)\./);
        if (raw) {
          const version = parseInt(raw[2], 10);
          if (version === 129) {
            res.setHeader("content-type", "text/html");
            res.end(
              '<body><h1>Please use Chrome Canary for testing.</h1><p>Chrome 129 has an issue with JavaScript modules & Vite local development, see <a href="https://github.com/stackblitz/bolt.new/issues/86#issuecomment-2395519258">for more information.</a></p><p><b>Note:</b> This only impacts <u>local development</u>. `pnpm run build` and `pnpm run start` will work fine in this browser.</p></body>'
            );
            return;
          }
        }
        next();
      });
    }
  };
}
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxRdWFudHVtIFN0dWRpbyBET05FXFxcXHF1YW50dW0tc3R1ZGlvXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFxRdWFudHVtIFN0dWRpbyBET05FXFxcXHF1YW50dW0tc3R1ZGlvXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi9RdWFudHVtJTIwU3R1ZGlvJTIwRE9ORS9xdWFudHVtLXN0dWRpby92aXRlLmNvbmZpZy50c1wiO2ltcG9ydCB7IGNsb3VkZmxhcmVEZXZQcm94eVZpdGVQbHVnaW4gYXMgcmVtaXhDbG91ZGZsYXJlRGV2UHJveHksIHZpdGVQbHVnaW4gYXMgcmVtaXhWaXRlUGx1Z2luIH0gZnJvbSAnQHJlbWl4LXJ1bi9kZXYnO1xyXG5pbXBvcnQgVW5vQ1NTIGZyb20gJ3Vub2Nzcy92aXRlJztcclxuaW1wb3J0IHsgZGVmaW5lQ29uZmlnLCB0eXBlIFZpdGVEZXZTZXJ2ZXIgfSBmcm9tICd2aXRlJztcclxuaW1wb3J0IHsgbm9kZVBvbHlmaWxscyB9IGZyb20gJ3ZpdGUtcGx1Z2luLW5vZGUtcG9seWZpbGxzJztcclxuaW1wb3J0IHsgb3B0aW1pemVDc3NNb2R1bGVzIH0gZnJvbSAndml0ZS1wbHVnaW4tb3B0aW1pemUtY3NzLW1vZHVsZXMnO1xyXG5pbXBvcnQgdHNjb25maWdQYXRocyBmcm9tICd2aXRlLXRzY29uZmlnLXBhdGhzJztcclxuaW1wb3J0ICogYXMgZG90ZW52IGZyb20gJ2RvdGVudic7XHJcbmltcG9ydCB7IGV4ZWNTeW5jIH0gZnJvbSAnY2hpbGRfcHJvY2Vzcyc7XHJcbmltcG9ydCB7IHJlYWRGaWxlU3luYyB9IGZyb20gJ2ZzJztcclxuaW1wb3J0IHsgam9pbiB9IGZyb20gJ3BhdGgnO1xyXG5cclxuZG90ZW52LmNvbmZpZygpO1xyXG5cclxuLy8gR2V0IGRldGFpbGVkIGdpdCBpbmZvIHdpdGggZmFsbGJhY2tzXHJcbmNvbnN0IGdldEdpdEluZm8gPSAoKSA9PiB7XHJcbiAgdHJ5IHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIGNvbW1pdEhhc2g6IGV4ZWNTeW5jKCdnaXQgcmV2LXBhcnNlIC0tc2hvcnQgSEVBRCcpLnRvU3RyaW5nKCkudHJpbSgpLFxyXG4gICAgICBicmFuY2g6IGV4ZWNTeW5jKCdnaXQgcmV2LXBhcnNlIC0tYWJicmV2LXJlZiBIRUFEJykudG9TdHJpbmcoKS50cmltKCksXHJcbiAgICAgIGNvbW1pdFRpbWU6IGV4ZWNTeW5jKCdnaXQgbG9nIC0xIC0tZm9ybWF0PSVjZCcpLnRvU3RyaW5nKCkudHJpbSgpLFxyXG4gICAgICBhdXRob3I6IGV4ZWNTeW5jKCdnaXQgbG9nIC0xIC0tZm9ybWF0PSVhbicpLnRvU3RyaW5nKCkudHJpbSgpLFxyXG4gICAgICBlbWFpbDogZXhlY1N5bmMoJ2dpdCBsb2cgLTEgLS1mb3JtYXQ9JWFlJykudG9TdHJpbmcoKS50cmltKCksXHJcbiAgICAgIHJlbW90ZVVybDogZXhlY1N5bmMoJ2dpdCBjb25maWcgLS1nZXQgcmVtb3RlLm9yaWdpbi51cmwnKS50b1N0cmluZygpLnRyaW0oKSxcclxuICAgICAgcmVwb05hbWU6IGV4ZWNTeW5jKCdnaXQgY29uZmlnIC0tZ2V0IHJlbW90ZS5vcmlnaW4udXJsJylcclxuICAgICAgICAudG9TdHJpbmcoKVxyXG4gICAgICAgIC50cmltKClcclxuICAgICAgICAucmVwbGFjZSgvXi4qZ2l0aHViLmNvbVs6L10vLCAnJylcclxuICAgICAgICAucmVwbGFjZSgvXFwuZ2l0JC8sICcnKSxcclxuICAgIH07XHJcbiAgfSBjYXRjaCB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBjb21taXRIYXNoOiAnbm8tZ2l0LWluZm8nLFxyXG4gICAgICBicmFuY2g6ICd1bmtub3duJyxcclxuICAgICAgY29tbWl0VGltZTogJ3Vua25vd24nLFxyXG4gICAgICBhdXRob3I6ICd1bmtub3duJyxcclxuICAgICAgZW1haWw6ICd1bmtub3duJyxcclxuICAgICAgcmVtb3RlVXJsOiAndW5rbm93bicsXHJcbiAgICAgIHJlcG9OYW1lOiAndW5rbm93bicsXHJcbiAgICB9O1xyXG4gIH1cclxufTtcclxuXHJcbi8vIFJlYWQgcGFja2FnZS5qc29uIHdpdGggZGV0YWlsZWQgZGVwZW5kZW5jeSBpbmZvXHJcbmNvbnN0IGdldFBhY2thZ2VKc29uID0gKCkgPT4ge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBwa2dQYXRoID0gam9pbihwcm9jZXNzLmN3ZCgpLCAncGFja2FnZS5qc29uJyk7XHJcbiAgICBjb25zdCBwa2cgPSBKU09OLnBhcnNlKHJlYWRGaWxlU3luYyhwa2dQYXRoLCAndXRmLTgnKSk7XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgbmFtZTogcGtnLm5hbWUsXHJcbiAgICAgIGRlc2NyaXB0aW9uOiBwa2cuZGVzY3JpcHRpb24sXHJcbiAgICAgIGxpY2Vuc2U6IHBrZy5saWNlbnNlLFxyXG4gICAgICBkZXBlbmRlbmNpZXM6IHBrZy5kZXBlbmRlbmNpZXMgfHwge30sXHJcbiAgICAgIGRldkRlcGVuZGVuY2llczogcGtnLmRldkRlcGVuZGVuY2llcyB8fCB7fSxcclxuICAgICAgcGVlckRlcGVuZGVuY2llczogcGtnLnBlZXJEZXBlbmRlbmNpZXMgfHwge30sXHJcbiAgICAgIG9wdGlvbmFsRGVwZW5kZW5jaWVzOiBwa2cub3B0aW9uYWxEZXBlbmRlbmNpZXMgfHwge30sXHJcbiAgICB9O1xyXG4gIH0gY2F0Y2gge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgbmFtZTogJ2JvbHQuZGl5JyxcclxuICAgICAgZGVzY3JpcHRpb246ICdBIERJWSBMTE0gaW50ZXJmYWNlJyxcclxuICAgICAgbGljZW5zZTogJ01JVCcsXHJcbiAgICAgIGRlcGVuZGVuY2llczoge30sXHJcbiAgICAgIGRldkRlcGVuZGVuY2llczoge30sXHJcbiAgICAgIHBlZXJEZXBlbmRlbmNpZXM6IHt9LFxyXG4gICAgICBvcHRpb25hbERlcGVuZGVuY2llczoge30sXHJcbiAgICB9O1xyXG4gIH1cclxufTtcclxuXHJcbmNvbnN0IHBrZyA9IGdldFBhY2thZ2VKc29uKCk7XHJcbmNvbnN0IGdpdEluZm8gPSBnZXRHaXRJbmZvKCk7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKGNvbmZpZykgPT4ge1xyXG4gIHJldHVybiB7XHJcbiAgICBkZWZpbmU6IHtcclxuICAgICAgX19DT01NSVRfSEFTSDogSlNPTi5zdHJpbmdpZnkoZ2l0SW5mby5jb21taXRIYXNoKSxcclxuICAgICAgX19HSVRfQlJBTkNIOiBKU09OLnN0cmluZ2lmeShnaXRJbmZvLmJyYW5jaCksXHJcbiAgICAgIF9fR0lUX0NPTU1JVF9USU1FOiBKU09OLnN0cmluZ2lmeShnaXRJbmZvLmNvbW1pdFRpbWUpLFxyXG4gICAgICBfX0dJVF9BVVRIT1I6IEpTT04uc3RyaW5naWZ5KGdpdEluZm8uYXV0aG9yKSxcclxuICAgICAgX19HSVRfRU1BSUw6IEpTT04uc3RyaW5naWZ5KGdpdEluZm8uZW1haWwpLFxyXG4gICAgICBfX0dJVF9SRU1PVEVfVVJMOiBKU09OLnN0cmluZ2lmeShnaXRJbmZvLnJlbW90ZVVybCksXHJcbiAgICAgIF9fR0lUX1JFUE9fTkFNRTogSlNPTi5zdHJpbmdpZnkoZ2l0SW5mby5yZXBvTmFtZSksXHJcbiAgICAgIF9fQVBQX1ZFUlNJT046IEpTT04uc3RyaW5naWZ5KHByb2Nlc3MuZW52Lm5wbV9wYWNrYWdlX3ZlcnNpb24pLFxyXG4gICAgICBfX1BLR19OQU1FOiBKU09OLnN0cmluZ2lmeShwa2cubmFtZSksXHJcbiAgICAgIF9fUEtHX0RFU0NSSVBUSU9OOiBKU09OLnN0cmluZ2lmeShwa2cuZGVzY3JpcHRpb24pLFxyXG4gICAgICBfX1BLR19MSUNFTlNFOiBKU09OLnN0cmluZ2lmeShwa2cubGljZW5zZSksXHJcbiAgICAgIF9fUEtHX0RFUEVOREVOQ0lFUzogSlNPTi5zdHJpbmdpZnkocGtnLmRlcGVuZGVuY2llcyksXHJcbiAgICAgIF9fUEtHX0RFVl9ERVBFTkRFTkNJRVM6IEpTT04uc3RyaW5naWZ5KHBrZy5kZXZEZXBlbmRlbmNpZXMpLFxyXG4gICAgICBfX1BLR19QRUVSX0RFUEVOREVOQ0lFUzogSlNPTi5zdHJpbmdpZnkocGtnLnBlZXJEZXBlbmRlbmNpZXMpLFxyXG4gICAgICBfX1BLR19PUFRJT05BTF9ERVBFTkRFTkNJRVM6IEpTT04uc3RyaW5naWZ5KHBrZy5vcHRpb25hbERlcGVuZGVuY2llcyksXHJcbiAgICAgICdwcm9jZXNzLmVudi5OT0RFX0VOVic6IEpTT04uc3RyaW5naWZ5KHByb2Nlc3MuZW52Lk5PREVfRU5WKSxcclxuICAgIH0sXHJcbiAgICBidWlsZDoge1xyXG4gICAgICB0YXJnZXQ6ICdlc25leHQnLFxyXG4gICAgfSxcclxuICAgIHBsdWdpbnM6IFtcclxuICAgICAgbm9kZVBvbHlmaWxscyh7XHJcbiAgICAgICAgaW5jbHVkZTogWydidWZmZXInLCAncHJvY2VzcycsICd1dGlsJywgJ3N0cmVhbSddLFxyXG4gICAgICAgIGdsb2JhbHM6IHtcclxuICAgICAgICAgIEJ1ZmZlcjogdHJ1ZSxcclxuICAgICAgICAgIHByb2Nlc3M6IHRydWUsXHJcbiAgICAgICAgICBnbG9iYWw6IHRydWUsXHJcbiAgICAgICAgfSxcclxuICAgICAgICBwcm90b2NvbEltcG9ydHM6IHRydWUsXHJcbiAgICAgICAgZXhjbHVkZTogWydjaGlsZF9wcm9jZXNzJywgJ2ZzJywgJ3BhdGgnXSxcclxuICAgICAgfSksXHJcbiAgICAgIHtcclxuICAgICAgICBuYW1lOiAnYnVmZmVyLXBvbHlmaWxsJyxcclxuICAgICAgICB0cmFuc2Zvcm0oY29kZSwgaWQpIHtcclxuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnZW52Lm1qcycpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgY29kZTogYGltcG9ydCB7IEJ1ZmZlciB9IGZyb20gJ2J1ZmZlcic7XFxuJHtjb2RlfWAsXHJcbiAgICAgICAgICAgICAgbWFwOiBudWxsLFxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIGNvbmZpZy5tb2RlICE9PSAndGVzdCcgJiYgcmVtaXhDbG91ZGZsYXJlRGV2UHJveHkoKSxcclxuICAgICAgcmVtaXhWaXRlUGx1Z2luKHtcclxuICAgICAgICBmdXR1cmU6IHtcclxuICAgICAgICAgIHYzX2ZldGNoZXJQZXJzaXN0OiB0cnVlLFxyXG4gICAgICAgICAgdjNfcmVsYXRpdmVTcGxhdFBhdGg6IHRydWUsXHJcbiAgICAgICAgICB2M190aHJvd0Fib3J0UmVhc29uOiB0cnVlLFxyXG4gICAgICAgICAgdjNfbGF6eVJvdXRlRGlzY292ZXJ5OiB0cnVlLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0pLFxyXG4gICAgICBVbm9DU1MoKSxcclxuICAgICAgdHNjb25maWdQYXRocygpLFxyXG4gICAgICBjaHJvbWUxMjlJc3N1ZVBsdWdpbigpLFxyXG4gICAgICBjb25maWcubW9kZSA9PT0gJ3Byb2R1Y3Rpb24nICYmIG9wdGltaXplQ3NzTW9kdWxlcyh7IGFwcGx5OiAnYnVpbGQnIH0pLFxyXG4gICAgXSxcclxuICAgIGVudlByZWZpeDogW1xyXG4gICAgICAnVklURV8nLFxyXG4gICAgICAnT1BFTkFJX0xJS0VfQVBJX0JBU0VfVVJMJyxcclxuICAgICAgJ09MTEFNQV9BUElfQkFTRV9VUkwnLFxyXG4gICAgICAnTE1TVFVESU9fQVBJX0JBU0VfVVJMJyxcclxuICAgICAgJ1RPR0VUSEVSX0FQSV9CQVNFX1VSTCcsXHJcbiAgICBdLFxyXG4gICAgY3NzOiB7XHJcbiAgICAgIHByZXByb2Nlc3Nvck9wdGlvbnM6IHtcclxuICAgICAgICBzY3NzOiB7XHJcbiAgICAgICAgICBhcGk6ICdtb2Rlcm4tY29tcGlsZXInLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gIH07XHJcbn0pO1xyXG5cclxuZnVuY3Rpb24gY2hyb21lMTI5SXNzdWVQbHVnaW4oKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIG5hbWU6ICdjaHJvbWUxMjlJc3N1ZVBsdWdpbicsXHJcbiAgICBjb25maWd1cmVTZXJ2ZXIoc2VydmVyOiBWaXRlRGV2U2VydmVyKSB7XHJcbiAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoKHJlcSwgcmVzLCBuZXh0KSA9PiB7XHJcbiAgICAgICAgY29uc3QgcmF3ID0gcmVxLmhlYWRlcnNbJ3VzZXItYWdlbnQnXT8ubWF0Y2goL0Nocm9tKGV8aXVtKVxcLyhbMC05XSspXFwuLyk7XHJcblxyXG4gICAgICAgIGlmIChyYXcpIHtcclxuICAgICAgICAgIGNvbnN0IHZlcnNpb24gPSBwYXJzZUludChyYXdbMl0sIDEwKTtcclxuXHJcbiAgICAgICAgICBpZiAodmVyc2lvbiA9PT0gMTI5KSB7XHJcbiAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ2NvbnRlbnQtdHlwZScsICd0ZXh0L2h0bWwnKTtcclxuICAgICAgICAgICAgcmVzLmVuZChcclxuICAgICAgICAgICAgICAnPGJvZHk+PGgxPlBsZWFzZSB1c2UgQ2hyb21lIENhbmFyeSBmb3IgdGVzdGluZy48L2gxPjxwPkNocm9tZSAxMjkgaGFzIGFuIGlzc3VlIHdpdGggSmF2YVNjcmlwdCBtb2R1bGVzICYgVml0ZSBsb2NhbCBkZXZlbG9wbWVudCwgc2VlIDxhIGhyZWY9XCJodHRwczovL2dpdGh1Yi5jb20vc3RhY2tibGl0ei9ib2x0Lm5ldy9pc3N1ZXMvODYjaXNzdWVjb21tZW50LTIzOTU1MTkyNThcIj5mb3IgbW9yZSBpbmZvcm1hdGlvbi48L2E+PC9wPjxwPjxiPk5vdGU6PC9iPiBUaGlzIG9ubHkgaW1wYWN0cyA8dT5sb2NhbCBkZXZlbG9wbWVudDwvdT4uIGBwbnBtIHJ1biBidWlsZGAgYW5kIGBwbnBtIHJ1biBzdGFydGAgd2lsbCB3b3JrIGZpbmUgaW4gdGhpcyBicm93c2VyLjwvcD48L2JvZHk+JyxcclxuICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG5leHQoKTtcclxuICAgICAgfSk7XHJcbiAgICB9LFxyXG4gIH07XHJcbn0iXSwKICAibWFwcGluZ3MiOiAiO0FBQTJTLFNBQVMsZ0NBQWdDLHlCQUF5QixjQUFjLHVCQUF1QjtBQUNsWixPQUFPLFlBQVk7QUFDbkIsU0FBUyxvQkFBd0M7QUFDakQsU0FBUyxxQkFBcUI7QUFDOUIsU0FBUywwQkFBMEI7QUFDbkMsT0FBTyxtQkFBbUI7QUFDMUIsWUFBWSxZQUFZO0FBQ3hCLFNBQVMsZ0JBQWdCO0FBQ3pCLFNBQVMsb0JBQW9CO0FBQzdCLFNBQVMsWUFBWTtBQUVkLGNBQU87QUFHZCxJQUFNLGFBQWEsTUFBTTtBQUN2QixNQUFJO0FBQ0YsV0FBTztBQUFBLE1BQ0wsWUFBWSxTQUFTLDRCQUE0QixFQUFFLFNBQVMsRUFBRSxLQUFLO0FBQUEsTUFDbkUsUUFBUSxTQUFTLGlDQUFpQyxFQUFFLFNBQVMsRUFBRSxLQUFLO0FBQUEsTUFDcEUsWUFBWSxTQUFTLHlCQUF5QixFQUFFLFNBQVMsRUFBRSxLQUFLO0FBQUEsTUFDaEUsUUFBUSxTQUFTLHlCQUF5QixFQUFFLFNBQVMsRUFBRSxLQUFLO0FBQUEsTUFDNUQsT0FBTyxTQUFTLHlCQUF5QixFQUFFLFNBQVMsRUFBRSxLQUFLO0FBQUEsTUFDM0QsV0FBVyxTQUFTLG9DQUFvQyxFQUFFLFNBQVMsRUFBRSxLQUFLO0FBQUEsTUFDMUUsVUFBVSxTQUFTLG9DQUFvQyxFQUNwRCxTQUFTLEVBQ1QsS0FBSyxFQUNMLFFBQVEscUJBQXFCLEVBQUUsRUFDL0IsUUFBUSxVQUFVLEVBQUU7QUFBQSxJQUN6QjtBQUFBLEVB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
