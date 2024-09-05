import Ajv, {AnySchemaObject, ErrorObject} from 'ajv';
import addFormats from 'ajv-formats';
import {Config} from '../../@types/types';
import path from 'node:path';
import fs from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {exit} from '../../lib/cli/exit';
import {i18n} from '../../lib/i18n/i18n';
import {tmpDir} from '../../lib/fs/tmpdir';

export const DEFAULT_SCHEMA_URL = 'https://json.schemastore.org/youtrack-app.json';
const tmpSchemaPath = tmpDir('schema.json');

export async function validate(config: Config, appDir?: string) {
  try {
    if (!appDir && !config.manifest) {
      exit(new Error(i18n('No directory or manifest file provided')));
    }

    if (config.manifest && !config.manifest.endsWith('.json')) {
      exit(new Error(i18n('Manifest file must be a JSON file')));
    }

    if (config.schema && !config.schema.endsWith('.json')) {
      exit(new Error(i18n('Schema file must be a JSON file')));
    }

    const ajv = new Ajv({strict: false});
    addFormats(ajv);

    const manifestFilePath = config.manifest ? config.manifest : path.join(appDir!, 'manifest.json');
    const manifest = await parseFile(manifestFilePath);
    let schema: AnySchemaObject;

    if (config.schema) {
      schema = isValidUrl(config.schema)
        ? await fetchSchema(config.schema)
        : await parseFile<AnySchemaObject>(config.schema);
    } else {
      schema = existsSync(tmpSchemaPath)
        ? JSON.parse(await readSchemaFromTmp())
        : await fetchSchemaAndWriteToTmp(DEFAULT_SCHEMA_URL);
    }

    const validateFn = ajv.compile(schema);
    const valid = validateFn(manifest);

    if (!valid) {
      throw new Error(validateFn.errors?.map(prepareError).join('\n'));
    }
    console.log(i18n('Manifest is valid!'));
  } catch (error) {
    exit(error);
  }
}

async function fetchSchema(url: string): Promise<AnySchemaObject> {
  console.log(i18n('Fetching schema...'));
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch schema: ${res.statusText}`);
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

async function fetchSchemaAndWriteToTmp(url: string): Promise<AnySchemaObject> {
  const schema = await fetchSchema(url);
  console.log(i18n('Writing schema to tmp...'));
  await writeSchemaToTmp(schema);
  return schema;
}
