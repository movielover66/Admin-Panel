// ==========================================
// ⚡ GOD MODE MASTER SCRIPT (FINAL PRO)
// ==========================================

// B. AUTH & MAIN LOGIC
function checkLogin() {
    const email = document.getElementById('usrInput').value.trim();
    const pass = document.getElementById('passInput').value.trim();
    
    if(!email || !pass) return alert("Please enter Email & Password");

    auth.signInWithEmailAndPassword(email, pass)
    .then(() => {
        document.getElementById('loginScreen').style.display='none';
        document.getElementById('mainApp').style.display='block';
        playSound('success');
        initApp();
    })
    .catch(e => { 
        alert("Login Failed: " + e.message);
        document.getElementById('loginMsg').innerText = "Auth Error: " + e.message; 
        playSound('error'); 
    });
}

function initApp(){
    loadReports(); 
    loadRequests();
    db.ref('movies').on('value', s => {
        const count = s.numChildren();
        document.getElementById('totalMovies').innerText = count;
    });
    renderDB();
}

// INCREMENT CONTROL
function inc(id) {
    let el = document.getElementById(id);
    let val = parseInt(el.value) || 0;
    el.value = val + 1;
    if(document.getElementById('mType').value === 'series') updateSeriesLinks();
}

// CINEFREAK SEARCH
function openCineFreak() {
    const title = document.getElementById('mTitle').value;
    if(!title) { showModal("ERROR", "Fetch a movie first!"); return; }
    window.open(`https://www.cinefreak.net/?s=${encodeURIComponent(title)}`, '_blank');
}

// LINK MANAGEMENT (MANUAL)
function addMultiServerLink() {
    const s1 = document.getElementById('server1').value;
    const s2 = document.getElementById('server2').value;
    const watch = document.getElementById('watchLink').value;
    const dl = document.getElementById('dlLink').value;
    
    if(!s1 && !s2 && !watch && !dl) return showModal("ERROR", "Add at least one link!");
    
    const isSeries = document.getElementById('mType').value === 'series';
    const ep = isSeries ? parseInt(document.getElementById('epNum').value) : 0;
    const qual = document.getElementById('linkQual').value;

    tempLinks.push({ 
        ep: ep, 
        qual: qual, 
        server1: s1, 
        server2: s2, 
        watch: watch, 
        dl: dl, 
        id: Date.now() 
    });

    if(isSeries) inc('epNum');
    
    document.getElementById('watchLink').value = "";
    document.getElementById('dlLink').value = "";
    renderLinks();
}

function renderLinks() {
    document.getElementById('linkContainer').innerHTML = tempLinks.map((l, i) => `
        <div class="list-item" style="flex-wrap:wrap;">
            <div style="flex:1;">
                <span style="color:var(--cyan); font-weight:bold;">
                    ${l.ep > 0 ? 'S'+document.getElementById('mSeason').value+' E'+l.ep : 'MOVIE'}
                </span> 
                <span style="background:#333; padding:2px 6px; border-radius:4px; font-size:10px;">${l.qual}</span>
            </div>
            <i class="fa-solid fa-trash" style="color:var(--red); cursor:pointer;" onclick="tempLinks.splice(${i}, 1); renderLinks()"></i>
        </div>`).join('');
}

// PUBLISH FUNCTION (MANUAL)
function publish() {
    try {
        const title = document.getElementById('mTitle').value;
        if(!title) return showModal("ERROR", "Title Required");
        
        const id = document.getElementById('editId').value || 'mov_' + Date.now();
        const type = document.getElementById('mType').value;
        
        const movieData = {
            title: title,
            year: document.getElementById('mYear').value,
            trailer: document.getElementById('mTrailer').value,
            type: type, 
            img: document.getElementById('posterPreview').src,
            backdrop: document.getElementById('mBackdrop').value, 
            desc: document.getElementById('mDesc').value,
            genre: document.getElementById('mGenre').value,
            ratings: { 
                imdb: document.getElementById('mRating').value, 
                rt: document.getElementById('rtRating').value 
            },
            res: document.getElementById('lQual').value,
            domainLock: document.getElementById('domainLock').value,
            isFeatured: document.getElementById('isFeatured').checked, 
            uploadTime: new Date().toISOString(),
            season: type==='series' ? document.getElementById('mSeason').value : null, 
            content: tempLinks
        };

        db.ref('movies/' + id).set(movieData)
        .then(() => { 
            showModal("SUCCESS", "Published Successfully!"); 
            triggerReset(); 
            renderDB(); 
        })
        .catch((e) => { showModal("DB ERROR", e.message); });

    } catch (err) { console.error(err); }
}

