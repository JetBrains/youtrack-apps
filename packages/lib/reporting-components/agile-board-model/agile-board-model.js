function areSprintsEnabled(board) {
  const sprintsSettings = board && board.sprintsSettings;
  return sprintsSettings ? !sprintsSettings.disableSprints : false;
}

function isCurrentSprint(sprint) {
  const now = Date.now();
  return sprint.start < now && sprint.finish > now;
}

function getCurrentSprint(agileBoard) {
  if (areSprintsEnabled(agileBoard)) {
    if (agileBoard.currentSprint) {
      return agileBoard.currentSprint;
    }
    return (agileBoard.sprints || []).filter(isCurrentSprint)[0];
  }
  return (agileBoard.sprints || [])[0];
}

export {
  areSprintsEnabled, isCurrentSprint, getCurrentSprint
};
