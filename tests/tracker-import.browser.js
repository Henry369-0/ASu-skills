async function verifyTrackerImport(page) {
  await page.emulateMedia({ media: 'screen' });
  await page.evaluate(() => localStorage.removeItem('offer-skills-application-tracker-v1'));
  await page.reload();
  await page.evaluate(() => {
    window.__dialogs = [];
    window.__confirmAnswer = true;
    window.__originalAlert = window.alert;
    window.__originalConfirm = window.confirm;
    window.alert = message => window.__dialogs.push(message);
    window.confirm = message => { window.__dialogs.push(message); return window.__confirmAnswer; };
  });
  const valid = [{ id: 'record-a', date: '2026-10-13', company: '保留的公司', status: '一面', position: '测试岗', time: '09:00', next: '', note: '', source: 'fictional fixture' }];
  const input = page.locator('#importInput');
  let serial = 0;
  async function upload(value) {
    const before = await page.evaluate(() => window.__dialogs.length);
    await input.setInputFiles({ name: `fixture-${serial++}.json`, mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(value)) });
    await page.waitForFunction(count => window.__dialogs.length > count, before);
  }
  await upload(valid);
  const original = await page.evaluate(() => localStorage.getItem('offer-skills-application-tracker-v1'));
  const invalid = [
    { records: valid },
    [null],
    [{ ...valid[0], id: 123 }],
    [{ ...valid[0], company: {} }],
    [{ ...valid[0], date: '2026-02-30' }],
    [{ ...valid[0], time: '99:00' }],
    [{ ...valid[0], status: 'unknown' }],
    [{ ...valid[0], note: {} }],
    [{ ...valid[0], company: '甲' }, { ...valid[0], company: '乙' }],
  ];
  for (const fixture of invalid) {
    await upload(fixture);
    const saved = await page.evaluate(() => localStorage.getItem('offer-skills-application-tracker-v1'));
    if (saved !== original) throw new Error('Invalid import replaced existing records.');
  }
  await page.evaluate(() => { window.__confirmAnswer = false; });
  await upload([{ ...valid[0], id: 'record-b', company: '取消的替换' }]);
  if (await page.evaluate(() => localStorage.getItem('offer-skills-application-tracker-v1')) !== original) throw new Error('Cancelling replacement changed records.');
  await page.evaluate(() => { window.__confirmAnswer = true; });
  await upload([...valid, { ...valid[0], id: 'record-b', company: '第二家公司' }]);
  await page.getByRole('row').filter({ hasText: '第二家公司' }).getByRole('button', { name: '编辑', exact: true }).click();
  if (await page.locator('#companyInput').inputValue() !== '第二家公司') throw new Error('Editing selects a different record.');
  await page.getByRole('button', { name: '取消', exact: true }).click();
  const dialogs = await page.evaluate(() => {
    const messages = window.__dialogs;
    window.alert = window.__originalAlert;
    window.confirm = window.__originalConfirm;
    return messages;
  });
  return { invalidImportsRejected: invalid.length, cancelledReplacementPreserved: true, correctRecordEdited: true, dialogs };
}
