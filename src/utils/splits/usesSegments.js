/**
 * Given a list of conditions, it returns a boolean flagging if those conditions 
 * use segments matchers (rules & whitelists)
 */
function usesSegments(conditions = []) {
  for (let i = 0; i < conditions.length; i++) {
    const matchers = conditions[i].matcherGroup.matchers;

    for (let j = 0; j < matchers.length; j++) {
      if (matchers[j].matcherType === 'IN_SEGMENT') return true;
    }
  }

  return false;
}

export default usesSegments;