/**
 * Tools count for SEO copy and UI. Use DB count when available, 600 as fallback.
 */
export const TOOLS_COUNT_FALLBACK = 600;

export async function getToolsCount(): Promise<number> {
  try {
    if (!process.env.DATABASE_URL) return TOOLS_COUNT_FALLBACK;
    const { ToolsRepository } = await import('@/database/repositories/tools.repository');
    const repo = new ToolsRepository();
    const count = await repo.count();
    return count > 0 ? count : TOOLS_COUNT_FALLBACK;
  } catch {
    return TOOLS_COUNT_FALLBACK;
  }
}
