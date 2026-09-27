/* ============================================================================
   water-sort-solver.js — SHARED SOLVER CORE  (Giai đoạn 3)
   ----------------------------------------------------------------------------
   Nguồn sự thật duy nhất cho toàn bộ logic giải water-sort. Cả
   water_sort_ultimate.html và water_sort_ios_solver.html nạp file này, nên
   không còn hai bản heuristic lệch nhau (nguyên nhân gốc của 2 heuristic
   không admissible trước đây).

   File này cũng là nguồn để dựng Web Worker: WaterSortSolver.workerSource()
   trả về chính mã nguồn các hàm bên dưới, nên worker chạy ĐÚNG code với main
   thread — không phải bản sao, không bao giờ lệch.

   Dùng được ở cả 3 nơi:
     • trình duyệt:  <script src="water-sort-solver.js"></script> → window.WaterSortSolver
     • Web Worker:   importScripts('water-sort-solver.js')
     • Node (test):  require('./water-sort-solver.js')
   ========================================================================== */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.WaterSortSolver = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var VERSION = '1.0.0';
  var FLAT_EMPTY = 255;

  /* ---------------------------------------------------------------------
     ENGINE
     Mỗi tool tạo 1 engine với CAP / UNK riêng. Engine giữ memo + bảng mã màu
     nên phải dùng 1 engine cho cả vòng đời của trang.
     --------------------------------------------------------------------- */
  function makeEngine(cfg) {
    cfg = cfg || {};
    var CAP = cfg.CAP || 4;
    var UNK = (cfg.UNK === undefined) ? 'unknown' : cfg.UNK;
    var maxMemo = cfg.maxMemo || 200000;

    var clone = function (x) { return JSON.parse(JSON.stringify(x)); };

    /* ---------- quy tắc cơ bản ---------- */
    function topValue(t) { return t.length ? t[t.length - 1] : null; }
    function topRun(t) {
      if (!t.length) return 0;
      var c = t[t.length - 1], n = 0;
      for (var i = t.length - 1; i >= 0 && t[i] === c; i--) n++;
      return n;
    }
    function isComplete(t) {
      return t.length === CAP && t[0] === t[1] && t[1] === t[2] && t[2] === t[3];
    }
    function isSolved(s) { return s.every(function (t) { return t.length === 0 || isComplete(t); }); }
    function validMove(s, from, to) {
      if (from === to || from < 0 || to < 0 || from >= s.length || to >= s.length) return false;
      var a = s[from], b = s[to];
      if (!a.length || isComplete(a) || isComplete(b) || b.length >= CAP) return false;
      var c = topValue(a);
      if (c === UNK) return false;
      if (b.length && topValue(b) !== c) return false;
      return true;
    }
    function legalMoves(s) {
      var out = [];
      for (var i = 0; i < s.length; i++) {
        if (!s[i].length || isComplete(s[i])) continue;
        for (var j = 0; j < s.length; j++) if (validMove(s, i, j)) out.push({ from: i, to: j });
      }
      return out;
    }
    function applyMove(s, from, to) {
      var a = s[from], b = s[to];
      var n = Math.min(topRun(a), CAP - b.length);
      for (var i = 0; i < n; i++) b.push(a.pop());
      return s;
    }
    function findAllUnknowns(s) {
      var out = [];
      for (var ti = 0; ti < s.length; ti++)
        for (var li = 0; li < s[ti].length; li++)
          if (s[ti][li] === UNK) out.push({ ti: ti, li: li });
      return out;
    }

    /* ---------- heuristic ----------
       ADMISSIBLE. seg(c) = số đoạn liên tiếp màu c trên cả bàn.
       Ở trạng thái thắng mỗi màu nằm trong đúng 1 đoạn. Một lượt rót chỉ
       chuyển MỘT màu và chỉ gộp được tối đa 2 đoạn thành 1, không đụng màu khác
       => cần ít nhất Σ_c (seg(c) - 1) lượt rót.
       Đây là cận dưới THẬT, nên dùng làm ngưỡng cắt nhánh được.
       (Không thêm "linear conflict" như bản cũ: trong water-sort không bao giờ
        hoán đổi 2 màu, chỉ gộp, nên mọi hạng tử kiểu swap đều không hợp lệ.) */
    function heuristic(s) {
      var seg = new Map();
      for (var ti = 0; ti < s.length; ti++) {
        var t = s[ti];
        for (var i = 0; i < t.length; i++) {
          if (i > 0 && t[i] === t[i - 1]) continue;
          seg.set(t[i], (seg.get(t[i]) || 0) + 1);
        }
      }
      var h = 0;
      seg.forEach(function (n) { if (n > 1) h += n - 1; });
      return h;
    }
    /* Điểm XẾP HẠNG (không phải cận dưới) — chỉ để sắp xếp thứ tự duyệt. */
    function rankScore(s) {
      var h = heuristic(s);
      h += s.filter(function (t) { return t.length === 0; }).length * 0.5;
      var buried = 0;
      for (var ti = 0; ti < s.length; ti++) {
        var t = s[ti];
        for (var i = 1; i < t.length; i++) if (t[i] !== t[i - 1]) buried++;
      }
      return h + buried * 0.25;
    }

    /* ---------- bảng mã màu ỔN ĐỊNH ----------
       Bắt buộc ổn định theo cả vòng đời. Nếu mỗi lần gọi tạo bảng mới thì
       cùng một chuỗi byte có thể mô tả hai bàn khác nhau (màu A->0 ở bàn này,
       màu B->0 ở bàn kia) => memo trả nhầm kết quả bàn trước cho bàn sau. */
    var _flatIds = new Map();
    function flatCodeOf(id) {
      var c = _flatIds.get(id);
      if (c === undefined) { c = _flatIds.size; _flatIds.set(id, c); }
      return c;
    }
    function flatIdOf(code) {
      var it = _flatIds.entries(), e;
      while (!(e = it.next()).done) if (e.value[1] === code) return e.value[0];
      return '?';
    }

    /* ---------- flat encoding ---------- */
    var _charCache = [];
    function _flatChar(i) { return _charCache[i] || (_charCache[i] = String.fromCharCode(i)); }
    function flatEncode(tubes) {
      var buf = new Uint8Array(tubes.length * CAP);
      buf.fill(FLAT_EMPTY);
      for (var t = 0; t < tubes.length; t++)
        for (var k = 0; k < tubes[t].length; k++)
          buf[t * CAP + k] = flatCodeOf(tubes[t][k]);
      return buf;
    }
    function flatFromIds(buf) {
      var out = [];
      for (var t = 0; t < buf.length / CAP; t++) {
        var col = [];
        for (var k = 0; k < CAP; k++) {
          var v = buf[t * CAP + k];
          if (v === FLAT_EMPTY) break;
          col.push(flatIdOf(v));
        }
        out.push(col);
      }
      return out;
    }
    function flatLen(b, t) { var n = CAP; while (n > 0 && b[t * CAP + n - 1] === FLAT_EMPTY) n--; return n; }
    function flatFull(b, t) {
      var o = t * CAP, c = b[o];
      return c !== FLAT_EMPTY && b[o + 1] === c && b[o + 2] === c && b[o + 3] === c;
    }
    function flatTopRun(b, t) {
      var L = flatLen(b, t); if (!L) return 0;
      var c = b[t * CAP + L - 1], n = 0;
      for (var k = L - 1; k >= 0 && b[t * CAP + k] === c; k--) n++;
      return n;
    }
    function flatSolved(b) {
      for (var t = 0; t < b.length / CAP; t++) {
        var o = t * CAP, c = b[o];
        if (c === FLAT_EMPTY) { if (b[o + 1] !== FLAT_EMPTY) return false; continue; }
        if (b[o + 1] !== c || b[o + 2] !== c || b[o + 3] !== c) return false;
      }
      return true;
    }

    /* ---------- STATE KEY ----------
       PHẢI là khoá ổn định theo từng màu, KHÔNG được canonical hoá (đổi tên màu
       theo thứ tự xuất hiện).

       Lý do: khoá phải phân biệt được HAI bàn khác nhau, và đường đi tìm được
       phải chơi được trên đúng bàn đó. Canonical hoá gộp mọi bàn đồng dưng vào
       một khoá — khoảng cách tới đích là bất biến dưới hoán vị tên màu, NHƯNG
       chuỗi nước đi là một dãy cặp chỉ số ống, và tính hợp lệ của mỗi nước lại
       phụ thuộc MÀU thật trên bàn. Nên nếu ta gộp hai bàn, đường đi trả về có
       thể hợp lệ trên bàn B nhưng bất hợp lệ trên bàn A.
       Đã thử: canonical hoá làm 129/232 ván chắc-chắn-giải-được bị báo nhầm
       là "không thể thắng". Đây cũng chính là lỗi mà bản v5 từng mắc phải. */
    function flatKey(b) {
      var s = '';
      for (var i = 0; i < b.length; i++) s += _flatChar(b[i]);
      return s;
    }
    function flatH(b) {
      var seg = new Map();
      for (var i = 0; i < b.length; i++) {
        var v = b[i];
        if (v === FLAT_EMPTY) continue;
        if (i % CAP !== 0 && b[i - 1] === v) continue;
        seg.set(v, (seg.get(v) || 0) + 1);
      }
      var h = 0;
      seg.forEach(function (n) { if (n > 1) h += n - 1; });
      return h;
    }
    function flatMoves(b, unkCode) {
      var nt = b.length / CAP, out = [];
      for (var i = 0; i < nt; i++) {
        var L = flatLen(b, i);
        if (!L || flatFull(b, i)) continue;
        var c = b[i * CAP + L - 1];
        if (unkCode !== undefined && c === unkCode) continue; // không rót được từ ô ?
        for (var j = 0; j < nt; j++) {
          if (j === i) continue;
          var L2 = flatLen(b, j);
          if (L2 >= CAP || flatFull(b, j)) continue;
          if (L2 && b[j * CAP + L2 - 1] !== c) continue;
          out.push(i, j);
        }
      }
      return out;
    }
    function flatApply(b, i, j) {
      var n = Math.min(flatTopRun(b, i), CAP - flatLen(b, j));
      if (n <= 0) return null;
      var nb = b.slice();
      var Li = flatLen(b, i), Lj = flatLen(b, j);
      for (var x = 0; x < n; x++) nb[j * CAP + Lj + x] = b[i * CAP + Li - 1 - x];
      for (x = 0; x < n; x++) nb[i * CAP + Li - 1 - x] = FLAT_EMPTY;
      return nb;
    }

    function FlatHeap() { this.f = []; this.b = []; this.g = []; this.m = []; this.k = []; }
    FlatHeap.prototype.size = function () { return this.f.length; };
    FlatHeap.prototype.push = function (f, buf, g, mv, k) {
      var i = this.f.length, p;
      this.f.push(f); this.b.push(buf); this.g.push(g); this.m.push(mv); this.k.push(k);
      while (i > 0) {
        p = (i - 1) >> 1;
        if (this.f[p] <= f) break;
        this.f[i] = this.f[p]; this.b[i] = this.b[p]; this.g[i] = this.g[p];
        this.m[i] = this.m[p]; this.k[i] = this.k[p];
        i = p;
      }
      this.f[i] = f; this.b[i] = buf; this.g[i] = g; this.m[i] = mv; this.k[i] = k;
    };
    FlatHeap.prototype.pop = function () {
      var rf = this.f[0], rb = this.b[0], rg = this.g[0], rm = this.m[0], rk = this.k[0];
      var lf = this.f.pop(), lb = this.b.pop(), lg = this.g.pop(), lm = this.m.pop(), lk = this.k.pop();
      if (this.f.length) {
        var i = 0, l, r, c;
        for (;;) {
          l = i * 2 + 1;
          if (l >= this.f.length) break;
          r = l + 1;
          c = (r < this.f.length && this.f[r] < this.f[l]) ? r : l;
          if (this.f[c] >= lf) break;
          this.f[i] = this.f[c]; this.b[i] = this.b[c]; this.g[i] = this.g[c];
          this.m[i] = this.m[c]; this.k[i] = this.k[c];
          i = c;
        }
        this.f[i] = lf; this.b[i] = lb; this.g[i] = lg; this.m[i] = lm; this.k[i] = lk;
      }
      return { f: rf, b: rb, g: rg, m: rm, k: rk };
    };

    /* ---------- verdict memo ---------- */
    var _winMemo = new Map();
    function memoSet(k, v) {
      if (_winMemo.size >= maxMemo) {
        var drop = Math.floor(maxMemo * 0.25), it = _winMemo.keys(), n;
        for (var i = 0; i < drop; i++) { n = it.next(); if (n.done) break; _winMemo.delete(n.value); }
      }
      _winMemo.set(k, v);
    }
    function clearWinMemo() { _winMemo.clear(); }
    function resetAll() { _winMemo.clear(); _flatIds.clear(); }

    /* ---------- dead-end nhanh ----------
       validMove() chỉ đòi ống ĐÍCH có b.length < CAP (không bắt buộc rỗng) và
       màu ở đỉnh phải khớp. Nên bàn chết khi và CHỈ khi mọi ống đều đầy: không
       còn ông đích nào nhận được nước rót.
       (Bản đầu tiên của hàm này kiểm tra "có ống rỗng không" — SAI, vì ống đầy
        một phần vẫn nhận được nước rót nếu đỉnh trùng màu. Sai lệch đó làm 38/70
        ván chắc-chắn-giải-được bị báo nhầm là không thể thắng.) */
    function isStuckFull(s) {
      for (var i = 0; i < s.length; i++) if (s[i].length < CAP) return false;
      return true;
    }

    /* ---------- EXACT SOLVER: A* trên flat encoding ----------
       Trả về:
         win     -> {verdict, path (TỐI ƯU), states}
         dead    -> {verdict, states, bestLocked, needsReveal}  (heap rỗng = hết KG)
         unknown -> {verdict, states, bestLocked, why}          (chạm trần/thời gian) */
    function exactSolve(tubes, opt) {
      opt = opt || {};
      var maxStates = Math.max(2000, opt.maxStates || 200000);
      var dl = opt.deadline || (Date.now() + 4000);
      var buf = flatEncode(tubes);
      var unkCode = _flatIds.has(UNK) ? _flatIds.get(UNK) : undefined;
      var startKey = flatKey(buf);
      var memo = _winMemo.get(startKey);
      if (memo) return memo;
      if (flatSolved(buf)) {
        var solvedVerdict = { verdict: 'win', path: [], states: 1, bestLocked: tubes.filter(isComplete).length, needsReveal: false };
        memoSet(startKey, solvedVerdict);
        return solvedVerdict;
      }
      if (isStuckFull(tubes)) {
        var stuckVerdict = { verdict: 'dead', path: [], states: 0, bestLocked: tubes.filter(isComplete).length, needsReveal: false, bestState: null };
        memoSet(startKey, stuckVerdict);
        return stuckVerdict;
      }

      var open = new FlatHeap();
      var gScore = new Map([[startKey, 0]]);
      var parent = new Map([[startKey, null]]);
      open.push(flatH(buf), buf, 0, null, startKey);
      var states = 1, bestLocked = 0, bestBuf = null, needsReveal = false, cur, ms, i, j, nb, nk, ng, old, q;

      function track(b) {
        var locked = 0;
        for (var t = 0; t < b.length / CAP; t++) if (flatFull(b, t)) locked++;
        if (locked > bestLocked) { bestLocked = locked; bestBuf = b.slice(); }
      }

      while (open.size()) {
        if (states >= maxStates)
          return { verdict: 'unknown', path: [], states: states, bestLocked: bestLocked,
            bestState: bestBuf ? flatFromIds(bestBuf) : null, needsReveal: needsReveal, why: 'cap' };
        if ((states & 511) === 0 && Date.now() > dl)
          return { verdict: 'unknown', path: [], states: states, bestLocked: bestLocked,
            bestState: bestBuf ? flatFromIds(bestBuf) : null, needsReveal: needsReveal, why: 'time' };

        cur = open.pop();
        if (cur.g > (gScore.get(cur.k) === undefined ? Infinity : gScore.get(cur.k))) continue;
        states++;

        if (flatSolved(cur.b)) {
          var path = [], k = cur.k, p;
          while (k) { p = parent.get(k); if (!p) break; path.push(p.m); k = p.k; }
          path.reverse();
          var r = { verdict: 'win', path: path, states: states, bestLocked: bestLocked, bestState: null, needsReveal: false };
          // Ghi nhớ MỌI trạng thái trên đường thắng, kèm đúng hậu tố tối ưu
          // từ trạng thái đó (A* tối ưu => hậu tố cũng tối ưu). Bản cũ vòng
          // lặp off-by-one: bỏ sót startKey và lưu slice sai vị trí.
          var keys = [cur.k], kk2 = cur.k, p2;
          while ((p2 = parent.get(kk2))) { kk2 = p2.k; keys.unshift(kk2); }
          for (i = 0; i <= path.length && i < keys.length; i++) {
            memoSet(keys[i], { verdict: 'win', path: path.slice(i), states: states,
              bestLocked: bestLocked, bestState: null, needsReveal: false });
          }
          return r;
        }
        track(cur.b);
        ms = flatMoves(cur.b, unkCode);
        if (!ms.length) {
          for (i = 0; i < cur.b.length / CAP; i++) {
            var L = flatLen(cur.b, i);
            if (L && unkCode !== undefined && cur.b[i * CAP + L - 1] === unkCode) { needsReveal = true; break; }
          }
          continue;
        }
        for (q = 0; q < ms.length; q += 2) {
          i = ms[q]; j = ms[q + 1];
          nb = flatApply(cur.b, i, j);
          if (!nb) continue;
          nk = flatKey(nb);
          ng = cur.g + 1;
          old = gScore.get(nk);
          if (old !== undefined && old <= ng) continue;
          gScore.set(nk, ng);
          parent.set(nk, { k: cur.k, m: { from: i, to: j } });
          open.push(ng + flatH(nb), nb, ng, { from: i, to: j }, nk);
        }
      }
      // heap rỗng => đã duyệt hết không gian => mọi trạng thái đã thấy đều chết
      gScore.forEach(function (_v, k) {
        memoSet(k, { verdict: 'dead', path: [], states: states, bestLocked: bestLocked, needsReveal: needsReveal });
      });
      return { verdict: 'dead', path: [], states: states, bestLocked: bestLocked,
        bestState: bestBuf ? flatFromIds(bestBuf) : null, needsReveal: needsReveal };
    }

    /* ---------- BẠNG CHỨNG SỐ HỌC + SUY LUẬN Ô ? ----------
       T2: thay vì đoán, ta CHỨNG MINH cách gán nào đúng.
         Bước 1 (miễn phí): mỗi màu phải đúng CAP ô. Ô ? chỉ bù được cho màu
           đang thiếu; dư ô ? thì phải dồn vừa vào một màu có 0 ô.
         Bước 2: exactSolve từng cách gán hợp lệ.
         Bước 3: xếp hạng theo số nước tối ưu. */
    var DEDUCT_MAX = 512;
    function deductUnknowns(st, opt, paletteIds) {
      opt = opt || {};
      var unk = findAllUnknowns(st);
      if (!unk.length) return { verdict: 'no-unknown', unk: 0, candidates: [], feasible: 0, tested: 0, totalAssign: 0 };
      var counts = {}, i, ti, li;
      for (ti = 0; ti < st.length; ti++)
        for (li = 0; li < st[ti].length; li++)
          if (st[ti][li] !== UNK) counts[st[ti][li]] = (counts[st[ti][li]] || 0) + 1;
      var nUnk = unk.length;
      // CHỈ xét màu ĐANG CÓ MẶT: palette có thể dư màu, tính vào sẽ kết luận sai
      var present = (paletteIds || []).filter(function (id) { return (counts[id] || 0) > 0; });
      var short = present.map(function (id) { return { id: id, need: CAP - (counts[id] || 0) }; })
        .filter(function (s) { return s.need > 0; })
        .sort(function (a, b) { return b.need - a.need; });
      var needTotal = short.reduce(function (a, s) { return a + s.need; }, 0);
      var over = Object.keys(counts).filter(function (id) { return counts[id] > CAP; });
      var spare = needTotal - nUnk;
      if (over.length || spare < 0 || spare % CAP !== 0) {
        return { verdict: 'count-infeasible', unk: nUnk, candidates: [], feasible: 0, tested: 0,
          totalAssign: 0, needTotal: needTotal, over: over,
          reason: over.length ? ('màu vượt CAP: ' + over.join(', '))
            : (spare < 0 ? ('cần ' + needTotal + ' ô để đủ ' + short.length + ' màu nhưng chỉ có ' + nUnk + ' ô ?')
                         : ('thừa ' + (spare % CAP) + ' ô ? — không dồn vừa vào màu nào để đủ ' + CAP + ' ô')) };
      }
      var maxAssign = opt.maxAssign || DEDUCT_MAX;
      // Gán theo thứ tự TRÊN -> DƯỚI trong mỗi ống. Nhờ vậy khi gán một ô ?
      // thì mọi ô ? nằm NGAY TRÊN nó đã có giá trị, nên luật "ô ? không bao giờ
      // trùng icon ngay phía trên" áp được cả với cặp ô ? chồng lên nhau —
      // trường hợp này bản gán tuần tự cũ bỏ sót.
      var order = unk.map(function (_v, i) { return i; }).sort(function (a, b) {
        return unk[b].li - unk[a].li || unk[a].ti - unk[b].ti;
      });
      var chosen = new Array(nUnk);
      var assigns = [];
      (function rec(k) {
        if (assigns.length >= maxAssign) return;
        if (k === order.length) { assigns.push(chosen.slice()); return; }
        var ui = order[k], u = unk[ui];
        var above = (u.li + 1 < st[u.ti].length) ? st[u.ti][u.li + 1] : null;
        if (above === UNK) {
          for (var t2 = 0; t2 < nUnk; t2++) {
            if (unk[t2].ti === u.ti && unk[t2].li === u.li + 1) { above = chosen[t2]; break; }
          }
        }
        for (var q = 0; q < short.length; q++) {
          var color = short[q].id;
          if (above !== null && color === above) continue;
          var used = 0;
          for (var z = 0; z < nUnk; z++) if (chosen[z] === color) used++;
          if (used >= short[q].need) continue;
          chosen[ui] = color;
          rec(k + 1);
          chosen[ui] = undefined;
          if (assigns.length >= maxAssign) return;
        }
      })(0);
      var budget = opt.budget || 8000;
      var t0 = Date.now();
      var results = [], screened = 0, feasible = [], sc, i2;

      function tryAssign(acc, maxStates, ms){
        var cand = st.map(function(t){ return t.slice(); });
        for(var a=0;a<unk.length;a++) cand[unk[a].ti][unk[a].li]=acc[a];
        var r = exactSolve(cand,{maxStates:maxStates,deadline:Date.now()+ms});
        return {acc:acc.slice(),verdict:r.verdict,len:r.path?r.path.length:null,
                states:r.states,bestLocked:r.bestLocked||0};
      }

      /* ---------- PHA 1: SANG LOC RE ----------
         Mot ban co 7 o ? co the hon 4000 cach gan. Neu moi cach deu phai chay
         exactSolve day du thi het gio truoc khi xet het, va ket qua la
         "chua ket luan duoc" du dap an nam ngay do.
         Nen: moi cach mot ngan sach rat nho, xep hang theo so ong da xep dung
         tot nhat (bestLocked). Cach nao hua nhieu thi dang de chay ky. */
      var tryCount = Math.min(assigns.length, opt.tryCount||24);
      // A* can tren ban 10 mau can ~20-25k trang thai de ra dap an, nen moi
      // cach gan can ngan sach vua du chu khong phai 120ms. Do duoi day rat nhieu
      // cach gan cung thang duoc, nen thuong chi can thu vai muc la ra dap an.
      var screenMs = Math.max(800, Math.floor(budget*0.85/tryCount));
      for(i2=0;i2<tryCount;i2++){
        var left = budget-(Date.now()-t0);
        if(left<=0){ results.push({acc:assigns[i2].slice(),verdict:"unknown",len:null,states:0,bestLocked:0}); continue; }
        sc = tryAssign(assigns[i2], opt.screenStates||60000, Math.min(screenMs,left));
        screened++;
        results.push(sc);
        if(sc.verdict==="win"){ feasible.push(sc); break; }
      }
      /* ---------- PHA 2: GIAI KY TOP-K ---------- */
      if(!feasible.length){
        var pool = results.filter(function(r){ return r.verdict!=="win"; })
          .sort(function(a,b){ return b.bestLocked-a.bestLocked; })
          .slice(0, opt.topK||8);
        for(i2=0;i2<pool.length;i2++){
          var rest = budget-(Date.now()-t0);
          if(rest<=200) break;
          var deep = tryAssign(pool[i2].acc, opt.maxStates||300000, rest);
          results[results.indexOf(pool[i2])] = deep;
          if(deep.verdict==="win"){ feasible.push(deep); break; }
        }
      }
      feasible.sort(function(a,b){ return a.len-b.len; });
      var allDead = screened>0 && results.every(function(r){ return r.verdict==="dead"; });
      return {
        verdict: feasible.length ? "solvable" : (allDead ? "all-dead" : "undetermined"),
        unk:nUnk, candidates:results, feasible:feasible.length, tested:screened,
        totalAssign:assigns.length, truncated:assigns.length>=maxAssign, needTotal:needTotal
      };
    }

    /* ---------- chẩn đoán bàn chết ---------- */
    function countColorInState(st, id) {
      var n = 0;
      for (var i = 0; i < st.length; i++) for (var j = 0; j < st[i].length; j++) if (st[i][j] === id) n++;
      return n;
    }
    function diagnoseDeadBoard(clean, res, paletteIds) {
      var nonEmpty = clean.filter(function (t) { return t.length; }).length;
      var fullTubes = clean.filter(function (t) { return t.length === CAP; }).length;
      var empties = clean.filter(function (t) { return t.length === 0; }).length;
      var never = [];
      if (res.bestState) {
        var done = new Set();
        res.bestState.forEach(function (t) { if (isComplete(t)) done.add(t[0]); });
        (paletteIds || []).forEach(function (id) {
          if (countColorInState(res.bestState, id) > 0 && !done.has(id)) never.push(id);
        });
      }
      var txt = '❌ Bàn này KHÔNG THỂ THẮNG (không phải do hết thời gian).\n';
      txt += 'Đã duyệt ' + res.states.toLocaleString() +
        ' trạng thái — đó là toàn bộ không gian đi được, không còn trạng thái nào ngoài đó.\n';
      txt += 'Số ống tối đa có thể xếp đúng: ' + (res.bestLocked || 0) + '/' + nonEmpty + '.\n';
      if (never.length) txt += 'Màu không bao giờ gom đủ được: ' + never.join(', ') + '.\n';
      if (res.needsReveal)
        txt += 'Có ô ? ở đỉnh đang chặn, nhưng kể cả mở đúng màu thì bàn vẫn không thắng được.\n';
      txt += 'Chẩn đoán: ' + fullTubes + '/' + clean.length + ' ống đầy, chỉ có ' + empties +
        ' ống rỗng. Khi mọi ống đều đầy thì không ống nào gộp màu được, nên không thể tạo thêm không gian.\n';
      txt += 'Cách khắc phục: thêm ống rỗng (mỗi ống thêm là thêm ' + CAP +
        ' ô không gian tạm), sửa vài ô trên bàn rồi chạy lại, hoặc tải mẫu khác.';
      return txt;
    }

    /* ---------- tra phán quyết đã ghi nhớ ----------
       UI cần biết "trạng thái này đã được chứng minh là chết chưa" để KHÔNG
       gợi ý nước đi dẫn vào vùng chết. Khoá sinh từ bảng mã màu ổn định nên
       tra được bằng chính bàn đó. */
    function knownVerdict(tubes) {
      var buf = flatEncode(tubes);
      return _winMemo.get(flatKey(buf)) || null;
    }
    function isKnownDead(tubes) {
      var m = knownVerdict(tubes);
      return !!(m && m.verdict === 'dead');
    }

    /* ---------- WEB WORKER (Giai đoạn 2) ----------
       exactSolve nặng ~0.5-3s. Chạy đồng bộ sẽ đóng băng tab, người dùng tưởng
       treo. Worker được DỰNG TỪ CHÍNH makeEngine.toString() nên chạy đúng mã
       nguồn với main thread — không có bản sao để lệch, và vẫn hoạt động khi mở
       HTML bằng file:// (không cần file .worker.js riêng).

       Trả về Promise<result|null>. null = không dựng được worker (trình duyệt
       chặn file://, CSP…) hoặc quá hạn → caller tự chạy đồng bộ. */
    function spawnWorker(msg, opt) {
      opt = opt || {};
      return new Promise(function (resolve) {
        var url = null, w = null, settled = false, timer = null;
        function done(res) {
          if (settled) return;
          settled = true;
          if (timer) clearTimeout(timer);
          try { if (w) w.terminate(); } catch (e) {}
          try { if (url) URL.revokeObjectURL(url); } catch (e) {}
          resolve(res);
        }
        try {
          var blob = new Blob([workerSource()], { type: 'text/javascript' });
          url = URL.createObjectURL(blob);
          w = new Worker(url);
        } catch (e) { return done(null); }
        timer = setTimeout(function () { done(null); }, opt.workerTimeoutMs || 30000);
        w.onmessage = function (e) { done(e.data && e.data.result ? e.data.result : null); };
        w.onerror = function () { done(null); };
        try { w.postMessage(msg); } catch (e) { done(null); }
      });
    }
    function solveInWorker(tubes, opt) {
      opt = opt || {};
      return spawnWorker({
        cmd: 'solve', id: 1, tubes: tubes, cap: CAP, unk: UNK,
        maxStates: opt.maxStates || 300000,
        budgetMs: opt.budgetMs || 8000
      }, opt);
    }
    /* ---------- Suy luận ô ? trong worker ----------
       deductUnknowns thử hàng trăm cách gán, mỗi cách một exactSolve — chạy
       đồng bộ treo UI nhiều giây. Worker dùng cùng mã nguồn (workerSource)
       nên kết quả không lệch với main thread. */
    function deductInWorker(tubes, opt, paletteIds) {
      opt = opt || {};
      return spawnWorker({
        cmd: 'deduct', id: 2, tubes: tubes, cap: CAP, unk: UNK,
        paletteIds: paletteIds || [],
        budget: opt.budget || 8000, maxStates: opt.maxStates || 300000,
        tryCount: opt.tryCount || 24, topK: opt.topK || 8,
        screenStates: opt.screenStates || 60000
      }, { workerTimeoutMs: opt.workerTimeoutMs || Math.max(30000, (opt.budget || 8000) + 10000) });
    }

    return {
      CAP: CAP, UNK: UNK, VERSION: VERSION,
      clone: clone, topValue: topValue, topRun: topRun,
      isComplete: isComplete, isSolved: isSolved, validMove: validMove,
      legalMoves: legalMoves, applyMove: applyMove, findAllUnknowns: findAllUnknowns,
      heuristic: heuristic, rankScore: rankScore, isStuckFull: isStuckFull,
      exactSolve: exactSolve, solveInWorker: solveInWorker,
      deductUnknowns: deductUnknowns, deductInWorker: deductInWorker, diagnoseDeadBoard: diagnoseDeadBoard,
      countColorInState: countColorInState,
      knownVerdict: knownVerdict, isKnownDead: isKnownDead,
      clearWinMemo: clearWinMemo, resetAll: resetAll,
      // nội bộ, hữu ích cho test
      _flat: { flatEncode: flatEncode, flatFromIds: flatFromIds, flatKey: flatKey, flatH: flatH,
               flatSolved: flatSolved, flatMoves: flatMoves, flatApply: flatApply, flatLen: flatLen,
               flatFull: flatFull, flatCodeOf: flatCodeOf }
    };
  }

  /* ---------------------------------------------------------------------
     WORKER SOURCE (Giai đoạn 2)
     Dựng từ CHÍNH các hàm của module này qua Function.prototype.toString(),
     nên worker và main thread dùng cùng một mã nguồn — không có bản sao để
     lệch. Nhờ vậy mở 1 file là đủ, không cần file .worker.js riêng, và vẫn
     chạy được khi mở HTML bằng file://.
     --------------------------------------------------------------------- */
  function workerSource() {
    var parts = [];
    // makeEngine.toString() tham chiếu 2 hằng ở cấp module, phải khai báo lại
    // trong preamble của worker, nếu không worker sẽ ném ReferenceError.
    parts.push('var FLAT_EMPTY = ' + FLAT_EMPTY + ';');
    parts.push('var VERSION = "' + VERSION + '";');
    parts.push(makeEngine.toString());
    return [
      "'use strict';",
      parts.join('\n'),
      'self.onmessage=function(e){',
      '  var d=e.data||{};',
      '  if(d.cmd==="solve"){',
      '    var eng=makeEngine({CAP:(d.cap||4),UNK:(d.unk===undefined?"unknown":d.unk)});',
      '    var r=eng.exactSolve(d.tubes,{maxStates:d.maxStates,deadline:Date.now()+(d.budgetMs||4000)});',
      '    self.postMessage({id:d.id,result:r});',
      '  }',
      '  if(d.cmd==="deduct"){',
      '    var eng2=makeEngine({CAP:(d.cap||4),UNK:(d.unk===undefined?"unknown":d.unk)});',
      '    var r2=eng2.deductUnknowns(d.tubes,{budget:d.budget,maxStates:d.maxStates,tryCount:d.tryCount,topK:d.topK,screenStates:d.screenStates},d.paletteIds||[]);',
      '    self.postMessage({id:d.id,result:r2});',
      '  }',
      '};'
    ].join('\n');
  }

  return { makeEngine: makeEngine, workerSource: workerSource, VERSION: VERSION };
});
