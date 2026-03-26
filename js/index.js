function formatProfileStat(n) {
    if (n == null || n === '' || Number.isNaN(Number(n))) return '—';
    return Number(n).toLocaleString();
}

async function fetchGithubRepoStars(username) {
    var total = 0;
    var page = 1;
    var maxPages = 30;
    while (page <= maxPages) {
        var url = 'https://api.github.com/users/' + encodeURIComponent(username) + '/repos?per_page=100&page=' + page;
        var r = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } });
        if (!r.ok) return null;
        var repos = await r.json();
        if (!Array.isArray(repos) || repos.length === 0) break;
        for (var i = 0; i < repos.length; i++) {
            if (!repos[i].fork) total += repos[i].stargazers_count || 0;
        }
        if (repos.length < 100) break;
        page += 1;
    }
    return total;
}

async function loadProfileStats() {
    var citeEl = document.getElementById('stat-citations');
    var starsEl = document.getElementById('stat-github-stars');
    var updatedEl = document.getElementById('stat-updated');
    var updatedWrap = document.getElementById('stat-updated-wrap');
    if (!citeEl || !starsEl) return;

    var statsUrl = window.__STATS_JSON__ || '/stats.json';
    var jsonData = null;
    try {
        var sr = await fetch(statsUrl, { cache: 'no-store' });
        if (sr.ok) jsonData = await sr.json();
    } catch (e) { /* ignore */ }

    var liveStars = null;
    try {
        liveStars = await fetchGithubRepoStars('Bean-Young');
    } catch (e) { /* ignore */ }

    if (jsonData && jsonData.citations != null) {
        citeEl.textContent = formatProfileStat(jsonData.citations);
    } else {
        citeEl.textContent = '—';
    }

    if (liveStars != null) {
        starsEl.textContent = formatProfileStat(liveStars);
    } else if (jsonData && jsonData.githubStars != null) {
        starsEl.textContent = formatProfileStat(jsonData.githubStars);
    } else {
        starsEl.textContent = '—';
    }

    if (updatedEl && updatedWrap && jsonData && jsonData.updated) {
        var d = new Date(jsonData.updated);
        if (!Number.isNaN(d.getTime())) {
            var lang = (document.documentElement.lang || '').toLowerCase();
            updatedEl.textContent = lang.indexOf('zh') === 0
                ? '指标同步时间（Scholar 等）：' + d.toLocaleDateString('zh-CN')
                : 'Synced (incl. Scholar): ' + d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
            updatedWrap.style.display = '';
        }
    }
}

$(document).ready(function() {
    $('.publication-mousecell').mouseover(function() {
        $(this).find('video').css('display', 'inline-block');
        $(this).find('img').css('display', 'none');
    });
    $('.publication-mousecell').mouseout(function() {
        $(this).find('video').css('display', 'none');
        $(this).find('img').css('display', 'inline-block');
    });
    loadProfileStats();
})
