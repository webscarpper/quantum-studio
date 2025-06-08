import type { AppLoadContext, EntryContext } from '@remix-run/cloudflare';
import { RemixServer } from '@remix-run/react';
import { isbot } from 'isbot';
import ReactDOMServer from 'react-dom/server';
import { PassThrough } from 'stream';
import { Head } from './root';
// import { themeStore } from '~/lib/stores/theme'; // No longer needed
import { renderHeadToString } from 'remix-island';

const ABORT_DELAY = 5000;

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
  _loadContext: AppLoadContext,
) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = ReactDOMServer.renderToPipeableStream(
      <RemixServer context={remixContext} url={request.url} />,
      {
        onShellReady() {
          shellRendered = true;
          const nodeStream = new PassThrough();
          const webStream = new ReadableStream<Uint8Array>({ // Specify Uint8Array for clarity
            start(controller) {
              nodeStream.on('data', (chunk: Buffer) => { // or any
                controller.enqueue(chunk);
              });
              nodeStream.on('end', () => {
                controller.close();
              });
              nodeStream.on('error', (err: Error) => {
                controller.error(err);
              });
            },
            cancel() {
              nodeStream.destroy();
            }
          });

          const head = renderHeadToString({ request, remixContext, Head });
          const prefix = `<!DOCTYPE html><html lang="en" data-theme="quantum-dark"><head>${head}</head><body><div id="root" class="w-full h-full">`; // Set fixed theme
          const suffix = `</div></body></html>`;

          responseHeaders.set('Content-Type', 'text/html');
          responseHeaders.set('Transfer-Encoding', 'chunked'); // Important for streaming
          responseHeaders.set('Cross-Origin-Embedder-Policy', 'require-corp');
          responseHeaders.set('Cross-Origin-Opener-Policy', 'same-origin');
          
          // Chain the streams: prefix -> react-render-stream -> suffix
          const fullResponseStream = new ReadableStream({
            async start(controller) {
              controller.enqueue(new TextEncoder().encode(prefix));
              
              // Pipe React's output through our webStream adapter
              const reader = webStream.getReader();
              try {
                while (true) {
                  const { done, value }: { done: boolean; value?: Uint8Array } = await reader.read();
                  if (done) break;
                  if (value) {
                    controller.enqueue(value);
                  }
                }
                controller.enqueue(new TextEncoder().encode(suffix));
                controller.close();
              } catch (error: any) { // or unknown
                console.error("Error in fullResponseStream reader:", error);
                controller.error(error);
              }
            }
          });
          
          resolve(
            new Response(fullResponseStream, {
              headers: responseHeaders,
              status: responseStatusCode,
            }),
          );
          pipe(nodeStream);
        },
        onShellError(err: unknown) {
          reject(err);
        },
        onError(error: unknown) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        },
      },
    );

    setTimeout(() => {
      if (!shellRendered) {
        abort();
      }
    }, ABORT_DELAY);
  });
}
