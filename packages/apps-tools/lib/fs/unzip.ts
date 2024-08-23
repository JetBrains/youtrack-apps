import fs from 'fs';
import path from 'path';
import unzipper from 'unzipper';

export async function unzip(zipFilePath: string, outputdir: string): Promise<void> {
  if (!fs.existsSync(zipFilePath)) {
    const error = new Error(`File "${zipFilePath}" not found`);
    throw error;
  }

  const outputPath = outputdir || path.dirname(zipFilePath);
  const directory = await unzipper.Open.file(zipFilePath);
  await directory.extract({path: outputPath});
}
