export function generateImpressions(count) {
  const impressions = [];
  for (let i = 0; i < count; i++) {
    impressions.push({
      keyName: `key_${i}`,
      feature: `feature_${i % 10}`,
      label: (i % 2 === 0) ? 'in segment all' : 'whitelisted',
      changeNumber: i * i,
      time: Date.now()
    });
  }
  return impressions;
}
