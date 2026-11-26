const $ = id => document.getElementById(id);

let swimmers = JSON.parse(localStorage.getItem('ahlySwimmers')) || [
    {
        id: 1,
        name: "أحمد محمد علي",
        school: "النصر للغات",
        grade: "ثانية ثانوي",
        photo: null,
        times: { '50': 28.50, '100': 62.30, '200': 135.40 },
        history: [
            { date: '2024-07-15', championship: 'بطولة القاهرة الصيفية', event: '50', time: 28.50 }
        ]
    },
    {
        id: 2,
        name: "خالد محمود سعيد",
        school: "الأهلي",
        grade: "أولى جامعة",
        photo: null,
        times: { '50': 29.40, '100': 64.20, '200': 140.50 },
        history: []
    }
];

let currentUser = null;
let currentPhoto = null;
let tempChampionships = [];  // نتائج لسه ما اتحفظتش على السباح
let currentRaces = [];       // سباقات البطولة اللي بتتكتب دلوقتي

const strokeNames = {
    breast: 'صدر',
    butterfly: 'دلفين',
    freestyle: 'حرة',
    back: 'ظهر',
    im: 'متنوع',
    'freestyle-back': 'حرة وظهر',
    'freestyle-butterfly': 'حرة ودلفين',
    'freestyle-breast': 'حرة وصدر'
};

const getStrokeName = key => strokeNames[key] || key || 'غير محدد';

function esc(v) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return String(v ?? '').replace(/[&<>"']/g, c => map[c]);
}

// 62.5 تبقى 1:02.50
function fmtTime(t) {
    if (t === null || t === undefined || isNaN(t)) return '--';
    if (t < 60) return Number(t).toFixed(2);
    const m = Math.floor(t / 60);
    return m + ':' + (t - m * 60).toFixed(2).padStart(5, '0');
}

function save() {
    localStorage.setItem('ahlySwimmers', JSON.stringify(swimmers));
}

function toggleTheme() {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('ahlyTheme', next);
    updateThemeIcon();
}

function updateThemeIcon() {
    $('themeToggle').textContent = document.documentElement.dataset.theme === 'dark' ? '☀️' : '🌙';
}

function login() {
    const user = $('loginUser').value;
    const pass = $('loginPass').value;

    if (user === 'admin' && pass === '1234') {
        currentUser = { type: 'coach', name: 'الكابتن' };
        startApp();
    } else if (user === 'swimmer' && pass === '1234') {
        const id = parseInt(prompt('أدخل رقم السباح الخاص بك:'));
        const swimmer = swimmers.find(s => s.id === id);
        if (!swimmer) return alert('رقم السباح غير موجود');
        currentUser = { type: 'swimmer', id: swimmer.id, name: swimmer.name };
        startApp();
    } else {
        alert('بيانات الدخول غير صحيحة\n\nجرب:\nمدرب: admin / 1234\nسباح: swimmer / 1234');
    }
}

function startApp() {
    $('loginScreen').hidden = true;
    $('mainApp').hidden = false;
    $('userInfo').textContent = (currentUser.type === 'coach' ? 'مدرب: ' : 'سباح: ') + currentUser.name;

    renderDashboard();
    renderSwimmers();

    // السباح يشوف بياناته بس
    if (currentUser.type === 'swimmer') {
        $('btnAdd').hidden = true;
        $('searchInput').parentElement.hidden = true;
        $('appTitle').textContent = 'بياناتي - النادي الأهلي';
        renderSwimmers(swimmers.filter(s => s.id === currentUser.id));
    }
}

function logout() {
    location.reload();
}

function showSection(name) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav button').forEach(b => b.classList.remove('active'));
    $(name).classList.add('active');
    $('nav-' + name).classList.add('active');

    if (name === 'stats') renderStats();
    if (name === 'championships') renderChampionships();
}

