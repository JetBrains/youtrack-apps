import fs from 'fs';
import archiver from 'archiver';

export function zipFolder(srcFolder: string, zipFilePath: string, callback: (error: Error | null) => void) {
  const output = fs.createWriteStream(zipFilePath);
  const zipArchive = archiver('zip');

  output.on('close', () => {
    callback(null);
  });

  zipArchive.on('error', error => {
    callback(error);
  });

  zipArchive.pipe(output);
  zipArchive.glob('**/*.*', {cwd: srcFolder});
  zipArchive.finalize();
  return zipArchive;
}
