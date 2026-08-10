import {Config} from '../../../@types/types.js';
import {exit} from '../../../lib/cli/exit.js';
import {createAppManagementOperations} from '../management/app-management-operations.js';
import {formatProjectLabel, printJson} from '../management/types.js';
import {paginationFromConfig} from '../pagination.js';
import {printList, printStructured} from './output.js';

export async function projectList(config: Config): Promise<void> {
  try {
    const pagination = paginationFromConfig(config);
    const result = await createAppManagementOperations(config).listProjects(pagination);

    printList({
      config,
      result,
      pagination,
      resourceName: 'projects',
      emptyMessage: 'No projects found',
      formatItem: formatProject,
    });
  } catch (error) {
    exit(error);
  }
}

export async function projectInfo(config: Config, projectKey?: string): Promise<void> {
  try {
    const project = await createAppManagementOperations(config).getProjectInfo(projectKey, paginationFromConfig(config));

    if (printStructured(config, project)) {
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
    const result = await createAppManagementOperations(config).getProjectFields(projectKey, paginationFromConfig(config));

    if (printStructured(config, result)) {
      return;
    }

    printJson(result);
  } catch (error) {
    exit(error);
  }
}

function formatProject(project: {id?: string; shortName?: string; name?: string}): string {
  const label = formatProjectLabel(project);
  return project.id && project.id !== label ? `${label} (${project.id})` : label;
}
