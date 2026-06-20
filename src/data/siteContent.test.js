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
    expect(pages.home.hero.title).toContain('地方文旅资源');
    expect(homeMetrics.map((metric) => metric.label)).toEqual([
      '合作城市/景区',
      '累计服务游客',
      '游客停留提升',
      '用户满意度'
    ]);
    expect(capabilityCards).toHaveLength(6);
    expect(solutionTracks).toHaveLength(4);
    expect(travelogueOutputs.map((item) => item.title)).toContain('纸质纪念书');
  });
});
