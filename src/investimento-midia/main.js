const CFG = {
      supabaseUrl: "https://jlyqptmxcloouaxumdqu.supabase.co",
      supabaseAnonKey: "sb_publishable_06dgJOD4td-HZzOvpeNn2w_sCz4swgJ",
      unidade: "braganca",
    };

    /* Para incluir uma seção: acrescente em NAV_ITEMS e um
       <section class="panel" data-panel="id"> no HTML.
       soon: true = visível, não clicável. */
    const NAV_ITEMS = [
      { id: "investimento", label: "Investimento por campanha" },
      { id: "como-funciona", label: "Como funciona" },
      { id: "resumo", label: "Resumo do mês" },
      { id: "historico", label: "Histórico / auditoria", badge: "em breve" },
      { id: "configuracoes", label: "Configurações" },
    ];

    const SIDEBAR_LINKS = [
      { href: "https://metabase.integration2u.com/dashboard/4", label: "Dashboard CAC", external: true },
    ];

    const els = {
      mes: document.getElementById("mes"),
      quem: document.getElementById("quem"),
      busca: document.getElementById("busca"),
      ordenacao: document.getElementById("ordenacao"),
      status: document.getElementById("status"),
      wrap: document.getElementById("tabelaWrap"),
      btnSalvar: document.getElementById("btnSalvar"),
      btnSalvarSticky: document.getElementById("btnSalvarSticky"),
      btnRecarregar: document.getElementById("btnRecarregar"),
      btnCopiarMes: document.getElementById("btnCopiarMes"),
      btnMesPrev: document.getElementById("btnMesPrev"),
      btnMesNext: document.getElementById("btnMesNext"),
      btnRetry: document.getElementById("btnRetry"),
      btnMenu: document.getElementById("btnMenu"),
      progressCard: document.getElementById("progressCard"),
      progressText: document.getElementById("progressText"),
      progressBar: document.getElementById("progressBar"),
      totalText: document.getElementById("totalText"),
      stickySave: document.getElementById("stickySave"),
      stickyText: document.getElementById("stickyText"),
      sidebar: document.getElementById("sidebar"),
      scrim: document.getElementById("scrim"),
      topbarTitle: document.getElementById("topbarTitle"),
      resumoMesLabel: document.getElementById("resumoMesLabel"),
      resumoLancadas: document.getElementById("resumoLancadas"),
      resumoPendentes: document.getElementById("resumoPendentes"),
      resumoDirty: document.getElementById("resumoDirty"),
      resumoTotal: document.getElementById("resumoTotal"),
    };

    let catalogo = [];
    let savedByCampanha = {};
    let draftByCampanha = {};
    let drawerOpen = false;

    function ymNow() {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    }

    function periodoMes() {
      const ym = els.mes.value;
      return ym ? `${ym}-01` : null;
    }

    function monthLabel() {
      if (!els.mes.value) return "";
      const [y, m] = els.mes.value.split("-").map(Number);
      const raw = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" })
        .format(new Date(y, m - 1, 1));
      return raw.charAt(0).toUpperCase() + raw.slice(1);
    }

    function shiftMonth(delta) {
      const [y, m] = els.mes.value.split("-").map(Number);
      const d = new Date(y, m - 1 + delta, 1);
      els.mes.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      reload();
    }

    function setStatus(text, kind) {
      els.status.textContent = text || "";
      els.status.className = "status" + (kind ? " " + kind : "");
      els.btnRetry.hidden = kind !== "err";
    }

    function formatBRL(n) {
      return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
    }

    function groupName(campanha) {
      const idx = campanha.indexOf(" - ");
      return idx > 0 ? campanha.slice(0, idx) : campanha;
    }

    function esc(s) {
      return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/"/g, "&quot;");
    }

    function buildNav() {
      const nav = document.getElementById("sidebarNav");
      nav.innerHTML = NAV_ITEMS.map((item) => {
        const badge = item.badge ? `<small>${esc(item.badge)}</small>` : "";
        if (item.soon) {
          return `<span class="nav-item is-soon" aria-disabled="true">${esc(item.label)}${badge || "<small>em breve</small>"}</span>`;
        }
        return `<a class="nav-item" href="#${item.id}" data-nav="${item.id}">${esc(item.label)}${badge}</a>`;
      }).join("");
      document.getElementById("sidebarLinks").innerHTML = SIDEBAR_LINKS.map((link) => {
        const extra = link.external ? ' target="_blank" rel="noreferrer"' : "";
        return `<a href="${esc(link.href)}"${extra}>${esc(link.label)}</a>`;
      }).join("");
    }

    function currentPanelId() {
      const h = (location.hash || "#investimento").replace(/^#/, "");
      const item = NAV_ITEMS.find((i) => i.id === h && !i.soon);
      return item ? item.id : "investimento";
    }

    function showPanel(id) {
      const item = NAV_ITEMS.find((i) => i.id === id && !i.soon) || NAV_ITEMS[0];
      document.querySelectorAll("[data-panel]").forEach((p) => {
        p.hidden = p.dataset.panel !== item.id;
      });
      document.querySelectorAll("[data-nav]").forEach((a) => {
        const on = a.dataset.nav === item.id;
        a.classList.toggle("is-active", on);
        if (on) a.setAttribute("aria-current", "page");
        else a.removeAttribute("aria-current");
      });
      els.topbarTitle.textContent = item.label;
      closeDrawer();
    }

    function openDrawer() {
      drawerOpen = true;
      els.sidebar.classList.add("open");
      els.scrim.classList.add("on");
      els.btnMenu.setAttribute("aria-expanded", "true");
      els.btnMenu.setAttribute("aria-label", "Fechar menu");
    }

    function closeDrawer() {
      drawerOpen = false;
      els.sidebar.classList.remove("open");
      els.scrim.classList.remove("on");
      els.btnMenu.setAttribute("aria-expanded", "false");
      els.btnMenu.setAttribute("aria-label", "Abrir menu");
    }

    async function rest(path, options) {
      const opts = options || {};
      const headers = Object.assign({
        apikey: CFG.supabaseAnonKey,
        Authorization: "Bearer " + CFG.supabaseAnonKey,
        Accept: "application/json",
        "Content-Type": "application/json",
      }, opts.headers || {});
      const res = await fetch(CFG.supabaseUrl + "/rest/v1/" + path, {
        method: opts.method || "GET",
        headers,
        body: opts.body ? JSON.stringify(opts.body) : undefined,
      });
      const raw = await res.text();
      let data = null;
      if (raw) {
        try { data = JSON.parse(raw); } catch (err) { data = raw; }
      }
      if (!res.ok) {
        const msg = (data && (data.message || data.hint || data.details)) || raw || res.statusText;
        throw new Error(msg);
      }
      return data;
    }

    async function loadCatalogo() {
      const q = "investimento_midia_catalogo?select=campanha,qtd_leads,ultimo_lead"
        + "&unidade=eq." + CFG.unidade
        + "&order=campanha";
      catalogo = await rest(q) || [];
    }

    async function loadMes(mes) {
      const target = mes || periodoMes();
      if (!target) return {};
      const q = "investimento_midia?select=campanha,valor_investimento,atualizado_em,atualizado_por"
        + "&unidade=eq." + CFG.unidade
        + "&periodo_mes=eq." + target
        + "&order=campanha";
      const rows = await rest(q) || [];
      const map = {};
      rows.forEach((row) => { map[row.campanha] = row; });
      return map;
    }

    async function loadMesAtual() {
      const map = await loadMes();
      savedByCampanha = map;
      draftByCampanha = {};
      Object.keys(map).forEach((campanha) => {
        draftByCampanha[campanha] = String(map[campanha].valor_investimento);
      });
    }

    function currentDraft(campanha) {
      if (Object.prototype.hasOwnProperty.call(draftByCampanha, campanha)) {
        return draftByCampanha[campanha];
      }
      const saved = savedByCampanha[campanha];
      return saved ? String(saved.valor_investimento) : "";
    }

    function isDirty(campanha) {
      const draft = currentDraft(campanha).trim();
      const saved = savedByCampanha[campanha];
      if (!saved) return draft !== "";
      return draft !== String(saved.valor_investimento);
    }

    function dirtyCampanhas() {
      return catalogo.map((item) => item.campanha).filter((name) => isDirty(name));
    }

    function filteredSorted() {
      const q = (els.busca.value || "").trim().toLowerCase();
      let list = catalogo.filter((item) => !q || item.campanha.toLowerCase().includes(q));
      const ord = els.ordenacao.value;
      list = list.slice().sort((a, b) => {
        if (ord === "leads") return (b.qtd_leads || 0) - (a.qtd_leads || 0);
        if (ord === "alfabetica") return a.campanha.localeCompare(b.campanha, "pt-BR");
        const aSaved = !!savedByCampanha[a.campanha] && !isDirty(a.campanha);
        const bSaved = !!savedByCampanha[b.campanha] && !isDirty(b.campanha);
        if (aSaved !== bSaved) return aSaved ? 1 : -1;
        const aDraft = currentDraft(a.campanha).trim();
        const bDraft = currentDraft(b.campanha).trim();
        const aPend = !aSaved && aDraft === "";
        const bPend = !bSaved && bDraft === "";
        if (aPend !== bPend) return aPend ? -1 : 1;
        return a.campanha.localeCompare(b.campanha, "pt-BR");
      });
      return list;
    }

    function rowTag(campanha) {
      if (isDirty(campanha)) {
        return '<span class="tag dirty" data-tag="' + esc(campanha) + '">não salvo</span>';
      }
      if (savedByCampanha[campanha]) {
        return '<span class="tag saved" data-tag="' + esc(campanha) + '">lançado</span>';
      }
      return '<span class="tag empty" data-tag="' + esc(campanha) + '">sem lançamento</span>';
    }

    function monthStats() {
      const total = catalogo.length;
      const launched = catalogo.filter((item) => {
        const c = item.campanha;
        return savedByCampanha[c] && !isDirty(c);
      }).length;
      const pending = catalogo.filter((item) => {
        const c = item.campanha;
        return !savedByCampanha[c] && currentDraft(c).trim() === "";
      }).length;
      let sum = 0;
      catalogo.forEach((item) => {
        const raw = currentDraft(item.campanha).trim();
        if (raw !== "") {
          const v = Number(String(raw).replace(",", "."));
          if (Number.isFinite(v)) sum += v;
        }
      });
      return { total, launched, pending, sum, dirty: dirtyCampanhas().length };
    }

    function updateProgress() {
      const s = monthStats();
      const pct = s.total ? Math.round((s.launched / s.total) * 100) : 0;
      els.progressCard.hidden = s.total === 0;
      els.progressText.textContent = s.launched + "/" + s.total + " lançadas";
      els.progressBar.style.width = pct + "%";
      els.totalText.textContent = formatBRL(s.sum) + " no rascunho";
      els.stickySave.classList.toggle("visible", s.dirty > 0);
      els.stickyText.textContent = s.dirty === 1
        ? "1 alteração não salva"
        : s.dirty + " alterações não salvas";
      els.resumoMesLabel.textContent = "Coorte " + monthLabel() + " (o mesmo mês da tela de lançamento).";
      els.resumoLancadas.textContent = s.total ? s.launched + " de " + s.total : "-";
      els.resumoPendentes.textContent = String(s.pending);
      els.resumoDirty.textContent = String(s.dirty);
      els.resumoTotal.textContent = formatBRL(s.sum);
    }

    function paintRowChrome(campanha) {
      const dirty = isDirty(campanha);
      document.querySelectorAll("tr[data-campanha], .card[data-campanha]").forEach((el) => {
        if (el.getAttribute("data-campanha") !== campanha) return;
        el.classList.toggle("dirty", dirty);
      });
      document.querySelectorAll('[data-tag]').forEach((el) => {
        if (el.getAttribute("data-tag") !== campanha) return;
        el.outerHTML = rowTag(campanha);
      });
    }

    function bindMoneyInput(input) {
      input.addEventListener("input", () => {
        const campanha = input.dataset.campanha;
        draftByCampanha[campanha] = input.value;
        document.querySelectorAll("input.money").forEach((el) => {
          if (el !== input && el.dataset.campanha === campanha) el.value = input.value;
        });
        paintRowChrome(campanha);
        updateProgress();
      });
    }

    function render(scrollTop) {
      const list = filteredSorted();
      if (!catalogo.length) {
        els.wrap.innerHTML = '<p class="empty">Nenhuma campanha no CRM ainda. Aguarde o sync do n8n (negociacoes_metabase).</p>';
        updateProgress();
        return;
      }
      if (!list.length) {
        els.wrap.innerHTML = '<p class="empty">Nenhuma campanha corresponde à busca.</p>';
        updateProgress();
        return;
      }

      const groups = new Map();
      list.forEach((item) => {
        const g = groupName(item.campanha);
        if (!groups.has(g)) groups.set(g, []);
        groups.get(g).push(item);
      });

      let tableHtml = '<div class="desktop-table">';
      let cardsHtml = '<div class="cards">';
      groups.forEach((items, gname) => {
        const gTitle = '<div class="group-title">' + esc(gname) + '</div>';
        tableHtml += gTitle + '<table><thead><tr><th>Campanha</th><th>Leads</th><th>Valor (R$)</th><th>Status</th></tr></thead><tbody>';
        items.forEach((item) => {
          const campanha = item.campanha;
          const draft = currentDraft(campanha);
          const dirty = isDirty(campanha);
          const safe = esc(campanha);
          tableHtml += `<tr class="${dirty ? "dirty" : ""}" data-campanha="${safe}">
            <td class="campanha">${safe}</td>
            <td class="leads">${item.qtd_leads || 0}</td>
            <td><input class="money" type="number" min="0" step="0.01" inputmode="decimal"
              placeholder="" title="Vazio apaga o lançamento" value="${esc(draft)}" data-campanha="${safe}" /></td>
            <td>${rowTag(campanha)}</td>
          </tr>`;
        });
        tableHtml += "</tbody></table>";
        cardsHtml += gTitle;
        items.forEach((item) => {
          const campanha = item.campanha;
          const draft = currentDraft(campanha);
          const dirty = isDirty(campanha);
          const safe = esc(campanha);
          cardsHtml += `<div class="card ${dirty ? "dirty" : ""}" data-campanha="${safe}">
            <div class="card-head"><strong>${safe}</strong>${rowTag(campanha)}</div>
            <div class="leads">${item.qtd_leads || 0} leads no CRM</div>
            <input class="money" type="number" min="0" step="0.01" inputmode="decimal"
              placeholder="" title="Vazio apaga o lançamento" value="${esc(draft)}" data-campanha="${safe}" />
          </div>`;
        });
      });
      tableHtml += "</div>";
      cardsHtml += "</div>";
      els.wrap.innerHTML = tableHtml + cardsHtml;
      els.wrap.querySelectorAll("input.money").forEach(bindMoneyInput);
      updateProgress();
      if (scrollTop) window.scrollTo(0, 0);
    }

    async function reload() {
      setStatus("Carregando…");
      els.btnSalvar.disabled = true;
      try {
        await loadCatalogo();
        await loadMesAtual();
        render(true);
        setStatus(catalogo.length + " campanhas do CRM · Bragança");
      } catch (err) {
        setStatus("Erro ao carregar: " + err.message, "err");
      } finally {
        els.btnSalvar.disabled = false;
      }
    }

    async function copiarMesAnterior() {
      const mes = periodoMes();
      if (!mes) return;
      const [y, m] = mes.split("-").map(Number);
      const prev = new Date(y, m - 2, 1);
      const prevMes = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}-01`;
      setStatus("Carregando mês anterior…");
      try {
        const prevMap = await loadMes(prevMes);
        let n = 0;
        catalogo.forEach((item) => {
          const c = item.campanha;
          if (!currentDraft(c).trim() && prevMap[c]) {
            draftByCampanha[c] = String(prevMap[c].valor_investimento);
            n++;
          }
        });
        render(false);
        setStatus(n ? "Pré-preenchidas " + n + " campanhas do mês anterior (não salvo)." : "Nada a copiar do mês anterior.");
      } catch (err) {
        setStatus("Erro: " + err.message, "err");
      }
    }

    async function save() {
      const mes = periodoMes();
      if (!mes) {
        setStatus("Escolha o mês.", "err");
        return;
      }
      const quem = (els.quem.value || "").trim() || "pagina-investimento";
      localStorage.setItem("lon22_quem", quem);
      const dirty = dirtyCampanhas();
      if (!dirty.length) {
        setStatus("Nada para salvar neste mês.");
        return;
      }
      els.btnSalvar.disabled = true;
      els.btnSalvarSticky.disabled = true;
      setStatus("Salvando " + dirty.length + " campanha(s)…");
      try {
        for (const campanha of dirty) {
          const raw = currentDraft(campanha).trim();
          const qs = "investimento_midia?unidade=eq." + CFG.unidade
            + "&periodo_mes=eq." + mes
            + "&campanha=eq." + encodeURIComponent(campanha);
          if (raw === "") {
            await rest(qs, { method: "DELETE" });
            continue;
          }
          const valor = Number(String(raw).replace(",", "."));
          if (!Number.isFinite(valor) || valor < 0) {
            throw new Error("Valor inválido em “" + campanha + "”");
          }
          await rest(
            "investimento_midia?on_conflict=unidade,periodo_mes,campanha",
            {
              method: "POST",
              headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
              body: [{
                unidade: CFG.unidade,
                periodo_mes: mes,
                campanha,
                valor_investimento: valor,
                atualizado_por: quem,
              }],
            }
          );
        }
        await loadMesAtual();
        render(false);
        setStatus("Salvo. " + Object.keys(savedByCampanha).length + " lançamento(s) neste mês.", "ok");
      } catch (err) {
        setStatus("Erro ao salvar: " + err.message, "err");
      } finally {
        els.btnSalvar.disabled = false;
        els.btnSalvarSticky.disabled = false;
      }
    }

    buildNav();
    showPanel(currentPanelId());
    window.addEventListener("hashchange", () => showPanel(currentPanelId()));

    els.mes.value = ymNow();
    els.quem.value = localStorage.getItem("lon22_quem") || "";
    els.quem.addEventListener("input", () => {
      localStorage.setItem("lon22_quem", (els.quem.value || "").trim());
    });
    els.mes.addEventListener("change", reload);
    els.busca.addEventListener("input", () => render(false));
    els.ordenacao.addEventListener("change", () => render(false));
    els.btnRecarregar.addEventListener("click", reload);
    els.btnRetry.addEventListener("click", reload);
    els.btnCopiarMes.addEventListener("click", copiarMesAnterior);
    els.btnMesPrev.addEventListener("click", () => shiftMonth(-1));
    els.btnMesNext.addEventListener("click", () => shiftMonth(1));
    els.btnSalvar.addEventListener("click", save);
    els.btnSalvarSticky.addEventListener("click", save);
    els.btnMenu.addEventListener("click", () => (drawerOpen ? closeDrawer() : openDrawer()));
    els.scrim.addEventListener("click", closeDrawer);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeDrawer();
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) save();
    });
    window.addEventListener("beforeunload", (e) => {
      if (dirtyCampanhas().length) {
        e.preventDefault();
        e.returnValue = "";
      }
    });
    reload();
