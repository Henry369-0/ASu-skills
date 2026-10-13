async function verifyResumeSave(page) {
  const assets = new URL('.', page.url());
  const results = [];
  for (const [file, expectedPages] of [['resume-template-editable.html', 1], ['resume-template-two-page.html', 2]]) {
    await page.emulateMedia({ media: 'screen' });
    await page.goto(new URL(file, assets).href);
    await page.reload();
    if (await page.getByRole('button', { name: '保存 HTML', exact: true }).count() !== 1) throw new Error(`${file} cannot save editable source.`);
    await page.getByRole('button', { name: '编辑', exact: true }).click();
    await page.locator('.name').fill('可继续编辑的测试姓名');
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: '保存 HTML', exact: true }).click();
    const download = await pending;
    const savedPath = `${await download.path()}.html`;
    await download.saveAs(savedPath);
    const normalized = savedPath.replace(/\\/g, '/');
    await page.goto(`file://${normalized.startsWith('/') ? '' : '/'}${normalized}`);
    if (await page.locator('.name').textContent() !== '可继续编辑的测试姓名') throw new Error('Saved text was lost.');
    if (!(await page.locator('.photo img').getAttribute('src')).startsWith('data:')) throw new Error('Saved photo depends on the original directory.');
    await page.getByRole('button', { name: '编辑', exact: true }).click();
    await page.locator('.name').fill('重新打开后继续修改');
    await page.emulateMedia({ media: 'print' });
    const print = await page.evaluate(() => ({
      toolbar: getComputedStyle(document.querySelector('.toolbar')).display,
      pages: [...document.querySelectorAll('.page, .resume-page')].map(node => ({ width: node.getBoundingClientRect().width, height: node.getBoundingClientRect().height })),
    }));
    if (print.toolbar !== 'none' || print.pages.length !== expectedPages || print.pages.some(p => Math.abs(p.width - 793.7) > 1 || Math.abs(p.height - 1122.5) > 1)) throw new Error(`${file} changed A4 pagination.`);
    results.push({ file, savedTextRetained: true, photoEmbedded: true, continuedEditing: true, print });
  }
  return results;
}
