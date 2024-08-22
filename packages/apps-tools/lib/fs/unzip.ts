import fs from 'fs';
import path from 'path';
import unzipper from 'unzipper';

export function unzip(zipFilePath: string, outputdir: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(zipFilePath)) {
      const error = new Error(`File "${zipFilePath}" not found`);
      reject(error);
    }

    const outputPath = outputdir || path.dirname(zipFilePath);

    fs.createReadStream(zipFilePath)
      .pipe(
        unzipper.Extract({
          path: outputPath,
        }),
      )
      .on('error', error => reject(error))
      .on('close', () => resolve());
  });
}
