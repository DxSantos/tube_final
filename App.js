import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, SafeAreaView, Image, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Search, Compass, Play, Pause, Volume2, VolumeX, ChevronUp, ChevronDown, Music, Cast, User, LogOut, RefreshCw, Check, Link2, Heart, Home, Library, X, Maximize2, Minimize2 } from 'lucide-react-native';
import { Audio } from 'expo-av';

const DEMO_MP3 = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
const API_KEY = 'AIzaSyCrunfLfTcyCsR3u-1luag_Zg1emu9sWZw';

const isWeb = Platform.OS === 'web';

const loadYTApi = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.resolve(null);
  }
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (window.__tubeDxYTPromise) return window.__tubeDxYTPromise;
  window.__tubeDxYTPromise = new Promise((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof previous === 'function') previous();
      resolve(window.YT);
    };
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.onerror = () => resolve(null);
    document.head.appendChild(tag);
  });
  return window.__tubeDxYTPromise;
};

const clamp01 = (v) => Math.min(1, Math.max(0, v));

const HISTORY_KEY = 'tube_dx_search_history_v1';

const loadHistory = () => {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
};

const saveHistory = (items) => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
    }
  } catch (e) {
    console.log('saveHistory error', e);
  }
};

const DragCarousel = ({ children }) => {
  const scrollRef = useRef(null);
  const dragEndRef = useRef(0);

  const getScrollLeft = () => {
    const r = scrollRef.current;
    if (!r) return 0;
    try {
      if (typeof r.getScrollableNode === 'function') {
        const n = r.getScrollableNode();
        if (n && typeof n.scrollLeft === 'number') return n.scrollLeft;
      }
      if (r._scrollRef && typeof r._scrollRef.scrollLeft === 'number') return r._scrollRef.scrollLeft;
      if (typeof r.getScrollResponder === 'function') {
        const responder = r.getScrollResponder();
        if (responder && typeof responder.getScrollableNode === 'function') {
          const n = responder.getScrollableNode();
          if (n && typeof n.scrollLeft === 'number') return n.scrollLeft;
        }
      }
    } catch (e) {
      console.log('getScrollLeft error', e);
    }
    return 0;
  };

  const setScrollLeft = (x) => {
    const r = scrollRef.current;
    if (!r) return;
    const target = Math.max(0, x);
    try {
      if (typeof r.scrollTo === 'function') {
        r.scrollTo({ x: target, animated: false });
        return;
      }
      if (typeof r.getScrollableNode === 'function') {
        const n = r.getScrollableNode();
        if (n) n.scrollLeft = target;
      }
    } catch (e) {
      console.log('setScrollLeft error', e);
    }
  };

  const onMouseDown = (e) => {
    if (!isWeb || !e) return;
    const ne = e.nativeEvent || e;
    if (typeof e.preventDefault === 'function') e.preventDefault();
    else if (typeof ne.preventDefault === 'function') ne.preventDefault();

    dragEndRef.current = 0;
    const startX = typeof ne.clientX === 'number' ? ne.clientX : 0;
    const startLeft = getScrollLeft();
    let moved = 0;

    const onMove = (ev) => {
      const dx = (ev.clientX || 0) - startX;
      if (Math.abs(dx) > moved) moved = Math.abs(dx);
      if (moved > 5) {
        dragEndRef.current = Date.now();
        window.__tubeDxLastDragAt = dragEndRef.current;
      }
      setScrollLeft(startLeft - dx);
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      document.body.style.userSelect = '';
      if (moved > 5) {
        dragEndRef.current = Date.now();
        window.__tubeDxLastDragAt = dragEndRef.current;
      }
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    document.body.style.userSelect = 'none';
  };

  return (
    <View style={styles.carouselWrap} {...(isWeb ? { onMouseDown } : {})}>
      <ScrollView ref={scrollRef} horizontal showsHorizontalScrollIndicator={false}>
        {children}
      </ScrollView>
    </View>
  );
};

const VolumeSlider = ({ value, onChange }) => {
  const [width, setWidth] = useState(0);

  const handlePress = (e) => {
    const ne = e && e.nativeEvent;
    if (width > 0 && ne && typeof ne.locationX === 'number') {
      onChange(clamp01(ne.locationX / width));
    }
  };

  const onMouseDown = (e) => {
    if (!isWeb || !e) return;
    const ne = e.nativeEvent || e;
    if (typeof e.preventDefault === 'function') e.preventDefault();
    const startX = typeof ne.clientX === 'number' ? ne.clientX : 0;
    const startValue = value;
    const trackWidth = width;

    const onMove = (ev) => {
      if (trackWidth > 0) {
        onChange(clamp01(startValue + ((ev.clientX || 0) - startX) / trackWidth));
      }
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      document.body.style.userSelect = '';
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    document.body.style.userSelect = 'none';
  };

  return (
    <TouchableOpacity
      style={styles.volTouch}
      activeOpacity={1}
      onPress={handlePress}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      {...(isWeb ? { onMouseDown } : {})}
    >
      <View style={styles.volBg} pointerEvents="none">
        <View style={[styles.volFill, { width: `${value * 100}%` }]} />
      </View>
    </TouchableOpacity>
  );
};

const APP_NAME = 'TubeDX';
const APP_ICON = require('./assets/app-icon.png');
const GOOGLE_CLIENT_ID = '450486634268-ur6ogci8ft1sh97q50uat4kdqhkr7bjk.apps.googleusercontent.com';
const USER_KEY = 'tube_dx_user_v1';
const PAIR_KEY = 'tube_dx_pair_v1';

const loadUser = () => {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

const saveUser = (u) => {
  try {
    if (typeof localStorage !== 'undefined') {
      if (u) localStorage.setItem(USER_KEY, JSON.stringify(u));
      else localStorage.removeItem(USER_KEY);
    }
  } catch (e) {
    console.log('saveUser error', e);
  }
};

const loadPair = () => {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(PAIR_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

const savePair = (p) => {
  try {
    if (typeof localStorage !== 'undefined') {
      if (p) localStorage.setItem(PAIR_KEY, JSON.stringify(p));
      else localStorage.removeItem(PAIR_KEY);
    }
  } catch (e) {
    console.log('savePair error', e);
  }
};

const FAV_KEY = 'tube_dx_favs_v1';
const REC_KEY = 'tube_dx_recent_v1';

const loadFavs = () => {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(FAV_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
};

const saveFavs = (items) => {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(FAV_KEY, JSON.stringify(items));
  } catch (e) {
    console.log('saveFavs error', e);
  }
};

const loadRecent = () => {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(REC_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
};

const saveRecent = (items) => {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(REC_KEY, JSON.stringify(items));
  } catch (e) {
    console.log('saveRecent error', e);
  }
};

const toTrack = (t) => ({
  id: t.id,
  videoId: t.videoId,
  title: t.title,
  artist: t.artist,
  cover: t.cover,
  url: t.url,
});

const decodeJwtToken = (token) => {
  try {
    const part = String(token).split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(part);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder('utf-8').decode(bytes));
  } catch (e) {
    console.log('jwt decode error', e);
    return null;
  }
};

const loadGoogleScript = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return Promise.resolve(null);
  if (window.google && window.google.accounts && window.google.accounts.id) {
    return Promise.resolve(window.google.accounts.id);
  }
  if (window.__tubeDxGsiPromise) return window.__tubeDxGsiPromise;
  window.__tubeDxGsiPromise = new Promise((resolve) => {
    const tag = document.createElement('script');
    tag.src = 'https://accounts.google.com/gsi/client';
    tag.async = true;
    tag.defer = true;
    tag.onload = () => resolve(window.google && window.google.accounts ? window.google.accounts.id : null);
    tag.onerror = () => resolve(null);
    document.head.appendChild(tag);
  });
  return window.__tubeDxGsiPromise;
};

const makePairCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return `${out.slice(0, 3)}-${out.slice(3)}`;
};

const AppIcon = ({ size = 30 }) => {
  const radius = Math.round(size * 0.28);
  if (APP_ICON) {
    return (
      <View style={{ width: size, height: size, borderRadius: radius, overflow: 'hidden', backgroundColor: '#18181b' }}>
        <Image source={APP_ICON} style={{ width: size, height: size }} resizeMode="cover" />
      </View>
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: '#ef4444',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Music color="#fff" size={Math.round(size * 0.58)} />
    </View>
  );
};

const MusicCard = ({ title, artist, cover, active, onPress, faved, onToggleFav }) => (
  <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
    <View>
      <Image source={{ uri: cover }} style={[styles.cardImg, active && { borderWidth: 2, borderColor: '#ef4444' }]} />
      {onToggleFav ? (
        <TouchableOpacity style={styles.cardHeart} onPress={onToggleFav} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Heart color={faved ? '#ef4444' : '#fff'} size={15} fill={faved ? '#ef4444' : 'rgba(0,0,0,0.45)'} />
        </TouchableOpacity>
      ) : null}
    </View>
    <View style={styles.cardBody}>
      <Text style={[styles.cardTitle, active && { color: '#ef4444' }]} numberOfLines={1}>{title}</Text>
      <Text style={styles.cardArtist} numberOfLines={1}>{artist}</Text>
    </View>
  </TouchableOpacity>
);

const ListRow = ({ track, active, onPress, faved, onToggleFav }) => (
  <View style={styles.row}>
    <TouchableOpacity style={styles.rowMain} onPress={onPress} activeOpacity={0.85}>
      <Image source={{ uri: track.cover }} style={[styles.rowImg, active && { borderWidth: 2, borderColor: '#ef4444' }]} />
      <View style={styles.rowTexts}>
        <Text style={[styles.rowTitle, active && { color: '#ef4444' }]} numberOfLines={1}>{track.title}</Text>
        <Text style={styles.rowArtist} numberOfLines={1}>{track.artist}</Text>
      </View>
    </TouchableOpacity>
    <TouchableOpacity style={styles.rowHeart} onPress={onToggleFav} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
      <Heart color={faved ? '#ef4444' : '#71717a'} size={20} fill={faved ? '#ef4444' : 'none'} />
    </TouchableOpacity>
  </View>
);

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState(null);
  const [ytActive, setYtActive] = useState(false);
  const [ytTime, setYtTime] = useState({ current: 0, duration: 0 });
  const [history, setHistory] = useState(() => loadHistory());
  const [volume, setVolume] = useState(0.8);
  const [user, setUser] = useState(() => loadUser());
  const [accountOpen, setAccountOpen] = useState(false);
  const [pairOpen, setPairOpen] = useState(false);
  const [pairState, setPairState] = useState(() => loadPair());
  const [joinCode, setJoinCode] = useState('');
  const [gsiReady, setGsiReady] = useState(false);
  const [gsiFailed, setGsiFailed] = useState(false);
  const [favorites, setFavorites] = useState(() => loadFavs());
  const [recent, setRecent] = useState(() => loadRecent());
  const [tab, setTab] = useState('home');
  const [miniVisible, setMiniVisible] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoMax, setVideoMax] = useState(false);

  const soundRef = useRef(null);
  const ytRef = useRef(null);
  const ytBoxRef = useRef(null);
  const ytLoadedIdRef = useRef(null);
  const progressWidthRef = useRef(0);
  const progressDragRef = useRef(null);
  const lastVolumeRef = useRef(0.8);
  const googleBtnRef = useRef(null);

  const showVideo = !!(isWeb && selectedTrack && selectedTrack.videoId);

  const destroyYt = () => {
    if (ytRef.current) {
      try {
        ytRef.current.destroy();
      } catch (e) {
        console.log('yt destroy error', e);
      }
    }
    ytRef.current = null;
    ytLoadedIdRef.current = null;
    setYtActive(false);
    setYtTime({ current: 0, duration: 0 });
  };

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
      destroyYt();
    };
  }, []);

  useEffect(() => {
    if (soundRef.current) {
      soundRef.current.setVolumeAsync(volume).catch((e) => console.log('setVolume error', e));
    }
    if (ytRef.current && typeof ytRef.current.setVolume === 'function') {
      try {
        ytRef.current.setVolume(Math.round(volume * 100));
      } catch (e) {
        console.log('yt setVolume error', e);
      }
    }
  }, [volume]);

  useEffect(() => {
    if (history.length) saveHistory(history);
  }, [history]);

  useEffect(() => {
    saveUser(user);
  }, [user]);

  useEffect(() => {
    savePair(pairState);
  }, [pairState]);

  useEffect(() => {
    saveFavs(favorites);
  }, [favorites]);

  useEffect(() => {
    saveRecent(recent);
  }, [recent]);

  useEffect(() => {
    if (!playerOpen) setVideoMax(false);
  }, [playerOpen]);

  useEffect(() => {
    if (!accountOpen || user || !isWeb || !GOOGLE_CLIENT_ID) return;
    let cancelled = false;
    loadGoogleScript().then((id) => {
      if (cancelled) return;
      setGsiReady(!!id);
      setGsiFailed(!id);
      if (!id || !googleBtnRef.current) return;
      try {
        id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => {
            const payload = decodeJwtToken(response && response.credential);
            if (payload) {
              setUser({
                name: payload.name || payload.email || 'Usuário Google',
                email: payload.email || '',
                picture: payload.picture || '',
              });
              setAccountOpen(false);
            }
          },
        });
        id.renderButton(googleBtnRef.current, {
          theme: 'filled_black',
          size: 'large',
          type: 'standard',
          width: 260,
        });
      } catch (e) {
        console.log('google init error', e);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [accountOpen, user]);

  useEffect(() => {
    if (!isWeb) return;
    if (!showVideo) {
      destroyYt();
      return;
    }
    let cancelled = false;
    loadYTApi().then((YT) => {
      if (!YT || cancelled) return;
      const box = ytBoxRef.current;
      if (!box) return;

      const existing = ytRef.current;
      const stillAlive = existing && existing.getIframe && existing.getIframe() && document.contains(existing.getIframe());

      if (stillAlive) {
        if (ytLoadedIdRef.current !== selectedTrack.videoId) {
          existing.loadVideoById(selectedTrack.videoId);
          ytLoadedIdRef.current = selectedTrack.videoId;
        }
        try {
          existing.setVolume(Math.round(volume * 100));
        } catch (e) {
          console.log('yt setVolume error', e);
        }
        existing.playVideo();
        setIsPlaying(true);
        return;
      }

      if (ytRef.current) {
        try {
          ytRef.current.destroy();
        } catch (e) {
          console.log('yt old destroy error', e);
        }
        ytRef.current = null;
      }

      const holder = document.createElement('div');
      holder.style.width = '100%';
      holder.style.height = '100%';
      box.appendChild(holder);

      const player = new YT.Player(holder, {
        videoId: selectedTrack.videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 1,
          controls: 0,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          disablekb: 1,
          iv_load_policy: 3,
          cc_load_policy: 0,
          fs: 0,
          loop: 1,
          playlist: selectedTrack.videoId,
          origin: window.location.origin,
        },
        events: {
          onReady: (event) => {
            if (cancelled) return;
            try {
              event.target.setVolume(Math.round(volume * 100));
              event.target.playVideo();
            } catch (e) {
              console.log('yt play error', e);
            }
            setIsPlaying(true);
          },
          onStateChange: (event) => {
            if (cancelled) return;
            if (event.data === 1) setIsPlaying(true);
            if (event.data === 2 || event.data === 0) setIsPlaying(false);
          },
        },
      });

      ytRef.current = player;
      ytLoadedIdRef.current = selectedTrack.videoId;
      setYtActive(true);
    });

    return () => {
      cancelled = true;
    };
  }, [showVideo, selectedTrack && selectedTrack.videoId]);

  useEffect(() => {
    if (!ytActive || !isPlaying) return;
    const id = setInterval(() => {
      const player = ytRef.current;
      if (player && typeof player.getCurrentTime === 'function') {
        setYtTime({
          current: player.getCurrentTime() || 0,
          duration: player.getDuration() || 0,
        });
      }
    }, 500);
    return () => clearInterval(id);
  }, [ytActive, isPlaying]);

  const handleCardPress = (track) => {
    const lastDrag = (typeof window !== 'undefined' && window.__tubeDxLastDragAt) || 0;
    if (lastDrag && Date.now() - lastDrag < 400) {
      return;
    }
    playSound(track);
  };

  const toggleMute = () => {
    if (volume > 0) {
      lastVolumeRef.current = volume;
      setVolume(0);
    } else {
      setVolume(lastVolumeRef.current || 0.8);
    }
  };

  const closeMini = async () => {
    setPlayerOpen(false);
    setMiniVisible(false);
    try {
      if (ytRef.current) ytRef.current.pauseVideo();
    } catch (e) {
      console.log('yt close error', e);
    }
    try {
      if (soundRef.current) await soundRef.current.pauseAsync();
    } catch (e) {
      console.log('sound close error', e);
    }
    setIsPlaying(false);
  };

  const maximizeVideo = async () => {
    if (!isWeb) return;
    const el = ytBoxRef.current;
    if (!el) return;
    try {
      if (typeof document !== 'undefined' && document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await el.requestFullscreen();
      }
    } catch (e) {
      console.log('fullscreen error', e);
    }
  };

  useEffect(() => {
    if (!isWeb || !playerOpen) return;
    const handler = () => {
      setIsFullscreen(!!(typeof document !== 'undefined' && document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handler);
    return () => {
      document.removeEventListener('fullscreenchange', handler);
    };
  }, [isWeb, playerOpen]);

  const initials = user && user.name
    ? user.name.split(' ').map((w) => w.charAt(0)).slice(0, 2).join('').toUpperCase()
    : '?';

  const authHint = !isWeb
    ? 'Para login real do Google no app, configure expo-auth-session (Google).'
    : !GOOGLE_CLIENT_ID
      ? 'Para ativar o login real do Google, cole o GOOGLE_CLIENT_ID no topo do App.js.'
      : gsiFailed
        ? 'Não foi possível carregar o Google. Verifique sua conexão.'
        : 'Carregando o Google…';

  const signInLocal = () => {
    setUser({ name: 'Visitante', email: 'sessão local', picture: '' });
    setAccountOpen(false);
  };

  const handleAuthPress = () => {
    if (isWeb && GOOGLE_CLIENT_ID && !gsiReady && !gsiFailed) return;
    signInLocal();
  };

  const authBtnLabel = isWeb && GOOGLE_CLIENT_ID && gsiFailed
    ? 'Entrar localmente'
    : isWeb
      ? 'Entrar com Google'
      : 'Entrar neste dispositivo';

  const isFav = (track) => !!track && favorites.some((f) => f.id === track.id);

  const toggleFav = (track) => {
    if (!track) return;
    const lastDrag = (typeof window !== 'undefined' && window.__tubeDxLastDragAt) || 0;
    if (lastDrag && Date.now() - lastDrag < 400) return;
    setFavorites((prev) => {
      const exists = prev.some((f) => f.id === track.id);
      if (exists) return prev.filter((f) => f.id !== track.id);
      return [toTrack(track), ...prev].slice(0, 60);
    });
  };

  const signOut = () => {
    setUser(null);
    setAccountOpen(false);
  };

  const openPair = () => {
    setPairOpen(true);
    if (!pairState || !pairState.code) {
      setPairState({ code: makePairCode(), device: null });
    }
  };

  const regenerateCode = () => {
    setPairState({ code: makePairCode(), device: pairState ? pairState.device : null });
  };

  const doPair = () => {
    const code = (joinCode || '').trim().toUpperCase();
    if (code.length < 4) return;
    setPairState({
      code: pairState && pairState.code ? pairState.code : makePairCode(),
      device: code,
    });
    setJoinCode('');
  };

  const unpair = () => {
    setPairState({ code: pairState && pairState.code ? pairState.code : makePairCode(), device: null });
  };

  const playSound = async (track) => {
    const useVideo = isWeb && track && track.videoId;
    setRecent((prev) => {
      const filtered = prev.filter((r) => r.id !== track.id);
      return [toTrack(track), ...filtered].slice(0, 20);
    });
    setMiniVisible(true);
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      setStatus(null);

      if (useVideo) {
        setSelectedTrack(track);
        setPlayerOpen(true);
        setIsPlaying(true);
        return;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: (track && track.url) || DEMO_MP3 },
        { shouldPlay: true, volume },
        (onStatus) => setStatus(onStatus)
      );
      soundRef.current = sound;
      setSelectedTrack(track);
      setPlayerOpen(true);
      setIsPlaying(true);
    } catch (e) {
      console.log('audio error', e);
    }
  };

  const togglePlay = async () => {
    if (ytActive && ytRef.current) {
      const player = ytRef.current;
      const iframe = (typeof player.getIframe === 'function') ? player.getIframe() : null;
      const alive = !iframe || (typeof document === 'undefined' || document.contains(iframe));
      if (!alive) {
        // Player is stale — reset and fall through
        ytRef.current = null;
        setYtActive(false);
      } else {
        try {
          if (isPlaying) {
            if (typeof player.pauseVideo === 'function') player.pauseVideo();
            setIsPlaying(false);
          } else {
            if (typeof player.playVideo === 'function') player.playVideo();
            setIsPlaying(true);
          }
        } catch (e) {
          console.log('yt toggle error', e);
        }
        return;
      }
    }
    try {
      if (soundRef.current) {
        const s = await soundRef.current.getStatusAsync();
        if (s.isPlaying) {
          await soundRef.current.pauseAsync();
          setIsPlaying(false);
        } else {
          await soundRef.current.playAsync();
          setIsPlaying(true);
        }
      }
    } catch (e) {
      console.log('pause/play error', e);
    }
  };

  const search = async () => {
    if (!searchQuery.trim()) return;
    try {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&maxResults=20&q=${encodeURIComponent(searchQuery)}&key=${API_KEY}`;
      const res = await fetch(url);
      const json = await res.json();
      const items = (json.items || []).map((i) => ({
        id: i.id.videoId,
        videoId: i.id.videoId,
        title: i.snippet.title,
        artist: i.snippet.channelTitle,
        cover: i.snippet.thumbnails.high.url,
        url: DEMO_MP3,
      }));
      setResults(items);
      setTab('explore');

      setHistory((prev) => {
        const map = new Map();
        prev.forEach((h) => map.set(h.id, h));
        const now = Date.now();
        items.forEach((it) => {
          const old = map.get(it.id);
          map.set(it.id, {
            id: it.id,
            videoId: it.videoId,
            title: it.title,
            artist: it.artist,
            cover: it.cover,
            url: it.url,
            hits: (old ? old.hits || 0 : 0) + 1,
            last: now,
          });
        });
        const next = Array.from(map.values())
          .sort((a, b) => (b.hits - a.hits) || (b.last - a.last))
          .slice(0, 20);
        return next;
      });
    } catch (e) {
      console.log('search error', e);
    }
  };

  const demoList = [
    { id: '1', title: 'Lo-fi Hip Hop', artist: 'Chill Study', cover: 'https://picsum.photos/seed/music1/400', url: DEMO_MP3 },
    { id: '2', title: 'Synthwave Night', artist: 'Retro Wave', cover: 'https://picsum.photos/seed/music2/400', url: DEMO_MP3 },
    { id: '3', title: 'Deep Focus', artist: 'Ambient Music', cover: 'https://picsum.photos/seed/music3/400', url: DEMO_MP3 },
    { id: '4', title: 'Workout Mix', artist: 'Gym Beast', cover: 'https://picsum.photos/seed/music4/400', url: DEMO_MP3 },
  ];

  const homeList = history.length ? history : demoList;
  const homeTitle = history.length ? 'Mais buscados por mim' : 'Ouvir agora';

  const progress = ytActive
    ? (ytTime.duration ? ytTime.current / ytTime.duration : 0)
    : status && status.durationMillis
      ? status.positionMillis / status.durationMillis
      : 0;

  const seekToRatio = (ratio) => {
    const r = Math.min(1, Math.max(0, ratio));
    if (ytActive && ytRef.current) {
      let duration = ytTime.duration;
      try {
        if (!duration && typeof ytRef.current.getDuration === 'function') {
          duration = ytRef.current.getDuration() || 0;
        }
        if (!duration) return;
        ytRef.current.seekTo(r * duration, true);
        setYtTime({ current: r * duration, duration });
      } catch (e) {
        console.log('seek error', e);
      }
      return;
    }
    if (soundRef.current && status && status.durationMillis) {
      soundRef.current
        .setPositionAsync(r * status.durationMillis)
        .catch((e) => console.log('seek audio error', e));
    }
  };

  const onProgressMouseDown = (e) => {
    if (!isWeb || !e) return;
    const node = e.currentTarget;
    if (!node || typeof node.getBoundingClientRect !== 'function') return;
    if (typeof e.preventDefault === 'function') e.preventDefault();
    const rect = node.getBoundingClientRect();
    if (!rect.width) return;

    const apply = (clientX) => {
      seekToRatio((clientX - rect.left) / rect.width);
    };

    apply(typeof e.clientX === 'number' ? e.clientX : 0);

    const onMove = (ev) => apply(ev.clientX || 0);
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      document.body.style.userSelect = '';
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    document.body.style.userSelect = 'none';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <View style={styles.topBar}>
          <View style={styles.brand}>
            <AppIcon size={30} />
            <Text style={styles.brandName}>{APP_NAME}</Text>
          </View>
          <View style={styles.topActions}>
            <TouchableOpacity style={styles.iconBtn} onPress={openPair} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Cast color={pairState && pairState.device ? '#ef4444' : '#fff'} size={22} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.avatarBtn} onPress={() => setAccountOpen(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              {user && user.picture ? (
                <Image source={{ uri: user.picture }} style={styles.avatarImg} />
              ) : user ? (
                <Text style={styles.avatarText}>{initials}</Text>
              ) : (
                <User color="#fff" size={20} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <Search color="#71717a" size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Pesquisar músicas, artistas..."
            placeholderTextColor="#71717a"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            onSubmitEditing={search}
            blurOnSubmit={false}
          />
          <TouchableOpacity style={styles.searchBtn} onPress={search}>
            <Text style={styles.searchBtnText}>Buscar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {tab === 'home' && (
        <ScrollView style={styles.content}>
          <Text style={styles.sectionTitle}>{homeTitle}</Text>
          <DragCarousel>
            {homeList.map((t) => (
              <MusicCard
                key={t.id}
                {...t}
                active={selectedTrack && selectedTrack.id === t.id}
                faved={isFav(t)}
                onToggleFav={() => toggleFav(t)}
                onPress={() => handleCardPress(t)}
              />
            ))}
          </DragCarousel>

          {recent.length > 0 && (
            <View>
              <Text style={styles.sectionTitle}>Ouvidos recentemente</Text>
              <DragCarousel>
                {recent.map((t) => (
                  <MusicCard
                    key={`h-${t.id}`}
                    {...t}
                    active={selectedTrack && selectedTrack.id === t.id}
                    faved={isFav(t)}
                    onToggleFav={() => toggleFav(t)}
                    onPress={() => handleCardPress(t)}
                  />
                ))}
              </DragCarousel>
            </View>
          )}

          {results.length > 0 && (
            <View>
              <Text style={styles.sectionTitle}>Resultados da busca</Text>
              <DragCarousel>
                {results.map((t) => (
                  <MusicCard
                    key={`r-${t.id}`}
                    {...t}
                    active={selectedTrack && selectedTrack.id === t.id}
                    faved={isFav(t)}
                    onToggleFav={() => toggleFav(t)}
                    onPress={() => handleCardPress(t)}
                  />
                ))}
              </DragCarousel>
            </View>
          )}
        </ScrollView>
      )}

      {tab === 'explore' && (
        <ScrollView style={styles.content}>
          <Text style={styles.sectionTitle}>Explorar</Text>
          {results.length ? (
            results.map((t) => (
              <ListRow
                key={`e-${t.id}`}
                track={t}
                active={selectedTrack && selectedTrack.id === t.id}
                faved={isFav(t)}
                onToggleFav={() => toggleFav(t)}
                onPress={() => handleCardPress(t)}
              />
            ))
          ) : (
            <View style={styles.emptyBox}>
              <Search color="#3f3f46" size={34} />
              <Text style={styles.emptyTitle}>Pesquise para explorar</Text>
              <Text style={styles.emptyText}>Digite um artista ou música na barra acima e toque em Buscar.</Text>
            </View>
          )}
        </ScrollView>
      )}

      {tab === 'library' && (
        <ScrollView style={styles.content}>
          <Text style={styles.sectionTitle}>Minhas favoritas</Text>
          {favorites.length ? (
            favorites.map((t) => (
              <ListRow
                key={`f-${t.id}`}
                track={t}
                active={selectedTrack && selectedTrack.id === t.id}
                faved
                onToggleFav={() => toggleFav(t)}
                onPress={() => handleCardPress(t)}
              />
            ))
          ) : (
            <View style={styles.emptyBox}>
              <Heart color="#3f3f46" size={34} />
              <Text style={styles.emptyTitle}>Nenhuma favorita ainda</Text>
              <Text style={styles.emptyText}>Toque no coração de uma música para salvá-la aqui.</Text>
            </View>
          )}

          {recent.length > 0 && (
            <View>
              <Text style={styles.sectionTitle}>Ouvidos recentemente</Text>
              {recent.map((t) => (
                <ListRow
                  key={`g-${t.id}`}
                  track={t}
                  active={selectedTrack && selectedTrack.id === t.id}
                  faved={isFav(t)}
                  onToggleFav={() => toggleFav(t)}
                  onPress={() => handleCardPress(t)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      )}

      <View style={[styles.fullPlayer, { display: playerOpen ? 'flex' : 'none' }]}>
        <TouchableOpacity style={styles.closePlayer} onPress={() => setPlayerOpen(false)}>
          <ChevronDown color="#fff" size={20} />
          <Text style={styles.closePlayerText}>Mini player</Text>
        </TouchableOpacity>

        {selectedTrack ? (
          <TouchableOpacity style={styles.favBtn} onPress={() => toggleFav(selectedTrack)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Heart
              color={isFav(selectedTrack) ? '#ef4444' : '#fff'}
              size={22}
              fill={isFav(selectedTrack) ? '#ef4444' : 'none'}
            />
          </TouchableOpacity>
        ) : null}

        {showVideo ? (
          <View style={videoMax ? styles.videoStageMax : styles.videoStage}>
            <div ref={ytBoxRef} style={{ width: '100%', height: '100%', backgroundColor: '#000' }} />
          </View>
        ) : (
          <Image source={{ uri: selectedTrack && selectedTrack.cover }} style={styles.fullPlayerImg} />
        )}

        {showVideo ? (
          <TouchableOpacity style={videoMax ? styles.maxFullscreenBtn : styles.maxBtn} onPress={() => setVideoMax(!videoMax)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            {videoMax ? <Minimize2 color="#fff" size={20} /> : <Maximize2 color="#fff" size={20} />}
          </TouchableOpacity>
        ) : null}

        <View style={videoMax ? styles.metaHidden : styles.metaBlock}>
          <Text style={styles.fullTitle} numberOfLines={2}>{selectedTrack && selectedTrack.title}</Text>
          <Text style={styles.fullArtist} numberOfLines={1}>{selectedTrack && selectedTrack.artist}</Text>

          <TouchableOpacity
            style={styles.progressTouch}
            activeOpacity={1}
            onLayout={(e) => {
              progressWidthRef.current = e.nativeEvent.layout.width;
            }}
            onPress={(e) => {
              const width = progressWidthRef.current;
              const x = e && e.nativeEvent ? e.nativeEvent.locationX : null;
              if (width > 0 && x != null) seekToRatio(x / width);
            }}
          >
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${Math.min(100, progress * 100)}%` }]} />
            </View>
          </TouchableOpacity>

          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{fmtTime(ytActive ? ytTime.current : status ? status.positionMillis / 1000 : 0)}</Text>
            <Text style={styles.timeText}>
              {fmtTime(ytActive ? ytTime.duration : status && status.durationMillis ? status.durationMillis / 1000 : 0)}
            </Text>
          </View>

          <TouchableOpacity style={styles.bigPlay} onPress={togglePlay}>
            {isPlaying ? <Pause color="#000" size={40} fill="#000" /> : <Play color="#000" size={40} fill="#000" />}
          </TouchableOpacity>

          {isWeb && selectedTrack && selectedTrack.videoId ? (
            <Text style={styles.videoHint}>Vídeo real do YouTube</Text>
          ) : null}
        </View>
      </View>

      {selectedTrack && miniVisible && (
        <View style={styles.miniPlayer}>
          <TouchableOpacity style={styles.miniInfo} activeOpacity={0.85} onPress={() => setPlayerOpen(true)}>
            <Image source={{ uri: selectedTrack.cover }} style={styles.miniImg} />
            <View style={styles.miniTexts}>
              <Text style={styles.miniTitle} numberOfLines={1}>{selectedTrack.title}</Text>
              <Text style={styles.miniArtist} numberOfLines={1}>{selectedTrack.artist}</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.volRow}>
            <TouchableOpacity style={styles.volIcon} onPress={toggleMute} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              {volume > 0 ? <Volume2 color="#a1a1aa" size={16} /> : <VolumeX color="#ef4444" size={16} />}
            </TouchableOpacity>
            <VolumeSlider value={volume} onChange={setVolume} />
          </View>
          <TouchableOpacity style={styles.expandBtn} onPress={() => setPlayerOpen(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <ChevronUp color="#e4e4e7" size={20} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.playButton} onPress={togglePlay}>
            {isPlaying ? <Pause color="#000" size={20} fill="#000" /> : <Play color="#000" size={20} fill="#000" />}
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeMini} onPress={closeMini} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <X color="#a1a1aa" size={18} />
          </TouchableOpacity>
        </View>
      )}

      {accountOpen && (
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setAccountOpen(false)}>
          <TouchableOpacity style={styles.sheet} activeOpacity={1} onPress={() => {}}>
            <View style={styles.sheetHead}>
              <Text style={styles.sheetTitle}>{user ? 'Sua conta' : 'Entrar'}</Text>
              <TouchableOpacity onPress={() => setAccountOpen(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={styles.sheetClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {user ? (
              <View>
                <View style={styles.accountRow}>
                  {user.picture ? (
                    <Image source={{ uri: user.picture }} style={styles.avatarBig} />
                  ) : (
                    <View style={styles.avatarBigFallback}>
                      <Text style={styles.avatarBigText}>{initials}</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.accountName} numberOfLines={1}>{user.name}</Text>
                    <Text style={styles.accountEmail} numberOfLines={1}>{user.email}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.secondaryBtn} onPress={signOut}>
                  <LogOut color="#ef4444" size={18} />
                  <Text style={styles.secondaryBtnText}>Sair da conta</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <Text style={styles.sheetText}>Entre para manter seus favoritos e histórico sincronizados.</Text>
                {isWeb && GOOGLE_CLIENT_ID && (
                  <View style={styles.gBtnWrap}>
                    <div
                      ref={googleBtnRef}
                      style={{ display: gsiReady ? 'flex' : 'none', justifyContent: 'center', minHeight: 44 }}
                    />
                  </View>
                )}

                {!(isWeb && GOOGLE_CLIENT_ID && gsiReady) && (
                  <View>
                    <TouchableOpacity style={styles.googleBtn} onPress={handleAuthPress}>
                      <View style={styles.googleG}>
                        <Text style={styles.googleGText}>G</Text>
                      </View>
                      <Text style={styles.googleBtnText}>{authBtnLabel}</Text>
                    </TouchableOpacity>
                    <Text style={styles.hint}>{authHint}</Text>
                  </View>
                )}
              </View>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      )}

      {pairOpen && (
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setPairOpen(false)}>
          <TouchableOpacity style={styles.sheet} activeOpacity={1} onPress={() => {}}>
            <View style={styles.sheetHead}>
              <Text style={styles.sheetTitle}>Pareamento</Text>
              <TouchableOpacity onPress={() => setPairOpen(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={styles.sheetClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.pairCodeBox}>
              <Text style={styles.pairLabel}>Código deste aparelho</Text>
              <Text style={styles.pairCode}>{pairState ? pairState.code : '---'}</Text>
              <TouchableOpacity style={styles.refreshBtn} onPress={regenerateCode}>
                <RefreshCw color="#fff" size={15} />
                <Text style={styles.refreshText}>Novo código</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            {pairState && pairState.device ? (
              <View>
                <View style={styles.pairedBox}>
                  <Check color="#22c55e" size={18} />
                  <Text style={styles.pairedText}>Pareado com {pairState.device}</Text>
                </View>
                <TouchableOpacity style={styles.secondaryBtn} onPress={unpair}>
                  <Text style={styles.secondaryBtnText}>Desparear</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <Text style={styles.pairLabel}>Código do outro dispositivo</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.pairInput}
                    placeholder="ABC-123"
                    placeholderTextColor="#52525b"
                    autoCapitalize="characters"
                    value={joinCode}
                    onChangeText={setJoinCode}
                    onSubmitEditing={doPair}
                    returnKeyType="done"
                  />
                  <TouchableOpacity style={styles.primaryBtnSm} onPress={doPair}>
                    <Link2 color="#000" size={16} />
                    <Text style={styles.primaryBtnTextSm}>Parear</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.hint}>Digite o código exibido no outro aparelho para conectar.</Text>
              </View>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      )}

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => setTab('home')}>
          <Home size={20} color={tab === 'home' ? '#fff' : '#71717a'} fill={tab === 'home' ? '#fff' : 'none'} />
          <Text style={[styles.navLabel, tab === 'home' && styles.navLabelActive]}>Início</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setTab('explore')}>
          <Compass size={20} color={tab === 'explore' ? '#fff' : '#71717a'} />
          <Text style={[styles.navLabel, tab === 'explore' && styles.navLabelActive]}>Explorar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setTab('library')}>
          <Library size={20} color={tab === 'library' ? '#fff' : '#71717a'} />
          <Text style={[styles.navLabel, tab === 'library' && styles.navLabelActive]}>Biblioteca</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function fmtTime(seconds) {
  if (!seconds || seconds < 0 || !isFinite(seconds)) return '0:00';
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000' },
  header: { paddingHorizontal: 20, paddingVertical: 15, paddingTop: 40 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#18181b', borderRadius: 25, paddingHorizontal: 15, paddingVertical: 8, borderWidth: 1, borderColor: '#27272a' },
  searchInput: { flex: 1, color: '#fff', marginLeft: 10, fontSize: 16 },
  searchBtn: { marginLeft: 10 },
  searchBtnText: { color: '#ef4444', fontWeight: 'bold' },
  content: { flex: 1, paddingHorizontal: 20, paddingBottom: 175 },
  sectionTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginVertical: 20 },
  carouselWrap: { marginBottom: 30, ...(isWeb ? { cursor: 'grab' } : {}) },
  card: { width: 160, marginRight: 16, marginBottom: 10, ...(isWeb ? { cursor: 'pointer' } : {}) },
  cardImg: { width: 160, height: 160, borderRadius: 12, backgroundColor: '#27272a' },
  cardBody: { paddingTop: 10 },
  cardTitle: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  cardArtist: { color: '#a1a1aa', fontSize: 12 },
  cardHeart: { position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 99, padding: 6 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#18181b', borderRadius: 12, padding: 8, marginBottom: 10, borderWidth: 1, borderColor: '#27272a' },
  rowMain: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  rowImg: { width: 52, height: 52, borderRadius: 8, backgroundColor: '#27272a', marginRight: 12 },
  rowTexts: { flex: 1 },
  rowTitle: { color: '#fff', fontSize: 14, fontWeight: '700' },
  rowArtist: { color: '#a1a1aa', fontSize: 12, marginTop: 3 },
  rowHeart: { padding: 8, marginLeft: 4 },
  emptyBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, paddingHorizontal: 24, backgroundColor: '#0f0f12', borderRadius: 16, borderWidth: 1, borderColor: '#27272a' },
  emptyTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginTop: 14 },
  emptyText: { color: '#71717a', fontSize: 13, marginTop: 6, textAlign: 'center', lineHeight: 19 },
  favBtn: { position: 'absolute', top: 48, right: 24, padding: 9, backgroundColor: '#18181b', borderRadius: 99, zIndex: 5, borderWidth: 1, borderColor: '#27272a' },
  miniPlayer: { position: 'absolute', bottom: 80, left: 12, right: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: '#18181b', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#3f3f46', zIndex: 30 },
  miniImg: { width: 44, height: 44, borderRadius: 6, marginRight: 10 },
  miniInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 6 },
  miniTexts: { flex: 1 },
  expandBtn: { padding: 4, marginRight: 6 },
  miniTitle: { color: '#fff', fontWeight: '700', fontSize: 13 },
  miniArtist: { color: '#a1a1aa', fontSize: 11 },
  playButton: { backgroundColor: '#fff', borderRadius: 22, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  closeMini: { padding: 6, marginLeft: 4 },
  volRow: { flexDirection: 'row', alignItems: 'center', marginRight: 10 },
  volIcon: { padding: 4, marginRight: 4 },
  volTouch: { width: 44, height: 24, justifyContent: 'center' },
  volBg: { width: '100%', height: 4, backgroundColor: '#3f3f46', borderRadius: 2, overflow: 'hidden' },
  volFill: { height: 4, backgroundColor: '#a1a1aa', borderRadius: 2 },
  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 15, backgroundColor: '#09090b', borderTopWidth: 1, borderTopColor: '#27272a', position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 30 },
  navItem: { alignItems: 'center', flex: 1, paddingTop: 2 },
  navLabel: { color: '#71717a', fontSize: 11, marginTop: 4 },
  navLabelActive: { color: '#fff', fontWeight: '700' },
  fullPlayer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, paddingTop: 60, paddingBottom: 90, zIndex: 40 },
  closePlayer: { position: 'absolute', top: 48, left: 24, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: '#18181b', borderRadius: 99, zIndex: 5, borderWidth: 1, borderColor: '#27272a' },
  closePlayerText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  fullPlayerImg: { width: 260, height: 260, borderRadius: 16, marginBottom: 24, backgroundColor: '#18181b' },
  fullTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', textAlign: 'center' },
  fullArtist: { color: '#a1a1aa', fontSize: 16, marginTop: 6, textAlign: 'center' },
  progressTouch: { width: '100%', paddingVertical: 10, marginTop: 18 },
  progressBg: { width: '100%', height: 4, backgroundColor: '#3f3f46', borderRadius: 2 },
  progressFill: { height: 4, backgroundColor: '#ef4444', borderRadius: 2 },
  timeRow: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', marginTop: -4, marginBottom: 16 },
  timeText: { color: '#71717a', fontSize: 11 },
  videoHint: { color: '#52525b', fontSize: 11, marginTop: 16 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  brand: { flexDirection: 'row', alignItems: 'center' },
  brandName: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 10, letterSpacing: 0.3 },
  topActions: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { padding: 8, marginRight: 6 },
  avatarBtn: { width: 34, height: 34, borderRadius: 99, backgroundColor: '#27272a', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg: { width: 34, height: 34, borderRadius: 99 },
  avatarText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, zIndex: 100 },
  sheet: { width: '100%', maxWidth: 380, backgroundColor: '#18181b', borderRadius: 20, padding: 22, borderWidth: 1, borderColor: '#27272a' },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  sheetTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  sheetClose: { color: '#a1a1aa', fontSize: 20, padding: 4 },
  sheetText: { color: '#a1a1aa', fontSize: 14, lineHeight: 20, marginBottom: 18 },
  accountRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  avatarBig: { width: 56, height: 56, borderRadius: 99, marginRight: 14 },
  avatarBigFallback: { width: 56, height: 56, borderRadius: 99, marginRight: 14, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center' },
  avatarBigText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  accountName: { color: '#fff', fontSize: 16, fontWeight: '700' },
  accountEmail: { color: '#71717a', fontSize: 13, marginTop: 3 },
  googleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderRadius: 12, paddingVertical: 13, paddingHorizontal: 18 },
  googleG: { width: 22, height: 22, borderRadius: 99, backgroundColor: '#4285F4', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  googleGText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  googleBtnText: { color: '#202124', fontSize: 15, fontWeight: '600' },
  gBtnWrap: { alignItems: 'center', paddingVertical: 4 },
  hint: { color: '#52525b', fontSize: 11, lineHeight: 16, marginTop: 14, textAlign: 'center' },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#27272a', borderRadius: 12, paddingVertical: 13, gap: 8, borderWidth: 1, borderColor: '#3f3f46' },
  secondaryBtnText: { color: '#ef4444', fontSize: 14, fontWeight: '600' },
  pairCodeBox: { alignItems: 'center', backgroundColor: '#09090b', borderRadius: 14, paddingVertical: 18, borderWidth: 1, borderColor: '#27272a' },
  pairLabel: { color: '#71717a', fontSize: 12, marginBottom: 8 },
  pairCode: { color: '#fff', fontSize: 30, fontWeight: 'bold', letterSpacing: 4 },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#27272a', borderRadius: 99 },
  refreshText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#27272a', marginVertical: 18 },
  pairedBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 14 },
  pairedText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pairInput: { flex: 1, backgroundColor: '#09090b', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: '#fff', fontSize: 15, borderWidth: 1, borderColor: '#3f3f46' },
  primaryBtnSm: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13 },
  primaryBtnTextSm: { color: '#000', fontSize: 14, fontWeight: '700' },
  bigPlay: { backgroundColor: '#fff', borderRadius: 38, width: 76, height: 76, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  videoStage: { width: '100%', maxWidth: 360, height: 202, borderRadius: 16, overflow: 'hidden', backgroundColor: '#000', marginBottom: 24, position: 'relative' },
  videoStageMax: { width: '100%', height: '100%', borderRadius: 0, overflow: 'visible', position: 'relative' },
  maxBtn: { alignSelf: 'flex-end', marginBottom: 8 },
  maxFullscreenBtn: { position: 'absolute', bottom: 24, right: 24, backgroundColor: '#18181b', borderRadius: 99, padding: 8, borderWidth: 1, borderColor: '#27272a' },
  metaBlock: { width: '100%', position: 'relative', zIndex: 5 },
  metaHidden: { display: 'none' },
});
