import { dataOperations, prOperations } from '../db/db';

const CONTEXT_DAYS = 60;

const sanitizeText = (text) =>
  String(text).replace(/[<>]/g, '').trim();

const formatWorkouts = (rows) => {
  const byDate = {};
  for (const row of rows) {
    const date = sanitizeText(row.date);
    const exercise = sanitizeText(row.exercise_name);
    if (!byDate[date]) byDate[date] = {};
    if (!byDate[date][exercise]) byDate[date][exercise] = [];
    byDate[date][exercise].push(`${sanitizeText(row.weight)}×${sanitizeText(row.reps)}`);
  }
  return Object.entries(byDate)
    .map(([date, exercises]) =>
      `${date}\n` +
      Object.entries(exercises)
        .map(([name, sets]) => `  ${name}: ${sets.join(', ')}`)
        .join('\n')
    ).join('\n');
};

const formatPRs = (prs) =>
  prs.map(pr =>
    `  ${sanitizeText(pr.exercise_name)} — ${sanitizeText(pr.pr_type)}: ${sanitizeText(pr.value)}`
  ).join('\n');

export const buildSystemPrompt = async (db) => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - CONTEXT_DAYS);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  const allData = await dataOperations.getAllWorkoutData(db);
  const recent = allData.filter(r => r.date >= cutoffStr);
  const prs = await prOperations.getAllCurrentPRs(db);

  return `You are a personal fitness coach assistant for a user who tracks their workouts in PRBook.
Use the data below to answer questions, spot trends, and give practical advice.
Do not invent workouts, weights, or dates not shown. If data is insufficient to answer, say so.
Keep responses concise and practical.

RECENT WORKOUTS (last ${CONTEXT_DAYS} days):
${formatWorkouts(recent)}

PERSONAL RECORDS:
${formatPRs(prs)}`;
};
