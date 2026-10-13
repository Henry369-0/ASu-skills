# 浏览器回归

这些检查使用 Playwright CLI 的独立浏览器会话和虚构数据，不需要修改 skill 或只读同款母版。

从仓库根目录启动一个静态服务，例如 `python -m http.server 8080 --bind 127.0.0.1`。已安装 Playwright CLI 时运行：

```sh
playwright-cli -s=asu-resume-check open http://localhost:8080/assets/resume-template-editable.html
playwright-cli -s=asu-resume-check run-code --filename=tests/resume-save.browser.js
playwright-cli -s=asu-tracker-check open http://localhost:8080/assets/application-tracker.html
playwright-cli -s=asu-tracker-check run-code --filename=tests/tracker-import.browser.js
```

简历检查会编辑、实际下载单页和双页 HTML、独立重开继续编辑，并检查 print media 的 A4 容器及隐藏工具栏。它不替代最终用户内容的 PDF 分页检查。

追踪器检查会清空该独立会话中的测试记录，验证九类错误备份不覆盖原记录、取消替换生效、编辑定位到正确记录。检查不要连接个人正在使用的浏览器会话。
