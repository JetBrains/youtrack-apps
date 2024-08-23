import os from 'os';
import path from 'path';

export function tmpDir(filePath: string): string {
  return path.resolve(os.tmpdir(), filePath);
}
