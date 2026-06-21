import {
  capabilityCards,
  homeMetrics,
  navItems,
  pages,
  solutionTracks,
  travelogueOutputs
} from './siteContent';

describe('site content contract', () => {
  test('keeps the public navigation aligned with the Web_V3 reference set', () => {
    expect(navItems.map((item) => item.label)).toEqual([
      '首页',
      '产品能力',
      '应用场景',
      '解决方案',
      '试点样板',
      '跟着游记',
      '关于我们'
    ]);
    expect(new Set(navItems.map((item) => item.href)).size).toBe(navItems.length);
    expect(navItems.every((item) => item.href.startsWith('#'))).toBe(true);
  });

  test('contains the operating proof and module depth needed for an external launch site', () => {
    expect(pages.home.hero.title).toContain('AI 文旅内容运营平台');
    expect(pages.home.hero.desc).toContain('让每一处风景被讲述');
    expect(homeMetrics.map((metric) => metric.label)).toEqual([
      '目的地叙事系统',
      '核心落地场景',
      '传播数据报告',
      'AI 文旅样板'
    ]);
    expect(capabilityCards).toHaveLength(6);
    expect(solutionTracks).toHaveLength(4);
    expect(travelogueOutputs.map((item) => item.title)).toContain('纸质纪念书');
  });

  test('defines deliberate hero title line breaks for launch-screen typography', () => {
    for (const [pageKey, page] of Object.entries(pages)) {
      expect(page.hero.titleLines, `${pageKey} hero needs controlled line breaks`).toBeDefined();
      expect(page.hero.titleLines.join('').replace(/\s/g, '')).toBe(page.hero.title.replace(/\s/g, ''));
      expect(page.hero.titleLines.length, `${pageKey} hero should stay concise`).toBeLessThanOrEqual(3);
      expect(
        page.hero.titleLines.every((line) => line.length <= 14),
        `${pageKey} hero lines should avoid awkward browser wrapping`
      ).toBe(true);
    }
  });
});
