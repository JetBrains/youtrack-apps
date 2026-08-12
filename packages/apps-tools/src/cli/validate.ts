import Ajv, {AnySchemaObject, ErrorObject} from 'ajv';
import addFormats from 'ajv-formats';
import {Config} from '../../@types/types.js';
import path from 'node:path';
import fs from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {exit, ExitCode} from '../../lib/cli/exit.js';
import {tmpDir} from '../../lib/fs/tmpdir.js';
import {printStructured} from './commands/output.js';

export const DEFAULT_SCHEMA_URL = 'https://json.schemastore.org/youtrack-app.json';
const tmpSchemaPath = tmpDir('schema.json');

export async function validate(config: Config, appDir?: string) {
  try {
    if (!appDir && !config.manifest) {
      return exit(new Error('Provide an app directory or a manifest file'), ExitCode.Usage);
    }

    if (config.manifest && !config.manifest.endsWith('.json')) {
      return exit(new Error('The manifest file must use the .json extension'), ExitCode.Usage);
    }

    if (config.schema && !config.schema.endsWith('.json')) {
      return exit(new Error('The schema file must use the .json extension'), ExitCode.Usage);
    }

    const ajv = new Ajv({strict: false});
    addFormats(ajv);

    const manifestFilePath = config.manifest ? config.manifest : path.join(appDir!, 'manifest.json');
    const manifest = await parseFile(manifestFilePath);
    let schema: AnySchemaObject;

    if (config.schema) {
      schema = isValidUrl(config.schema)
        ? await fetchSchema(config.schema, !config.json && !config.yaml)
        : await parseFile<AnySchemaObject>(config.schema);
    } else {
      schema = existsSync(tmpSchemaPath)
        ? JSON.parse(await readSchemaFromTmp())
        : await fetchSchemaAndWriteToTmp(DEFAULT_SCHEMA_URL, !config.json && !config.yaml);
    }

    warnIfStaleDefaults(manifest as Record<string, unknown>);

    const validateFn = ajv.compile(schema);
    const valid = validateFn(manifest);

    if (!valid) {
      const errors = validateFn.errors?.map(prepareError) ?? ['Manifest is invalid'];
      printStructured(config, {valid: false, errors});
      exit(new Error(errors.join('\n')), ExitCode.Usage);
      return;
    }
    if (!printStructured(config, {valid: true})) {
      console.log('Manifest validation passed');
    }
  } catch (error) {
    exit(error);
  }
}

function warnIfStaleDefaults(manifest: Record<string, unknown>): void {
  const vendor = manifest.vendor as Record<string, string> | undefined;
  const stale: string[] = [];

  if (vendor?.name === 'VendorName') stale.push('vendor.name still uses "VendorName"');
  if (vendor?.url === 'https://vendor.com') stale.push('vendor.url still uses "https://vendor.com"');
  if (typeof manifest.description === 'string' &&
      /^A YouTrack app created with (TypeScript|JavaScript)$/.test(manifest.description)) {
    stale.push('description still uses the generated default text');
  }

  for (const msg of stale) {
    console.warn(`Warning: ${msg}. Update manifest.json before publishing.`);
  }
}

async function fetchSchema(url: string, showProgress: boolean): Promise<AnySchemaObject> {
  if (showProgress) {
    console.log('Fetching the schema...');
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not fetch the schema: ${res.statusText}`);
  return (await res.json()) as AnySchemaObject;
}

async function parseFile<T>(filePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(filePath, {encoding: 'utf8'}));
}

function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_) {
    return false;
  }
}

function prepareError(error: ErrorObject): string {
  const ADDITIONAL_PROPERTIES_KEYWORD = 'additionalProperties';
  const additionalParams =
    error.keyword === ADDITIONAL_PROPERTIES_KEYWORD ? ` ${JSON.stringify(error.params.additionalProperty)}` : '';
  return `"${preparePath(error.instancePath) || 'manifest root'}" ${error.message}${additionalParams}`;
}

function preparePath(instancePath: string): string {
  return instancePath.replace(/^\//, '').replace(/\//g, '.');
}

async function writeSchemaToTmp(schema: AnySchemaObject): Promise<void> {
  await fs.writeFile(tmpSchemaPath, JSON.stringify(schema));
}

async function readSchemaFromTmp(): Promise<string> {
  return await fs.readFile(tmpSchemaPath, {encoding: 'utf8'});
}

async function fetchSchemaAndWriteToTmp(url: string, showProgress: boolean): Promise<AnySchemaObject> {
  const schema = await fetchSchema(url, showProgress);
  if (showProgress) {
    console.log('Caching the schema in the tmp directory...');
  }
  await writeSchemaToTmp(schema);
  return schema;
}
