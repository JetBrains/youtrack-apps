import fs from 'fs';
import archiver from 'archiver';

export function zipFolder(srcFolder: string, zipFilePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipFilePath);
    const zipArchive = archiver('zip');

    output.on('close', () => {
      resolve();
    });

    zipArchive.on('error', error => {
      reject(error);
    });

    zipArchive.pipe(output);
    zipArchive.glob('**/*.*', {cwd: srcFolder});
    zipArchive.finalize();
  });
}
