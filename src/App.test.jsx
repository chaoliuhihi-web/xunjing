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
        name: /把地方文旅资源转化为游客可参与/
      })
    ).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: '预约演示' }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('核心产品矩阵')).toBeInTheDocument();
    expect(screen.getByText('产品界面展示')).toBeInTheDocument();
  });

  test('navigates between core pages without leaving the SPA shell', async () => {
    const user = userEvent.setup();
    render(<App />);

    const nav = screen.getByRole('navigation', { name: '主导航' });
    await user.click(within(nav).getByRole('link', { name: '产品能力' }));
    expect(screen.getByRole('heading', { name: /一套平台，连接文旅资源/ })).toBeInTheDocument();
    expect(screen.getByText('平台架构')).toBeInTheDocument();

    await user.click(within(nav).getByRole('link', { name: '跟着游记' }));
    expect(screen.getByRole('heading', { name: /把每一次旅行/ })).toBeInTheDocument();
    expect(screen.getByText('轻松 5 步，生成你的专属游记')).toBeInTheDocument();
  });

  test('captures demo requests with a customer-facing success state', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getAllByRole('button', { name: '预约演示' })[0]);
    await user.type(screen.getByLabelText('联系人姓名'), '王女士');
    await user.type(screen.getByLabelText('联系电话'), '13800138000');
    await user.type(screen.getByLabelText('单位名称'), '新疆文旅示范中心');
    await user.selectOptions(screen.getByLabelText('合作类型'), '景区 AI 导览样板');
    await user.click(screen.getByRole('button', { name: '提交需求' }));

    expect(screen.getByText('需求已记录')).toBeInTheDocument();
    expect(screen.getByText(/我们会在 1 个工作日内联系/)).toBeInTheDocument();
  });
});
