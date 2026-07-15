(() => {
  const root = document.querySelector('[data-calculator]');
  if (!root) return;

  const form = root.querySelector('.calculator-form');
  const currencySelect = root.querySelector('[data-currency]');
  const primary = root.querySelector('#primary-result');
  const list = root.querySelector('#result-list');
  const formula = root.dataset.calculator;

  const number = (name) => {
    const input = form.elements[name];
    const value = Number.parseFloat(input?.value ?? '0');
    return Number.isFinite(value) ? value : 0;
  };

  const money = (value) => {
    if (!Number.isFinite(value)) return 'Not available';
    const symbol = currencySelect.value;
    return `${symbol}${value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
  };
  const percent = (value) => Number.isFinite(value) ? `${value.toFixed(2)}%` : 'Not available';
  const numeric = (value) => Number.isFinite(value) ? value.toLocaleString(undefined, {maximumFractionDigits: 2}) : 'Not available';

  const calculations = {
    profit_margin: () => {
      const cost = number('cost'); const selling = number('selling'); const profit = selling - cost;
      return [['Gross profit', money(profit)], ['Profit margin', selling ? percent((profit / selling) * 100) : 'Not available'], ['Markup', cost ? percent((profit / cost) * 100) : 'Not available']];
    },
    markup: () => {
      const cost = number('cost'); const rate = number('markup'); const profit = cost * rate / 100; const selling = cost + profit;
      return [['Selling price', money(selling)], ['Profit', money(profit)], ['Resulting margin', selling ? percent((profit / selling) * 100) : 'Not available']];
    },
    discount: () => {
      const price = number('price'); const rate = Math.min(number('discount'), 100); const saving = price * rate / 100;
      return [['Final price', money(price - saving)], ['You save', money(saving)], ['Discount amount', percent(rate)]];
    },
    commission: () => {
      const sales = number('sales'); const rate = number('rate'); const base = number('base'); const commission = sales * rate / 100;
      return [['Commission', money(commission)], ['Total payout', money(base + commission)], ['Revenue after commission', money(sales - commission)]];
    },
    vat: () => {
      const amount = number('amount'); const rate = number('rate'); const vat = amount * rate / 100; const divisor = 1 + rate / 100;
      return [['VAT amount', money(vat)], ['Total including VAT', money(amount + vat)], ['Net amount if VAT-inclusive', divisor ? money(amount / divisor) : 'Not available']];
    },
    break_even: () => {
      const fixed = number('fixed'); const price = number('price'); const variable = number('variable'); const contribution = price - variable; const units = contribution > 0 ? Math.ceil(fixed / contribution) : NaN;
      return [['Break-even units', numeric(units)], ['Break-even revenue', Number.isFinite(units) ? money(units * price) : 'Not available'], ['Contribution per unit', money(contribution)]];
    },
    loan: () => {
      const principal = number('principal'); const months = Math.max(number('months'), 1); const monthlyRate = number('annual_rate') / 1200;
      const payment = monthlyRate === 0 ? principal / months : principal * monthlyRate * ((1 + monthlyRate) ** months) / (((1 + monthlyRate) ** months) - 1);
      const total = payment * months;
      return [['Monthly payment', money(payment)], ['Total repayment', money(total)], ['Total interest', money(total - principal)]];
    },
    overtime: () => {
      const hourly = number('hourly'); const regular = hourly * number('regular_hours'); const overtime = hourly * number('multiplier') * number('overtime_hours');
      return [['Regular pay', money(regular)], ['Overtime pay', money(overtime)], ['Total gross pay', money(regular + overtime)]];
    }
  };

  function render() {
    const results = calculations[formula]?.() ?? [];
    primary.textContent = results[0]?.[1] ?? '—';
    list.innerHTML = results.map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join('');
  }

  root.addEventListener('input', render);
  root.querySelector('[data-reset]').addEventListener('click', () => {
    form.querySelectorAll('input[data-default]').forEach((input) => { input.value = input.dataset.default; });
    currencySelect.value = '$';
    render();
  });
  root.querySelector('[data-copy]').addEventListener('click', async (event) => {
    const text = [...list.querySelectorAll('div')].map((row) => `${row.children[0].textContent}: ${row.children[1].textContent}`).join('\n');
    try { await navigator.clipboard.writeText(text); event.currentTarget.textContent = 'Copied'; }
    catch { event.currentTarget.textContent = 'Select and copy manually'; }
    window.setTimeout(() => { event.currentTarget.textContent = 'Copy result'; }, 1600);
  });

  render();
})();
