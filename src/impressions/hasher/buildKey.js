export function buildKey(impression) {
  return `${impression.keyName}:${impression.feature}:${impression.treatment}:${impression.label}:${impression.changeNumber}`;
}