function renderDashboard() {
    renderChampionships();
    renderStats();
    $('statTotal').textContent = swimmers.length;

    const best50 = Math.min(...swimmers.map(s => s.times?.['50']).filter(Boolean));
    $('statBest').textContent = isFinite(best50) ? best50.toFixed(2) : '--';

    const recent = swimmers
        .flatMap(s => (s.history || []).map(h => ({ name: s.name, ...h })))
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);

    $('recentResults').innerHTML = recent.map(r => `
        <div class="result-row">
            <strong>${esc(r.name)}</strong> - ${esc(r.championship)}<br>
            <small>${esc(r.event)}م: ${fmtTime(r.time)} ث</small>
        </div>`).join('') || '<p class="empty">لا توجد نتائج مسجلة</p>';
}

function renderSwimmers(list = swimmers) {
    $('swimmersList').innerHTML = list.map(s => `
        <div class="swimmer-card" onclick="viewSwimmer(${s.id})">
            <div class="swimmer-photo">
                ${s.photo ? `<img src="${s.photo}" alt="${esc(s.name)}">` : '🏊‍♂️'}
            </div>
            <div class="swimmer-info">
                <h3>${esc(s.name)}</h3>
                <p>📚 ${esc(s.school)} - ${esc(s.grade)}</p>
                <p>🏊‍♂️ ${getStrokeName(s.specialty)}</p>
                <div class="swimmer-times">
                    <div><span>${s.times?.['50']?.toFixed(2) || '--'}</span><small>50م</small></div>
                    <div><span>${s.times?.['100']?.toFixed(2) || '--'}</span><small>100م</small></div>
                    <div><span>${s.times?.['200'] ? (s.times['200'] / 60).toFixed(2) : '--'}</span><small>200م</small></div>
                </div>
            </div>
        </div>`).join('');
}

function searchSwimmers() {
    const q = $('searchInput').value.toLowerCase();
    renderSwimmers(swimmers.filter(s =>
        s.name.toLowerCase().includes(q) || s.school.toLowerCase().includes(q)));
}

function openAddModal() {
    $('swimmerModal').classList.add('active');
    $('modalTitle').textContent = 'إضافة سباح جديد';
    $('swimmerId').value = '';
    document.querySelector('form').reset();
    $('photoPreview').innerHTML = '📷';
    currentPhoto = null;
    tempChampionships = [];
    currentRaces = [];
    displayCurrentRaces();
    displayTempResults();
}

function closeModal() {
    $('swimmerModal').classList.remove('active');
}

function displayTempResults() {
    $('savedChampionships').innerHTML = tempChampionships.map((r, i) => `
        <div class="mini-row">
            <div>
                <strong>${esc(r.championship)}</strong> - ${esc(r.event)}م ${r.stroke ? getStrokeName(r.stroke) : ''}: ${fmtTime(r.time)} ث
                ${r.rank ? `(الترتيب: ${esc(r.rank)})` : ''}
            </div>
            <button type="button" class="btn-del" onclick="removeTempResult(${i})">حذف</button>
        </div>`).join('');
}

function removeTempResult(i) {
    tempChampionships.splice(i, 1);
    displayTempResults();
}

function displayCurrentRaces() {
    $('currentChampionshipRaces').innerHTML = currentRaces.map((r, i) => `
        <div class="mini-row">
            <span>${esc(r.event)}م ${getStrokeName(r.stroke)}: ${fmtTime(r.time)} ث ${r.rank ? '(الترتيب: ' + esc(r.rank) + ')' : ''}</span>
            <button type="button" class="btn-del" onclick="removeCurrentRace(${i})">حذف</button>
        </div>`).join('');
    $('btnSaveChamp').disabled = currentRaces.length === 0;
}

function removeCurrentRace(i) {
    currentRaces.splice(i, 1);
    displayCurrentRaces();
}

function addRaceToChampionship() {
    const stroke = $('raceStroke').value;
    const event = $('raceDistance').value;
    const time = parseFloat($('raceTime').value);
    const rank = $('raceRank').value;

    if (!stroke || !event || !(time > 0)) {
        return alert('يرجى اختيار نوع العومة والمسافة وكتابة الوقت');
    }
    currentRaces.push({ stroke, event, time, rank });
    $('raceTime').value = '';
    $('raceRank').value = '';
    displayCurrentRaces();
}

