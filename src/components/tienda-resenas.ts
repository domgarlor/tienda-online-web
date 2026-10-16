// Web Component con Shadow DOM abierto: widget de opiniones de clientes.
// Todo su contenido vive dentro de `shadowRoot`, así que document.querySelector
// no lo ve: Playwright lo atraviesa solo, Selenium necesita getShadowRoot().
const STORAGE_KEY = 'tienda-resenas';

interface Resena {
  estrellas: number;
  texto: string;
}

const PLANTILLA = `
  <style>
    :host { display: block; max-width: 40rem; font-family: inherit; }
    section { border: 1px solid #d1d5db; border-radius: 0.5rem; background: #fff; padding: 1rem; }
    h2 { margin: 0 0 0.5rem; font-size: 1.125rem; }
    .estrellas { display: flex; gap: 0.25rem; margin: 0.25rem 0 0.75rem; }
    .estrellas button { font-size: 1.5rem; background: none; border: none; cursor: pointer; color: #9ca3af; }
    .estrellas button[aria-checked="true"] { color: #f59e0b; }
    textarea { width: 100%; box-sizing: border-box; border: 1px solid #d1d5db; border-radius: 0.25rem; padding: 0.5rem; }
    .publicar { margin-top: 0.5rem; background: #059669; color: #fff; border: none; border-radius: 0.25rem; padding: 0.4rem 0.9rem; cursor: pointer; }
    .error { color: #dc2626; margin: 0.25rem 0 0; }
    ul { list-style: none; padding: 0; margin: 1rem 0 0; display: grid; gap: 0.5rem; }
    li { border-top: 1px solid #e5e7eb; padding-top: 0.5rem; }
  </style>
  <section aria-labelledby="titulo">
    <h2 id="titulo">Opiniones de clientes</h2>
    <p data-testid="media" role="status"></p>
    <div role="radiogroup" aria-label="Valoración" class="estrellas"></div>
    <label for="texto">Tu opinión</label>
    <textarea id="texto" rows="3"></textarea>
    <p class="error" role="alert" hidden></p>
    <button type="button" class="publicar">Publicar opinión</button>
    <ul data-testid="lista-resenas" aria-label="Opiniones publicadas"></ul>
  </section>
`;

class TiendaResenas extends HTMLElement {
  private estrellas = 0;
  private root!: ShadowRoot;

  connectedCallback() {
    this.root = this.attachShadow({ mode: 'open' });
    this.root.innerHTML = PLANTILLA;

    const grupo = this.root.querySelector('.estrellas')!;
    for (let n = 1; n <= 5; n++) {
      const boton = document.createElement('button');
      boton.type = 'button';
      boton.setAttribute('role', 'radio');
      boton.setAttribute('aria-checked', 'false');
      boton.setAttribute('aria-label', `${n} ${n === 1 ? 'estrella' : 'estrellas'}`);
      boton.textContent = '★';
      boton.addEventListener('click', () => this.elegir(n));
      grupo.appendChild(boton);
    }

    this.root.querySelector('.publicar')!.addEventListener('click', () => this.publicar());
    this.pintar();
  }

  private elegir(n: number) {
    this.estrellas = n;
    this.root.querySelectorAll('.estrellas button').forEach((b, i) => {
      b.setAttribute('aria-checked', String(i + 1 === n));
    });
  }

  private leer(): Resena[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as Resena[];
    } catch {
      return [];
    }
  }

  private publicar() {
    const area = this.root.querySelector('textarea')!;
    const error = this.root.querySelector<HTMLElement>('.error')!;
    const texto = area.value.trim();

    if (this.estrellas === 0 || texto === '') {
      error.textContent = 'Elige una valoración y escribe tu opinión.';
      error.hidden = false;
      return;
    }
    error.hidden = true;

    localStorage.setItem(STORAGE_KEY, JSON.stringify([{ estrellas: this.estrellas, texto }, ...this.leer()]));
    area.value = '';
    this.elegir(0);
    this.pintar();
    this.dispatchEvent(new CustomEvent('resena-publicada', { bubbles: true, composed: true }));
  }

  private pintar() {
    const resenas = this.leer();
    const media = this.root.querySelector('[data-testid="media"]')!;
    media.textContent = resenas.length
      ? `Valoración media: ${(resenas.reduce((s, r) => s + r.estrellas, 0) / resenas.length).toFixed(1)} (${resenas.length} opiniones)`
      : 'Aún no hay opiniones. ¡Sé el primero!';

    const lista = this.root.querySelector('ul')!;
    lista.replaceChildren(
      ...resenas.map((r) => {
        const li = document.createElement('li');
        li.setAttribute('data-testid', 'resena');
        li.textContent = `${'★'.repeat(r.estrellas)} ${r.texto}`;
        return li;
      }),
    );
  }
}

if (!customElements.get('tienda-resenas')) {
  customElements.define('tienda-resenas', TiendaResenas);
}
