import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ActivityIndicator, Button, FlatList } from 'react-native';
import React, { useEffect, useState} from 'react';

interface Player {
  color: string;
  id: string;
  name: string;
  rating: number;
  title?: string;
}

interface PuzzleData {
  game: {
    clock: string;
    id: string;
    pgn: string;
    players: Player[];
    rated: boolean;
  };
  puzzle: {
    id: string;
    initialPly: number;
    plays: number;
    rating: number;
    solution: string[];
    themes: string[];
  };
}

export default function App() {
   const [puzzle, setPuzzle] = useState<PuzzleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPuzzle();
  }, []);

  const fetchPuzzle = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('https://lichess.org/api/puzzle/daily');
      const data = await response.json();
      setPuzzle(data);
    } catch (err) {
      setError('Failed to load puzzle');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ActivityIndicator style={styles.loader} size="large" />;
  if (error) return <Text style={styles.error}>{error}</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lichess Daily Puzzle</Text>

      {puzzle && (
        <>
          {/* Game Details */}
          <Text style={styles.subtitle}>Game Details</Text>
          <Text style={styles.text}>Clock: {puzzle.game.clock}</Text>
          <Text style={styles.text}>Rated: {puzzle.game.rated ? 'Yes' : 'No'}</Text>

          {/* Player Details */}
          <Text style={styles.subtitle}>Players</Text>
          {puzzle.game.players.map((player) => (
            <Text key={player.id} style={styles.text}>
              {player.title ? `${player.title} ` : ''}{player.name} ({player.rating})
            </Text>
          ))}

          {/* Puzzle Details */}
          <Text style={styles.subtitle}>Puzzle</Text>
          <Text style={styles.text}>Puzzle ID: {puzzle.puzzle.id}</Text>
          <Text style={styles.text}>Rating: {puzzle.puzzle.rating}</Text>
          <Text style={styles.text}>Plays: {puzzle.puzzle.plays}</Text>

          {/* Themes */}
          <Text style={styles.subtitle}>Themes</Text>
          <FlatList
            data={puzzle.puzzle.themes}
            keyExtractor={(item) => item}
            renderItem={({ item }) => <Text style={styles.theme}>{item}</Text>}
          />

          {/* Solution */}
          <Text style={styles.subtitle}>Solution Moves</Text>
          <FlatList
            data={puzzle.puzzle.solution}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => <Text style={styles.solution}>{item}</Text>}
          />

          <Button title="Reload Puzzle" onPress={fetchPuzzle} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 10,
  },
  text: {
    fontSize: 16,
    marginBottom: 5,
  },
  theme: {
    fontSize: 14,
    backgroundColor: '#e0e0e0',
    padding: 5,
    borderRadius: 5,
    marginVertical: 2,
  },
  solution: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'green',
    marginVertical: 2,
  },
  loader: {
    marginTop: 50,
  },
  error: {
    color: 'red',
    fontSize: 16,
  },
});