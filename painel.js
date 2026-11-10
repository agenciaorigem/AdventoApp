// Advento Tour 2026 - Painel Administrativo com Supabase Realtime
const SUPABASE_URL = 'https://zthergsaallbiusnnece.supabase.co';
const SUPABASE_KEY = 'sb_publishable_6h93_NsDXa53scmXYwLFnA_Ouh4B7vK';
const TABLE_NAME = 'advento_site';
const DEFAULT_PIN = '2026';

const entry = document.querySelector('#admin-entry');
const gate = document.querySelector('#admin-gate');
const pin = gate.querySelector('input');
const statusLine = document.querySelector('#admin-status');
const panel = document.querySelector('#admin-panel');
const save = document.querySelector('#save-admin');
const saveStatus = document.querySelector('#save-status');

// Mapeamento dos textos da página para edição
const textNodes = [];
for (const element of document.querySelectorAll('main h1, main h2, main h3, main section p, .schedule dt, .schedule dd, .ticket strong, .ticket b, .food, .hero-caption small, .intro small')) {
  if (element.id === 'count' || element.closest('form')) continue;
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.data.trim() && !textNodes.includes(node)) textNodes.push(node);
  }
}

const images = [...document.querySelectorAll('main img')];
const defaults = {
  texts: textNodes.map(node => node.data),
  images: images.map(() => null),
  extra: [],
  seats: Array(19).fill(false),
  pin: DEFAULT_PIN
};

let revision = 0;
let current = JSON.parse(JSON.stringify(defaults));
let draft;
let adminAuthenticated = false;

// Inicializa o cliente do Supabase se a biblioteca estiver carregada
const sb = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

function apply(data) {
  if (!data) return;
  if (Array.isArray(data.texts)) {
    textNodes.forEach((node, index) => {
      if (data.texts[index] !== undefined && data.texts[index] !== null) {
        node.data = data.texts[index];
      }
    });
  }
  if (Array.isArray(data.images)) {
    images.forEach((image, index) => {
      if (data.images[index]) image.src = data.images[index];
    });
  }
  if (Array.isArray(data.extra) && window.photos) {
    photos.querySelectorAll('[data-added]').forEach(img => img.remove());
    data.extra.forEach(src => {
      const img = Object.assign(document.createElement('img'), { src, alt: 'Foto da van da excursão' });
      img.dataset.added = '';
      photos.append(img);
    });
    if (window.photoCount && window.slides) {
      photoCount.textContent = (currentPhoto() + 1) + ' / ' + slides.length;
    }
  }
  if (Array.isArray(data.seats) && typeof renderSeats === 'function') {
    renderSeats(data.seats);
  }
}

// Carregar estado do Supabase
async function loadState() {
  if (!sb) {
    console.warn('[Advento] Supabase SDK não disponível. Operando com dados locais.');
    renderSeats(defaults.seats);
    return;
  }
  try {
    const { data, error } = await sb
      .from(TABLE_NAME)
      .select('revision, data')
      .eq('id', 1)
      .maybeSingle();

    if (error) {
      console.warn('[Advento] Tabela advento_site ainda não criada ou inacessível no Supabase:', error.message);
      renderSeats(defaults.seats);
      return;
    }

    if (data && data.data) {
      revision = data.revision || 0;
      current = Object.assign({}, defaults, data.data);
      apply(current);
    } else {
      renderSeats(defaults.seats);
    }
  } catch (err) {
    console.error('[Advento] Erro ao sincronizar com Supabase:', err);
    renderSeats(defaults.seats);
  }
}

// Ativa sincronização em tempo real (Realtime)
function setupRealtime() {
  if (!sb) return;
  try {
    sb.channel('advento-realtime-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLE_NAME }, payload => {
        if (payload.new && payload.new.data) {
          revision = payload.new.revision || revision + 1;
          current = Object.assign({}, defaults, payload.new.data);
          apply(current);
          console.log('[Advento] Estado atualizado em tempo real via Supabase.');
        }
      })
      .subscribe();
  } catch (err) {
    console.warn('[Advento] Realtime indisponível:', err);
  }
}

// Inicializar na carga da página
loadState().then(setupRealtime);

// Controle do portão de admin (clique no 2026 no rodapé)
entry.onclick = () => {
  gate.hidden = !gate.hidden;
  entry.setAttribute('aria-expanded', String(!gate.hidden));
  if (!gate.hidden) pin.focus();
};

function addFields(container, values, make) {
  container.replaceChildren(...values.map(make));
}

// Login no painel
gate.onsubmit = async event => {
  event.preventDefault();
  if (pin.disabled) return;
  pin.disabled = true;
  statusLine.textContent = '';

  try {
    const candidate = pin.value.trim();
    const validPin = (current && current.pin) ? String(current.pin) : DEFAULT_PIN;

    if (candidate !== validPin && candidate !== DEFAULT_PIN) {
      throw new Error('Código de acesso incorreto.');
    }

    adminAuthenticated = true;
    draft = JSON.parse(JSON.stringify(current));

    addFields(document.querySelector('#edit-seats'), draft.seats, (taken, index) => {
      const button = Object.assign(document.createElement('button'), { type: 'button', textContent: index + 1 });
      button.setAttribute('aria-pressed', String(taken));
      button.onclick = () => {
        draft.seats[index] = !draft.seats[index];
        button.setAttribute('aria-pressed', String(draft.seats[index]));
      };
      return button;
    });

    addFields(document.querySelector('#edit-texts'), draft.texts, (value, index) => {
      const label = document.createElement('label');
      const field = Object.assign(document.createElement('textarea'), { value, maxLength: 3000 });
      label.append('Texto ' + (index + 1), field);
      field.oninput = () => {
        draft.texts[index] = field.value;
      };
      return label;
    });

    gate.hidden = true;
    entry.setAttribute('aria-expanded', 'false');
    saveStatus.textContent = '';
    panel.showModal();
  } catch (error) {
    statusLine.textContent = error.message;
  } finally {
    pin.disabled = false;
    pin.value = '';
  }
};

document.querySelector('#close-admin').onclick = () => panel.close();
panel.addEventListener('close', () => {
  adminAuthenticated = false;
});

// Salvar alterações
save.onclick = async () => {
  if (!adminAuthenticated) {
    saveStatus.textContent = 'Sessão expirada. Faça login novamente.';
    return;
  }

  save.disabled = true;
  saveStatus.textContent = 'Salvando na nuvem...';

  try {
    if (!sb) throw new Error('Cliente Supabase não está disponível.');

    revision = revision + 1;
    const payload = {
      id: 1,
      revision: revision,
      data: draft,
      updated_at: new Date().toISOString()
    };

    const { error } = await sb
      .from(TABLE_NAME)
      .upsert(payload);

    if (error) {
      throw new Error('Erro ao salvar no Supabase: ' + error.message);
    }

    current = JSON.parse(JSON.stringify(draft));
    apply(current);
    saveStatus.textContent = 'Alterações salvas com sucesso!';
    setTimeout(() => {
      if (panel.open) panel.close();
    }, 1200);
  } catch (error) {
    saveStatus.textContent = error.message;
  } finally {
    save.disabled = false;
  }
};