function saveChampionshipToSwimmer() {
    const name = $('champName').value.trim();
    const year = $('champYear').value;
    const date = $('champDate').value || (year + '-01-01');

    if (!name) return alert('يرجى كتابة اسم البطولة');
    if (currentRaces.length === 0) return alert('أضف سباقاً واحداً على الأقل');

    currentRaces.forEach(r => tempChampionships.push({
        date, championship: name, event: r.event, stroke: r.stroke, time: r.time, rank: r.rank
    }));
    currentRaces = [];
    displayCurrentRaces();
    displayTempResults();
}

function previewPhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
        currentPhoto = ev.target.result;
        $('photoPreview').innerHTML = `<img src="${currentPhoto}">`;
    };
    reader.readAsDataURL(file);
}

function saveSwimmer(e) {
    e.preventDefault();
    const id = $('swimmerId').value;
    const prev = id ? swimmers.find(x => x.id === parseInt(id)) : null;
    const history = (prev?.history || []).concat(tempChampionships);

    const swimmer = {
        id: id ? parseInt(id) : Date.now(),
        name: $('swName').value,
        school: $('swSchool').value,
        grade: $('swGrade').value,
        specialty: $('swSpecialty').value,
        photo: currentPhoto,
        times: {},
        history
    };

    // الرقم القياسي = أفضل وقت لكل مسافة، مع الأخذ في الاعتبار الأرقام القديمة
    ['50', '100', '200'].forEach(d => {
        const vals = history.filter(h => String(h.event) === d).map(h => h.time);
        if (prev?.times?.[d]) vals.push(prev.times[d]);
        swimmer.times[d] = vals.length ? Math.min(...vals) : null;
    });

    if (id) swimmers[swimmers.findIndex(s => s.id === parseInt(id))] = swimmer;
    else swimmers.push(swimmer);

    save();
    closeModal();
    tempChampionships = [];
    renderSwimmers();
    renderDashboard();
    alert('تم الحفظ بنجاح!');
}

function viewSwimmer(id) {
    const s = swimmers.find(x => x.id === id);
    if (!s) return;
    s.times = s.times || {};
    s.history = s.history || [];

    if (currentUser.type !== 'coach') {
        return alert(`
                الاسم: ${s.name}
                المدرسة: ${s.school}
                المرحلة: ${s.grade}
                الأرقام القياسية:
                50م صدر: ${s.times['50'] || '--'}
                100م صدر: ${s.times['100'] || '--'}
                200م متنوع: ${s.times['200'] || '--'}
            `);
    }

    const time50 = prompt('إضافة وقت 50م جديد (أو اتركه فارغاً):');
    if (!time50) return;
    s.times['50'] = parseFloat(time50);
    s.history.push({
        date: new Date().toISOString().split('T')[0],
        championship: prompt('اسم البطولة:') || 'تدريب',
        event: '50',
        time: parseFloat(time50)
    });
    save();
    renderSwimmers();
    renderDashboard();
}

function renderChampionships() {
    const champs = {};
    swimmers.forEach(sw => (sw.history || []).forEach(h => {
        const key = h.championship + '|' + h.date;
        champs[key] = champs[key] || { name: h.championship, date: h.date, races: 0, swimmers: new Set() };
        champs[key].races++;
        champs[key].swimmers.add(sw.id);
    }));

    const items = Object.values(champs).sort((a, b) => new Date(b.date) - new Date(a.date));

    $('championshipsList').innerHTML = items.map(c => `
        <div class="champ-item">
            <h3>🏆 ${esc(c.name)}</h3>
            <p>📅 ${esc(c.date)} | 🏊 ${c.swimmers.size} سباح | ${c.races} سباق</p>
        </div>`).join('') || '<p class="empty">لا توجد بطولات مسجلة</p>';

    $('statChamps').textContent = items.length;
}