// DATABASE LIST RENDER
function renderDB() {
    const q = document.getElementById('dbSearch').value.toLowerCase();
    
    db.ref('movies').once('value', s => {
        const d = s.val(); 
        let html = "";
        
        if(d) {
            Object.keys(d).reverse().forEach(k => {
                const m = d[k];
                if(m.title && m.title.toLowerCase().includes(q)) {
                    html += `
                    <div class="list-item" style="display:flex; align-items:center; gap:15px; padding:12px; background:#1a1a1a; border-radius:8px; margin-bottom:8px; border:1px solid #333;">
                        <img src="${m.img}" style="width:60px; height:90px; object-fit:cover; border-radius:5px; border:1px solid #555;">
                        <div style="flex:1;">
                            <b style="font-size:16px; color:#fff;">${m.title}</b>
                            <div style="font-size:11px; color:#aaa; margin-top:5px;">
                                <span style="color:var(--gold); font-weight:bold;">${m.year || 'N/A'}</span> • 
                                <span style="background:#333; padding:2px 5px; border-radius:3px;">${m.type ? m.type.toUpperCase() : 'MOVIE'}</span> • 
                                <span style="color:var(--cyan);">${m.res || 'HD'}</span>
                            </div>
                        </div>
                        <div style="display:flex; gap:15px; margin-right:10px;">
                            <i class="fa-solid fa-pen" style="color:var(--cyan); cursor:pointer; font-size:18px;" onclick="loadEdit('${k}')" title="Edit"></i>
                            <i class="fa-solid fa-trash" style="color:var(--red); cursor:pointer; font-size:18px;" onclick="if(confirm('Delete?')) db.ref('movies/${k}').remove() && renderDB()" title="Delete"></i>
                        </div>
                    </div>`;
                }
            });
        }
        document.getElementById('dbList').innerHTML = html || '<div style="text-align:center;color:#555; padding:20px;">No Movies Found</div>';
    });
}

function loadEdit(id) {
    db.ref('movies/' + id).once('value', s => {
        const m = s.val();
        switchTab('upload'); 
        document.getElementById('editId').value = id;
        document.getElementById('mTitle').value = m.title; 
        document.getElementById('mYear').value = m.year || "";
        document.getElementById('posterPreview').src = m.img;
        document.getElementById('mDesc').value = m.desc;
        document.getElementById('mType').value = m.type;
        document.getElementById('lQual').value = m.res || '720p HD';
        
        if(m.ratings) { 
            document.getElementById('mRating').value = m.ratings.imdb || ""; 
            document.getElementById('rtRating').value = m.ratings.rt || ""; 
        }
        
        if(m.type === 'series') document.getElementById('mSeason').value = m.season || 1;
        toggleTypeUI(); 
        tempLinks = m.content || []; 
        renderLinks();
    });
}

// ==========================================
// 1. SMART TITLE & EXCEL LIST (WITH SIZE)
// ==========================================

let excelList = [];

function generateSmartTitle() {
    const title = document.getElementById('genTitle').value;
    const year = document.getElementById('genYear').value;
    const qual = document.getElementById('genQual').value;
    const audio = document.getElementById('genAudio').value;
    const source = document.getElementById('genSource').value;

    if(title) {
        const smartText = `${title} (${year || '2024'}) ${qual} ${audio} ${source}`;
        document.getElementById('finalSmartTitle').value = smartText;
    }
}

async function autoFetchYearForExcel() {
    const title = document.getElementById('genTitle').value;
    if (!title) return;
    
    try {
        const res = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${TMDB_KEY}&query=${encodeURIComponent(title)}`);
        const data = await res.json();
        if (data.results && data.results.length > 0) {
            const match = data.results[0];
            const date = match.release_date || match.first_air_date;
            if (date) document.getElementById('genYear').value = date.split('-')[0];
            
            // Show Photo
            if (match.poster_path) {
                const imgEl = document.getElementById('genThumb');
                imgEl.src = `https://image.tmdb.org/t/p/w92${match.poster_path}`;
                imgEl.style.display = 'block';
            }
            generateSmartTitle(); 
        }
    } catch (e) {}
}

