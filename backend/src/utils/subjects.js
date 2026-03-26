function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeArraySubject(item) {
  if (!item || typeof item !== 'object') return null;
  const name = String(item.name || item.subject || '').trim();
  if (!name) return null;
  return {
    name,
    question_count: toNumber(item.question_count ?? item.questions, 0),
    positive_marks: toNumber(item.positive_marks, 1),
    negative_marks: toNumber(item.negative_marks, 0),
  };
}

function normalizeObjectSubject(name, value) {
  if (!name) return null;
  const config = (value && typeof value === 'object') ? value : {};
  return {
    name,
    question_count: toNumber(config.question_count ?? config.questions, 0),
    positive_marks: toNumber(config.positive_marks, 1),
    negative_marks: toNumber(config.negative_marks, 0),
  };
}

export function normalizeSubjectsConfig(rawConfig) {
  if (!rawConfig) return [];

  let parsed = rawConfig;
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch (_) {
      return [];
    }
  }

  if (Array.isArray(parsed)) {
    return parsed
      .map(normalizeArraySubject)
      .filter(Boolean);
  }

  if (parsed && typeof parsed === 'object') {
    return Object.entries(parsed)
      .map(([name, value]) => normalizeObjectSubject(String(name).trim(), value))
      .filter(Boolean);
  }

  return [];
}

export function getSubjectsOrder(rawConfig) {
  return normalizeSubjectsConfig(rawConfig).map(s => s.name);
}