function renderStats() {
    const distances = ['50', '100', '200', '400', '800', '1500'];
    const best = {};
    const champSet = new Set();
    let totalRaces = 0;

    swimmers.forEach(sw => {
        const history = sw.history || [];
        history.forEach(h => {
            totalRaces++;
            champSet.add(h.championship + '|' + h.date);
        });
        const records = history.map(h => ({ d: String(h.event), t: h.time, stroke: h.stroke }));
        Object.entries(sw.times || {}).forEach(([d, t]) => t && records.push({ d, t }));

        records.forEach(r => {
            if (r.t > 0 && (!best[r.d] || r.t < best[r.d].t)) {
                best[r.d] = { t: r.t, name: sw.name, stroke: r.stroke };
            }
        });
    });

    $('statsSummary').innerHTML = `
        <div class="stat-card"><h3>${swimmers.length}</h3><p>إجمالي السباحين</p></div>
        <div class="stat-card"><h3>${totalRaces}</h3><p>سباقات مسجلة</p></div>
        <div class="stat-card"><h3>${champSet.size}</h3><p>بطولات</p></div>`;

    const rows = distances.filter(d => best[d]).map(d => `
        <tr>
            <td>${d} م</td>
            <td>${fmtTime(best[d].t)} ث</td>
            <td>${esc(best[d].name)}</td>
            <td>${best[d].stroke ? getStrokeName(best[d].stroke) : '--'}</td>
        </tr>`).join('');

    $('statsBest').innerHTML = rows
        ? `<div class="table-wrap"><table><thead><tr><th>المسافة</th><th>أفضل وقت</th><th>السباح</th><th>العومة</th></tr></thead><tbody>${rows}</tbody></table></div>`
        : '<p class="empty">لا توجد أرقام مسجلة بعد</p>';

    // التطور = الفرق بين أول وآخر وقت لنفس المسافة
    const progress = swimmers.map(sw => {
        const byDist = {};
        (sw.history || []).forEach(h => (byDist[h.event] = byDist[h.event] || []).push(h));

        let top = null;
        Object.entries(byDist).forEach(([d, list]) => {
            if (list.length < 2) return;
            list.sort((a, b) => new Date(a.date) - new Date(b.date));
            const first = list[0].time;
            const last = list[list.length - 1].time;
            const pct = (first - last) / first * 100;
            if (!top || pct > top.pct) top = { d, first, last, pct };
        });
        return { sw, races: (sw.history || []).length, top };
    });

    const topPct = Math.max(0, ...progress.map(p => p.top ? p.top.pct : 0));
    const winner = progress
        .filter(p => p.top && p.top.pct > 0)
        .sort((a, b) => b.top.pct - a.top.pct)[0];

    $('statsImproved').innerHTML = winner
        ? `<div class="improved-box"><strong>${esc(winner.sw.name)}</strong>
           <p>تحسن في ${winner.top.d} م من ${fmtTime(winner.top.first)} إلى ${fmtTime(winner.top.last)} ث
           (${(winner.top.first - winner.top.last).toFixed(2)} ث، ${winner.top.pct.toFixed(1)}%)</p></div>`
        : '<p class="empty">لا توجد بيانات كافية بعد. سجّل سباقين على الأقل لنفس المسافة لنفس السباح.</p>';

    $('statsProgress').innerHTML = `<div class="table-wrap"><table>
        <thead><tr><th>السباح</th><th>عدد السباقات</th><th>التطور</th><th>مقدار التحسن</th></tr></thead><tbody>
        ${progress.map(p => {
            const w = p.top && topPct > 0 ? Math.max(0, p.top.pct) / topPct * 100 : 0;
            return `<tr>
                <td>${esc(p.sw.name)}</td>
                <td>${p.races}</td>
                <td><div class="bar"><div style="width: ${w}%"></div></div></td>
                <td>${p.top ? (p.top.first - p.top.last).toFixed(2) + ' ث (' + p.top.d + ' م)' : '--'}</td>
            </tr>`;
        }).join('')}</tbody></table></div>`;
}

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
});

updateThemeIcon();
