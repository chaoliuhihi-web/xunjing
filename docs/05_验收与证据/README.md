# 验收与证据目录

本目录只保存验收标准、证据清单和 Go/No-Go 规则；测试截图、JSON、日志、视频、PDF 和运行产物统一放在仓库 `qa/` 对应任务目录。

当前入口：

- [`寻境 C 端 P0 验收门禁 v1.0`](./寻境C端P0验收门禁_v1.0.md)

推荐证据目录：

```text
qa/xunjing-c-product/<YYYYMMDD>/<TASK-ID>/
├── README.md
├── commands.log
├── test-results/
├── screenshots/
├── api/
└── artifacts/
```

没有证据文件或可重复命令的功能不得标记为完成。