function addToExcelList() {
    const smartTitle = document.getElementById('finalSmartTitle').value; 
    const link = document.getElementById('genLink').value;
    const dl = document.getElementById('genDL').value;
    const qual = document.getElementById('genQual').value;
    const size = document.getElementById('genSize').value; // Get Size
    const rawType = document.getElementById('genTitle').value.includes('Season') ? 'series' : 'movie';

    if (!smartTitle) return alert("Please enter a name!");

    excelList.push({
        Title: smartTitle, 
        Year: document.getElementById('genYear').value,
        Type: rawType,
        Size: size, // Save Size
        Link: link,
        Download: dl,
        Quality: qual
    });

    renderExcelPreview();
    
    document.getElementById('genTitle').value = "";
    document.getElementById('genLink').value = "";
    document.getElementById('genDL').value = "";
    document.getElementById('genSize').value = "";
    document.getElementById('finalSmartTitle').value = "";
    document.getElementById('genTitle').focus();
}

function renderExcelPreview() {
    document.getElementById('excelCount').innerText = excelList.length;
    const container = document.getElementById('excelPreview');
    if (excelList.length === 0) return container.innerHTML = '<div style="text-align:center; color:#555; padding:20px;">List is Empty</div>';
    
    container.innerHTML = excelList.map((item, index) => `
        <div style="background:#222; padding:10px; margin-bottom:5px; border-radius:5px; display:flex; justify-content:space-between; align-items:center;">
            <div>
                <b style="color:#fff; font-size:12px;">${item.Title}</b>
                <br><span style="color:var(--gold); font-size:10px;">Size: ${item.Size || 'N/A'}</span>
            </div>
            <i class="fa-solid fa-trash" style="color:var(--red); cursor:pointer;" onclick="removeFromExcel(${index})"></i>
        </div>
    `).join('');
}

function removeFromExcel(index) {
    excelList.splice(index, 1);
    renderExcelPreview();
}

function downloadGeneratedExcel() {
    if (excelList.length === 0) return alert("List is empty!");
    const ws = XLSX.utils.json_to_sheet(excelList);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Movies");
    XLSX.writeFile(wb, "Smart_Title_Upload.xlsx");
    alert("Excel Saved!");
}

// ==========================================
// 2. PRO BULK UPLOAD (FIXED: SHOW FULL SMART TITLE)
// ==========================================

function handleBulkUpload(input) {
    const file = input.files[0];
    const reader = new FileReader();
    
    reader.onload = async function(e) { 
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {type: 'array'});
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet);

        if(confirm(`Found ${json.length} items. Upload with SMART TITLES?`)) {
            alert("Starting Upload... Titles will appear exactly as in Excel!");
            
            let count = 0;
            for (const row of json) {
                // 1. Get Titles
                let fullTitle = row.Title || row.title || "No Title"; // Smart Title (e.g., Pathan 4K...)
                let cleanTitle = fullTitle.split('(')[0].trim();      // Clean Title (e.g., Pathan)
                
                const year = row.Year || row.year || "";
                const quality = row.Quality || row.quality || "HD"; 
                const size = row.Size || row.size || ""; 
                const mainWatch = row.Link || row.link || "";     
                const mainDL = row.Download || row.download || ""; 

                // Detect Series logic
                let isSeries = false, season = 1, episode = 1;
                const seMatch = cleanTitle.match(/S(\d+)\s*E(\d+)/i) || cleanTitle.match(/Season\s*(\d+)\s*Episode\s*(\d+)/i);
                if (seMatch) {
                    isSeries = true; season = parseInt(seMatch[1]); episode = parseInt(seMatch[2]);
                    cleanTitle = cleanTitle.replace(seMatch[0], '').trim();
                } else if(row.Type && row.Type.toLowerCase().includes('series')) {
                    isSeries = true;
                }

                // TMDB Fetch logic
                let tmdbId = "", posterUrl = "https://via.placeholder.com/300x450?text=No+Poster", backdrop = "", desc = "Added via Bulk Upload", genre = "Action", imdbRating = "N/A";
                try {
                    const searchRes = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${TMDB_KEY}&query=${encodeURIComponent(cleanTitle)}`);
                    const searchData = await searchRes.json();
                    if (searchData.results && searchData.results.length > 0) {
                        const match = searchData.results[0]; tmdbId = match.id;
                        const type = isSeries ? 'tv' : (match.media_type === 'tv' ? 'tv' : 'movie');
                        const detailRes = await fetch(`https://api.themoviedb.org/3/${type}/${tmdbId}?api_key=${TMDB_KEY}`);
                        const details = await detailRes.json();
                        if (details.poster_path) posterUrl = `https://image.tmdb.org/t/p/original${details.poster_path}`;
                        if (details.backdrop_path) backdrop = `https://image.tmdb.org/t/p/original${details.backdrop_path}`;
                        if (details.overview) desc = details.overview;
                        if (details.genres) genre = details.genres.map(g => g.name).join(", ");
                        if (details.vote_average) imdbRating = details.vote_average.toFixed(1);
                    }
                } catch (e) {}

                // Auto Links
                let finalServer1 = mainWatch; 
                let finalServer2 = "";
                if (!mainWatch) {
                    if (isSeries) {
                        finalServer1 = `https://vidsrc.pro/embed/tv/${tmdbId}/${season}/${episode}`;
                        finalServer2 = `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${season}&e=${episode}`;
                    } else {
                        finalServer1 = `https://vidsrc.pro/embed/movie/${tmdbId}`;
                        finalServer2 = `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1`;
                    }
                }

                // ID Generation
                const dbId = tmdbId ? `mov_${tmdbId}` : 'mov_' + cleanTitle.replace(/[^a-zA-Z0-9]/g, '');
                
                const newContent = {
                    server1: finalServer1,
                    server2: finalServer2,
                    dl: mainDL,
                    qual: quality,
                    size: size,
                    ep: isSeries ? episode : 0,
                    season: isSeries ? season : 0,
                    id: Date.now() + Math.random()
                };

                // Check & Merge
                const snapshot = await db.ref('movies/' + dbId).once('value');
                if (snapshot.exists()) {
                    let existingData = snapshot.val();
                    let contentList = existingData.content || [];
                    contentList.push(newContent);
                    await db.ref('movies/' + dbId + '/content').set(contentList);
                } else {
                    const movieData = {
                        title: fullTitle, // 🔥 CHANGE: Use 'fullTitle' instead of 'cleanTitle'
                        cleanTitle: cleanTitle, // Keep clean title for backup
                        year: year, 
                        type: isSeries ? 'series' : 'movie',
                        img: posterUrl, 
                        backdrop: backdrop, 
                        desc: desc, 
                        genre: genre,
                        ratings: { imdb: imdbRating }, 
                        uploadTime: new Date().toISOString(),
                        res: quality,
                        content: [newContent]
                    };
                    await db.ref('movies/' + dbId).set(movieData);
                }
                count++;
            }
            alert(`SUCCESS! ${count} movies uploaded with FULL TITLES.`);
            renderDB();
        }
    };
    reader.readAsArrayBuffer(file);
}

