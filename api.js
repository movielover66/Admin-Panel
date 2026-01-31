// ==========================================
// C. HYBRID API & AUTO LINKS (CORE FETCH LOGIC)
// ==========================================

async function fetchHybrid() {
    // Check if TMDB_KEY exists (loaded from config.js)
    if(typeof TMDB_KEY === 'undefined') return showModal("SYSTEM ERROR", "Config.js not loaded!");

    const q = document.getElementById('tmdbQuery').value;
    if(!q) return showModal("ERROR", "Enter Name or ID");
    
    // IMDb ID Search
    if(q.startsWith('tt')) { syncData('find', q); return; }

    try {
        console.log("Fetching: " + q);
        const url = `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_KEY}&query=${encodeURIComponent(q)}`;
        
        const res = await fetch(url);
        const data = await res.json();

        if (!res.ok) throw new Error(`API Error: ${data.status_message || "Invalid Key"}`);
        if(!data.results || data.results.length === 0) return showModal("OOPS", "No Content Found");
        
        let html = data.results.filter(x=>x.media_type==='movie'||x.media_type==='tv').map(x => `
            <div class="list-item" onclick="syncData('${x.media_type}', ${x.id})" style="cursor:pointer;">
                <img src="https://image.tmdb.org/t/p/w200${x.poster_path}" style="width:40px;height:60px;object-fit:cover; margin-right:10px;" onerror="this.src='https://via.placeholder.com/40x60'">
                <div><b>${x.title||x.name}</b><br><small style="color:var(--cyan);">${x.media_type.toUpperCase()} • ${x.release_date||x.first_air_date||'N/A'}</small></div>
            </div>`).join('');
        showModal("SELECT CONTENT", html);

    } catch(e) { 
        showModal("API ERROR", `Issue: ${e.message}<br><small>Check Config Key</small>`); 
    }
}

async function syncData(type, id) {
    closeModal(); playSound('success');
    
    // RESET FIELDS
    document.getElementById('mRating').value = ""; document.getElementById('rtRating').value = ""; document.getElementById('metaRating').value = "";
    document.getElementById('mTrailer').value = ""; document.getElementById('mYear').value = "";
    
    try {
        let tmdbData = {};

        if(type === 'find') {
            const res = await fetch(`https://api.themoviedb.org/3/find/${id}?api_key=${TMDB_KEY}&external_source=imdb_id`);
            const d = await res.json();
            tmdbData = d.movie_results[0] || d.tv_results[0];
            type = d.movie_results.length > 0 ? 'movie' : 'series'; 
            id = tmdbData.id;
        } 
        
        const res = await fetch(`https://api.themoviedb.org/3/${type}/${id}?api_key=${TMDB_KEY}&append_to_response=external_ids,videos`);
        tmdbData = await res.json();

        if (!res.ok) throw new Error("Details Fetch Failed");

        document.getElementById('editId').value = "";
        document.getElementById('tmdbId').value = tmdbData.id;
        document.getElementById('mTitle').value = tmdbData.title || tmdbData.name;
        document.getElementById('mDesc').value = tmdbData.overview;
        document.getElementById('mGenre').value = tmdbData.genres ? tmdbData.genres.map(g => g.name).join(", ") : "";

        let date = tmdbData.release_date || tmdbData.first_air_date;
        document.getElementById('mYear').value = date ? date.split('-')[0] : "";

        if(tmdbData.videos && tmdbData.videos.results) {
            const trailer = tmdbData.videos.results.find(v => v.site === "YouTube" && v.type === "Trailer");
            document.getElementById('mTrailer').value = trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : "";
        }

        if(tmdbData.poster_path) document.getElementById('posterPreview').src = `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}`;
        if(tmdbData.backdrop_path) document.getElementById('mBackdrop').value = `https://image.tmdb.org/t/p/w500${tmdbData.backdrop_path}`;
        
        document.getElementById('mType').value = (type === 'tv') ? 'series' : 'movie';
        toggleTypeUI();

        // AUTO LINK & RATINGS
        const imdbId = tmdbData.external_ids?.imdb_id;
        if(imdbId) {
            generateAutoLinks(id, imdbId, type); 
            try {
                const omdbRes = await fetch(`https://www.omdbapi.com/?i=${imdbId}&apikey=${OMDB_KEY}`);
                const omdb = await omdbRes.json();
                if(omdb.Ratings) {
                    document.getElementById('mRating').value = omdb.imdbRating || "";
                    const rt = omdb.Ratings.find(r => r.Source === "Rotten Tomatoes");
                    document.getElementById('rtRating').value = rt ? rt.Value : "";
                    const meta = omdb.Ratings.find(r => r.Source === "Metacritic");
                    document.getElementById('metaRating').value = meta ? meta.Value.split('/')[0] : "";
                }
            } catch(e) { console.log("OMDB Error", e); }
        } else {
            generateAutoLinks(id, null, type);
        }
    } catch(e) {
        showModal("DATA ERROR", "Fetch Failed: " + e.message);
    }
}

function generateAutoLinks(tmdbId, imdbId, type) {
    let s1 = "", s2 = "";
    if(type === 'movie') {
        s1 = `https://vidsrc.pro/embed/movie/${tmdbId}`;
        s2 = `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1`;
    } else {
        s1 = `https://vidsrc.pro/embed/tv/${tmdbId}/1/1`;
        s2 = `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=1&e=1`;
    }
    document.getElementById('server1').value = s1;
    document.getElementById('server2').value = s2;
}

function updateSeriesLinks() {
    const tmdbId = document.getElementById('tmdbId').value;
    if(!tmdbId) return;
    const s = document.getElementById('mSeason').value;
    const e = document.getElementById('epNum').value;
    document.getElementById('server1').value = `https://vidsrc.pro/embed/tv/${tmdbId}/${s}/${e}`;
    document.getElementById('server2').value = `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${s}&e=${e}`;
}

async function fetchEpisodeInfo() {
    const id = document.getElementById('tmdbId').value;
    const s = document.getElementById('mSeason').value;
    const e = document.getElementById('epNum').value;
    if(!id) return showModal("ERROR", "Search Content First");
    try {
        const res = await fetch(`https://api.themoviedb.org/3/tv/${id}/season/${s}/episode/${e}?api_key=${TMDB_KEY}`);
        const d = await res.json();
        if(d.name) {
            showModal("EPISODE FOUND", `<b>${d.name}</b><br>${d.overview}`);
            updateSeriesLinks();
        }
    } catch(e){ showModal("ERROR", "Not Found"); }
}
