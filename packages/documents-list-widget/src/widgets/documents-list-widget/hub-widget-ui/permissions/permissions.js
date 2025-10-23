import RingPermissions from '@jetbrains/ring-ui/components/permissions/permissions';

class Permissions {
  async init(dashboardApi, options = {}) {
    const datasource = query => (
      dashboardApi.fetchHub(
        `api/rest/${RingPermissions.API_PERMISSION_CACHE_PATH}`,
        {
          query: {
            fields: 'permission/key,global,projects(id)',
            query
          }
        }
      )
    );
    const fakeAuth = {addListener: () => undefined};

    this._permissions = new RingPermissions(fakeAuth, {datasource});
    this._permissionCache = await this._permissions.load(options);
  }

  isInitialized() {
    return !!this._permissionCache;
  }

  has(permissionQuery, projectRingId) {
    if (!this.isInitialized()) {
      throw new Error(
        'Permissions have not been loaded yet. Have you already called Permissions::init?'
      );
    }
    return this._permissionCache.has(permissionQuery, projectRingId);
  }
}

export default new Permissions();
