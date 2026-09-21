import { RRule, Frequency } from 'rrule'

export function getRRuleFrequency(freq: string) {
  switch (freq) {
    case 'DAILY': return RRule.DAILY
    case 'WEEKLY': return RRule.WEEKLY
    case 'MONTHLY': return RRule.MONTHLY
    case 'YEARLY': return RRule.YEARLY
    default: return RRule.DAILY
  }
}

export function generateOccurrenceDates(recurrence: any, startRange: Date, endRange: Date): Date[] {
  const options: any = {
    freq: getRRuleFrequency(recurrence.frequency),
    interval: recurrence.interval || 1,
    dtstart: new Date(recurrence.startDate),
  }

  if (recurrence.endDate) {
    options.until = new Date(recurrence.endDate)
  }

  if (recurrence.occurrenceCount) {
    options.count = recurrence.occurrenceCount
  }

  if (recurrence.daysOfWeek) {
    try {
      // Expecting array of [0, 1, 2] corresponding to RRule.MO, RRule.TU, RRule.WE
      const days = JSON.parse(recurrence.daysOfWeek)
      if (Array.isArray(days)) {
        options.byweekday = days
      }
    } catch(e) {}
  }
  
  if (recurrence.dayOfMonth) {
     options.bymonthday = recurrence.dayOfMonth
  }

  if (recurrence.monthOfYear) {
     options.bymonth = recurrence.monthOfYear
  }
  
  if (recurrence.occurrenceIndex !== null && recurrence.occurrenceIndex !== undefined) {
    options.bysetpos = recurrence.occurrenceIndex
  }

  try {
    const rule = new RRule(options)
    return rule.between(startRange, endRange, true) // true = inclusive
  } catch (error) {
    console.error("RRule generation failed:", error)
    return []
  }
}
