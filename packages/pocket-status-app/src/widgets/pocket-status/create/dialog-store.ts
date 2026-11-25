import {makeAutoObservable} from 'mobx';

import {StatesSet} from '../../shared/types.ts';

export class DialogStore {
  // Editing works on a copy, so Cancel leaves the loaded set as it was
  constructor(set?: StatesSet) {
    this.newSet = set ? {name: set.name, values: [...set.values]} : {name: '', values: []};
    makeAutoObservable(this);
  }

  newSet: StatesSet;
  addNewValue = false;
}
