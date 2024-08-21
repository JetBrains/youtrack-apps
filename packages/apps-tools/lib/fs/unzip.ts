import fs from 'fs';
import path from 'path';
import unzipper from 'unzipper';

export function unzip(zipFilePath: string, outputdir: string, fn: (error: Error | null) => void): void {
  if (!fs.existsSync(zipFilePath)) {
    const error = new Error(`File "${zipFilePath}" not found`);
    if (fn) return fn(error);
    throw error;
  }

  const outputPath = outputdir || path.dirname(zipFilePath);

  fs.createReadStream(zipFilePath)
    .pipe(
      unzipper.Extract({
        path: outputPath,
      }),
    )
    .on('error', error => fn && fn(error))
    .on('close', function () {
      fn && fn(null);
    });
}