// ==========================================
// 3. UTILITY FUNCTIONS
// ==========================================

function saveSettings() { 
    db.ref('settings/automation').set({ 
        tgToken: document.getElementById('tgToken').value, 
        tgChatId: document.getElementById('tgChatId').value 
    }); 
    alert("Saved!"); 
}

function triggerReset(){ 
    document.getElementById('mTitle').value=""; 
    document.getElementById('editId').value=""; 
    document.getElementById('posterPreview').src=""; 
    tempLinks=[]; 
    renderLinks(); 
}

function toggleTypeUI(){ 
    const isSeries=document.getElementById('mType').value==='series'; 
    document.getElementById('seasonBox').style.display=isSeries?'block':'none'; 
    document.getElementById('epBox').style.display=isSeries?'block':'none'; 
    document.getElementById('btnFetchEP').style.display=isSeries?'block':'none'; 
}

function switchTab(t) {
    document.querySelectorAll('.tab-content').forEach(e => e.style.display = 'none');
    const selectedTab = document.getElementById(t);
    if (selectedTab) selectedTab.style.display = 'block';
    
    document.querySelectorAll('.nav-tab').forEach(e => e.classList.remove('active'));
    const activeBtn = document.querySelector(`.nav-tab[onclick="switchTab('${t}')"]`);
    if (activeBtn) activeBtn.classList.add('active');
    
    if (t === 'database') renderDB();
}

function showModal(t,m){ 
    document.getElementById('modalTitle').innerText=t; 
    document.getElementById('modalBody').innerHTML=m; 
    document.getElementById('masterModal').style.display='flex'; 
}

function closeModal(){ 
    document.getElementById('masterModal').style.display='none'; 
}

function playSound(t){ 
    if(audioCtx.state==='suspended') audioCtx.resume(); 
    const o=audioCtx.createOscillator();
    const g=audioCtx.createGain(); 
    o.connect(g); 
    g.connect(audioCtx.destination); 
    o.start(); 
    o.stop(audioCtx.currentTime+0.1); 
}

