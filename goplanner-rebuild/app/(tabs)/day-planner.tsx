import React, { useState, useCallback } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { taskApi, Task } from "@/lib/api";
import { colors, fonts } from "@/lib/theme";

const CATEGORIES = [
  { value: "meeting", label: "Meeting", color: "#4A90E2", bg: "rgba(74, 144, 226, 0.15)", icon: "briefcase-outline" },
  { value: "appointment", label: "Appointment", color: "#E2A24C", bg: "rgba(226, 162, 76, 0.15)", icon: "document-text-outline" },
  { value: "personal", label: "Personal", color: "#5CB88A", bg: "rgba(92, 184, 138, 0.15)", icon: "heart-outline" },
  { value: "travel", label: "Travel", color: "#4CC9D9", bg: "rgba(76, 201, 217, 0.15)", icon: "airplane-outline" },
  { value: "other", label: "Other", color: "#9199A6", bg: "rgba(145, 153, 166, 0.15)", icon: "checkbox-outline" },
] as const;

export default function DayPlannerScreen() {
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState<typeof CATEGORIES[number]["value"]>("other");
  const [formStart, setFormStart] = useState("09:00");
  const [formEnd, setFormEnd] = useState("10:00");
  const [formLocation, setFormLocation] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const loadTasks = useCallback(async (dateStr: string) => {
    setLoading(true);
    try {
      const res = await taskApi.list(dateStr);
      setTasks(res.data);
    } catch {
      Toast.show({ type: "error", text1: "Error loading tasks" });
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTasks(selectedDate);
    }, [selectedDate, loadTasks])
  );

  const get7Days = () => {
    const arr = [];
    const base = new Date();
    for (let i = -3; i <= 3; i++) {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      arr.push(d);
    }
    return arr;
  };

  const handleSelectDate = (date: Date) => {
    const formatted = date.toISOString().split("T")[0];
    setSelectedDate(formatted);
    setIsFormOpen(false);
    setEditingId(null);
  };

  const handleOpenAddForm = () => {
    setEditingId(null);
    setFormTitle("");
    setFormCategory("other");
    setFormStart("09:00");
    setFormEnd("10:00");
    setFormLocation("");
    setFormNotes("");
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (task: Task) => {
    setEditingId(task._id);
    setFormTitle(task.title);
    setFormCategory(task.category);
    setFormStart(task.start);
    setFormEnd(task.end);
    setFormLocation(task.location || "");
    setFormNotes(task.notes || "");
    setIsFormOpen(true);
  };

  const handleSaveTask = async () => {
    if (!formTitle.trim() || !formStart.trim() || !formEnd.trim()) {
      Toast.show({ type: "error", text1: "Required fields", text2: "Title, start, and end time are required." });
      return;
    }

    setActionLoading(true);
    try {
      if (editingId) {
        // Edit mode
        await taskApi.update(editingId, {
          title: formTitle.trim(),
          category: formCategory,
          start: formStart.trim(),
          end: formEnd.trim(),
          location: formLocation.trim(),
          notes: formNotes.trim(),
        });
        Toast.show({ type: "success", text1: "Task updated" });
      } else {
        // Add mode
        await taskApi.create({
          date: selectedDate,
          title: formTitle.trim(),
          category: formCategory,
          start: formStart.trim(),
          end: formEnd.trim(),
          location: formLocation.trim(),
          notes: formNotes.trim(),
        });
        Toast.show({ type: "success", text1: "Task created" });
      }
      setIsFormOpen(false);
      setEditingId(null);
      await loadTasks(selectedDate);
    } catch {
      Toast.show({ type: "error", text1: "Failed to save task" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleComplete = async (task: Task) => {
    try {
      // Optimistic update
      setTasks((prev) =>
        prev.map((t) => (t._id === task._id ? { ...t, completed: !t.completed } : t))
      );
      await taskApi.update(task._id, { completed: !task.completed });
    } catch {
      // Revert on error
      setTasks((prev) =>
        prev.map((t) => (t._id === task._id ? { ...t, completed: task.completed } : t))
      );
      Toast.show({ type: "error", text1: "Failed to update status" });
    }
  };

  const handleDeleteTask = async (id: string) => {
    const confirm = Platform.OS === "web" ? window.confirm("Delete this task?") : true;
    if (!confirm) return;

    setActionLoading(true);
    try {
      await taskApi.remove(id);
      Toast.show({ type: "success", text1: "Task deleted" });
      await loadTasks(selectedDate);
    } catch {
      Toast.show({ type: "error", text1: "Failed to delete task" });
    } finally {
      setActionLoading(false);
    }
  };

  const daysList = get7Days();
  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Day Planner</Text>
            <Text style={styles.subtitle}>Your daily personal schedule</Text>
          </View>
          <TouchableOpacity
            style={[styles.todayBtn, selectedDate === todayStr && styles.todayBtnActive]}
            onPress={() => setSelectedDate(todayStr)}
          >
            <Text style={[styles.todayBtnText, selectedDate === todayStr && styles.todayBtnTextActive]}>Today</Text>
          </TouchableOpacity>
        </View>

        {/* Date strip */}
        <View style={styles.dateStrip}>
          {daysList.map((day, idx) => {
            const formatted = day.toISOString().split("T")[0];
            const isSelected = formatted === selectedDate;
            const isToday = formatted === todayStr;
            const dayNum = day.getDate();
            const dayName = day.toLocaleDateString(undefined, { weekday: "short" });

            return (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.dateChip,
                  isSelected && styles.dateChipSelected,
                  isToday && !isSelected && styles.dateChipToday,
                ]}
                onPress={() => handleSelectDate(day)}
              >
                <Text style={[styles.dateChipName, isSelected && styles.dateChipTextSelected]}>{dayName}</Text>
                <Text style={[styles.dateChipNum, isSelected && styles.dateChipTextSelected]}>{dayNum}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Header action row */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            {new Date(selectedDate).toLocaleDateString(undefined, { day: "numeric", month: "short", weekday: "long" })}
          </Text>
          {!isFormOpen && (
            <TouchableOpacity style={styles.addTaskBtn} onPress={handleOpenAddForm}>
              <Ionicons name="add" size={16} color="white" />
              <Text style={styles.addTaskBtnText}>Add Task</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Add/Edit task form */}
        {isFormOpen && (
          <View style={styles.formCard}>
            <Text style={styles.formCardTitle}>{editingId ? "Edit Task" : "Add Task"}</Text>
            
            <Text style={styles.formLabel}>Title *</Text>
            <TextInput
              placeholder="e.g. Team Standup meeting"
              placeholderTextColor="#888"
              value={formTitle}
              onChangeText={setFormTitle}
              style={styles.input}
            />

            <Text style={styles.formLabel}>Category</Text>
            <View style={styles.categoriesRow}>
              {CATEGORIES.map((cat) => {
                const isActive = formCategory === cat.value;
                return (
                  <TouchableOpacity
                    key={cat.value}
                    style={[
                      styles.categoryChip,
                      { borderColor: cat.color },
                      isActive && { backgroundColor: cat.color },
                    ]}
                    onPress={() => setFormCategory(cat.value)}
                  >
                    <Text style={[styles.categoryChipText, isActive && { color: "white" }]}>{cat.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.row}>
              <View style={styles.flex1}>
                <Text style={styles.formLabel}>Start Time *</Text>
                <TextInput
                  placeholder="09:00"
                  placeholderTextColor="#888"
                  value={formStart}
                  onChangeText={setFormStart}
                  style={styles.input}
                />
              </View>
              <View style={[styles.flex1, { marginLeft: 12 }]}>
                <Text style={styles.formLabel}>End Time *</Text>
                <TextInput
                  placeholder="10:00"
                  placeholderTextColor="#888"
                  value={formEnd}
                  onChangeText={setFormEnd}
                  style={styles.input}
                />
              </View>
            </View>

            <Text style={styles.formLabel}>Location</Text>
            <TextInput
              placeholder="e.g. Conference room A or Zoom link"
              placeholderTextColor="#888"
              value={formLocation}
              onChangeText={setFormLocation}
              style={styles.input}
            />

            <Text style={styles.formLabel}>Notes</Text>
            <TextInput
              placeholder="Notes, link codes, etc."
              placeholderTextColor="#888"
              value={formNotes}
              onChangeText={setFormNotes}
              style={styles.input}
              multiline
            />

            <View style={styles.formButtonsRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsFormOpen(false)} disabled={actionLoading}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveTask} disabled={actionLoading}>
                {actionLoading ? <ActivityIndicator size="small" color="white" /> : <Text style={styles.saveBtnText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Tasks list timeline */}
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : tasks.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="checkbox-outline" size={48} color={colors.textFaint} />
            <Text style={styles.emptyText}>Nothing planned for this day.</Text>
            <TouchableOpacity style={styles.emptyAddBtn} onPress={handleOpenAddForm}>
              <Text style={styles.emptyAddBtnText}>Tap + to add something</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.timelineWrapper}>
            {tasks.map((task) => {
              const categoryDetails = CATEGORIES.find((c) => c.value === task.category) || CATEGORIES[4];
              return (
                <View key={task._id} style={[styles.timelineNode, task.completed && styles.nodeCompleted]}>
                  {/* Left checkbox column */}
                  <TouchableOpacity
                    style={styles.checkboxWrapper}
                    onPress={() => handleToggleComplete(task)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={task.completed ? "checkmark-circle" : "ellipse-outline"}
                      size={24}
                      color={task.completed ? colors.success : colors.textMuted}
                    />
                  </TouchableOpacity>

                  {/* Task Card details */}
                  <View style={styles.taskCard}>
                    <View style={styles.taskHeaderRow}>
                      <View style={[styles.catBadge, { backgroundColor: categoryDetails.bg }]}>
                        <Ionicons name={categoryDetails.icon} size={12} color={categoryDetails.color} />
                        <Text style={[styles.catBadgeText, { color: categoryDetails.color }]}>
                          {categoryDetails.label}
                        </Text>
                      </View>
                      <View style={styles.actionsRow}>
                        <TouchableOpacity style={styles.actionBtn} onPress={() => handleOpenEditForm(task)}>
                          <Ionicons name="create-outline" size={16} color={colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionBtn} onPress={() => handleDeleteTask(task._id)}>
                          <Ionicons name="trash-outline" size={16} color={colors.danger} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <Text style={[styles.taskTitle, task.completed && styles.textLineThrough]}>
                      {task.title}
                    </Text>

                    <View style={styles.taskMetaRow}>
                      <Ionicons name="time-outline" size={12} color={colors.textMuted} />
                      <Text style={styles.taskTime}>{task.start} – {task.end}</Text>
                    </View>

                    {!!task.location && (
                      <View style={styles.taskMetaRow}>
                        <Ionicons name="location-outline" size={12} color={colors.textMuted} />
                        <Text style={styles.taskLocation} numberOfLines={1}>{task.location}</Text>
                      </View>
                    )}

                    {!!task.notes && (
                      <Text style={styles.taskNotes} numberOfLines={2}>{task.notes}</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { padding: 20, paddingTop: 60, paddingBottom: 80 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  title: { color: colors.textPrimary, fontSize: 24, fontFamily: fonts.bold },
  subtitle: { color: colors.textMuted, fontSize: 13, marginTop: 4, fontFamily: fonts.medium },
  todayBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  todayBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  todayBtnText: { color: colors.textMuted, fontSize: 12, fontFamily: fonts.bold },
  todayBtnTextActive: { color: "white" },
  dateStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    backgroundColor: colors.surface,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateChip: {
    width: "12%",
    aspectRatio: 0.75,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  dateChipSelected: { backgroundColor: colors.primary },
  dateChipToday: { borderColor: colors.primaryMuted, borderWidth: 1 },
  dateChipName: { color: colors.textMuted, fontSize: 10, fontFamily: fonts.medium, textTransform: "uppercase" },
  dateChipNum: { color: colors.textPrimary, fontSize: 14, fontFamily: fonts.bold, marginTop: 2 },
  dateChipTextSelected: { color: "white" },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: { color: colors.primary, fontSize: 15, fontFamily: fonts.bold },
  addTaskBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  addTaskBtnText: { color: "white", fontSize: 12, fontFamily: fonts.bold },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 20,
  },
  formCardTitle: { color: colors.textPrimary, fontSize: 16, fontFamily: fonts.bold, marginBottom: 12 },
  formLabel: { color: colors.textPrimary, fontSize: 12, fontFamily: fonts.medium, marginBottom: 6, marginTop: 10 },
  input: {
    backgroundColor: "#182C40",
    padding: 10,
    borderRadius: 8,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  categoriesRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginVertical: 6 },
  categoryChip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  categoryChipText: { color: colors.textMuted, fontSize: 11, fontFamily: fonts.bold },
  row: { flexDirection: "row", alignItems: "center" },
  flex1: { flex: 1 },
  formButtonsRow: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 16 },
  cancelBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
  cancelBtnText: { color: colors.textMuted, fontFamily: fonts.bold, fontSize: 13 },
  saveBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, backgroundColor: colors.primary },
  saveBtnText: { color: "white", fontFamily: fonts.bold, fontSize: 13 },
  emptyBox: {
    backgroundColor: colors.surface,
    padding: 30,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 10,
  },
  emptyText: { color: colors.textMuted, fontSize: 14, fontFamily: fonts.medium, marginTop: 8 },
  emptyAddBtn: { marginTop: 12 },
  emptyAddBtnText: { color: colors.primary, fontSize: 13, fontFamily: fonts.bold },
  timelineWrapper: { marginTop: 4 },
  timelineNode: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  nodeCompleted: { opacity: 0.55 },
  checkboxWrapper: {
    paddingTop: 14,
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  taskCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  taskHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  catBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 4,
  },
  catBadgeText: { fontSize: 10, fontFamily: fonts.bold, textTransform: "capitalize" },
  actionsRow: { flexDirection: "row", gap: 8 },
  actionBtn: { padding: 2 },
  taskTitle: { color: colors.textPrimary, fontSize: 16, fontFamily: fonts.bold, marginBottom: 8 },
  textLineThrough: { textDecorationLine: "line-through" },
  taskMetaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  taskTime: { color: colors.textMuted, fontSize: 12, fontFamily: fonts.medium },
  taskLocation: { color: colors.textMuted, fontSize: 12, fontFamily: fonts.medium, flex: 1 },
  taskNotes: { color: colors.textFaint, fontSize: 11, fontFamily: fonts.medium, marginTop: 8, fontStyle: "italic" },
});
