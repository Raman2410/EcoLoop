/**
 * Service to manage collector gamification badges
 */

export const checkAndAssignBadges = (collector) => {
  if (!collector) return false;

  // Ensure badges array exists
  if (!Array.isArray(collector.badges)) {
    collector.badges = [];
  }

  const currentTotal = collector.totalPickups || 0;
  const currentToday = collector.todayPickups || 0;
  const bestDayRecord = collector.bestDayRecord || 0;

  let badgesAdded = false;

  const addBadge = (badgeName) => {
    if (!collector.badges.includes(badgeName)) {
      collector.badges.push(badgeName);
      badgesAdded = true;
    }
  };

  // 1. "First Pickup"
  if (currentTotal === 1) {
    addBadge("First Pickup");
  }

  // 2. "5 Pickups Completed"
  if (currentTotal === 5) {
    addBadge("5 Pickups Completed");
  }

  // 3. "Daily Hero"
  if (currentToday >= 20) {
    addBadge("Daily Hero");
  }

  // 4. "Record Breaker" 
  // (Assuming checkAndAssignBadges is called BEFORE controller updates bestDayRecord properly)
  if (currentToday > bestDayRecord && bestDayRecord > 0) {
    addBadge("Record Breaker");
  }

  return badgesAdded;
};
