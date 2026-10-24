// Testi dell'"Orario raccontato": cosa dice (e cosa scrive nel fumetto) la guida di ogni giorno.
// Lo usano la pagina avatar.html e, su GitHub, lo script che registra le voci naturali
// (strumenti/frasi.js): così la pagina e le registrazioni hanno sempre le stesse identiche frasi.

const RACCONTO = (() => {
  const GUIDE_R = typeof GUIDE !== 'undefined' ? GUIDE : require('./guide.js').GUIDE;
  const A4 = typeof FOGLIO_A4 !== 'undefined' ? FOGLIO_A4 : require('./foglio-a4.js');   // testi della ripresa
  const GIORNI = ['LUNEDÌ', 'MARTEDÌ', 'MERCOLEDÌ', 'GIOVEDÌ', 'VENERDÌ'];
  const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
  const SALUTI = ['Buongiorno', 'Buonasera'];
  const CIFRE = ['zero', 'uno', 'due', 'tre', 'quattro', 'cinque', 'sei', 'sette', 'otto', 'nove'];
  const NUMERI = ['nessuna', 'una', 'due', 'tre', 'quattro', 'cinque', 'sei', 'sette', 'otto', 'nove', 'dieci'];
  // cognomi per cui il nome di battesimo del catalogo è incerto: si dice solo il cognome
  const NOMI_INCERTI = ['forestieri'];   // nel catalogo c'è "Forestieri Vincenzi"
  const PARTICELLE = /^(la|lo|li|le|di|de|del|della|da|d')$/i;

  const maiusc = s => s.charAt(0).toUpperCase() + s.slice(1);
  const semplice = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/’/g, "'").toLowerCase().replace(/\s+/g, ' ').trim();
  const finisce = l => /^\d\d:\d\d$/.test(l.endTime);
  const ordine = (a, b) => GIORNI.indexOf(a.day) - GIORNI.indexOf(b.day) || a.startTime.localeCompare(b.startTime) || a.aula.localeCompare(b.aula);

  // ---------- date ----------
  function dataDel(settimana, giorno) {   // a mezzogiorno: l'ora legale non sposta il giorno
    const d = new Date(settimana.dal + 'T12:00:00');
    d.setDate(d.getDate() + GIORNI.indexOf(giorno));
    return d;
  }
  const dataBreve = (s, g) => { const d = dataDel(s, g); return `${d.getDate()} ${MESI[d.getMonth()]}`; };   // "12 ottobre"
  const nomeGiorno = g => g.charAt(0) + g.slice(1).toLowerCase();                                             // "Lunedì"
  function ilGiorno(s, g, detto) {   // "il 12 ottobre", "l'8 ottobre", "il primo ottobre"
    const d = dataDel(s, g), n = d.getDate(), m = MESI[d.getMonth()];
    if (n === 1) return `il ${detto ? 'primo' : '1°'} ${m}`;
    return `${n === 8 || n === 11 ? "l'" : 'il '}${n} ${m}`;
  }

  // ---------- orari, aule, titoli ----------
  const oraDetta = t => { const [h, m] = t.split(':'); return +m ? `${+h} e ${+m}` : `${+h}`; };   // "15:30" → "15 e 30"
  function aula(a, detto) {
    if (/^palestra$/i.test(a)) return 'in palestra';
    if (/^aula magna$/i.test(a)) return 'in aula magna';
    const m = /^S\s*(\d+)$/i.exec(a);
    if (m) return detto ? 'in aula esse ' + [...m[1]].map(c => CIFRE[+c]).join(' ') : 'in aula ' + a;
    return 'in ' + a.toLowerCase();
  }
  // "VENERDI'" → "VENERDÌ", "ISGRO'" → "ISGRÒ"
  const accenti = s => String(s).replace(/([AEIOUaeiou])'(?=\s|$|[.,;:!?/])/g, (x, v) => ({ a: 'à', e: 'è', i: 'ì', o: 'ò', u: 'ù', A: 'À', E: 'È', I: 'Ì', O: 'Ò', U: 'Ù' }[v]));
  const parolaMaiusc = w => w.toLowerCase().replace(/(^|[\s'’-])(\p{L})/gu, (x, a, b) => a + b.toUpperCase());
  function titoloScritto(t) {
    let s = accenti(t).replace(/[.…]{2,}\s*$/, '').trim();
    if (s === s.toUpperCase()) s = maiusc(s.toLowerCase()).replace(/\blute\b/g, 'LUTE').replace(/venerdì/g, 'Venerdì').replace(/mosaico/g, 'Mosaico');
    return s;
  }
  const titoloDetto = t => titoloScritto(t).replace(/["“”«»]/g, '').replace(/\s[-–]\s/g, ', ').replace(/\s*\/\s*/g, ', e ')
    .replace(/['’]900\b/g, 'Novecento');

  // ---------- docenti: "Nome Cognome" presi dal catalogo dei corsi (dati/corsi.json, "Cognome Nome") ----------
  function personeDelCatalogo(corsi) {
    const out = [];
    for (const c of corsi || []) for (const p of String(c.doc || '').split(/\s*[\/,]\s*/)) if (p.trim()) out.push({ testo: p.trim(), cod: c.cod });
    return out;
  }
  // una persona dell'orario ("LO VANO R.", "MILANI CASSIA", "LA SPADA") → { scritto, detto }
  function persona(p, cod, catalogo) {
    const conAccenti = accenti(p);
    const iniziale = (/(?:^|\s)(\p{Lu})\./u.exec(conAccenti) || [])[1];
    const cognomeOrario = conAccenti.replace(/(?:^|\s)(?:\p{Lu}\.)+/gu, ' ').replace(/\s+/g, ' ').trim();
    const cogn = semplice(cognomeOrario), parole = cogn.split(' ').length;
    const soloCognome = { scritto: parolaMaiusc(cognomeOrario), detto: parolaMaiusc(cognomeOrario) };
    if (!cogn) return null;
    // i medici del Lutelisir: nel catalogo "Dr. G. Falliti" → "il dottor Falliti"
    const dott = catalogo.find(x => x.cod === cod && /^dr\.?(ssa)?\s/i.test(x.testo) && semplice(x.testo).endsWith(' ' + cogn));
    if (dott) {
      const d = /^dr\.?ssa/i.test(dott.testo) ? 'la dottoressa ' : 'il dottor ';
      return { scritto: dott.testo, detto: d + parolaMaiusc(cognomeOrario) };
    }
    if (NOMI_INCERTI.includes(cogn)) return soloCognome;
    for (const x of catalogo) {
      if (/\./.test(x.testo)) continue;   // nel catalogo solo l'iniziale: il nome non lo sappiamo
      const s = semplice(x.testo), w = x.testo.split(/\s+/);
      let cognome = null, nome = null;
      if (s.startsWith(cogn + ' ')) { cognome = w.slice(0, parole).join(' '); nome = w.slice(parole).join(' '); }
      else if (s === cogn && !iniziale && w.length === 2 && !PARTICELLE.test(w[0])) { cognome = w[0]; nome = w[1]; }   // "MILANI CASSIA"
      if (!nome) continue;
      if (iniziale && semplice(nome)[0] !== semplice(iniziale)) continue;   // stesso cognome ma un'altra persona
      const n = `${nome} ${cognome}`;
      return { scritto: n, detto: n };
    }
    return soloCognome;
  }
  const elenco = v => v.length > 1 ? v.slice(0, -1).join(', ') + ' e ' + v[v.length - 1] : (v[0] || '');
  // tutti i docenti di una lezione; quelli "LUTE" (Istruttore LUTE, Relatori Ospiti LUTE) non si dicono
  function docenti(l, corsi) {
    if (!l.teacher || /\bLUTE\b/i.test(l.teacher)) return { scritto: l.teacher || '', detto: '' };
    const cat = personeDelCatalogo(corsi);
    const pp = accenti(l.teacher).split(/\s*\/\s*|\s+[-–]\s*|\s*[-–]\s+/).map(p => persona(p, l.cod, cat)).filter(Boolean);
    return { scritto: elenco(pp.map(p => p.scritto)), detto: elenco(pp.map(p => p.detto)) };
  }

  // ---------- le battute della guida per un giorno ----------
  // saluto: "Buongiorno" o "Buonasera" (le voci registrate esistono per tutti e due)
  function battute(settimana, corsi, giorno, saluto) {
    const g = GUIDE_R[giorno];
    const lez = settimana.lezioni.filter(l => l.day === giorno).sort(ordine);
    const attive = lez.filter(l => !l.sospesa), sospese = lez.length - attive.length;
    const giornoMin = giorno.toLowerCase();
    const b = [];
    const aggiungi = (tipo, scritto, detto, lezione) => b.push({ tipo, testo: scritto, parlato: (detto || scritto).replace(/«|»/g, '').replace(/\bLUTE\b/g, 'Lute'), lezione });

    let introS = `${saluto}! Sono ${g.nome}, la vostra guida del ${giornoMin}. `, introD = introS;
    // "riprende lunedì 2 novembre" → detto "riprende lunedì primo novembre" se è il primo del mese
    const ripresa = l => l.riprende ? ', ' + A4.ripresaLunga(l).replace(/ 1 /, ' primo ') : '';
    if (!attive.length) {
      const motivo = lez.find(l => l.motivo)?.motivo;
      const rip = lez.every(l => l.riprende === lez[0].riprende) ? ripresa(lez[0]).replace('riprende', 'riprendono') : '';
      const t = `Attenzione: ${giornoMin} ${dataBreve(settimana, giorno)} le lezioni sono sospese${motivo ? ' (' + motivo + ')' : ''}${rip}.`;
      aggiungi('intro', introS + t, introD + t);
    } else {
      const inizio = attive.map(l => l.startTime).sort()[0];
      const fini = attive.filter(finisce).map(l => l.endTime).sort(), fine = fini[fini.length - 1];
      const quante = (detto) => attive.length === 1 ? `${maiusc(ilGiorno(settimana, giorno, detto))} c'è una sola lezione. `
        : `${maiusc(ilGiorno(settimana, giorno, detto))} ci sono ${attive.length} lezioni, dalle ${detto ? oraDetta(inizio) : inizio}${fine ? ' alle ' + (detto ? oraDetta(fine) : fine) : ''}. `;
      introS += quante(false); introD += quante(true);
      if (sospese) { const t = `Attenzione: ${sospese === 1 ? 'una lezione è sospesa' : sospese + ' lezioni sono sospese'}. `; introS += t; introD += t; }
      const chiusa = attive.length === 1 ? 'Ve la racconto.' : 'Ve le racconto una per una.';
      aggiungi('intro', introS + chiusa, introD + chiusa);

      // le lezioni, raggruppate per ora d'inizio, con frasi che cambiano per non fare cantilena
      for (const l of lez) {
        const doc = docenti(l, corsi).detto;
        const tS = `«${titoloScritto(l.title)}»`, tD = titoloDetto(l.title);
        const con = d => doc ? (/\bcon\b/i.test(d) ? ', a cura di ' : ', con ') + doc : '';
        if (l.sospesa) {
          const m = l.motivo ? `: ${l.motivo}` : '';
          aggiungi('lezione', `Attenzione: questa settimana ${tS} è sospesa${m}${ripresa(l)}.`, `Attenzione: questa settimana ${tD} è sospesa${m}${ripresa(l)}.`, l);
          continue;
        }
        const gruppo = attive.filter(x => x.startTime === l.startTime), n = gruppo.length, k = gruppo.indexOf(l);
        const frase = detto => {
          const ora = detto ? oraDetta(l.startTime) : l.startTime;
          const dove = aula(l.aula, detto), tit = detto ? tD : tS;
          const fino = finisce(l) ? `, fino alle ${detto ? oraDetta(l.endTime) : l.endTime}` : '';
          const corpo = `${tit}${con(tit)}${fino}.`;
          if (n === 1) return `Alle ${ora}, ${dove}: ${corpo}`;
          if (k === 0) return `Alle ${ora} cominciano ${NUMERI[n] || n} lezioni. ${maiusc(dove)}: ${corpo}`;
          if (k === n - 1) return `${n === 2 ? 'E' : 'Infine,'} ${dove}: ${corpo}`;
          return k % 2 ? `${maiusc(dove)}: ${corpo}` : `Poi, ${dove}: ${corpo}`;
        };
        aggiungi('lezione', frase(false), frase(true), l);
      }
    }
    aggiungi('fine', `Questo è tutto per ${giornoMin}. Per sentire un altro giorno, toccate «Altri giorni». Buone lezioni, e arrivederci alla LUTE!`);
    return b;
  }

  // nome del file con la voce registrata di una frase (cambia se cambia la frase o la voce)
  function fileAudio(giorno, parlato) {
    const v = GUIDE_R[giorno].voce, s = `${v.nome}|${v.velocita}|${v.tono}|${parlato}`;
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return h.toString(16).padStart(8, '0') + '-' + s.length.toString(36) + '.mp3';
  }

  return { GIORNI, MESI, SALUTI, battute, docenti, dataDel, dataBreve, nomeGiorno, titoloScritto, fileAudio, ordine };
})();

if (typeof module !== 'undefined') module.exports = RACCONTO;
