import PermissionCache from '@jetbrains/ring-ui/components/permissions/permissions__cache';
import {useState, useEffect} from 'react';

import fetcher from '../fetcher/fetcher';


const PERMISSION_FIELDS = 'permission,key,global,projects(id)';
let permissionCache = null;

class Permissions {
  load = async () => {
    if (!permissionCache) {
      const permissions = await fetcher().fetchHub(
        `api/rest/permissions/cache?fields=${PERMISSION_FIELDS}`
      );
      permissionCache = new PermissionCache(permissions);
    }

    return permissionCache;
  }
}

const permissions = new Permissions();

function usePermissions(permissionExpression, projectId = undefined) {
  const [hasPermission, setHasPermission] = useState(
    permissionCheckResult(permissionExpression, projectId)
  );

  useEffect(() => {
    let isSubscribed = true;

    (async function checkPermission() {
      await permissions.load();

      if (isSubscribed) {
        setHasPermission(
          permissionCheckResult(permissionExpression, projectId)
        );
      }
    }());

    return () => {
      isSubscribed = false;
    };
  }, []);

  return [hasPermission];

  function permissionCheckResult(expression, id) {
    return permissionCache
      ? permissionCache.has(expression, id)
      : false;
  }
}

export default permissions;

export {
  usePermissions
};
