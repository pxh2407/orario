// Foglio A4 dell'orario (Sintesi Settimana per i soci e Foglio A4 del programma Gestione Orario) e testi delle
// lezioni sospese. Un solo file per tutte e due le pagine, così il foglio è identico.
// Lezione sospesa: { sospesa: true, motivo?: "assenza docente", riprende?: "2026-11-02" } (riprende vuoto = solo questa settimana)

const FOGLIO_A4 = (() => {
  const GIORNI = ['LUNEDÌ', 'MARTEDÌ', 'MERCOLEDÌ', 'GIOVEDÌ', 'VENERDÌ'];
  const SETTIMANA = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
  const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const data = iso => new Date(iso + 'T12:00:00');   // a mezzogiorno: l'ora legale non sposta il giorno
  const giornoMese = d => `${d.getDate()} ${MESI[d.getMonth()]}`;

  // ---------- testi della ripresa ----------
  // "riprende lunedì 2 novembre" (schede) · "solo questa settimana"
  const ripresaLunga = l => {
    if (!l.riprende) return 'solo questa settimana';
    const d = data(l.riprende);
    return `riprende ${SETTIMANA[d.getDay()]} ${giornoMese(d)}`;
  };
  // "riprende il 2/11" (tabelle ed elenchi stretti)
  const ripresaBreve = l => {
    if (!l.riprende) return 'solo questa settimana';
    const d = data(l.riprende);
    return `riprende il ${d.getDate()}/${d.getMonth() + 1}`;
  };
  // stesso giorno della settimana successiva: la proposta del programma quando si sospende
  function ripresaProposta(dal, giorno) {
    const d = data(dal);
    d.setDate(d.getDate() + GIORNI.indexOf(giorno) + 7);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  // ---------- note in calce ----------
  // Una nota per lezione sospesa; se un giorno ha TUTTE le lezioni sospese (festa) una sola nota per quel giorno.
  // Restituisce { numero: Map(id lezione → n. della nota), testi: [...] }
  function note(lezioni, dal) {
    const numero = new Map(), testi = [];
    for (const g of GIORNI) {
      const lez = lezioni.filter(l => l.day === g)
        .sort((a, b) => a.startTime.localeCompare(b.startTime) || a.aula.localeCompare(b.aula));
      const sosp = lez.filter(l => l.sospesa);
      if (!sosp.length) continue;
      const d = data(dal); d.setDate(d.getDate() + GIORNI.indexOf(g));
      const quando = `${SETTIMANA[d.getDay()]} ${d.getDate()}`;
      if (sosp.length === lez.length && lez.length > 1) {
        const motivi = [...new Set(sosp.map(l => l.motivo).filter(Boolean))];
        const riprese = [...new Set(sosp.map(l => l.riprende || ''))];
        const rip = riprese.length === 1 && riprese[0] ? `, riprendono ${ripresaLunga(sosp[0]).replace(/^riprende /, '')}` : '';
        testi.push(`${quando.charAt(0).toUpperCase() + quando.slice(1)}: tutte le lezioni sospese${motivi.length === 1 ? ' (' + motivi[0] + ')' : ''}${rip}`);
        sosp.forEach(l => numero.set(l.id, testi.length));
        continue;
      }
      for (const l of sosp) {
        const doc = l.teacher && !/\bLUTE\b/i.test(l.teacher) ? ` – ${l.teacher}` : '';
        const motivo = l.motivo ? ` (${l.motivo})` : '';
        testi.push(`${l.title}${doc} (${quando}) sospesa${motivo}${l.riprende ? ': ' + ripresaLunga(l) : ' solo questa settimana'}`);
        numero.set(l.id, testi.length);
      }
    }
    return { numero, testi };
  }

  // ---------- pezzi del foglio ----------
  // intestazione in una riga: logo, "Orario LUTE dal 2 al 6 novembre" (senza anno) e, a destra, lezioni e aggiornamento
  function testata(logo, periodo, lezioni, aggiornato) {
    return `
      <div class="a4-head">
        ${logo}
        <div class="a4-title">Orario LUTE ${periodo.replace(/ \d{4}/g, '')}</div>
        <div class="a4-info">${lezioni} lezioni<br>Aggiornato al ${aggiornato}</div>
      </div>`;
  }
  // lezioni di un giorno raggruppate per orario: inizio e fine una sola volta, a sinistra del gruppo.
  // colore(l) e nNota(l) danno il colore dell'aula e il numero della nota
  function gruppi(lezioni, colore, nNota) {
    const perOrario = new Map();
    lezioni.forEach(l => {
      const orario = `${l.startTime}–${l.endTime}`;
      perOrario.set(orario, [...(perOrario.get(orario) || []), l]);
    });
    return [...perOrario.keys()].sort().map((orario, i) => {
      const [inizio, fine] = orario.split('–');
      return `
      <div class="a4-gruppo${i % 2 ? ' a4-alt' : ''}">
        <div class="a4-ora"><span>${inizio}</span><span>${fine}</span></div>
        <div class="a4-righe">${perOrario.get(orario).map(l => riga(l, colore(l), nNota(l))).join('')}</div>
      </div>`;
    }).join('');
  }
  // riga di una lezione: aula, titolo e, di seguito sulla stessa riga se c'è posto, il docente
  // (si può togliere se manca spazio) e, se sospesa, "vedi nota n"
  function riga(l, colore, nNota) {
    return `
      <div class="a4-row${l.sospesa ? ' a4-sospesa' : ''}">
        <div class="a4-aula" style="background:${colore}">${esc(l.aula)}</div>
        <div class="a4-txt"><b>${l.sospesa ? `<em class="a4-barrato">${esc(l.title)}<i></i></em>` : esc(l.title)}</b>${l.teacher ? `<span class="a4-doc">${esc(l.teacher)}</span>` : ''}${l.sospesa ? `<span class="a4-vedi">vedi nota ${nNota}</span>` : ''}</div>
      </div>`;
  }
  function blocchiNote(testi) {
    if (!testi.length) return '';
    return `<div class="a4-note${testi.length > 4 ? ' a4-note-due' : ''}">
      ${testi.map((t, i) => `<div class="a4-nota"><b>${i + 1}</b> – ${esc(t)}</div>`).join('')}</div>`;
  }

  // ---------- una sola pagina, sempre leggibile ----------
  // 1) rimpicciolisco il testo, ma il docente non va sotto 8,5 punti; 2) se non basta tolgo il docente,
  // dalle righe con il nome più lungo; 3) poi rimpicciolisco ancora, ma il titolo non va sotto 10 punti.
  // (A4 a 96 dpi: 1 px = 0,75 punti. Titolo 16 px → 10 pt a k 0,83; docente 13 px → 8,5 pt a k 0,87)
  const K_DOCENTE = 0.87, K_MINIMO = 0.83;
  function adatta(foglio) {
    const cols = foglio.querySelector('.a4-cols');
    const fuori = () => [...cols.children].filter(c => c.lastElementChild &&
      c.lastElementChild.getBoundingClientRect().bottom > cols.getBoundingClientRect().bottom + 0.5);
    let k = 1, tolti = 0;
    const metti = v => { k = v; cols.style.setProperty('--k', v); };
    metti(1.3);
    while (fuori().length && k > K_DOCENTE) metti(Math.max(K_DOCENTE, Math.round((k - 0.01) * 100) / 100));
    for (let f = fuori(); f.length; f = fuori()) {
      const doc = f.flatMap(c => [...c.querySelectorAll('.a4-doc:not(.a4-via)')])
        .sort((a, b) => b.textContent.length - a.textContent.length)[0];
      if (!doc) break;
      doc.classList.add('a4-via');
      tolti++;
    }
    while (fuori().length && k > K_MINIMO) metti(Math.max(K_MINIMO, Math.round((k - 0.01) * 100) / 100));
    return { k, tolti, entra: !fuori().length };
  }

  // ---------- aspetto: Atkinson Hyperlegible (Braille Institute), fatto per chi vede poco ----------
  const CSS = `
    .a4-sheet { width: 794px; height: 1123px; background: #fff; padding: 10px 22px 8px; box-sizing: border-box; font-family: 'Atkinson Hyperlegible', 'Segoe UI', sans-serif; color: #1e293b; display: flex; flex-direction: column; overflow: hidden; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .a4-head { display: flex; align-items: center; gap: 12px; padding-bottom: 4px; border-bottom: 3px solid #f28c38; }
    .a4-logo { height: 34px; width: auto; flex-shrink: 0; }
    .a4-title { font-family: var(--a4-font-titolo, 'Playfair Display', serif); font-size: 27px; font-weight: 700; color: #0d2538; line-height: 1.1; white-space: nowrap; }
    .a4-info { margin-left: auto; text-align: right; font-size: 13px; font-weight: 700; color: #334155; line-height: 1.2; white-space: nowrap; }
    .a4-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 8px; flex: 1; min-height: 0; --k: 1; }
    .a4-day { margin-bottom: calc(10px * var(--k)); }
    .a4-dayhead { background: #0d2538; color: #fff; font-weight: 700; font-size: calc(14px * var(--k)); letter-spacing: 0.05em; text-transform: uppercase; padding: calc(5px * var(--k)) 10px; border-radius: 8px; display: flex; justify-content: space-between; }
    .a4-dayhead span { letter-spacing: 0; text-transform: none; opacity: 0.85; }
    .a4-row { display: flex; align-items: center; gap: 6px; padding: calc(4px * var(--k)) 3px; border-bottom: 1px solid #e2e8f0; }
    .a4-gruppo { display: flex; border-bottom: 1.5px solid #94a3b8; }
    .a4-ora { width: calc(46px * var(--k)); flex-shrink: 0; display: flex; flex-direction: column; justify-content: center; text-align: center; font-weight: 700; font-size: calc(14px * var(--k)); line-height: 1.15; color: #1e293b; }
    .a4-alt { background: #e8edf3; }
    .a4-righe { flex: 1; min-width: 0; }
    .a4-righe .a4-row:last-child { border-bottom: none; }
    .a4-aula { width: 50px; height: 20px; line-height: 20px; flex-shrink: 0; text-align: center; color: #fff; font-weight: 700; font-size: 11.5px; border-radius: 5px; padding: 0; }
    /* docente subito dopo il titolo: va a capo solo se non c'è posto, e mai spezzato a metà */
    .a4-txt { min-width: 0; font-size: calc(16px * var(--k)); line-height: 1.25; }
    .a4-txt b { color: #0d2538; }
    .a4-txt span { font-size: calc(13px * var(--k)); white-space: nowrap; margin-left: 0.4em; }
    .a4-doc { color: #1e293b; font-weight: 700; }
    .a4-doc.a4-via { display: none !important; }
    .a4-vedi { color: #991b1b; font-weight: 700; }
    .a4-sospesa { background: rgba(148, 163, 184, 0.2); }
    .a4-sospesa .a4-txt b { color: #64748b; }
    /* barrato disegnato con una linea vera: html2canvas metterebbe la riga di text-decoration sopra il testo */
    .a4-barrato { position: relative; display: inline-block; font-style: normal; }
    .a4-barrato i { position: absolute; left: -2px; right: -2px; top: 52%; height: 2px; background: #991b1b; }
    .a4-note { margin-top: 5px; padding: 3px 10px; border: 1px solid #991b1b; border-radius: 10px; color: #991b1b; font-size: 13px; line-height: 1.35; }
    .a4-note-due { display: grid; grid-template-columns: 1fr 1fr; column-gap: 18px; }
    .a4-nota b { font-weight: 700; }
    /* Atkinson ha lo zero barrato, brutto in piccolo: orari, aule e date in un carattere stretto con lo zero normale */
    .a4-ora, .a4-aula, .a4-dayhead span, .a4-info { font-family: 'Roboto Condensed', 'Arial Narrow', sans-serif; }`;
  const FONT = 'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Roboto+Condensed:wght@700&family=Playfair+Display:wght@700&display=swap';

  // stile e carattere si aggiungono alla pagina solo la prima volta che serve il foglio
  // (avatar.html e lo script delle voci usano soltanto i testi della ripresa)
  let installato = null;   // Promise: pronta quando il foglio di stile dei caratteri è stato letto
  function installa() {
    if (installato) return installato;
    if (typeof document === 'undefined') return (installato = Promise.resolve());
    const st = document.createElement('style');
    st.textContent = CSS;
    document.head.appendChild(st);
    const ln = document.createElement('link');
    ln.rel = 'stylesheet'; ln.href = FONT;
    installato = new Promise(r => { ln.onload = ln.onerror = r; setTimeout(r, 5000); });   // senza rete: va avanti col carattere di riserva
    document.head.appendChild(ln);
    return installato;
  }
  // da chiamare prima di disegnare, misurare o fotografare il foglio: il carattere deve essere già arrivato
  function caratteriPronti() {
    if (typeof document === 'undefined') return Promise.resolve();
    return installa()
      .then(() => Promise.all(['400 16px "Atkinson Hyperlegible"', '700 16px "Atkinson Hyperlegible"', '700 14px "Roboto Condensed"', '700 28px "Playfair Display"']
        .map(f => document.fonts.load(f).catch(() => {}))))
      .then(() => document.fonts.ready);
  }

  // html2canvas mette il testo più in basso del browser: nella copia da fotografare (onclone) lo rialzo
  function correggiPerFoto(doc) {
    doc.querySelectorAll('.a4-aula').forEach(el => { el.innerHTML = '<span style="position:relative;top:-5px">' + el.innerHTML + '</span>'; });
    doc.querySelectorAll('.a4-ora span, .a4-txt, .a4-title, .a4-info, .a4-nota').forEach(el => { el.style.position = 'relative'; el.style.top = '-6px'; });
    doc.querySelectorAll('.a4-barrato i').forEach(el => { el.style.top = 'calc(52% + 6px)'; });
    doc.querySelectorAll('.a4-dayhead').forEach(el => { el.innerHTML = '<span style="position:relative;top:-6px;opacity:1">' + el.innerHTML + '</span>'; el.firstChild.style.cssText += ';display:flex;justify-content:space-between;width:100%;letter-spacing:inherit;text-transform:inherit;font-weight:inherit'; });
  }

  return { SETTIMANA, MESI, correggiPerFoto, ripresaLunga, ripresaBreve, ripresaProposta, note, testata, gruppi, blocchiNote, adatta, installa, caratteriPronti };
})();

if (typeof module !== 'undefined') module.exports = FOGLIO_A4;
