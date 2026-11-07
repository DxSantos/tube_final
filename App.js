import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Search, Home, Library, Compass } from 'lucide-react-native';

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      
      {/* HEADER / SEARCH BAR */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Search color="#71717a" size={20} />
          <TextInput 
            style={styles.searchInput} 
            placeholder="Pesquisar músicas, artistas..." 
            placeholderTextColor="#71717a"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity style={styles.searchBtn}>
            <Text style={styles.searchBtnText}>Buscar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* MAIN CONTENT AREA */}
      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Ouvir agora</Text>
        <View style={styles.placeholderCard}>
          <Text style={styles.placeholderText}>Sua biblioteca de músicas aparecerá aqui</Text>
        </View>
      </ScrollView>

      {/* BOTTOM NAVIGATION */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Home color="#fff" size={24} />
          <Text style={styles.navText}>Início</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Compass color="#71717a" size={24} />
          <Text style={styles.navTextGray}>Explorar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Library color="#71717a" size={24} />
          <Text style={styles.navTextGray}>Biblioteca</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#000', // Fundo Preto Absoluto
  },
  header: { 
    paddingHorizontal: 20, 
    paddingVertical: 15, 
    paddingTop: 40, 
    backgroundColor: '#000' 
  },
  searchContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#18181b', 
    borderRadius: 25, 
    paddingHorizontal: 15, 
    paddingVertical: 8, 
    borderWidth: 1, 
    borderColor: '#27272a' 
  },
  searchInput: { 
    flex: 1, 
    color: '#fff', 
    marginLeft: 10, 
    fontSize: 16,
    outlineStyle: 'none'
  },
  searchBtn: { 
    marginLeft: 10 
  },
  searchBtnText: { 
    color: '#ef4444', 
    fontWeight: 'bold', 
    fontSize: 14 
  },
  content: { 
    flex: 1, 
    paddingHorizontal: 20 
  },
  sectionTitle: { 
    color: '#fff', 
    fontSize: 22, 
    fontWeight: 'bold', 
    marginVertical: 20 
  },
  placeholderCard: {
    backgroundColor: '#18181b',
    borderRadius: 15,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#27272a'
  },
  placeholderText: {
    color: '#71717a',
    fontSize: 16,
    textAlign: 'center'
  },
  bottomNav: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    alignItems: 'center', 
    paddingVertical: 15, 
    backgroundColor: '#09090b', 
    borderTopWidth: 1, 
    borderTopColor: '#27272a',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0
  },
  navItem: { 
    alignItems: 'center',
    flex: 1
  },
  navText: { 
    color: '#fff', 
    fontSize: 11, 
    marginTop: 4 
  },
  navTextGray: { 
    color: '#71717a', 
    fontSize: 11, 
    marginTop: 4 
  },
});
