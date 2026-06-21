import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

describe('Xinghe Xunjing public site', () => {
  beforeEach(() => {
    window.location.hash = '';
  });

  test('renders the launch homepage with visible conversion actions', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', {
        name: /让目的地拥有自己的 AI 叙事/
      })
    ).toBeInTheDocument();
    expect(screen.getByText(/传播数据报告的完整闭环/)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: '预约样板' }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('星河寻境如何让目的地“活起来”')).toBeInTheDocument();
    expect(screen.getByText('样板项目运营界面')).toBeInTheDocument();
  });

  test('navigates between core pages without leaving the SPA shell', async () => {
    const user = userEvent.setup();
    render(<App />);

    const nav = screen.getByRole('navigation', { name: '主导航' });
    await user.click(within(nav).getByRole('link', { name: '产品能力' }));
    expect(screen.getByRole('heading', { name: /从地方资源到游客传播/ })).toBeInTheDocument();
    expect(screen.getByText('从资源到传播的闭环架构')).toBeInTheDocument();

    await user.click(within(nav).getByRole('link', { name: '跟着游记' }));
    expect(screen.getByRole('heading', { name: /让游客带走的/ })).toBeInTheDocument();
    expect(screen.getByText('5 步生成一段会被记住的旅行故事')).toBeInTheDocument();
  });

  test('captures demo requests with a customer-facing success state', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getAllByRole('button', { name: '预约样板' })[0]);
    await user.type(screen.getByLabelText('联系人姓名'), '王女士');
    await user.type(screen.getByLabelText('联系电话'), '13800138000');
    await user.type(screen.getByLabelText('单位名称'), '新疆文旅示范中心');
    await user.selectOptions(screen.getByLabelText('合作类型'), '景区 AI 导览样板');
    await user.click(screen.getByRole('button', { name: '提交样板需求' }));

    expect(screen.getByText('已收到样板沟通需求')).toBeInTheDocument();
    expect(screen.getByText(/确认场景资源、演示路径和样板切入点/)).toBeInTheDocument();
  });
});
