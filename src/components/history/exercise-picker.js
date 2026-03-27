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
            {exercises.length} exercises available
          </Text>

          <FlatList
            data={exercises}
            keyExtractor={(item) => item.id.toString()}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            numColumns={3}
            columnWrapperStyle={styles.columnWrapper}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const isSelected = selectedIds.has(item.id);

              return (
                <TouchableRipple
                  style={styles.gridItemTouchable}
                  onPress={() => toggleExercise(item)}
                  rippleColor={c.primary + '20'}
                >
                  <View
                    style={[
                      styles.gridItem,
                      isSelected
                        ? { backgroundColor: c.primaryContainer, borderColor: c.primary }
                        : { backgroundColor: c.surfaceVariant, borderColor: c.borderLight },
                    ]}
                  >
                    {isSelected && (
                      <View style={[styles.selectedBadge, { backgroundColor: c.primary }]}>
                        <MaterialCommunityIcons name="check" size={12} color="#FFFFFF" />
                      </View>
                    )}
                    <Text
                      style={[
                        styles.itemText,
                        { color: isSelected ? c.primary : c.textPrimary },
                      ]}
                      numberOfLines={2}
                    >
                      {item.name}
                    </Text>
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
    marginHorizontal: 12,
    marginVertical: 12,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 14,
    height: '50%',
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '700',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 14,
  },
  list: {
    flexGrow: 1,
  },
  listContent: {
    paddingBottom: 6,
  },
  columnWrapper: {
    gap: 8,
    marginBottom: 8,
  },
  gridItemTouchable: {
    flex: 1,
    maxWidth: '31.5%',
  },
  gridItem: {
    minHeight: 58,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  selectedBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 15,
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
