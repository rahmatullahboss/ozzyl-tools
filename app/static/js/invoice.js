(() => {
  const root = document.querySelector('[data-document-type]');
  if (!root) return;

  const type = root.dataset.documentType;
  const storageKey = `ozzyl-tools-${type.toLowerCase()}-draft-v1`;
  const itemsBody = root.querySelector('[data-items]');
  const fieldElements = [...root.querySelectorAll('[data-field]')];
  const status = root.querySelector('[data-save-status]');

  const today = new Date();
  const isoDate = (date) => date.toISOString().slice(0, 10);
  const addDays = (date, days) => { const copy = new Date(date); copy.setDate(copy.getDate() + days); return copy; };

  const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));

  function addItem(item = {description: '', qty: 1, rate: 0}) {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><input class="item-description" value="${escapeHtml(item.description)}" placeholder="Service or product"></td>
      <td><input class="item-qty" type="number" min="0" step="0.01" value="${Number(item.qty) || 0}"></td>
      <td><input class="item-rate" type="number" min="0" step="0.01" value="${Number(item.rate) || 0}"></td>
      <td class="item-amount">0.00</td>
      <td class="no-print"><button class="remove-item" type="button" aria-label="Remove line item">×</button></td>`;
    row.querySelector('.remove-item').addEventListener('click', () => { row.remove(); if (!itemsBody.children.length) addItem(); recalculate(); });
    row.addEventListener('input', recalculate);
    itemsBody.appendChild(row);
    recalculate();
  }

  function value(name) { return root.querySelector(`[data-field="${name}"]`)?.value ?? ''; }
  function currency() { return value('currency') || ''; }
  function format(amount) { return `${currency()}${amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`; }

  function recalculate() {
    let subtotal = 0;
    [...itemsBody.children].forEach((row) => {
      const qty = Number.parseFloat(row.querySelector('.item-qty').value) || 0;
      const rate = Number.parseFloat(row.querySelector('.item-rate').value) || 0;
      const amount = qty * rate;
      subtotal += amount;
      row.querySelector('.item-amount').textContent = format(amount);
    });
    const discount = Math.max(Number.parseFloat(value('discount')) || 0, 0);
    const taxable = Math.max(subtotal - discount, 0);
    const tax = taxable * Math.max(Number.parseFloat(value('taxRate')) || 0, 0) / 100;
    root.querySelector('[data-subtotal]').textContent = format(subtotal);
    root.querySelector('[data-tax]').textContent = format(tax);
    root.querySelector('[data-total]').textContent = format(taxable + tax);
  }

  function serialize() {
    const fields = Object.fromEntries(fieldElements.map((element) => [element.dataset.field, element.value]));
    const items = [...itemsBody.children].map((row) => ({
      description: row.querySelector('.item-description').value,
      qty: row.querySelector('.item-qty').value,
      rate: row.querySelector('.item-rate').value,
    }));
    return {fields, items, savedAt: new Date().toISOString()};
  }

  function hydrate(data) {
    if (!data) return;
    Object.entries(data.fields || {}).forEach(([name, fieldValue]) => {
      const element = root.querySelector(`[data-field="${name}"]`);
      if (element) element.value = fieldValue;
    });
    itemsBody.innerHTML = '';
    (data.items?.length ? data.items : [{}]).forEach(addItem);
    recalculate();
  }

  function setDefaults() {
    root.querySelector('[data-field="documentDate"]').value = isoDate(today);
    root.querySelector('[data-field="dueDate"]').value = isoDate(addDays(today, type === 'Invoice' ? 14 : 30));
    itemsBody.innerHTML = '';
    addItem({description: 'Professional service', qty: 1, rate: 0});
  }

  root.querySelector('[data-add-item]').addEventListener('click', () => addItem());
  root.querySelector('[data-print]').addEventListener('click', () => window.print());
  root.querySelector('[data-save]').addEventListener('click', () => {
    localStorage.setItem(storageKey, JSON.stringify(serialize()));
    status.textContent = 'Draft saved in this browser';
  });
  root.querySelector('[data-clear]').addEventListener('click', () => {
    localStorage.removeItem(storageKey);
    fieldElements.forEach((element) => { if (!['currency', 'discount', 'taxRate'].includes(element.dataset.field)) element.value = ''; });
    root.querySelector('[data-field="currency"]').value = '$';
    root.querySelector('[data-field="discount"]').value = '0';
    root.querySelector('[data-field="taxRate"]').value = '0';
    setDefaults();
    status.textContent = 'Draft cleared';
  });
  root.addEventListener('input', recalculate);
  root.addEventListener('change', recalculate);

  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved) { hydrate(saved); status.textContent = 'Saved draft restored'; }
    else setDefaults();
  } catch { setDefaults(); }
})();
