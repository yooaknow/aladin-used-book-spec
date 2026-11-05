(() => {
  const app = document.getElementById("app");
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const byId = Object.fromEntries(SCREENS.map((s) => [s.id, s]));
  const byKey = Object.fromEntries(SCREENS.map((s) => [s.key, s]));
  const ELS = SCREENS.reduce((n, s) => n + s.els.length, 0);
  const FNS = new Set(SCREENS.flatMap((s) => s.els.flatMap((e) => e.p.map((f) => f.id)))).size;
  const docHref = (sc, n) => `#/doc/${sc}${n ? "/" + n : ""}`;
  const demoHref = (key, n) => `#/demo/${key}${n ? "/" + n : ""}`;
  const findEl = (sc, n) => byId[sc].els.find((e) => e.n === n);
  const bullets = (items) => `<ul class="bullets">${items.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>`;

  // 번호(SC·F·R·P·C) → 사람이 읽는 이름. 글에는 이름만 보이고, 번호는 제목 옆에 작게만 둔다
  const LABEL = {};
  SCREENS.forEach((s) => {
    LABEL[s.id] = `${s.short} 화면`;
    s.els.forEach((e) => {
      LABEL[`${s.id}/${e.n}`] = `${s.short} ${e.n} ${e.name}`;
      e.p.forEach((f) => { LABEL[f.id] = f.name; });
    });
  });
  const label = (id) => LABEL[id] || id;
  const elTag = (sc, n) => `${byId[sc].short} ${n}`;
  const codeTag = (id) => `<span class="code">${id}</span>`;

  // 글 안의 번호는 이름 링크로, `코드`는 코드 글꼴로, [제안]은 ‘기획 제안’ 표시로 바꾼다
  const ID_RE = /\b(SC-[A-Z]{3}-\d{2}(?:\/\d{2})?|F-[A-Z]{3}-\d{2})\b/g;
  const idHref = (id) => (id.startsWith("SC-") ? docHref(...id.split("/")) : `#/doc/${id}`);
  const idLink = (id, cls = "rid") => `<a class="${cls}" href="${idHref(id)}" title="${id}">${esc(label(id))}</a>`;
  const SUGGEST = '<span class="chip amber sm">기획 제안</span>';
  const rich = (s) => esc(s)
    .replace(/`([^`]+)`/g, '<code class="c">$1</code>')
    .replace(/\[제안\]\s*/g, SUGGEST + " ")
    .replace(ID_RE, (m) => idLink(m));

  // 항목 목록: 문자열 하나면 한 줄, 배열이면 개조식 목록. "개발 참고:"로 시작하면 따로 표시
  const DEV = "개발 참고:";
  function list(items) {
    if (!Array.isArray(items)) return `<p class="one">${rich(items)}</p>`;
    return `<ul class="dots">${items.map((t) => t.startsWith(DEV)
      ? `<li class="dev"><b>개발 참고</b> ${rich(t.slice(DEV.length).trim())}</li>`
      : `<li>${rich(t)}</li>`).join("")}</ul>`;
  }
  // 하단 여백만 유지(문구 없음)
  const footer = () => `<div class="foot" aria-hidden="true"></div>`;
  const isSplit = () => window.innerWidth > 1020;

  function thumb(s, b, w = 210, maxH = 170, hl = true) {
    const k = w / s.w, pad = 18;
    const top = Math.max(0, b[1] - pad);
    const hgt = Math.round(Math.min((b[3] + pad * 2) * k, maxH));
    const box = hl ? `<span class="thumb-box" style="left:${b[0] * k}px;top:${(b[1] - top) * k}px;width:${b[2] * k}px;height:${b[3] * k}px"></span>` : "";
    return `<div class="thumb" style="height:${hgt}px"><div style="position:relative;width:${w}px;height:${hgt}px;margin:0 auto;overflow:hidden"><img src="${s.img}" alt="" style="left:0;top:${-top * k}px;width:${w}px;height:${s.h * k}px;transform:none">${box}</div></div>`;
  }

  /* ---------------- 전체 흐름 보기 ---------------- */
  function renderFlow() {
    const steps = FLOW.map((f, i) => {
      const s = byId[f.sc], el = findEl(f.sc, f.el);
      return `<article class="card step">
        <div class="step-head"><span>${String(i + 1).padStart(2, "0")}</span><span class="chip purple">${elTag(f.sc, f.el)}</span></div>
        <h3>${esc(f.title)}</h3>
        ${thumb(s, el.boxes[0])}
        <p>${esc(f.desc)}</p>
        <div class="btns"><a class="btn small" href="${docHref(f.sc, f.el)}">문서 보기</a><a class="btn small primary" href="${demoHref(s.key, f.el)}">시연하기</a></div>
        <div class="next">${esc(f.next)}</div>
      </article>`;
    }).join("");

    const sides = [
      { t: "담기 완료 알림 → 장바구니", path: "상품 상세 ‘장바구니’ → 완료 알림의 ‘장바구니 보기’ → 장바구니", d: ["담기 완료 알림의 링크로 장바구니로 이동", "알림은 화면 아래 구매 바 위에 잠깐 뜸"], chips: ["SC-DET-01/06"], demo: demoHref("det", "06") },
      { t: "필터 적용", path: "가격 비교 ‘저가격순’·‘모든 품질 등급’ → 아래에서 필터 창 → ‘필터 적용하기’", d: ["‘정렬 순서’ 탭·‘반값택배만 보기’·‘필터 적용하기’까지 동작", "바깥 어두운 부분 누름 → 닫힘"], chips: ["SC-CMP-01/02"], demo: demoHref("cmp", "02") },
      { t: "보관", path: "가격 비교 보관 아이콘 → 눌린 모양 + 보관 완료 알림", d: ["보관 완료 알림은 잠시 뒤 자동으로 닫힘"], chips: ["SC-CMP-01/04"], demo: demoHref("cmp", "04") },
      { t: "Thanks to 안내·공감", path: "상품 상세 리뷰 ⓘ → Thanks to 설명 말풍선 / 공감 → 눌린 모양", d: ["말풍선은 아이콘 바로 위에 뜸", "말풍선 바깥 누름 → 닫힘"], chips: ["SC-DET-01/05"], demo: demoHref("det", "05") },
      { t: "뒤로 가기", path: "장바구니 → 상품 상세 → 가격 비교 → 홈", d: ["화면 위 뒤로 아이콘으로 이전 화면으로"], chips: [], demo: demoHref("crt") },
      { t: "금액 연결", path: "5,400원 + 일리아스 18,000원 + 배송비 3,500원 = 26,900원", d: ["가격 비교·상세·장바구니의 판매자·상태·금액이 모두 같음 (우나야하 · 중 · 64%)"], chips: ["SC-CRT-01/02"], demo: demoHref("crt", "02") }
    ].map((m) => `<article class="card mini"><h3>${esc(m.t)}</h3><div class="path">${esc(m.path)}</div>${bullets(m.d)}
        <div class="chips">${m.chips.map((c) => idLink(c, "chip purple")).join("")}${m.tag ? `<span class="chip amber">${m.tag}</span>` : ""}<a class="chip line" href="${m.demo}">시연하기</a></div></article>`).join("");

    app.innerHTML = `<div class="wrap">
      <p class="eyebrow">전체 흐름 보기</p>
      <h1>중고책 구매 흐름 한눈에 보기</h1>
      ${bullets(["홈 ‘온라인 중고’ → 가격 비교 → 상품 상세 → 장바구니 순서", "단계마다 ‘문서 보기’와 ‘시연하기’로 바로 이동"])}
      <div class="btns"><a class="btn" href="#/doc">명세 전체 읽기</a><a class="btn primary" href="${demoHref("hom", "10")}">시연 이어보기</a></div>
      <div class="chips"><span class="chip">화면 4개</span><span class="chip purple">요소 ${ELS}개</span><span class="chip purple">기능 ${FNS}개</span></div>

      <section class="section">
        <h2>중고책 구매 핵심 흐름</h2>
        <p class="muted">‘온라인 중고’의 &lt;소년이 온다&gt;를 사는 흐름 (피그마에 연결된 순서 기준)</p>
        <div class="strip"><span>홈 · 온라인 중고</span><span class="arrow">→</span><span>가격 비교 · 판매 상품 고르기</span><span class="arrow">→</span><span>상품 상세 · 장바구니 담기</span><span class="arrow">→</span><span class="soft">완료 알림 ‘장바구니 보기’</span><span class="arrow">→</span><span>장바구니 · 주문하기</span></div>
        <div class="grid steps">${steps}</div>
      </section>

      <section class="section">
        <h2>보조 흐름</h2>
        <p class="muted">핵심 흐름 중간에 뜨는 창, 뒤로 가기, 금액 연결</p>
        <div class="grid two">${sides}</div>
      </section>
    </div>${footer()}`;
  }

  /* ---------------- 문서 보기 ---------------- */
  const G_ROWS = [["role", "역할"], ["show", "화면에 보이는 것"], ["act", "기획 내용"], ["memo", "디자인 메모"]];
  const F_ROWS = [["when", "실행 조건"], ["rule", "처리 규칙"], ["steps", "처리 순서"], ["ok", "성공하면"], ["fail", "실패하면"]];

  // 동작 여부 (피그마 프로토타입 연결 기준): on 동작 / part 일부 동작 / view·off 동작하지 않음
  const ST_CHIP = {
    on: '<span class="chip st-on">동작</span>',
    part: '<span class="chip st-part">일부 동작</span>',
    view: '<span class="chip st-off">동작하지 않음</span>',
    off: '<span class="chip st-off">동작하지 않음</span>'
  };
  const elStatus = (im) => (!im.works.length ? "off" : im.noop.length ? "part" : "on");

  // 원래 기획한 기능: 개발할 내용과 헷갈리지 않게 연한 회색으로 접어 둔다
  const plannedBox = (body) => (body ? `<details class="planned"><summary>원래 기획한 기능 (참고용)</summary>${body}</details>` : "");

  function fnDoc(f) {
    if (f.ref) return `<div class="fn"><div class="fn-name">${esc(f.name)} ${codeTag(f.id)}</div><p class="ref">여러 요소가 같이 쓰는 기능 · 규칙은 ${rich(f.ref)}에 적어 둠</p>${f.note ? list(f.note) : ""}${plannedBox(f.planned && list(f.planned))}</div>`;
    const st = FN_STATUS[f.id] || "on";
    const head = `<div class="fn-name">${esc(f.name)} ${ST_CHIP[st]} ${codeTag(f.id)}</div>`;
    const rows = F_ROWS.filter(([k]) => f[k]).map(([k, l]) => {
      const v = k === "steps" ? `<ol class="steps-ol">${f.steps.map((t) => `<li>${rich(t)}</li>`).join("")}</ol>` : list(f[k]);
      return `<dt>${l}</dt><dd>${v}</dd>`;
    }).join("");
    const extra = f.planned ? list(f.planned) : "";
    // 동작하지 않는 기능은 "동작하지 않음"만 보이고, 원래 기획은 회색 칸에 접어 둔다
    if (st === "view" || st === "off") {
      return `<div class="fn" id="${f.id}">${head}<p class="off-line">동작하지 않음${st === "view" ? " · 화면에 보이기만 함" : ""}</p>${plannedBox(`<dl>${rows}</dl>${extra}`)}</div>`;
    }
    return `<div class="fn" id="${f.id}">${head}<dl>${rows}</dl>${plannedBox(extra)}</div>`;
  }

  // 요소에서 동작하는 것 / 동작하지 않는 것
  function implBox(im) {
    const on = im.works.length ? `<div class="impl-on"><b>동작</b>${list(im.works)}</div>` : "";
    const off = `<div class="impl-off"><b>동작하지 않음</b>${im.noop.length ? list(im.noop) : '<p class="one">화면에 보이기만 함</p>'}</div>`;
    return `<div class="impl">${on}${im.noop.length || !im.works.length ? off : ""}</div>`;
  }

  function elDoc(s, e) {
    const im = IMPL[`${s.id}/${e.n}`] || { works: [], noop: [] };
    const tags = [ST_CHIP[elStatus(im)]];
    if (e.flowStart) tags.push('<span class="chip pink">흐름 시작</span>');
    if (e.flowStep) tags.push('<span class="chip pink">핵심 흐름</span>');
    if (e.memo) tags.push('<span class="chip gray">디자인 메모 있음</span>');
    const g = G_ROWS.filter(([k]) => e[k]).map(([k, l]) => {
      const a = k === "memo" ? ' class="annot"' : k === "role" ? ' class="role"' : "";
      return `<dt${a}>${l}</dt><dd${a}>${list(e[k])}</dd>`;
    }).join("");
    return `<article class="el" id="${s.id}-${e.n}" data-sc="${s.id}" data-el="${e.n}">
      <div class="el-head"><div class="el-title"><span class="id">${elTag(s.id, e.n)}</span><h3>${esc(e.name)}</h3>${codeTag(`${s.id}/${e.n}`)}</div><a class="btn small" href="${demoHref(s.key, e.n)}">이 요소 시연</a></div>
      <div class="chips">${e.fns.map((f) => `<span class="chip purple">기능: ${esc(label(f))}</span>`).join("")}${tags.join("")}</div>
      <div class="print-only print-crop">${thumb(s, e.boxes[0], 230, 380)}</div>
      <div class="pair">
        <section class="spec green"><h4>화면설계서</h4><p class="sub">무엇이 보이고, 어떻게 움직이나</p><dl>${g}</dl>${plannedBox(e.planned && list(e.planned))}</section>
        <section class="spec purple"><h4>기능명세서</h4><p class="sub">무엇이 동작하고, 어떻게 처리하나</p>${implBox(im)}${e.p.map(fnDoc).join("")}</section>
      </div>
    </article>`;
  }

  // 캡처 + 번호 테두리 (design 좌표, 캔버스가 배율을 가짐)
  function boxesHtml(s) {
    return s.els.flatMap((e) => e.boxes.map((b, i) => ({ e, b, i })))
      .sort((a, b) => b.b[2] * b.b[3] - a.b[2] * a.b[3])
      .map(({ e, b, i }) => `<button type="button" class="box" data-el="${e.n}" style="left:${b[0]}px;top:${b[1]}px;width:${b[2]}px;height:${b[3]}px" aria-label="${e.n} ${esc(e.name)} 명세로 이동">${i === 0 ? `<span class="badge">${e.n}</span>` : ""}</button>`).join("");
  }

  function screenDoc(s) {
    const W = 276, k = W / s.w;
    // 인쇄 전용: 화면 전체를 한 페이지 높이에 맞춘 개요 + 요소 번호 목록
    // (transform 없이 축소 좌표로 직접 배치해야 인쇄 시 박스가 다음 페이지로 밀리지 않음)
    const PK = Math.min(300 / s.w, 860 / s.h), px = (v) => (v * PK).toFixed(1);
    const poBoxes = s.els.map((e) => e.boxes.map((b, i) => `<span class="po-box" style="left:${px(b[0])}px;top:${px(b[1])}px;width:${px(b[2])}px;height:${px(b[3])}px">${i === 0 ? `<span class="badge">${e.n}</span>` : ""}</span>`).join("")).join("");
    const overview = `<div class="print-only print-overview"><div class="po-shot" style="width:${px(s.w)}px;height:${px(s.h)}px"><img src="${s.img}" alt="${esc(s.name)} 화면" style="width:${px(s.w)}px;height:${px(s.h)}px">${poBoxes}</div><ol class="po-legend">${s.els.map((e) => `<li><b>${e.n}</b>${esc(e.name)}</li>`).join("")}</ol></div>`;
    const extras = s.extras.length ? `<div class="box-section"><h3>화면 위에 뜨는 창·알림</h3><div class="extras">${s.extras.map((x) => `<div class="extra"><div class="img"><img src="${x.img}" alt="${esc(x.name)}" style="width:${Math.min(x.w, 300)}px"></div><b>${esc(x.name)}</b>${list(x.desc)}</div>`).join("")}</div></div>` : "";
    const flowItem = (f) => {
      if (f.startsWith("[시연]")) return `<li class="proto"><span class="chip pink sm">시연 흐름</span> ${rich(f.slice(4).trim())}</li>`;
      return `<li>${rich(f)}</li>`;
    };
    return `<section class="card screen" id="${s.id}" data-sc="${s.id}">
      <div class="screen-head">
        <div><h2>${esc(s.name)}${codeTag(s.id)}</h2><p>${esc(s.summary)}</p>
          <dl class="meta"><dt>들어오는 곳</dt><dd>${s.entry.map(esc).join(" · ")}</dd><dt>피그마 원본</dt><dd>최종 디자인 ${s.source}</dd></dl></div>
        <div><a class="btn" href="${demoHref(s.key)}">이 화면 시연</a></div>
      </div>
      ${overview}
      <div class="screen-body">
        <aside class="shot inline-shot" data-sc="${s.id}">
          <div class="shot-scroll"><div class="shot-canvas" style="width:${W}px;height:${Math.round(s.h * k)}px"><div class="shot-scale" style="transform:scale(${k})"><img src="${s.img}" alt="${esc(s.name)} 화면" loading="lazy" width="375" height="${s.h}">${boxesHtml(s)}</div></div></div>
          <p class="hint">보라색 번호를 누르면 그 설명으로 이동</p>
        </aside>
        <div class="els">
          ${s.els.map((e) => elDoc(s, e)).join("")}
          <div class="box-section"><h3>사용자 이동 경로</h3><ul class="flowlist">${s.flow.map(flowItem).join("")}</ul></div>
          ${extras}
        </div>
      </div>
    </section>`;
  }

  function commonDoc() {
    const idmap = SCREENS.map((s) => `<div class="cid"><div class="cid-head">${esc(s.name)}</div><ul>${s.els.map((e) => `<li><a href="${docHref(s.id, e.n)}"><b>${e.n}</b> ${esc(e.name)}</a><span class="muted">→ ${e.fns.map((f) => esc(label(f))).join(", ")}</span></li>`).join("")}</ul></div>`).join("");
    return `<section class="card common" id="common">
      <div class="box-section" id="idmap" style="margin-top:0"><h3>화면별 요소·기능 목록</h3><div class="idmap">${idmap}</div></div>
      <div class="box-section" id="log"><h3>검토·결정 기록</h3><ul class="log">${LOG.map((l) => `<li><time>${l[0]}</time>${list(l[1])}</li>`).join("")}</ul></div>
    </section>`;
  }

  const docState = { sc: null, el: null };
  function renderDoc() {
    const finder = SCREENS.map((s) => `<div class="finder-row"><div class="label">${esc(s.short)}</div><div class="chips"><a class="chip sc-link" href="${docHref(s.id)}">${esc(s.short)} 화면</a>${s.els.map((e) => `<a class="chip purple" href="${docHref(s.id, e.n)}" title="${esc(e.name)}">${e.n}</a>`).join("")}</div></div>`).join("")
      + `<div class="finder-row"><div class="label">목록·기록</div><div class="chips"><a class="chip gray" href="#/doc/idmap">요소·기능 목록</a><a class="chip gray" href="#/doc/log">검토 기록</a></div></div>`;
    app.innerHTML = `<div class="split doc-split">
      <aside class="split-left doc-left">
        <div class="seg" id="dseg">${SCREENS.map((s) => `<a href="${docHref(s.id)}" data-seg="${s.id}">${esc(s.short)}</a>`).join("")}</div>
        <div class="phone" id="dphone" data-reserve="84"><div class="phone-screen"><div class="scroller" id="dscroller"><div class="canvas-wrap" id="dwrap"><div class="canvas" id="dcanvas"></div></div></div></div></div>
        <p class="hint">보라색 번호를 누르면 그 설명으로 이동</p>
      </aside>
      <div class="split-right" id="dright">
        <p class="eyebrow">문서 보기</p>
        <h1>화면과 명세 펼쳐 읽기</h1>
        ${bullets(["화면 캡처의 보라색 번호 = 아래 설명의 요소 번호", "화면설계서: 무엇이 보이고, 어떻게 움직이나", "기능명세서: 언제, 무엇을 처리하고, 결과는 어떤가"])}
        <div class="btns"><a class="btn" href="#/flow">전체 흐름 보기</a><button class="btn" type="button" data-print>문서 인쇄</button></div>
        <div class="chips"><span class="chip">화면 4개</span><span class="chip purple">요소 ${ELS}개</span><span class="chip purple">기능 ${FNS}개</span></div>
        <nav class="card finder" aria-label="화면 번호로 찾기"><h2>요소 번호로 찾기</h2>${finder}</nav>
        ${SCREENS.map(screenDoc).join("")}
        ${commonDoc()}
        ${footer()}
      </div>
    </div>`;
    docState.sc = null; docState.el = null;
    fitPhones();
    setDocScreen(SCREENS[0].id);
    document.getElementById("dright").addEventListener("scroll", onDocScroll, { passive: true });
  }

  function setDocScreen(id) {
    if (docState.sc === id) return;
    const s = byId[id];
    docState.sc = id; docState.el = null; docState.switched = true;
    document.getElementById("dwrap").style.height = `calc(${s.h}px * var(--s))`;
    document.getElementById("dcanvas").innerHTML = `<img src="${s.img}" alt="${esc(s.name)} 화면" width="375" height="${s.h}">${boxesHtml(s)}`;
    document.getElementById("dscroller").scrollTop = 0;
    document.querySelectorAll("#dseg a").forEach((a) => a.classList.toggle("on", a.dataset.seg === id));
  }

  function setDocEl(sc, n) {
    const key = sc + "/" + n;
    if (docState.el === key) return;
    docState.el = key;
    document.querySelectorAll(`#dcanvas .box, .inline-shot .box`).forEach((b) => {
      const inSc = b.closest(".inline-shot") ? b.closest(".inline-shot").dataset.sc === sc : docState.sc === sc;
      b.classList.toggle("on", inSc && b.dataset.el === n);
    });
    if (!isSplit()) return;
    const box = document.querySelector(`#dcanvas .box[data-el="${n}"]`);
    const sc2 = document.getElementById("dscroller");
    if (!box || !sc2) return;
    const instant = docState.switched;
    docState.switched = false;
    setTimeout(() => {
      const s = curScale(document.getElementById("dphone"));
      const top = box.offsetTop * s, h = box.offsetHeight * s, view = sc2.scrollTop;
      if (top < view + 16 || top + Math.min(h, sc2.clientHeight * 0.6) > view + sc2.clientHeight - 16) {
        const y = Math.max(0, top - 70 * s);
        if (instant) sc2.scrollTop = y; else sc2.scrollTo({ top: y, behavior: "smooth" });
      }
    }, 0);
  }

  let docTick = false;
  function onDocScroll() {
    if (docTick) return;
    docTick = true;
    setTimeout(() => {
      docTick = false;
      const pane = isSplit() ? document.getElementById("dright") : null;
      const base = pane ? pane.getBoundingClientRect().top : document.querySelector(".top").offsetHeight;
      let cur = null;
      document.querySelectorAll(".screen").forEach((sec) => { if (sec.getBoundingClientRect().top - base <= 160) cur = sec.dataset.sc; });
      if (pane) setDocScreen(cur || SCREENS[0].id);
      if (!cur) return;
      let el = null;
      document.querySelectorAll(`.el[data-sc="${cur}"]`).forEach((a) => { if (a.getBoundingClientRect().top - base <= 200) el = a.dataset.el; });
      if (el) setDocEl(cur, el);
    }, 60);
  }

  /* ---------------- 시연하기 ---------------- */
  const state = { showHot: true, pressed: {}, history: [], sheet: { opt: 0, half: false } };
  const OPTS = ["모든 품질등급", "최상", "상", "중"];
  let demoTimers = [];
  let barIO = null;

  const actText = (a) => ({ go: `→ ${byKey[a.to]?.short ?? ""}`, sheet: "필터 창", cabinet: "보관 완료 알림", toggle: "눌린 모양", tooltip: "Thanks to 설명 말풍선", cartSnack: "담기 완료 알림", noop: "동작하지 않음" }[a.act]);
  const hotHtml = (a, attr = "data-hot") => `<button type="button" class="hot${state.pressed[a.key] ? " pressed" : ""}" ${attr}="${a.id}" style="left:${a.r[0]}px;top:${a.r[1]}px;width:${a.r[2]}px;height:${a.r[3]}px" aria-label="${esc(a.label)}"></button>`;

  function renderDemo(key, hl) {
    const s = byKey[key] || byKey.hom;
    demoTimers.forEach(clearTimeout); demoTimers = [];
    if (barIO) { barIO.disconnect(); barIO = null; }
    const acts = DEMO[s.key].map((a) => ({ ...a, key: s.key + ":" + a.id }));
    const hots = [...acts].sort((a, b) => b.r[2] * b.r[3] - a.r[2] * a.r[3]).map((a) => hotHtml(a)).join("");
    const O = DEMO_OVERLAY;
    const stepIdx = FLOW.findIndex((f) => f.sc === s.id);
    let fixbar = "";
    if (s.key === "det") {
      fixbar = `<div class="fixbar" id="fixbar" style="height:calc(73px * var(--s))"><div class="fixbar-inner" style="height:73px;background:url(${s.img}) 0 -${s.h - 73}px / 375px ${s.h}px no-repeat">${hotHtml({ id: "cart", r: [64, 17, 144, 40], label: "하단 ‘장바구니’", key: "det:cartfix" })}</div></div>`;
    } else if (s.key === "crt") {
      fixbar = `<div class="fixbar" id="fixbar" style="height:calc(110px * var(--s))"><div class="fixbar-inner" style="height:110px"><img src="${O.bottombar.img}" alt="선택 상품 총 2종 2개 26,900원 주문하기" style="position:absolute;left:-${O.bottombar.padX}px;top:-${O.bottombar.padTop}px;width:${O.bottombar.w}px;height:${O.bottombar.h}px"></div></div>`;
    }
    const snackBottom = s.key === "det" ? 73 + 24 : 24;
    const sh = O.sheet;
    const sheetHots = [
      ...sh.tabs.map((r, i) => `<button type="button" class="hot" data-sheet="tab${i}" style="left:${r[0]}px;top:${r[1]}px;width:${r[2]}px;height:${r[3]}px" aria-label="${i ? "품질 등급" : "정렬 순서"} 탭"></button>`),
      `<button type="button" class="hot${state.sheet.half ? " sel" : ""}" data-sheet="half" style="left:${sh.half[0] - 18}px;top:${sh.half[1] - 4}px;width:${sh.half[2] + 22}px;height:${sh.half[3] + 8}px" aria-label="반값택배만 보기"></button>`,
      ...sh.options.map((r, i) => `<button type="button" class="hot${state.sheet.opt === i ? " sel" : ""}" data-sheet="opt${i}" style="left:${r[0]}px;top:${r[1]}px;width:${r[2]}px;height:${r[3]}px" aria-label="${OPTS[i]}"></button>`),
      `<button type="button" class="hot" data-sheet="reset" style="left:${sh.reset[0]}px;top:${sh.reset[1]}px;width:${sh.reset[2]}px;height:${sh.reset[3]}px" aria-label="초기화"></button>`,
      `<button type="button" class="hot" data-sheet="apply" style="left:${sh.apply[0]}px;top:${sh.apply[1]}px;width:${sh.apply[2]}px;height:${sh.apply[3]}px" aria-label="필터 적용하기"></button>`
    ].join("");

    const actionList = acts.map((a) => `<button type="button" class="action" data-pulse="${a.id}"><b>${esc(a.label)}</b><span>${esc(actText(a))}</span>${a.note ? `<small>${esc(a.note)}</small>` : ""}</button>`).join("");
    const notes = {
      crt: ["아래 주문 바: 본문 ‘결제 금액’이 보이면 숨김", "‘주문하기’ 다음의 주문 단계는 피그마에 연결 안 됨"],
      det: ["아래 구매 바(장바구니·주문하기)는 화면 맨 아래에 붙어 있음", "‘주문하기’·보관 아이콘은 피그마에 연결 안 됨"],
      hom: [],
      cmp: ["‘장바구니’·‘주문하기’ 버튼은 피그마에 연결 안 됨", "장바구니 담기는 상품 상세 화면에서 연결"]
    }[s.key];

    app.innerHTML = `<div class="split demo-split">
      <div class="split-left">
        <div class="phone${state.showHot ? " show-hot" : ""}" id="phone" data-reserve="0">
          <div class="phone-screen">
            <div class="scroller" id="scroller"><div class="canvas-wrap" style="height:calc(${s.h}px * var(--s))"><div class="canvas" id="canvas">
              <img src="${s.img}" alt="${esc(s.name)} 화면" width="375" height="${s.h}">${hots}
              ${s.key === "crt" ? `<div id="paymark" style="position:absolute;left:0;top:${O.bottombar.payTop}px;width:375px;height:439px;pointer-events:none"></div>` : ""}
            </div></div></div>
            ${fixbar}
            <div class="dim" id="dim"></div>
            <div class="sheet" id="sheet"><div class="sheet-inner"><img src="${sh.img}" alt="필터 창">${sheetHots}</div></div>
            <div class="snack" id="snackCart" style="bottom:calc(${snackBottom}px * var(--s))"><div class="snack-inner"><img src="${O.snackCart.img}" alt="상품이 장바구니에 담겼습니다. 장바구니 보기"><button type="button" class="hot" data-snack="cart" style="left:${O.snackCart.action[0]}px;top:${O.snackCart.action[1]}px;width:${O.snackCart.action[2]}px;height:${O.snackCart.action[3]}px" aria-label="장바구니 보기"></button></div></div>
            <div class="snack" id="snackCab" style="bottom:calc(${snackBottom}px * var(--s))"><div class="snack-inner"><img src="${O.snackCabinet.img}" alt="보관함에 담았습니다. 보관함 보기"></div></div>
            <div class="toast" id="toast" role="status" aria-live="polite"></div>
          </div>
        </div>
      </div>
      <div class="split-right" id="pright">
        <p class="eyebrow">시연하기</p>
        <h1>구매 흐름 직접 눌러 보기</h1>
        ${bullets(["피그마에 연결해 둔 동작을 그대로 재현", "보라색 점선 영역을 누르면 다음 화면이나 창이 열림"])}
        <div class="demo-side">
          <section class="card panel">
            <h2>${esc(s.name)}</h2>
            <p>${esc(s.summary)}</p>
            <div class="btns" style="margin:12px 0 0"><a class="btn small" href="${docHref(s.id)}">이 화면 문서 보기</a><a class="btn small" href="${demoHref("hom", "10")}">처음부터</a></div>
          </section>
          <section class="card panel">
            <h3>핵심 흐름</h3>
            <ol class="progress">${FLOW.map((f, i) => `<li class="${i < stepIdx ? "past" : i === stepIdx ? "now" : ""}"><span class="num">${i + 1}</span><span>${esc(f.title)}<small>${elTag(f.sc, f.el)}</small></span></li>`).join("")}</ol>
          </section>
          <section class="card panel">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:8px"><h3 style="margin:0">누를 수 있는 영역</h3><label class="toggle"><input type="checkbox" id="hotToggle"${state.showHot ? " checked" : ""}>영역 표시</label></div>
            <div class="actions">${actionList}</div>
            ${notes.length ? `<div class="note" style="margin-top:10px">${bullets(notes)}</div>` : ""}
            <h3 style="margin-top:16px">요소 위치 보기</h3>
            <div class="chips">${s.els.map((e) => `<a class="chip purple" data-focus="${e.n}" title="${esc(e.name)}">${e.n}</a>`).join("")}</div>
          </section>
          <section class="card panel">
            <h3>동작 기록</h3>
            <ul class="history" id="history">${historyHtml()}</ul>
          </section>
        </div>
        ${footer()}
      </div>
    </div>`;

    fitPhones();
    if (s.key === "crt") {
      const fb = document.getElementById("fixbar");
      barIO = new IntersectionObserver(([en]) => fb.classList.toggle("hide", en.isIntersecting), { root: document.getElementById("scroller"), threshold: 0 });
      barIO.observe(document.getElementById("paymark"));
    }
    if (hl) {
      const targets = acts.filter((a) => a.el === hl);
      if (targets.length) pulse(targets[0].id); else focusEl(hl);
    }
  }

  const historyHtml = () => state.history.length ? state.history.slice(0, 8).map((h) => `<li>${esc(h)}</li>`).join("") : `<li class="empty">아직 누른 곳 없음</li>`;
  function log(msg) {
    state.history.unshift(msg);
    const h = document.getElementById("history");
    if (h) h.innerHTML = historyHtml();
  }
  function toast(msg) {
    const t = document.getElementById("toast");
    if (!t) return;
    t.textContent = msg; t.classList.add("on");
    demoTimers.push(setTimeout(() => t.classList.remove("on"), 2400));
  }
  const curScale = (p) => parseFloat(getComputedStyle(p || document.getElementById("phone")).getPropertyValue("--s")) || 1;
  function fitPhones() {
    const hdr = document.querySelector(".top").offsetHeight;
    document.documentElement.style.setProperty("--hdr", hdr + "px");
    const vw = Math.min(window.innerWidth, document.documentElement.clientWidth);
    document.querySelectorAll(".phone").forEach((p) => {
      let s = Math.min(1, (vw - 32 - 20) / 375);
      if (isSplit()) s = Math.min(s, (window.innerHeight - hdr - 32 - Number(p.dataset.reserve || 0)) / (812 + 20));
      p.style.setProperty("--s", Math.max(0.55, s).toFixed(4));
    });
  }
  function scrollPhoneTo(y) {
    const sc = document.getElementById("scroller");
    if (sc) sc.scrollTo({ top: Math.max(0, (y - 90) * curScale()), behavior: "smooth" });
  }
  const currentDemoKey = () => { const k = location.hash.split("/")[2]; return k && byKey[k] ? k : "hom"; };
  function pulse(id) {
    const a = DEMO[currentDemoKey()].find((x) => x.id === id);
    if (!a) return;
    if (!document.querySelector(`#fixbar [data-hot="${id}"]`)) scrollPhoneTo(a.r[1]);
    document.querySelectorAll(`[data-hot="${id}"]`).forEach((el) => { el.classList.remove("pulse"); void el.offsetWidth; el.classList.add("pulse"); });
  }
  function focusEl(n) {
    const s = byKey[currentDemoKey()];
    const e = s.els.find((x) => x.n === n);
    if (!e) return;
    const canvas = document.getElementById("canvas");
    canvas.querySelectorAll(".focus-frame").forEach((f) => f.remove());
    e.boxes.forEach((b, i) => {
      const f = document.createElement("div");
      f.className = "focus-frame";
      f.style.cssText = `left:${b[0]}px;top:${b[1]}px;width:${b[2]}px;height:${b[3]}px`;
      if (i === 0) f.innerHTML = `<span>${esc(n)} ${esc(e.name)}</span>`;
      canvas.appendChild(f);
    });
    scrollPhoneTo(e.boxes[0][1]);
  }
  function showSnack(id, ms) {
    ["snackCart", "snackCab"].forEach((x) => document.getElementById(x)?.classList.remove("on"));
    const el = document.getElementById(id);
    el.classList.add("on");
    demoTimers.push(setTimeout(() => el.classList.remove("on"), ms));
  }
  function closeTips() { document.querySelectorAll("#canvas .tip").forEach((t) => t.remove()); }
  function openSheet(open) {
    document.getElementById("dim").classList.toggle("on", open);
    document.getElementById("sheet").classList.toggle("on", open);
  }
  function syncSheet() {
    document.querySelectorAll('[data-sheet^="opt"]').forEach((b) => b.classList.toggle("sel", b.dataset.sheet === "opt" + state.sheet.opt));
    document.querySelector('[data-sheet="half"]')?.classList.toggle("sel", state.sheet.half);
  }

  function doAction(id, el) {
    const key = currentDemoKey();
    const a = DEMO[key].find((x) => x.id === id);
    if (!a) return;
    closeTips();
    switch (a.act) {
      case "go":
        log(`${a.label} → ${byKey[a.to].short}`);
        location.hash = demoHref(a.to);
        break;
      case "toggle": {
        const k = key + ":" + id;
        state.pressed[k] = !state.pressed[k];
        document.querySelectorAll(`[data-hot="${id}"]`).forEach((h) => h.classList.toggle("pressed", state.pressed[k]));
        log(`${a.label} → ${state.pressed[k] ? "눌린" : "기본"} 모양`);
        if (a.note) toast(a.note);
        break;
      }
      case "sheet":
        openSheet(true);
        log(`${a.label} → 필터 창 열림`);
        break;
      case "cabinet": {
        state.pressed[key + ":" + id] = true;
        el.classList.add("pressed");
        showSnack("snackCab", 3000);
        log(`${a.label} → 눌린 모양 + 보관 완료 알림`);
        break;
      }
      case "tooltip": {
        const T = DEMO_OVERLAY.tooltip;
        const t = document.createElement("img");
        t.className = "tip"; t.src = T.img; t.alt = "추천하고 적립 혜택 받기";
        t.style.left = `${a.r[0] + a.r[2] / 2 - T.tailX - 3.5}px`;
        t.style.top = `${a.r[1] - T.h - 2}px`;
        document.getElementById("canvas").appendChild(t);
        log(`${a.label} → Thanks to 설명 말풍선`);
        break;
      }
      case "cartSnack":
        showSnack("snackCart", 4500);
        log(`${a.label} → 담기 완료 알림`);
        break;
      case "noop":
        // 눌러도 아무 일 없음 (카드 아래로 눌림이 번져 상세로 넘어가지 않게 이 영역에서 멈춤)
        toast("동작하지 않음");
        log(`${a.label} → 동작하지 않음`);
        break;
    }
  }

  function sheetAction(cmd) {
    if (cmd.startsWith("opt")) { state.sheet.opt = +cmd.slice(3); syncSheet(); return; }
    if (cmd === "half") { state.sheet.half = !state.sheet.half; syncSheet(); return; }
    if (cmd === "tab0") { toast("정렬 순서 옵션은 디자인에 없음"); return; }
    if (cmd === "tab1") return;
    if (cmd === "reset") { state.sheet = { opt: 0, half: false }; syncSheet(); toast("선택 초기화(적용 전)"); log("필터 창 → 초기화"); return; }
    if (cmd === "apply") {
      openSheet(false);
      const msg = `필터 적용: ${OPTS[state.sheet.opt]}${state.sheet.half ? " · 반값택배만" : ""}`;
      toast(msg + " · 목록 갱신은 디자인에 없어 생략");
      log(`‘필터 적용하기’ → ${msg}`);
    }
  }

  // 인쇄: 지연 로딩 이미지까지 모두 불러온 뒤 인쇄 창을 연다
  async function printDoc() {
    const imgs = [...app.querySelectorAll("img")];
    imgs.forEach((i) => { i.loading = "eager"; });
    await Promise.all(imgs.map((i) => (i.complete ? null : new Promise((r) => {
      i.addEventListener("load", r, { once: true });
      i.addEventListener("error", r, { once: true });
    }))));
    window.print();
  }

  /* ---------------- 이벤트·라우팅 ---------------- */
  app.addEventListener("click", (ev) => {
    const t = ev.target;
    if (t.closest("[data-print]")) { printDoc(); return; }
    const box = t.closest(".box");
    if (box) {
      const sc = box.closest(".inline-shot") ? box.closest(".inline-shot").dataset.sc : docState.sc, n = box.dataset.el;
      document.getElementById(`${sc}-${n}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
      history.replaceState(null, "", docHref(sc, n));
      return;
    }
    const hot = t.closest("[data-hot]");
    if (hot) { doAction(hot.dataset.hot, hot); return; }
    const sh = t.closest("[data-sheet]");
    if (sh) { sheetAction(sh.dataset.sheet); return; }
    if (t.closest("[data-snack]")) { log("알림의 ‘장바구니 보기’ → 장바구니"); location.hash = demoHref("crt"); return; }
    if (t.id === "dim") { openSheet(false); toast("적용 없이 닫힘"); log("바깥 어두운 부분 → 필터 창 닫힘 (적용 안 함)"); return; }
    const p = t.closest("[data-pulse]");
    if (p) { pulse(p.dataset.pulse); return; }
    const f = t.closest("[data-focus]");
    if (f) { focusEl(f.dataset.focus); return; }
    if (!t.closest(".tip")) closeTips();
  });
  app.addEventListener("change", (ev) => {
    if (ev.target.id === "hotToggle") {
      state.showHot = ev.target.checked;
      document.getElementById("phone").classList.toggle("show-hot", state.showHot);
    }
  });
  window.addEventListener("resize", () => { fitPhones(); if (current === "doc") onDocScroll(); });
  window.addEventListener("scroll", () => { if (current === "doc" && !isSplit()) onDocScroll(); }, { passive: true });

  let current = null;
  function route() {
    const parts = location.hash.replace(/^#\/?/, "").split("/");
    const view = ["flow", "doc", "demo"].includes(parts[0]) ? parts[0] : "flow";
    document.body.classList.toggle("app-mode", view !== "flow");
    document.querySelectorAll(".tabs a").forEach((a) => a.classList.toggle("on", a.dataset.tab === view));
    if (view === "doc") {
      if (current !== "doc") { renderDoc(); window.scrollTo(0, 0); }
      current = "doc";
      const target = parts[1] ? (parts[2] ? `${parts[1]}-${parts[2]}` : parts[1]) : null;
      if (target) requestAnimationFrame(() => document.getElementById(target)?.scrollIntoView({ block: "start" }));
    } else if (view === "demo") {
      const first = current !== "demo";
      current = "demo";
      renderDemo(parts[1] || "hom", parts[2]);
      if (first) window.scrollTo(0, 0);
    } else {
      current = "flow";
      renderFlow();
      window.scrollTo(0, 0);
    }
  }
  window.addEventListener("hashchange", route);
  route();
})();
