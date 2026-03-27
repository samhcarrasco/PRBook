import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { Modal, Portal, Button, TouchableRipple } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/themecontext';
import { openDB, historyOperations } from '../../db/db';

const getSelectionLabel = (selectedExercises) => {
  if (selectedExercises.length === 0) {
    return 'Select one or more exercises...';
  }

  if (selectedExercises.length === 1) {
    return selectedExercises[0].name;
  }

  if (selectedExercises.length === 2) {
    return `${selectedExercises[0].name}, ${selectedExercises[1].name}`;
  }

  return `${selectedExercises[0].name}, ${selectedExercises[1].name} +${selectedExercises.length - 2} more`;
};

const ExercisePicker = ({ selectedExercises, onChange, historyVersion }) => {
  const [exercises, setExercises] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const { theme } = useAppTheme();
  const c = theme.custom.colors;

  useEffect(() => {
    const loadExercises = async () => {
      try {
        const db = await openDB();
        const result = await historyOperations.getExercisesWithHistory(db);
        setExercises(result);
      } catch (error) {
        console.error('Error loading exercises with history:', error);
      }
    };

    loadExercises();
  }, [historyVersion, showModal]);

  useEffect(() => {
    onChange((currentSelection) => {
      const nextSelection = currentSelection.filter((selectedExercise) =>
        exercises.some((exercise) => exercise.id === selectedExercise.id)
      );

      return nextSelection.length === currentSelection.length
        ? currentSelection
        : nextSelection;
    });
  }, [exercises, onChange]);

  const selectedIds = useMemo(
    () => new Set(selectedExercises.map((exercise) => exercise.id)),
    [selectedExercises]
  );

  const toggleExercise = (exercise) => {
    onChange((currentSelection) => {
      const alreadySelected = currentSelection.some((item) => item.id === exercise.id);

      if (alreadySelected) {
        return currentSelection.filter((item) => item.id !== exercise.id);
      }

      return [...currentSelection, exercise];
    });
  };

  const clearSelection = () => onChange([]);

  return (
    <View>
      <TouchableRipple
        style={[styles.selector, { backgroundColor: c.surfaceVariant, borderColor: c.border }]}
        onPress={() => setShowModal(true)}
        borderless
        rippleColor={c.primary + '20'}
      >
        <View style={styles.selectorContent}>
          <MaterialCommunityIcons
            name="dumbbell"
            size={20}
            color={selectedExercises.length > 0 ? c.primary : c.textTertiary}
          />
          <View style={styles.selectorTextContainer}>
            <Text style={[styles.selectorLabel, { color: c.textTertiary }]}>Exercises</Text>
            <Text
              style={[
                styles.selectorText,
                { color: selectedExercises.length > 0 ? c.textPrimary : c.textTertiary },
              ]}
              numberOfLines={2}
            >
              {getSelectionLabel(selectedExercises)}
            </Text>
          </View>
          <View style={styles.selectorMeta}>
            {selectedExercises.length > 0 && (
              <View style={[styles.countBadge, { backgroundColor: c.primaryContainer }]}>
                <Text style={[styles.countText, { color: c.primary }]}>{selectedExercises.length}</Text>
              </View>
            )}
            <MaterialCommunityIcons name="chevron-down" size={20} color={c.textTertiary} />
          </View>
        </View>
      </TouchableRipple>

      <Portal>
        <Modal
          visible={showModal}
          onDismiss={() => setShowModal(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: c.surface }]}
        >
          <Text style={[styles.modalTitle, { color: c.textPrimary }]}>Select Exercises</Text>
          <Text style={[styles.modalSubtitle, { color: c.textTertiary }]}>
            Pick one or more exercises to compare on every graph.
          </Text>

          <FlatList
            data={exercises}
            keyExtractor={(item) => item.id.toString()}
            style={styles.list}
            renderItem={({ item }) => {
              const isSelected = selectedIds.has(item.id);

              return (
                <TouchableRipple
                  onPress={() => toggleExercise(item)}
                  rippleColor={c.primary + '20'}
                >
                  <View style={[styles.item, { borderBottomColor: c.border }]}>
                    <View
                      style={[
                        styles.checkbox,
                        isSelected
                          ? { backgroundColor: c.primary, borderColor: c.primary }
                          : { borderColor: c.borderLight },
                      ]}
                    >
                      {isSelected && <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />}
                    </View>
                    <Text style={[styles.itemText, { color: c.textPrimary }]}>{item.name}</Text>
                  </View>
                </TouchableRipple>
              );
            }}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={[styles.emptyText, { color: c.textTertiary }]}>
                  No exercises with workout history yet. Log some workouts first!
                </Text>
              </View>
            }
          />

          <View style={styles.actionRow}>
            <Button mode="text" onPress={clearSelection} disabled={selectedExercises.length === 0}>
              Clear
            </Button>
            <Button mode="contained" onPress={() => setShowModal(false)}>
              Done
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  selector: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  selectorTextContainer: {
    flex: 1,
  },
  selectorLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectorText: {
    fontSize: 16,
    fontWeight: '500',
  },
  selectorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countBadge: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  countText: {
    fontSize: 13,
    fontWeight: '700',
  },
  modal: {
    margin: 20,
    borderRadius: 16,
    padding: 20,
    maxHeight: '75%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  list: {
    maxHeight: 420,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  empty: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
});

export default ExercisePicker;
