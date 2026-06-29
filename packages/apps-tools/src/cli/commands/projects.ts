import {Config} from '../../../@types/types.js';
import {exit} from '../../../lib/cli/exit.js';
import {i18n} from '../../../lib/i18n/i18n.js';
import {createAppManagementOperations} from '../management/app-management-operations.js';
import {formatBoolean, formatProjectLabel, printJson, printYaml, ProjectCustomField} from '../management/types.js';
import {paginationFromConfig, printPaginationNotice} from '../pagination.js';

export async function projectList(config: Config): Promise<void> {
  try {
    const pagination = paginationFromConfig(config);
    const result = await createAppManagementOperations(config).listProjects(pagination);

    if (config.json) {
      printJson(result);
      return;
    }

    if (config.yaml) {
      printYaml(result);
      return;
    }

    if (!result.items.length) {
      console.log(i18n('No projects found'));
      return;
    }

    for (const project of result.items) {
      console.log(formatProject(project));
    }
    printPaginationNotice('projects', result, pagination);
  } catch (error) {
    exit(error);
  }
}

export async function projectInfo(config: Config, projectKey?: string): Promise<void> {
  try {
    const project = await createAppManagementOperations(config).getProjectInfo(projectKey);

    if (config.yaml) {
      printYaml(project);
      return;
    }

    console.log(`Name: ${project.name ?? 'unknown'}`);
    console.log(`Short name: ${project.shortName ?? 'unknown'}`);
    console.log(`ID: ${project.id}`);
  } catch (error) {
    exit(error);
  }
}

export async function projectFields(config: Config, projectKey?: string): Promise<void> {
  try {
    const result = await createAppManagementOperations(config).getProjectFields(projectKey);

    if (config.yaml) {
      printYaml(result);
      return;
    }

    if (!result.fields.length) {
      console.log(i18n(`No custom fields found for project "${formatProjectLabel(result.project)}"`));
      return;
    }

    for (const field of result.fields) {
      console.log(formatCustomField(field));
    }
  } catch (error) {
    exit(error);
  }
}

function formatProject(project: {id?: string; shortName?: string; name?: string}): string {
  const label = formatProjectLabel(project);
  return project.id && project.id !== label ? `${label} (${project.id})` : label;
}

function formatCustomField(projectField: ProjectCustomField): string {
  const field = projectField.field ?? {};
  const fieldType = field.fieldType ?? {};
  const name = field.name ?? 'unknown';
  const id = field.id ?? projectField.id;
  const type = fieldType.valueType ?? 'unknown';
  return [
    `${name} (${id}): type=${type}`,
    `bundle=${formatBoolean(fieldType.isBundleType)}`,
    `multi=${formatBoolean(fieldType.isMultiValue)}`,
    `required=${formatRequired(projectField.canBeEmpty)}`,
  ].join(', ');
}

function formatRequired(canBeEmpty: boolean | undefined): string {
  if (canBeEmpty === undefined) {
    return 'unknown';
  }

  return canBeEmpty ? 'no' : 'yes';
}