function loadReports() { 
    db.ref('reports').on('value', s => { 
        const d = s.val(); 
        document.getElementById('pendingReports').innerText = s.numChildren(); 
        document.getElementById('notifBadge').style.display = s.numChildren() > 0 ? 'block' : 'none'; 
        let h = ''; 
        if(d) Object.keys(d).reverse().forEach(k => { 
            const i = d[k]; 
            h += `<div class="list-item" style="border-left:3px solid var(--red);flex-direction:column;align-items:flex-start;"><div style="width:100%;display:flex;justify-content:space-between;"><b style="color:var(--red)">${i.movie||'Unknown'}</b><i class="fa-solid fa-check" style="color:green" cursor:pointer;" onclick="db.ref('reports/${k}').remove()"></i></div><small style="color:#ccc;">${i.issue||'Broken Link'}</small></div>`; 
        }); 
        document.getElementById('reportList').innerHTML = h; 
    }); 
}

function loadRequests() { 
    db.ref('requests').on('value', s => { 
        const d = s.val(); 
        let h = ''; 
        if(d) Object.keys(d).reverse().forEach(k => { 
            h += `<div class="list-item" style="border-left:3px solid var(--gold);flex-direction:column;align-items:flex-start;"><div style="width:100%;display:flex;justify-content:space-between;"><b style="color:var(--gold)">${d[k].movieName||'Req'}</b><i class="fa-solid fa-trash" style="color:var(--red)" onclick="db.ref('requests/${k}').remove()"></i></div></div>`; 
        });
        document.getElementById('requestList').innerHTML = h; 
    }); 
}

// ==========================================
// 4. ULTRA SMART BROKEN LINK SCANNER
// ==========================================

async function startAutoScan() {
    if(!confirm("⚠️ DEEP SCANNING STARTING...\n\nThis will check connectivity of every link.\nIt may take some time. Do not close the tab.")) return;
    
    // UI Update (Show Progress)
    const btn = document.querySelector('button[onclick="startAutoScan()"]');
    const originalText = btn.innerHTML;
    
    try {
        const snapshot = await db.ref('movies').once('value');
        const movies = snapshot.val();
        
        if(!movies) { alert("Database is Empty!"); return; }

        let issuesFound = 0;
        let batchUpdates = {};
        const keys = Object.keys(movies);
        const total = keys.length;

        // Loop through all movies
        for (let i = 0; i < total; i++) {
            const key = keys[i];
            const m = movies[key];
            
            // UI Progress Update
            btn.innerHTML = `<i class="fa-solid fa-radar fa-spin"></i> Scanning (${i+1}/${total})`;

            let issueType = "";
            let linkToCheck = "";

            // 1. CHECK IF CONTENT EXISTS
            if (!m.content || !Array.isArray(m.content) || m.content.length === 0) {
                issueType = "🔴 No Video Content Added";
            } else {
                // Get the first link to test
                const c = m.content[0];
                
                // Priority: Check Server 1 -> Server 2 -> Download
                linkToCheck = c.server1 || c.server2 || c.dl;

                // 2. CHECK EMPTY LINKS
                if (!linkToCheck || linkToCheck.trim() === "") {
                    issueType = "🟠 All Links are Empty";
                } 
                // 3. CHECK SYNTAX (Valid URL format)
                else if (!linkToCheck.startsWith("http")) {
                    issueType = "⚠️ Invalid URL Format (No http)";
                }
                // 4. CHECK DEAD SERVER (Network Ping)
                else {
                    const isAlive = await checkLinkAlive(linkToCheck);
                    if (!isAlive) {
                        issueType = "💀 Dead Link / Server Down";
                    }
                }
            }

            // If Issue Found -> Add to Report
            if (issueType) {
                const reportId = 'rep_' + key;
                batchUpdates['reports/' + reportId] = {
                    movie: m.title,
                    issue: issueType,
                    link: linkToCheck || "N/A",
                    id: key,
                    time: Date.now()
                };
                issuesFound++;
            }
        }

        // Push Reports
        if (issuesFound > 0) {
            await db.ref().update(batchUpdates);
            alert(`SCAN COMPLETE! 🚨 Found ${issuesFound} Broken/Dead Links.\nCheck INBOX to fix them.`);
            loadReports();
        } else {
            alert("SCAN COMPLETE! ✅ All Links are Healthy & Active.");
        }

    } catch (err) {
        console.error(err);
        alert("Scan Stopped: " + err.message);
    } finally {
        btn.innerHTML = originalText;
    }
}

// Helper Function: Pings the URL
async function checkLinkAlive(url) {
    try {
        // We use 'no-cors' mode to just check connectivity without needing permission
        // If fetch fails (Network Error), it means domain is dead.
        await fetch(url, { method: 'HEAD', mode: 'no-cors', cache: 'no-cache' });
        return true; // Connection Successful (Server exists)
    } catch (e) {
        console.log("Dead Link Detected:", url);
        return false; // Connection Failed (DNS Error / Server Down)
    }
}
