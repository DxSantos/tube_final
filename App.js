import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, SafeAreaView, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Search, Home, Library, Compass, Play, Pause } from 'lucide-react-native';
import { Audio } from 'expo-av';

const DEMO_MP3 = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
const API_KEY = 'AIzaSyCrunfLfTcyCsR3u-1luag_Zg1emu9sWZw';

const MusicCard = ({ title, artist, cover, active, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress}>
    <Image source={{ uri: cover }} style={[styles.cardImg, active && { borderWidth: 2, borderColor: '#ef4444' }]} />
    <View style={styles.cardBody}>
      <Text style={[styles.cardTitle, active && { color: '#ef4444' }]} numberOfLines={1}>{title}</Text>
      <Text style={styles.cardArtist} numberOfLines={1}>{artist}</Text>
    </View>
  </TouchableOpacity>
);

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [results, setResults] = useState([]);
  const soundRef = useRef(null);

  const playSound = async (track) => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }
      const { sound } = await Audio.Sound.createAsync(
        { uri: track?.url || DEMO_MP3 },
        { shouldPlay: true }
      );
      soundRef.current = sound;
      setSelectedTrack(track);
      setIsPlaying(true);
    } catch (e) {
      console.log('audio error', e);
    }
  };

  const togglePlay = async () => {
    try {
      if (soundRef.current) {
        const status = await soundRef.current.getStatusAsync();
        if (status.isPlaying) {
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
      const items = (json.items || []).map(i => ({
        id: i.id.videoId,
        title: i.snippet.title,
        artist: i.snippet.channelTitle,
        cover: i.snippet.thumbnails.high.url,
        url: DEMO_MP3,
      }));
      setResults(items);
    } catch (e) {
      console.log('search error', e);
    }
  };

  const list = results.length ? results : [
    { id: '1', title: 'Lo-fi Hip Hop', artist: 'Chill Study', cover: 'https://picsum.photos/seed/music1/200' },
    { id: '2', title: 'Synthwave Night', artist: 'Retro Wave', cover: 'https://picsum.photos/seed/music2/200' },
    { id: '3', title: 'Deep Focus', artist: 'Ambient Music', cover: 'https://picsum.photos/seed/music3/200' },
    { id: '4', title: 'Workout Mix', artist: 'Gym Beast', cover: 'https://picsum.photos/seed/music4/200' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Search color="#71717a" size={20} />
          <TextInput style={styles.searchInput} placeholder="Pesquisar músicas, artistas..." placeholderTextColor="#71717a" value={searchQuery} onChangeText={setSearchQuery} />
          <TouchableOpacity style={styles.searchBtn} onPress={search}><Text style={styles.searchBtnText}>Buscar</Text></TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Ouvir agora</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          {list.map(t => <MusicCard key={t.id} {...t} active={selectedTrack?.id === t.id} onPress={() => playSound(t)} />)}
        </ScrollView>
      </ScrollView>

      {selectedTrack && (
        <View style={styles.miniPlayer}>
          <Image source={{ uri: selectedTrack.cover }} style={styles.miniImg} />
          <View style={{ flex: 1 }}>
            <Text style={styles.miniTitle}>{selectedTrack.title}</Text>
            <Text style={styles.miniArtist}>{selectedTrack.artist}</Text>
          </View>
          <TouchableOpacity style={styles.playButton} onPress={togglePlay}>
            {isPlaying ? <Pause color="#000" size={20} fill="#000" /> : <Play color="#000" size={20} fill="#000" />}
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}><Text style={{ color: '#fff' }}>Início</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem}><Text style={{ color: '#71717a' }}>Explorar</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem}><Text style={{ color: '#71717a' }}>Biblioteca</Text></TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000' },
  header: { paddingHorizontal: 20, paddingVertical: 15, paddingTop: 40 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#18181b', borderRadius: 25, paddingHorizontal: 15, paddingVertical: 8, borderWidth: 1, borderColor: '#27272a' },
  searchInput: { flex: 1, color: '#fff', marginLeft: 10, fontSize: 16 },
  searchBtn: { marginLeft: 10 },
  searchBtnText: { color: '#ef4444', fontWeight: 'bold' },
  content: { flex: 1, paddingHorizontal: 20 },
  sectionTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginVertical: 20 },
  horizontalScroll: { marginBottom: 30 },
  card: { width: 160, marginRight: 16, marginBottom: 10 },
  cardImg: { width: 160, height: 160, borderRadius: 12, backgroundColor: '#27272a' },
  cardBody: { paddingTop: 10 },
  cardTitle: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  cardArtist: { color: '#a1a1aa', fontSize: 12 },
  recContainer: { marginBottom: 100 },
  recItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#18181b' },
  recImg: { width: 50, height: 50, borderRadius: 6, marginRight: 12 },
  recTitle: { color: '#fff', fontWeight: '500', fontSize: 15 },
  recArtist: { color: '#71717a', fontSize: 12 },
  miniPlayer: { position: 'absolute', bottom: 80, left: 12, right: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: '#18181b', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#3f3f46' },
  miniImg: { width: 44, height: 44, borderRadius: 6, marginRight: 10 },
  miniTitle: { color: '#fff', fontWeight: '700', fontSize: 13 },
  miniArtist: { color: '#a1a1aa', fontSize: 11 },
  playButton: { backgroundColor: '#fff', borderRadius: 99, padding: 8 },
  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 15, backgroundColor: '#09090b', borderTopWidth: 1, borderTopColor: '#27272a', position: 'absolute', bottom: 0, left: 0, right: 0 },
  navItem: { alignItems: 'center', flex: 1 },
});
