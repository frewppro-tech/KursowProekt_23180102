// js/app.js

document.addEventListener("DOMContentLoaded", () => {
  const audio = document.getElementById("audio");
  const playPauseBtn = document.getElementById("play-pause-btn");
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");

  const artistTabs = document.querySelectorAll(".artist-tab");
  const playlistsSections = document.querySelectorAll(".playlist");

  const artistImage = document.getElementById("artist-image");
  const artistName = document.getElementById("artist-name");
  const currentTrackTitle = document.getElementById("current-track-title");

  const progressBar = document.getElementById("progress-bar");
  const currentTimeEl = document.getElementById("current-time");
  const durationEl = document.getElementById("duration");

  const volumeSlider = document.getElementById("volume-slider");
  const muteBtn = document.getElementById("mute-btn");

  // настройки за снимките и имената
  // imgSrc -> за <img> в HTML (пътя е спрямо index.html)
  // bgVar  -> за фона (CSS променлива, пътя е спрямо css/style.css -> ../images/...)
  const artistConfig = {
    virgo: {
      name: "Virgo",
      imgSrc: "images/virgo.jpg",
      bgVar: 'url("../images/virgo.jpg")'
    },
    galena: {
      name: "Galena",
      imgSrc: "images/galena.jpg",
      bgVar: 'url("../images/galena.jpg")'
    },
    mbt: {
      name: "MBT",
      imgSrc: "images/mbt.jpg",
      bgVar: 'url("../images/mbt.jpg")'
    }
  };

  let currentArtist = "virgo";
  let currentPlaylistEl = document.getElementById("playlist-virgo");
  let currentTracks = Array.from(
    currentPlaylistEl.querySelectorAll(".track")
  );
  let currentTrackIndex = 0;

  let lastVolume = 1; // последната ненулева сила на звука

  /* ------------ помощни функции ------------ */

  function setMuteIcon(isMuted) {
    if (!muteBtn) return;
    muteBtn.textContent = isMuted ? "🔇" : "🔊";
    muteBtn.setAttribute(
      "aria-label",
      isMuted ? "Върни звука" : "Заглуши звука"
    );
  }

  function setArtist(artistKey) {
    currentArtist = artistKey;

    // активен таб
    artistTabs.forEach(tab =>
      tab.classList.toggle("active", tab.dataset.artist === artistKey)
    );

    // активен плейлист
    playlistsSections.forEach(section =>
      section.classList.toggle(
        "playlist-active",
        section.id === `playlist-${artistKey}`
      )
    );

    currentPlaylistEl = document.getElementById(`playlist-${artistKey}`);
    currentTracks = Array.from(
      currentPlaylistEl.querySelectorAll(".track")
    );
    currentTrackIndex = 0;

    // снимка и фон
    const cfg = artistConfig[artistKey];
    artistImage.src = cfg.imgSrc;
    artistImage.alt = cfg.name;
    artistName.textContent = cfg.name;

    // сменяме CSS променливата --bg-image на <html> (documentElement)
    document.documentElement.style.setProperty("--bg-image", cfg.bgVar);

    // зареждаме първата песен, но без autoplay
    if (currentTracks.length > 0) {
      loadTrack(currentTrackIndex, false);
    }
  }

  function loadTrack(index, autoplay = true) {
    if (!currentTracks.length) return;

    if (index < 0) index = currentTracks.length - 1;
    if (index >= currentTracks.length) index = 0;
    currentTrackIndex = index;

    const trackEl = currentTracks[currentTrackIndex];
    const src = trackEl.dataset.src;
    const title = trackEl.dataset.title || trackEl.textContent.trim();

    // визуално активна песен
    currentTracks.forEach(t => t.classList.remove("active-track"));
    trackEl.classList.add("active-track");

    audio.src = src;
    audio.load();
    currentTrackTitle.textContent = title;

    if (autoplay) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
    updatePlayPauseIcon();
  }

  function updatePlayPauseIcon() {
    if (audio.paused) {
      playPauseBtn.textContent = "▶";
      playPauseBtn.setAttribute("aria-label", "Пусни");
    } else {
      playPauseBtn.textContent = "⏸";
      playPauseBtn.setAttribute("aria-label", "Пауза");
    }
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60) || 0;
    const secs = Math.floor(seconds % 60) || 0;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  /* ------------ събития ------------ */

  // смяна на изпълнител (SPA табове)
  artistTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const artistKey = tab.dataset.artist;
      if (artistKey !== currentArtist) {
        setArtist(artistKey);
      }
    });
  });

  // клик по песен в плейлист
  playlistsSections.forEach(section => {
    section.addEventListener("click", e => {
      const trackEl = e.target.closest(".track");
      if (!trackEl) return;

      const artistKey = trackEl.dataset.artist;
      if (artistKey && artistKey !== currentArtist) {
        setArtist(artistKey);
      }

      currentPlaylistEl = document.getElementById(
        `playlist-${currentArtist}`
      );
      currentTracks = Array.from(
        currentPlaylistEl.querySelectorAll(".track")
      );

      const index = currentTracks.indexOf(trackEl);
      if (index !== -1) {
        loadTrack(index, true); // play веднага
      }
    });
  });

  // play/pause бутона
  playPauseBtn.addEventListener("click", () => {
    if (!audio.src) {
      if (currentTracks.length) loadTrack(currentTrackIndex, true);
      return;
    }
    if (audio.paused) {
      audio.play();
    } else {
      audio.pause();
    }
    updatePlayPauseIcon();
  });

  // предишна / следваща
  prevBtn.addEventListener("click", () => {
    if (!currentTracks.length) return;
    loadTrack(currentTrackIndex - 1, true);
  });

  nextBtn.addEventListener("click", () => {
    if (!currentTracks.length) return;
    loadTrack(currentTrackIndex + 1, true);
  });

  // прогрес бар и време
  audio.addEventListener("timeupdate", () => {
    if (!audio.duration || isNaN(audio.duration)) return;
    const percent = (audio.currentTime / audio.duration) * 100;
    progressBar.value = percent;
    currentTimeEl.textContent = formatTime(audio.currentTime);
  });

  audio.addEventListener("loadedmetadata", () => {
    if (!isNaN(audio.duration)) {
      durationEl.textContent = formatTime(audio.duration);
    }
  });

  // когато свърши песента – следваща
  audio.addEventListener("ended", () => {
    loadTrack(currentTrackIndex + 1, true);
  });

  // scrub по прогрес бара
  progressBar.addEventListener("input", () => {
    if (!audio.duration || isNaN(audio.duration)) return;
    const newTime = (progressBar.value / 100) * audio.duration;
    audio.currentTime = newTime;
  });

  // Volume slider
  if (volumeSlider) {
    volumeSlider.addEventListener("input", () => {
      const vol = volumeSlider.value / 100;
      audio.volume = vol;
      if (vol === 0) {
        setMuteIcon(true);
      } else {
        setMuteIcon(false);
        lastVolume = vol;
      }
    });
  }

  // Mute button
  if (muteBtn) {
    muteBtn.addEventListener("click", () => {
      if (audio.volume > 0) {
        lastVolume = audio.volume || lastVolume || 1;
        audio.volume = 0;
        if (volumeSlider) volumeSlider.value = 0;
        setMuteIcon(true);
      } else {
        audio.volume = lastVolume || 1;
        if (volumeSlider) volumeSlider.value = Math.round(audio.volume * 100);
        setMuteIcon(false);
      }
    });
  }

  // начална настройка – Virgo + сила на звука
  audio.volume = 1;
  if (volumeSlider) volumeSlider.value = 100;
  setMuteIcon(false);
  setArtist(currentArtist);
});
